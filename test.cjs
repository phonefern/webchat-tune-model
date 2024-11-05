const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { GoogleAIFileManager } = require('@google/generative-ai/server');
const admin = require('firebase-admin');
const app = express();
const port = 3000;





const serviceAccount = require('./llm-chat-fbe62-firebase-adminsdk-f92n5-8513431bd9.json'); 
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'gs://llm-chat-fbe62.appspot.com' 
});
const bucket = admin.storage().bucket();

app.use(cors());
app.use(express.json());

const apiKey = 'AIzaSyAYinKiYLPNeCT5pqRQkpp5UDP_cO9pmYc';
const genAI = new GoogleGenerativeAI(apiKey);
const fileManager = new GoogleAIFileManager(apiKey);

const availableModels = {
  "gemini-1.5-flash": genAI.getGenerativeModel({ model: "gemini-1.5-flash" }),
  "packagetestv2-nettsfkvxpqs": genAI.getGenerativeModel({ model: "tunedModels/packagetestv2-nettsfkvxpqs" }),
};


async function getFirebaseFileUrl(filePath) {
  const file = bucket.file(filePath); 
  const [url] = await file.getSignedUrl({
    action: 'read',
    expires: '19-10-2567', 
  });
  return url; 
}


app.post('/ask-ai', async (req, res) => {
  const { question, model, filePath } = req.body; 

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
    let fileUrl = null;

   
    if (filePath) {
      fileUrl = await getFirebaseFileUrl(filePath);
    }

    const history = [
      {
        role: "user",
        parts: [
          { text: question },
        ],
      }
    ];

    
    if (fileUrl) {
      history.push({
        role: "user",
        parts: [
          {
            fileData: {
              mimeType: 'image/jpeg', 
              fileUri: fileUrl,
            },
          }
        ]
      });
    }

    const chatSession = selectedModel.startChat({
      generationConfig,
      history,
    });

    const result = await chatSession.sendMessage(question);
    console.log(result.response.text());
    console.log('Received data:', req.body);
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
