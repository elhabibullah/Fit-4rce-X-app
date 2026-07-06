import express from 'express';
import http from 'http';
import path from 'path';
import { WebSocketServer } from 'ws';
import { GoogleGenAI, Modality } from '@google/genai';
import { createServer as createViteServer } from 'vite';

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/api/live-coach' });

const PORT = 3000;

app.use(express.json());

// Initialize GoogleGenAI on the server side - keeping the API key absolutely secure
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// Secure API proxy endpoints for Gemini requests
app.post('/api/translate-sprint-plan', async (req: express.Request, res: express.Response) => {
  try {
    const { plan, language } = req.body;
    if (['en', 'fr'].includes(language)) {
      res.json(plan);
      return;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `You are an elite athletics coach and translator. Translate this sprint training plan into the target language: ${language}.
      
      Structure requirements:
      - Translate all descriptive texts into ${language}: 'titleFr' (translate to target language), 'titleEn' (translate to target language), 'descriptionFr' (translate to target language), 'descriptionEn' (translate to target language).
      - Translate the array items in 'warmupFr' and 'warmupEn' into ${language}.
      - Translate the array items in 'drillsFr' and 'drillsEn' into ${language}.
      - Translate the array items in 'cooldownFr' and 'cooldownEn' into ${language}.
      - For each exercise in 'mainExercises', translate:
        - 'nameFr' and 'nameEn' into ${language}.
        - 'intensityFr' and 'intensityEn' into ${language} (e.g. "90% d'effort max" -> translated equivalent, or "90% Max Effort" -> translated equivalent).
        - 'targetTimeFr' and 'targetTimeEn' into ${language} (translate focus/approx labels, keep times like 5.5s unchanged if standard).
        - 'recoveryFr' and 'recoveryEn' into ${language}.
        - 'notesFr' and 'notesEn' into ${language}.
        - 'setsRepsFr' and 'setsRepsEn' into ${language}.
      
      Maintain all other keys exactly unchanged, such as 'id', 'distance', 'isHillWork'.
      Return ONLY the valid translated JSON matching the structure of the input.
      
      Input sprint plan JSON:
      ${JSON.stringify(plan)}`,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const parsed = JSON.parse(response.text || "{}");
    res.json(parsed);
  } catch (error: any) {
    console.error("API error translate-sprint-plan:", error);
    res.status(500).json({ error: error.message || 'Failed to translate sprint plan' });
  }
});

app.post('/api/generate-workout', async (req: express.Request, res: express.Response) => {
  try {
    const { prompt, language } = req.body;
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `As an elite fitness trainer, generate a professional training session in ${language} for: ${prompt}.
      Format requirement: { "title": "String", "description": "String", "exercises": [{ "name": "String", "description": "String", "equipment": "String" }] }`,
      config: {
        responseMimeType: 'application/json'
      }
    });
    res.json(JSON.parse(response.text || "{}"));
  } catch (error: any) {
    console.error("API error generate-workout:", error);
    res.status(500).json({ error: error.message || 'Failed to generate workout' });
  }
});

app.post('/api/chatbot-response', async (req: express.Request, res: express.Response) => {
  try {
    const { msg } = req.body;
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: msg,
      config: {
        systemInstruction: "You are the Fit-4rce X Assistant. Helpful, concise, and focused on fitness performance."
      }
    });
    res.json({ text: response.text || "System ready." });
  } catch (error: any) {
    console.error("API error chatbot-response:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/diet-plan', async (req: express.Request, res: express.Response) => {
  try {
    const { profile, language } = req.body;
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Generate a high-performance daily nutrition plan for ${profile?.full_name || 'the user'} in ${language}. Goal: 3200 kcal. Return JSON only.`,
      config: {
        responseMimeType: 'application/json'
      }
    });
    res.json(JSON.parse(response.text || '{}'));
  } catch (error: any) {
    console.error("API error diet-plan:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/diet-al-response', async (req: express.Request, res: express.Response) => {
  try {
    const { msg } = req.body;
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: msg
    });
    res.json({ text: response.text || "Analyzing..." });
  } catch (error: any) {
    console.error("API error diet-al-response:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/trainer-cv', async (req: express.Request, res: express.Response) => {
  try {
    const { name, bio, language } = req.body;
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Generate a professional, structured trainer CV for ${name} with the following biography: ${bio} in ${language}.`
    });
    res.json({ text: response.text || "Profile data loaded..." });
  } catch (error: any) {
    console.error("API error trainer-cv:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/fasting-phase', async (req: express.Request, res: express.Response) => {
  try {
    const { phaseName, language } = req.body;
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Explain the physiological state and benefits of the fasting phase: "${phaseName}" in ${language}. Keep it scientifically accurate yet accessible.`
    });
    res.json({ text: response.text || "Analyzing physiological state..." });
  } catch (error: any) {
    console.error("API error fasting-phase:", error);
    res.status(500).json({ error: error.message });
  }
});

wss.on('connection', (ws) => {
  console.log('Client connected to Live Coach WebSocket proxy');
  let session: any = null;

  ws.on('message', async (message) => {
    try {
      const parsed = JSON.parse(message.toString());

      if (parsed.type === 'setup') {
        const { systemPrompt, voiceName } = parsed;
        console.log('Establishing secure live session with voice name:', voiceName);
        
        session = await ai.live.connect({
          model: 'gemini-3.1-flash-live-preview',
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
              voiceConfig: { prebuiltVoiceConfig: { voiceName: voiceName || 'Zephyr' } },
            },
            systemInstruction: systemPrompt || 'You are Fit-4rce-X Coach.',
            inputAudioTranscription: {},
            outputAudioTranscription: {},
          },
          callbacks: {
            onmessage: (msg) => {
              // Directly forward the server content to the client
              ws.send(JSON.stringify(msg));
            },
            onclose: () => {
              console.log('Gemini session closed');
              ws.send(JSON.stringify({ type: 'status', status: 'Link closed' }));
            },
            onerror: (err) => {
              console.error('Gemini session error:', err);
              ws.send(JSON.stringify({ type: 'status', status: 'Connection error' }));
            }
          }
        });
        ws.send(JSON.stringify({ type: 'status', status: 'Listening...' }));
      } else if (parsed.audio) {
        if (session) {
          session.sendRealtimeInput({
            audio: { data: parsed.audio, mimeType: 'audio/pcm;rate=16000' }
          });
        }
      }
    } catch (err) {
      console.error('WebSocket proxy message processing error:', err);
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected from Live Coach WebSocket proxy');
    if (session) {
      session.close();
    }
  });
});

async function startServer() {
  // Vite middleware for development / serving files in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Fit-4rce-X Full-Stack Server running on port ${PORT}`);
  });
}

startServer();
