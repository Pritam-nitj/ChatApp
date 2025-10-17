const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);

app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json());

// --- MOCK DATA ---
let messages = [
    { _id: 'msg1', chatRoomId: 'general_room', senderId: 'userA', content: 'Hello everyone!', isDeleted: false, timestamp: new Date(Date.now() - 60000) },
    { _id: 'msg2', chatRoomId: 'general_room', senderId: 'userB', content: 'What a great feature!', isDeleted: false, timestamp: new Date() },
    { _id: 'msg3', chatRoomId: 'general_room', senderId: 'userC', content: 'This message was deleted.', isDeleted: true, deletedAt: new Date(), deletedBy: 'userA', timestamp: new Date(Date.now() - 120000) },
];
const CHAT_ROOM_ID = 'general_room'; 

// --- Socket.IO Setup ---
const io = socketIo(server, { cors: { origin: 'http://localhost:3000' } });

io.on('connection', (socket) => {
    socket.on('joinRoom', (room) => {
        socket.join(room);
    });
});

// --- API Routes ---

// GET: Fetch all initial messages 
app.get('/api/messages/:roomId', (req, res) => {
    return res.json(messages); 
});

// DELETE: Soft delete a message 
app.delete('/api/messages/:messageId', (req, res) => {
    const { messageId } = req.params;
    
    const message = messages.find(m => m._id === messageId);

    if (!message) {
        return res.status(404).json({ error: "Message not found." });
    }
    
    // 1. Soft Delete (Update the message in the mock array)
    message.isDeleted = true;
    message.deletedAt = new Date();
    message.content = "This message was deleted by a room member.";
    
    // 2. Real-time Notification
    io.to(CHAT_ROOM_ID).emit('messageDeleted', { 
        messageId: message._id, 
        chatRoomId: CHAT_ROOM_ID 
    });

    res.status(204).send(); 
});

const PORT = 5000;
server.listen(PORT, () => console.log(`Backend server listening on port ${PORT}`));