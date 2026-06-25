const express = require('express')
const { getTrimestres, postTrimestreController, actifTrimestreController, deleteTrimestre } = require('../controllers/trimestre.controller')
const VerifyToken = require('../middleware/verifyToken')
const route = express.Router()

route.get('/', getTrimestres)
route.post('/create',VerifyToken, postTrimestreController)
route.patch('/actif/:id', actifTrimestreController)
route.delete('/delete/:id',VerifyToken,deleteTrimestre)

module.exports = route