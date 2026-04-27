const express = require('express')
const { postEtablissement, getEtablissementByIdAdmin,  moyennesClasseEtablissement, moyenneMatieres, moyenneGeneralesEtablissemetEvolution } = require('../controllers/etablissement.controller')
const verifyToken = require('../middleware/verifyToken')
const route = express.Router()

route.post('/create', postEtablissement)
route.get('/moyenne-generale-evolution', moyenneGeneralesEtablissemetEvolution)
route.get('/moyenne-classes', verifyToken, moyennesClasseEtablissement)
route.get('/moyenne-matieres', verifyToken, moyenneMatieres)
route.get('/:id', getEtablissementByIdAdmin)
module.exports = route