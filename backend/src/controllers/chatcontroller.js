// backend/controllers/chatController.js
const mongoose = require('mongoose');
const Chat = require('../models/Chat');

// GET /api/chats
exports.getAllChats = async (req, res) => {
    try {
        // Find all chats and sort by creation date (newest first)
        const chats = await Chat.find().sort({ createdAt: -1 }); 
        res.status(200).json(chats);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching chats', error: error.message });
    }
};

// POST /api/chats
exports.createChat = async (req, res) => {
    try {
        const newChat = new Chat(req.body);
        const savedChat = await newChat.save();
        res.status(201).json(savedChat);
    } catch (error) {
        // Handle validation errors (e.g., missing username/message)
        res.status(400).json({ message: 'Error creating chat. Check input data.', error: error.message });
    }
};

// DELETE /api/chats/:id
exports.deleteChat = async (req, res) => {
    const chatId = req.params.id;

    // Optional: Check if the ID is a valid MongoDB ObjectID format
    if (!mongoose.Types.ObjectId.isValid(chatId)) {
        return res.status(400).json({ message: 'Invalid Chat ID format.' });
    }

    try {
        // ✅ FIXED: Using the Mongoose Model to delete from the database
        const result = await Chat.findByIdAndDelete(chatId);

        if (!result) {
            return res.status(404).json({ message: `Chat with ID ${chatId} not found in the database.` });
        }

        res.status(200).json({ message: `Chat successfully deleted.`, deletedId: chatId });

    } catch (error) {
        console.error('Error during database deletion:', error);
        res.status(500).json({ message: 'Server error during chat deletion.', error: error.message });
    }
};