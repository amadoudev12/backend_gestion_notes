const express = require('express')
const { getAllElevesController, createEleveController, getEleveController, moyennesController, EleveRang, bulletinController, absenceController} = require('../controllers/eleves.controller')
const VerifyToken = require('../middleware/verifyToken')
const upload  = require('../middleware/uploadsFichier')
const route = express.Router()

route.get('/liste', getAllElevesController)
route.get('/note-matiere/:id',moyennesController)
route.post('/import',upload.single('file'), createEleveController)
route.get('/rang',VerifyToken,EleveRang)
route.post('/bulletin',VerifyToken,bulletinController)
route.post('/absence',absenceController)
route.get('/:id',getEleveController)

module.exports = route