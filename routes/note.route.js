const express = require('express')
const { postNote, getNotesByElveId, getAllNotesByClasseByMatier, noteRepartition } = require('../controllers/note.controller')
const verifyToken = require('../middleware/verifyToken')
const route = express.Router()
route.post('/create-note', postNote)
route.post('/liste-note', getAllNotesByClasseByMatier)
route.get('/repartition-note', verifyToken, noteRepartition)
route.get('/getNote/:id', getNotesByElveId)
module.exports = route