const puppeteer = require('puppeteer')
const ejs = require('ejs')
const path = require('path')
const os = require('os')
const fs = require('fs')
const { getBulletinInformation, getMention } = require('./util')
const { prisma } = require('../lib/prisma')
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
    // Calcul de la distinction
    if (moyenneGenerale >= 16) distinction = "Félicitations";
    else if (moyenneGenerale >= 14) distinction = "Tableau d'honneur";
    else if (moyenneGenerale >= 12) distinction = "Encouragements";
    else distinction = ""; // pas de distinction si moyenne <12

    return distinction
}
// bulletin d'un seul eleve
const generate = async (matricule) => {
    const tempDir = path.join(os.tmpdir(), 'puppeteer-session-' + Date.now())
    fs.mkdirSync(tempDir, { recursive: true })
    try {
        const trimestre = await prisma.trimestre.findFirst({
            where : {
                actif:true
            }
        })
        const { eleve, matiere, moyenneGenerale, rang, enseignants, etablissement, rangMatiere } = await getBulletinInformation(matricule)
        const decision = moyenneGenerale >= 10 ? "Admis" : "Double"
        const distinction = Distinction(moyenneGenerale)
        const fichier = path.join(__dirname, '../view/bulletin.ejs')
        const html = await ejs.renderFile(fichier, {
            eleve,
            matiere,
            moyenneGenerale,
            rang,
            decision, 
            enseignants,
            etablissement,
            trimestre,
            totalMoyenneCoeficient:totalMoyenneCoeficient(matiere),
            distinction,
            rangMatiere
        })
        const browser = await puppeteer.launch({
            headless: true,
            userDataDir: tempDir
        })
        const page = await browser.newPage()
        await page.setContent(html, { waitUntil: "networkidle0" })
        //chemin du fichier PDF
        const bulletinFile = path.join(tempDir, `bulletin-${eleve.nom}.pdf`)
        await page.pdf({
            path: bulletinFile,
            format: 'A4',
            printBackground: true,
            margin: { top: '20mm', bottom: "20mm" }
        })
        await browser.close()
        return bulletinFile
    } catch (err) {
        console.log("erreur au niveau de la generation du pdf", err)
        throw err
    }
}

// bulletin de tout une classe 
const generateClasseBulletin = async (id_classe) => {
    const tempDir = path.join(os.tmpdir(), 'puppeteer-session-' + Date.now())
    fs.mkdirSync(tempDir, { recursive: true })
    try {
        const trimestre = await prisma.trimestre.findFirst({
            where : {
                actif:true
            }
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
            const { eleve, matiere, moyenneGenerale, rang, etablissement, rangMatiere   } = await getBulletinInformation(eleveItem.matricule)
            console.log("moyenne generale",moyenneGenerale)
            if (isNaN(moyenneGenerale)) {
                console.log(`Aucune note pour ${eleveItem.matricule}, on skip`);
            }
            console.log(matiere)
            const decision = moyenneGenerale >= 10 ? "Admis" : "Double"
            const mention = getMention(moyenneGenerale)
            const distinction = Distinction(moyenneGenerale)
            const html = await ejs.renderFile(fichier, {
                eleve,
                matiere,
                moyenneGenerale,
                rang,
                decision,
                etablissement,
                trimestre, 
                distinction,
                totalMoyenneCoeficient:totalMoyenneCoeficient(matiere),
                rangMatiere
            })

            htmlGlobal += `<div class="page">${html}</div>`

            await prisma.resultatTrimestre.create({
                data: {
                    eleve: {
                        connect : {
                            matricule : eleveItem.matricule
                        }
                    },
                    moyenneGenerale:moyenneGenerale,
                    decision,
                    rang,
                    mention,
                    anneeScolaire: "2025 - 2026",
                    idtrimestre: 1
                }
            })
        }

        // CSS propre — une page = un bulletin, sans débordement
        htmlGlobal = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }

                html, body {
                    width: 210mm;
                    background: white;
                }

                .page {
                    width: 210mm;
                    min-height: 297mm;
                    padding: 15mm;
                    background: white;
                    
                    /* ✅ La vraie solution pour forcer une nouvelle page PDF */
                    break-after: page;        
                    -webkit-column-break-after: page;
                    page-break-after: always;
                }

                .page:last-child {
                    break-after: auto;
                    page-break-after: auto;
                }
                </style>
            </head>
            <body>
                ${htmlGlobal}
            </body>
            </html>
`

        const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
            timeout: 60000
        })

        const page = await browser.newPage()

        // Définir la taille de la page AVANT setContent
        await page.setViewport({ width: 794, height: 1123 }) // ~A4 en px à 96dpi

        await page.setContent(htmlGlobal, { waitUntil: 'networkidle0' })

        const filePath = path.join(tempDir, `bulletins-classe-${id_classe}.pdf`)
        await page.pdf({
            path: filePath,
            format: 'A4',
            printBackground: true,
            margin: {
                top: '0',
                bottom: '0',
                left: '0',
                right: '0'
            }
        })
        await browser.close()
        return filePath

    } catch (err) {
        console.log("Erreur génération classe :", err)
        throw err
    }
}


const generateFicheNote = async(notes, matiere, etablissement, trimestre, classe, infosProf) => {
    console.log('notes recu', classe)
    const tempDir = path.join(os.tmpdir(), 'puppeteer-session-' + Date.now())
    fs.mkdirSync(tempDir, { recursive: true })

    try {
        const fichier = path.join(__dirname, '../view/listeNote.ejs')
        const html = await ejs.renderFile(fichier, {
            notes:notes,
            matiere:matiere,
            etablissement:etablissement,
            trimestre:trimestre,
            classe:classe,
            infosProf:infosProf
        })
        const browser = await puppeteer.launch({
            headless: true,
            userDataDir: tempDir
        })
        const page = await browser.newPage()
        await page.setContent(html, { waitUntil: "networkidle0" })
        const listeFile = path.join(tempDir, 'listeNote.pdf')
        console.log("Fichier généré :", listeFile)
        await page.pdf({
            path:listeFile,
            format: 'A4',
            printBackground: true,
                margin: {
                    top: '20mm',
                    bottom: '20mm',
                    left: '10mm',
                    right: '10mm'
                }
        })
        await browser.close()
        return listeFile
    }catch(err){
        console.error("Erreur génération PDF :", err) 
        throw err
    }
}
module.exports = { generate, generateClasseBulletin, generateFicheNote }