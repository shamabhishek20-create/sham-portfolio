require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const Contact = require('./models/Contact');

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Middleware ────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Static Frontend ───────────────────────────────────────
app.use(express.static(path.join(__dirname, '..', 'public')));

// ─── MongoDB Connection ────────────────────────────────────
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB Atlas'))
  .catch(err => console.error('❌ MongoDB connection error:', err.message));

// ─── POST /contact ─────────────────────────────────────────
app.post('/contact', async (req, res) => {
  try {
    const { name, email, message } = req.body;

    if (!name || !name.trim())
      return res.status(400).json({ success: false, error: 'Name is required.' });

    if (!email || !email.trim())
      return res.status(400).json({ success: false, error: 'Email is required.' });

    if (!/^\S+@\S+\.\S+$/.test(email))
      return res.status(400).json({ success: false, error: 'Please enter a valid email.' });

    if (!message || !message.trim())
      return res.status(400).json({ success: false, error: 'Message is required.' });

    const contact = new Contact({
      name: name.trim(),
      email: email.trim(),
      message: message.trim()
    });

    await contact.save();

    res.status(201).json({ success: true, message: 'Thank you! Your message has been received.' });
  } catch (err) {
    console.error('Contact save error:', err);
    if (err.name === 'ValidationError') {
      const msgs = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ success: false, error: msgs.join(', ') });
    }
    res.status(500).json({ success: false, error: 'Server error. Please try again later.' });
  }
});

// ─── GET /messages (admin) ─────────────────────────────────
app.get('/messages', async (req, res) => {
  try {
    const messages = await Contact.find().sort({ createdAt: -1 });
    res.json({ success: true, count: messages.length, data: messages });
  } catch (err) {
    console.error('Fetch messages error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch messages.' });
  }
});

// ─── Fallback → index.html ─────────────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// ─── Start Server ──────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
