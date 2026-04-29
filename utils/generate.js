const puppeteer = require('puppeteer-core')
const chromium = require('@sparticuz/chromium')
const ejs = require('ejs')
const path = require('path')
const os = require('os')
const fs = require('fs')
const { getBulletinInformation, getMention } = require('./util')
const { prisma } = require('../lib/prisma')

// Pool global pour réutiliser les navigateurs
let browserPool = null

// Fonction pour obtenir un navigateur du pool
const getBrowserFromPool = async () => {
    if (!browserPool || !browserPool.connected) {
        browserPool = await puppeteer.launch({
            args: chromium.args,
            defaultViewport: chromium.defaultViewport,
            executablePath: await chromium.executablePath(),
            headless: chromium.headless,
        })
    }
    return browserPool
}

// Fonction pour configurer les options de lancement de Puppeteer
const getLaunchOptions = async () => {
    return {
        args: chromium.args,
        defaultViewport: chromium.defaultViewport,
        executablePath: await chromium.executablePath(),
        headless: chromium.headless,
    }
}

const totalMoyenneCoeficient = (tab) => {
    console.log(tab)
    if(!tab || tab.length === 0){
        throw new Error('aucune note')
    }
    let total = 0
    tab.forEach(t => {
        total += t.moyenne * t.coefficient
    })
    return (total).toFixed(2)
}

function Distinction(moyenneGenerale, rang) {
    let distinction = ''
    if (moyenneGenerale >= 16) distinction = "Félicitations";
    else if (moyenneGenerale >= 14) distinction = "Tableau d'honneur";
    else if (moyenneGenerale >= 12) distinction = "Encouragements";
    else distinction = "";
    return distinction
}

// bulletin d'un seul eleve
const generate = async (matricule) => {
    const tempDir = path.join(os.tmpdir(), 'puppeteer-session-' + Date.now())
    fs.mkdirSync(tempDir, { recursive: true })
    let page;
    try {
        const trimestre = await prisma.trimestre.findFirst({
            where : { actif: true }
        })
        const { eleveInfo, matiere, moyenneGenerale, rang, enseignants, etablissement, rangMatiere } = await getBulletinInformation(matricule)
        const decision = moyenneGenerale >= 10 ? "Admis" : "Double"
        const distinction = Distinction(moyenneGenerale)
        const fichier = path.join(__dirname, '../view/bulletin.ejs')
        console.log('eleve info:', eleveInfo)
        const html = await ejs.renderFile(fichier, {
            eleve: eleveInfo,
            matiere,
            moyenneGenerale,
            rang,
            decision,
            enseignants,
            etablissement,
            trimestre,
            totalMoyenneCoeficient: totalMoyenneCoeficient(matiere),
            distinction,
            rangMatiere
        })
        const browser = await getBrowserFromPool()
        page = await browser.newPage()
        
        await page.setDefaultNavigationTimeout(60000)
        await page.setDefaultTimeout(60000)
        await page.setContent(html, { waitUntil: "domcontentloaded", timeout: 45000 })
        await new Promise(resolve => setTimeout(resolve, 2000))
        
        const bulletinFile = path.join(tempDir, `bulletin-${eleveInfo?.eleve.nom}.pdf`)
        await page.pdf({
            path: bulletinFile,
            format: 'A4',
            printBackground: true,
            margin: { top: '20mm', bottom: "20mm", left: "10mm", right: "10mm" }
        })
        await new Promise(resolve => setTimeout(resolve, 500))
        await page.close()
        
        console.log("Bulletin généré avec succès :", bulletinFile)
        return bulletinFile
    } catch (err) {
        console.log("erreur au niveau de la generation du pdf", err)
        if (page) {
            try { await page.close() } catch (e) { console.error("Erreur fermeture page :", e) }
        }
        throw err
    }
}

