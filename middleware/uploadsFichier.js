const fs = require('fs')
const multer = require('multer')
const {extname} = require('path')
if(!fs.existsSync('./upload')){
    fs.mkdirSync('./upload')
}

//configuration de multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'upload/')
    },
    filename: (req,file,cb) => {
        const ext = extname(file.originalname)
        const nomFichier = req.body.nom
        ?.toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
        const uniqueFixe = Date.now() 
        const filename = `${nomFichier || 'classe'}-${uniqueFixe}${ext}`
        cb(null, filename)
    }
})
const upload = multer({storage})
module.exports =  upload