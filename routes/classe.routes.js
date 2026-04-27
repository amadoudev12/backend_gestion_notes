const express = require('express')
const { listeEleveParClasse, listeClasses, listeClasseByEtabblissement, getClasseMatiere, bestAndBadMoyenneController, createClasse } = require('../controllers/classe.controller')
const route = express.Router()
const VerifyToken = require('../middleware/verifyToken')


route.get('/liste-des-classes', listeClasses)
route.get('/etablissement/classe',VerifyToken, listeClasseByEtabblissement)
route.post('/create', VerifyToken, createClasse)
route.get('/classe-matiere/:id', getClasseMatiere)
route.get('/best-moy/:id', bestAndBadMoyenneController)
route.get('/liste-classe/:id', listeEleveParClasse)
module.exports = route