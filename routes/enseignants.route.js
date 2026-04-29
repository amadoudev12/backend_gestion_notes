const express = require('express')
const { createEnseignantController, getEnseignantByMatriculeController, classeEnseignerParEnsignant, enseignantStatController, enseignantEtablissement, nombreMatiereController, nombreElevesClasse } = require('../controllers/enseignant.controller')
const VerifyToken = require('../middleware/verifyToken')
const upload = require('../middleware/uploadsFichier')
const route = express.Router()

route.get('/etablissement', VerifyToken, enseignantEtablissement)
route.get('/get-enseignant', getEnseignantByMatriculeController)
route.get('/classe-enseigner',VerifyToken, classeEnseignerParEnsignant)
route.get('/stat',VerifyToken, enseignantStatController)
route.get('/nombre-eleves-classes', VerifyToken, nombreElevesClasse)
route.post('/create',upload.single('file') ,VerifyToken,createEnseignantController)
module.exports = route