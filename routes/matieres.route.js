const express = require('express')
const verifyToken = require('../middleware/verifyToken')
const { createMatiere, getAllMatieres, updateMatiere, deleteMatiere } = require('../controllers/matiere.controller')
const route = express.Router()

route.get('/', verifyToken, getAllMatieres)
route.post('/add',verifyToken, createMatiere)
route.put('/update/:id',verifyToken, updateMatiere)
route.delete('/delete/:id',verifyToken, deleteMatiere)

module.exports = route