// server.js

const express = require('express');
const mongoose = require('mongoose');
const chatRoutes = require('./routes/chatRoutes'); // Import the route module

const app = express();
const PORT = 3000;
const DB_URI = 'mongodb://localhost:27017/chatdb'; // ⚠️ REPLACE with your actual DB connection string

// Middleware
app.use(express.json()); // To parse JSON bodies

// Database Connection
mongoose.connect(DB_URI)
    .then(() => console.log('✅ Database connected successfully!'))
    .catch(err => console.error('❌ Database connection error:', err));

// Routes
// All routes defined in chatRoutes.js will be accessible under the /api/chats path
app.use('/api/chats', chatRoutes);

// Simple health check route
app.get('/', (req, res) => {
    res.status(200).send('Server is running. Access chat API at /api/chats');
});

// Start Server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});