const express = require('express')
const { postEtablissement, getEtablissementByIdAdmin } = require('../controllers/etablissement.controller')
const route = express.Router()

route.post('/create', postEtablissement)
route.get('/:id', getEtablissementByIdAdmin)
module.exports = route