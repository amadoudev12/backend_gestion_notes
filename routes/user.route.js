const express = require('express')
const { loginController } = require('../controllers/user.controller')
const route = express.Router()
route.post('/login', loginController)
module.exports = route