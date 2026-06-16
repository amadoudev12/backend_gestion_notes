const express = require('express')
const { loginController, modificationController } = require('../controllers/user.controller')
const verifyToken = require('../middleware/verifyToken')
const uploadSignature  = require("../middleware/UploadSignature")
const route = express.Router()
route.post('/login', loginController)
route.put('/premiere-connexion',verifyToken, uploadSignature.single("signature"), modificationController)
module.exports = route