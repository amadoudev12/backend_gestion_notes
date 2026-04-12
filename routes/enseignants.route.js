const express = require('express')
const { createEnseignantController, getEnseignantByMatriculeController, classeEnseignerParEnsignant, enseignantStatController } = require('../controllers/enseignant.controller')
const VerifyToken = require('../middleware/verifyToken')
const route = express.Router()
route.get('/get-enseignant', getEnseignantByMatriculeController)
route.get('/classe-enseigner',VerifyToken, classeEnseignerParEnsignant)
route.get('/stat',VerifyToken, enseignantStatController)
route.post('/create-enseignant', createEnseignantController)
module.exports = route