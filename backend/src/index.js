import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import authRoutes from './routes/auth.route.js';
import messageRoutes from './routes/message.route.js';
// import groupRoutes from "./routes/group.route.js";
// import groupMessageRoutes from "./routes/groupMessage.js";
import cookieParser from 'cookie-parser';
import { connectDB } from './lib/db.js';
import cors from 'cors';
import { app, server } from './lib/socket.js';
import groupRoutes from './routes/group.route.js';
import groupMessageRoutes from './routes/groupMessage.route.js';
import voiceRoutes from './routes/voice.route.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

connectDB();
const PORT = process.env.PORT || 5000;

app.use(express.json({ limit: '8mb' }));
app.use(cookieParser());

// Updated CORS configuration
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      const allowedOrigins = [
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        process.env.FRONTEND_URL,
      ].filter(Boolean);

      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
  })
);

// Create temp directory if it doesn't exist
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const tempDir = path.join(__dirname, '../temp');

// Create temp directory for temporary file uploads
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

app.use('/api/auth', authRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/group-messages', groupMessageRoutes);
app.use('/api/voice-messages', voiceRoutes);

app.get('/', (req, res) => {
  res.send({
    activeStatus: true,
    error: false,
  });
});

// 404 handler
app.use((req, res, next) => {
  res.status(404).send({ message: 'Route Not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send({ message: 'Internal Server Error' });
});

server.listen(PORT, () => {
  console.log('Server Running on Port:', PORT);
});
