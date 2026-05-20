require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');
const KNOWLEDGE_BASE = require('./knowledge');

const { GROQ_API_KEY, TAVILY_API_KEY } = process.env;
const PORT = process.env.PORT || 3001;

const app = express();
const sessions = {};

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// Keywords that indicate the user needs real-time info
const REALTIME_KEYWORDS = [
  'bloqueo', 'bloqueos', 'paro', 'marcha', 'protesta', 'huelga',
  'hoy', 'ahora', 'actualmente', 'este momento', 'abierto', 'cerrado',
  'clima', 'tiempo', 'lluvia', 'temperatura',
  'evento', 'festival', 'feria', 'actividad',
  'blockade', 'strike', 'protest', 'today', 'right now', 'currently',
  'weather', 'open', 'closed', 'event', 'happening'
];

function needsRealtime(text) {
  const lower = text.toLowerCase();
  return REALTIME_KEYWORDS.some(kw => lower.includes(kw));
}

async function webSearch(query) {
  if (!TAVILY_API_KEY) return null;
  try {
    const res = await axios.post(
      'https://api.tavily.com/search',
      {
        query: `${query} Sucre Bolivia`,
        search_depth: 'basic',
        max_results: 3,
        include_answer: true,
      },
      {
        headers: {
          Authorization: `Bearer ${TAVILY_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 5000,
      }
    );
    const { answer, results } = res.data;
    const snippets = results.map(r => `- ${r.title}: ${r.content.slice(0, 200)}`).join('\n');
    return `Información actual de internet:\n${answer || ''}\n${snippets}`;
  } catch (err) {
    console.error('Tavily error:', err.message);
    return null;
  }
}

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

  // Inject real-time search context if needed
  let systemPrompt = KNOWLEDGE_BASE;
  if (needsRealtime(message)) {
    const searchResult = await webSearch(message);
    if (searchResult) {
      systemPrompt = `${KNOWLEDGE_BASE}\n\n${searchResult}`;
    }
  }

  try {
    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'llama-3.3-70b-versatile',
        max_tokens: 350,
        messages: [
          { role: 'system', content: systemPrompt },
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
