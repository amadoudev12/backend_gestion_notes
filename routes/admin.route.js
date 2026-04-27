const express = require('express')
const { StatEtablissement, listePlusFaiblesMoyennes, listePlusFortesMoyennes, meilleureByClasseController, register } = require('../controllers/admin.controller')
const verifyToken = require('../middleware/verifyToken')
const route = express.Router()

route.post('/register', register)
route.get('/stat',verifyToken, StatEtablissement)
route.get('/liste-faible-moyenne',verifyToken, listePlusFaiblesMoyennes)
route.get('/liste-forte-moyenne',verifyToken, listePlusFortesMoyennes)
route.get('/cinq-meilleurByclasse',verifyToken, meilleureByClasseController)

module.exports = route