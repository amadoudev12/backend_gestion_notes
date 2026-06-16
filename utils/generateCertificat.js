const puppeteer = require('puppeteer')
// const chromium = require('@sparticuz/chromium')
const ejs = require('ejs')
const path = require('path')
const os = require('os')
const fs = require('fs')

let browserPool = null
const getBrowserFromPool = async () => {
    if (browserPool && browserPool.connected) {
        return browserPool
    }

    browserPool = await puppeteer.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"]
    })

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

const formDate = (date)=> {
    return new Date(date).toLocaleDateString('fr-FR')
}
const generateCertificat = async (eleve, anneeAcademique, certificat, classe, etablissement,signature   )=> {
    const tempDir = path.join(os.tmpdir(), 'puppeteer-session-' + Date.now())
    fs.mkdirSync(tempDir, { recursive: true })
    let page 
    const baseurl = process.env.BASE_URL
    try {
        const fichier = path.join(__dirname,'../view/Certificat.ejs')
        const html = await  ejs.renderFile(fichier,{
            certificat,
            eleve,
            classe,
            anneeAcademique,
            etablissement,
            formDate,
            baseurl,
            signature
        })
        const browser = await getBrowserFromPool()
        page = await browser.newPage()
        await page.setDefaultNavigationTimeout(60000)
        await page.setDefaultTimeout(60000)
        await page.setContent(html, { waitUntil: "domcontentloaded", timeout: 45000 })
        await new Promise(resolve => setTimeout(resolve, 2000))
        const certificatFile = path.join(tempDir, 'certificat.pdf')
        
        await page.pdf({
            path:certificatFile,
            format:"A4",
            printBackground: true,
            margin: { top: '20mm', bottom: '20mm', left: '10mm', right: '10mm' }
        })
        await new Promise(resolve => setTimeout(resolve, 500))
        await page.close()
        return certificatFile
    }catch(err) {
        console.error("Erreur génération PDF :", err)
        if (page) {
            try { await page.close() } catch (e) { console.error("Erreur fermeture page :", e) }
        }
        throw err
    }
}

module.exports = generateCertificat