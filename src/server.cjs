const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI, HarmCategory,HarmBlockThreshold,} = require('@google/generative-ai');

const app = express();
const port = 3000;

// Use CORS middleware
app.use(cors());

// Middleware to parse JSON request body
app.use(express.json());

// Set up your Google Gemini API Key
const apiKey = 'AIzaSyAYinKiYLPNeCT5pqRQkpp5UDP_cO9pmYc'; // Replace with your actual Gemini API key
const genAI = new GoogleGenerativeAI(apiKey);

// Available models (you can add more models here)
const availableModels = {
  "gemini-1.5-flash": genAI.getGenerativeModel({ model: "gemini-1.5-flash" }),
  "packagetestv2-nettsfkvxpqs": genAI.getGenerativeModel({ model: "tunedModels/packagetestv2-nettsfkvxpqs" }),
};

// Endpoint to handle AI requests
app.post('/ask-ai', async (req, res) => {
  const { question, model } = req.body;

  if (!question) {
    return res.status(400).json({ error: 'Question is required.' });
  }

  if (!model || !availableModels[model]) {
    return res.status(400).json({ error: 'Invalid model selected.' });
  }

  const selectedModel = availableModels[model];
  const generationConfig = {
    temperature: 1,
    topP: 0.95,
    topK: 64,
    maxOutputTokens: 512,
    responseMimeType: "text/plain",
  };

  try {
    const chatSession = selectedModel.startChat({
      generationConfig,
      history: [
        {
          role: "user",
          parts: [
            {text: "hello\n"},
          ],
        },
        {
          role: "model",
          parts: [
            {text: "Hi there! How can I help you today?"},
          ],
        }
      ],
    });

    const result = await chatSession.sendMessage(question);
    console.log(result.response.text());
    res.json({ answer: result.response.text().trim() });
  } catch (error) {
    console.error(error);
    
    res.status(500).json({ error: 'Error processing AI response' });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
