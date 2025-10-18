const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();

mongoose.connect('mongodb://localhost:27017/chatApp');

const Message = mongoose.model('Message', new mongoose.Schema({
  sender: String,
  receiver: String,
  content: String,
  isRead: { type: Boolean, default: false },
  timestamp: { type: Date, default: Date.now }
}));

app.use(cors());
app.use(express.json());

app.post('/send', async (req, res) => {
  const msg = new Message(req.body);
  await msg.save();
  res.sendStatus(200);
});

app.get('/unread/:user', async (req, res) => {
  const msgs = await Message.find({ receiver: req.params.user, isRead: false });
  res.json(msgs);
});

app.post('/read', async (req, res) => {
  await Message.updateMany({ receiver: req.body.user }, { isRead: true });
  res.sendStatus(200);
});

app.listen(3001, () => console.log('Server running on 3001'));