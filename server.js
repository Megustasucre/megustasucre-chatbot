require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');
const KNOWLEDGE_BASE = require('./knowledge');

const { GROQ_API_KEY } = process.env;
const PORT = process.env.PORT || 3001;

const app = express();
const sessions = {};

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.post('/chat', async (req, res) => {
  const { message, sessionId } = req.body;
  if (!message?.trim() || !sessionId) {
    return res.status(400).json({ error: 'Missing fields' });
  }

  if (!sessions[sessionId]) sessions[sessionId] = [];
  sessions[sessionId].push({ role: 'user', content: message.trim() });

  if (sessions[sessionId].length > 12) {
    sessions[sessionId] = sessions[sessionId].slice(-12);
  }

  try {
    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'llama-3.3-70b-versatile',
        max_tokens: 350,
        messages: [
          { role: 'system', content: KNOWLEDGE_BASE },
          ...sessions[sessionId],
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const reply = response.data.choices[0].message.content;
    sessions[sessionId].push({ role: 'assistant', content: reply });
    res.json({ reply });
  } catch (err) {
    console.error('Groq error:', err.message);
    res.status(500).json({ error: 'AI unavailable' });
  }
});

app.listen(PORT, () => console.log(`Chinchi chatbot server on port ${PORT}`));
