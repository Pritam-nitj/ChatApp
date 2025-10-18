// backend/routes/chatRoutes.js
const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController'); 

// GET /api/chats - Get all chats (sorted by newest first)
router.get('/', chatController.getAllChats);

// POST /api/chats - Create a new chat
router.post('/', chatController.createChat);

// DELETE /api/chats/:id - Delete a specific chat
router.delete('/:id', chatController.deleteChat);

module.exports = router;