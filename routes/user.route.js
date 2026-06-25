const express = require('express')
const { loginController, modificationController } = require('../controllers/user.controller')
const verifyToken = require('../middleware/verifyToken')
const uploadSignature = require("../middleware/UploadSignature")
const { loginValidation, modificationUserValidation } = require('../middleware/validators')

const route = express.Router()

route.post('/login', loginValidation, loginController)
route.put(
    '/premiere-connexion',
    verifyToken,
    uploadSignature.single("signature"),
    modificationUserValidation,
    modificationController
)

module.exports = route