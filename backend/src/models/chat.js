// backend/models/Chat.js
const mongoose = require('mongoose');

const ChatSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        trim: true
    },
    message: {
        type: String,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true }); // Mongoose adds createdAt and updatedAt fields

// Export the Mongoose Model
module.exports = mongoose.model('Chat', ChatSchema);