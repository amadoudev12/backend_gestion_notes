const express = require("express")
const { getBulletinClasse } = require("../controllers/bulletin.controller")
const VerifyToken = require('../middleware/verifyToken')
const route = express.Router()

route.get('/:id',VerifyToken, getBulletinClasse)
module.exports = route