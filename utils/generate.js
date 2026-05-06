const puppeteer = require('puppeteer-core')
const chromium  = require('@sparticuz/chromium')
const ejs       = require('ejs')
const path      = require('path')
const os        = require('os')
const fs        = require('fs')
const { getBulletinInformation } = require('./util')
const { prisma }    = require('../lib/prisma')
const supabase  = require('../lib/supabaseClient')

// ─── Détection environnement ─────────────────────────────────────────────────
const IS_PROD = process.env.NODE_ENV === 'production'

// ─── Pool navigateur ─────────────────────────────────────────────────────────
let browserPool = null

const getBrowserFromPool = async () => {
    if (browserPool && browserPool.connected) return browserPool

    if (IS_PROD) {
        // Render / Linux : on utilise le Chromium embarqué dans @sparticuz/chromium
        browserPool = await puppeteer.launch({
            args:             chromium.args,
            defaultViewport:  chromium.defaultViewport,
            executablePath:   await chromium.executablePath(),
            headless:         chromium.headless,
        })
    } else {
        // Local : on utilise le Chromium installé par puppeteer
        // npm i puppeteer en dev suffit ; puppeteer-core est utilisé en prod
        const puppeteerFull = require('puppeteer')
        browserPool = await puppeteerFull.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
        })
    }

    // Nettoyage automatique si le browser se ferme de façon inattendue
    browserPool.on('disconnected', () => { browserPool = null })

    return browserPool
}

// Fermer proprement le pool (utile pour les tests ou le graceful shutdown)
const closeBrowserPool = async () => {
    if (browserPool) {
        try { await browserPool.close() } catch (_) {}
        browserPool = null
    }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const totalMoyenneCoeficient = (tab) => {
    if (!tab || tab.length === 0) throw new Error('aucune note')
    let total = 0
    tab.forEach(t => { total += t.moyenne * t.coefficient })
    return total.toFixed(2)
}

const getDistinction = (moyenneGenerale) => {
    if (moyenneGenerale >= 16) return "Félicitations"
    if (moyenneGenerale >= 14) return "Tableau d'honneur"
    if (moyenneGenerale >= 12) return "Encouragements"
    return ""
}

const openPage = async (browser) => {
    const page = await browser.newPage()
    await page.setDefaultNavigationTimeout(60000)
    await page.setDefaultTimeout(60000)
    return page
}

const closePage = async (page) => {
    if (!page) return
    try {
        if (!page.isClosed()) await page.close()
    } catch (e) {
        console.warn('Fermeture page ignorée :', e.message)
    }
}

const PDF_MARGINS = { top: '20mm', bottom: '20mm', left: '10mm', right: '10mm' }

// ─── Bulletin d'un seul élève ─────────────────────────────────────────────────

const generate = async (matricule) => {
    let page
    try {
        const trimestre = await prisma.trimestre.findFirst({ where: { actif: true } })
        if (!trimestre) throw new Error('Aucun trimestre actif trouvé')

        const {
            eleveInfo, matiere, moyenneGenerale,
            rang, enseignants, etablissement, rangMatiere
        } = await getBulletinInformation(matricule)
        
        const decision    = moyenneGenerale >= 10 ? 'Admis' : 'Double'
        const distinction = getDistinction(moyenneGenerale)

        const fichier = path.join(__dirname, '../view/bulletin.ejs')
        const html    = await ejs.renderFile(fichier, {
            eleve: eleveInfo,
            matiere,
            moyenneGenerale: moyenneGenerale ?? 0,
            rang,
            decision,
            enseignants,
            etablissement,
            trimestre,
            totalMoyenneCoeficient: totalMoyenneCoeficient(matiere),
            distinction,
            rangMatiere,
        })

        const browser = await getBrowserFromPool()
        page = await openPage(browser)
        await page.setContent(html, { waitUntil: 'domcontentloaded', timeout: 45000 })
        await new Promise(r => setTimeout(r, 2000))

        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: PDF_MARGINS,
        })

        await closePage(page)
        page = null

        // Upload Supabase
        const annee          = trimestre.annee ?? '2025-2026'
        const trimestreLib   = trimestre.libelle
        const classeLib      = eleveInfo.classe?.libelle ?? 'inconnu'
        const chemin         = `${annee}/${trimestreLib}/${classeLib}/${matricule}.pdf`

        const { error: uploadError } = await supabase.storage
            .from('bulletins')
            .upload(chemin, pdfBuffer, { contentType: 'application/pdf', upsert: true })

        if (uploadError) throw uploadError

        // Persistance en base
        await prisma.bulletin.upsert({
            where: {
                eleveId_idtrimestre_id_annee: {
                    eleveId:     eleveInfo.eleve.matricule,
                    idtrimestre: trimestre.id_trimestre,
                    id_annee:    1,
                },
            },
            update:  { fichier_url: chemin },
            create:  {
                eleveId:         matricule,
                idtrimestre:     trimestre.id_trimestre,
                id_annee:        1,
                moyenneGenerale,
                decision,
                rang,
                mention:         distinction,
                fichier_url:     chemin,
            },
        })

        console.log('Bulletin généré :', chemin)
        return chemin

    } catch (err) {
        console.error('Erreur génération bulletin :', err)
        await closePage(page)
        throw err
    }
}

// ─── Bulletins de toute une classe ───────────────────────────────────────────

const generateClasseBulletins = async (id_classe) => {
    const inscriptions = await prisma.inscription.findMany({
        where:   { id_classe },
        include: { eleve: true },
    })

    if (!inscriptions.length) throw new Error('Aucun élève dans cette classe')

    const results = []
    for (const ins of inscriptions) {
        try {
            const file = await generate(ins.eleve.matricule)
            results.push({ matricule: ins.eleve.matricule, status: 'success', file })
        } catch {
            results.push({ matricule: ins.eleve.matricule, status: 'error' })
        }
    }

    return results
}

// ─── Fiche de notes ───────────────────────────────────────────────────────────

const generateFicheNote = async (notes, matiere, etablissement, trimestre, classe, infosProf) => {
    const tempDir = path.join(os.tmpdir(), `puppeteer-${Date.now()}`)
    fs.mkdirSync(tempDir, { recursive: true })

    let page
    try {
        const fichier = path.join(__dirname, '../view/listeNote.ejs')
        const html    = await ejs.renderFile(fichier, {
            notes, matiere, etablissement, trimestre, classe, infosProf,
        })

        const browser = await getBrowserFromPool()
        page = await openPage(browser)
        await page.setContent(html, { waitUntil: 'domcontentloaded', timeout: 45000 })
        await new Promise(r => setTimeout(r, 3000))

        const listeFile = path.join(tempDir, 'listeNote.pdf')
        await page.pdf({
            path:            listeFile,
            format:          'A4',
            printBackground: true,
            margin:          PDF_MARGINS,
        })

        await closePage(page)
        page = null

        console.log('Fiche notes générée :', listeFile)
        return listeFile

    } catch (err) {
        console.error('Erreur génération fiche notes :', err)
        await closePage(page)
        throw err
    }
}

module.exports = { generate, generateClasseBulletins, generateFicheNote, closeBrowserPool }