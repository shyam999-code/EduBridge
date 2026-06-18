const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const aiService = require('./services/aiService');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5005;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static assets from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Chatbot API Endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { query, subject, studentClass, language, history } = req.body;

    if (!query || query.trim() === '') {
      return res.status(400).json({ error: 'Query is required' });
    }

    const responseText = await aiService.generateResponse(
      query,
      subject || 'General Academic',
      studentClass || 'Class 8',
      language || 'English',
      history || []
    );

    return res.json({ response: responseText });
  } catch (error) {
    console.error('Server error handling chat:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Serve frontend index.html for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`===================================================`);
  console.log(`  EduBridge AI Assistant running on port ${PORT}`);
  console.log(`  Open: http://localhost:${PORT}`);
  console.log(`===================================================`);
});
// Trigger nodemon reload

