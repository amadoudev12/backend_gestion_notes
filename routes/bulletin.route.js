const express = require("express")
const VerifyToken = require('../middleware/verifyToken')
const { genererBulletinClasse } = require("../controllers/bulletin.controller")
const route = express.Router()

route.get('/:id', VerifyToken, genererBulletinClasse)
module.exports = route