const fs = require('fs')
const multer = require('multer')
const {extname} = require('path')

if(!fs.existsSync('./uploads')){
    fs.mkdirSync('./uploads')
}

//configuration de multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/signatures')
    },

    filename: (req, file, cb) => {
        const ext = extname(file.originalname)

        const nomFichier = req.user?.profil?.matricule
            ? req.user.profil.matricule
            : (req.body.etab_nom || 'signature')
                .toLowerCase()
                .replace(/\s+/g, '-')
                .replace(/[^a-z0-9-]/g, '')

        const uniqueFixe = Date.now()

        const filename = `${nomFichier}-${uniqueFixe}${ext}`

        cb(null, filename)
    }
})

const uploadSignature = multer({storage})
module.exports =  uploadSignature



// const multer = require("multer")
// //stockage en memoire
// const storage= multer.diskStorage()
// const uploadSignature = multer({
//     storage,
//     limits: {
//         fieldSize:5* 1024 * 1024
//     },
//     fileFilter:(req, file, cb) => {
//         const typesAutorises = [
//             'image/png'
//         ]
//         if(typesAutorises.includes(file.mimetype)){
//             cb(null, true)
//         }else {
//             cb(new Error('seules les images PNG sont autorisés'))
//         }
//     }
// })

// module.exports = uploadSignature