// bulletin de tout une classe 
const generateClasseBulletin = async (id_classe) => {
    const tempDir = path.join(os.tmpdir(), 'puppeteer-session-' + Date.now())
    fs.mkdirSync(tempDir, { recursive: true })
    let browser;
    try {
        const trimestre = await prisma.trimestre.findFirst({
            where : { actif: true }
        })
        const eleves = await prisma.eleve.findMany({
            where: { idClasse: id_classe }
        })
        if (!eleves || eleves.length === 0) {
            throw new Error("Aucun élève dans cette classe")
        }
        let htmlGlobal = ''
        const fichier = path.join(__dirname, '../view/bulletin.ejs')
        for (const eleveItem of eleves) {
            const { eleveInfo, matiere, moyenneGenerale, rang, etablissement, rangMatiere } = await getBulletinInformation(eleveItem.matricule)
            console.log("moyenne generale", moyenneGenerale)
            if (isNaN(moyenneGenerale)) {
                console.log(`Aucune note pour ${eleveItem.matricule}, on skip`);
                continue;
            }
            const decision = moyenneGenerale >= 10 ? "Admis" : "Double"
            const distinction = Distinction(moyenneGenerale)
            const html = await ejs.renderFile(fichier, {
                eleve: eleveInfo,
                matiere,
                moyenneGenerale,
                rang,
                decision,
                etablissement,
                trimestre,
                distinction,
                totalMoyenneCoeficient: totalMoyenneCoeficient(matiere),
                rangMatiere
            })
            htmlGlobal += `<div class="page">${html}</div>`
        }

        htmlGlobal = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                html, body { width: 210mm; background: white; }
                .page {
                    width: 210mm;
                    min-height: 297mm;
                    padding: 15mm;
                    background: white;
                    break-after: page;
                    page-break-after: always;
                }
                .page:last-child { break-after: auto; page-break-after: auto; }
                </style>
            </head>
            <body>${htmlGlobal}</body>
            </html>
        `

        const launchOptions = await getLaunchOptions()
        browser = await puppeteer.launch(launchOptions)

        const page = await browser.newPage()
        await page.setViewport({ width: 794, height: 1123 })
        await page.setContent(htmlGlobal, { waitUntil: 'load', timeout: 30000 })
        await new Promise(resolve => setTimeout(resolve, 2000))

        const filePath = path.join(tempDir, `bulletins-classe-${id_classe}.pdf`)
        await page.pdf({
            path: filePath,
            format: 'A4',
            printBackground: true,
            margin: { top: '0', bottom: '0', left: '0', right: '0' },
            timeout: 60000
        })
        await new Promise(resolve => setTimeout(resolve, 500))
        await browser.close()
        return filePath

    } catch (err) {
        console.log("Erreur génération classe :", err)
        if (browser) {
            try { await browser.close() } catch (closeErr) { console.error("Erreur fermeture navigateur :", closeErr) }
        }
        throw err
    }
}

const generateFicheNote = async(notes, matiere, etablissement, trimestre, classe, infosProf) => {
    console.log('notes recu', classe)
    const tempDir = path.join(os.tmpdir(), 'puppeteer-session-' + Date.now())
    fs.mkdirSync(tempDir, { recursive: true })

    let page;
    try {
        const fichier = path.join(__dirname, '../view/listeNote.ejs')
        const html = await ejs.renderFile(fichier, {
            notes,
            matiere,
            etablissement,
            trimestre,
            classe,
            infosProf
        })
        
        const browser = await getBrowserFromPool()
        page = await browser.newPage()
        
        await page.setDefaultNavigationTimeout(60000)
        await page.setDefaultTimeout(60000)
        await page.setContent(html, { waitUntil: "domcontentloaded", timeout: 45000 })
        await new Promise(resolve => setTimeout(resolve, 3000))
        
        const listeFile = path.join(tempDir, 'listeNote.pdf')
        console.log("Fichier généré :", listeFile)
        
        await page.pdf({
            path: listeFile,
            format: 'A4',
            printBackground: true,
            margin: { top: '20mm', bottom: '20mm', left: '10mm', right: '10mm' }
        })
        await new Promise(resolve => setTimeout(resolve, 500))
        await page.close()
        
        console.log("PDF généré avec succès :", listeFile)
        return listeFile
    } catch(err) {
        console.error("Erreur génération PDF :", err)
        if (page) {
            try { await page.close() } catch (e) { console.error("Erreur fermeture page :", e) }
        }
        throw err
    }
}

module.exports = { generate, generateClasseBulletin, generateFicheNote }