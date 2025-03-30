import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { google } from '@ai-sdk/google';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const app = express();
const PORT = 5000;

app.use(cors({ origin: "http://localhost:5173" }));
app.use(bodyParser.json());

const googleAI = google({
    apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY
});

app.post('/chat', async (req, res) => {
    try {
        const { message } = req.body;
        const response = await googleAI.generateText({
            prompt: message,
            model: 'text-bison-001'
        });
        res.json({ reply: response.text });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
