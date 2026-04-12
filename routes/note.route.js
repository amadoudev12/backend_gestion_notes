const express = require('express')
const { postNote, getNotesByElveId, getAllNotesByClasseByMatier } = require('../controllers/note.controller')
const route = express.Router()
route.post('/create-note', postNote)
route.post('/liste-note', getAllNotesByClasseByMatier)
route.get('/getNote/:id', getNotesByElveId)
module.exports = route