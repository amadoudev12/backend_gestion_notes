const express = require('express')
const { getTrimestres, postTrimestreController, actifTrimestreController } = require('../controllers/trimestre.controller')
const route = express.Router()

route.get('/', getTrimestres)
route.post('/create', postTrimestreController)
route.patch('/actif/:id', actifTrimestreController)

module.exports = route