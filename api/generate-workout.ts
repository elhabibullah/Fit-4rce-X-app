import { GoogleGenAI } from '@google/genai';

let aiInstance: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  if (!aiInstance) {
    aiInstance = new GoogleGenAI({ apiKey });
  }
  return aiInstance;
}

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { combinedPrompt, workoutType, fitnessLevel, options, language } = req.body || {};
  const targetLang = language || 'fr';

  let targetSets = 4;
  let targetReps = 14;
  let restBetweenSets = 30;

  if (options && typeof options === 'object') {
    if (typeof options.sets === 'number' && options.sets > 0) targetSets = options.sets;
    if (typeof options.reps === 'number' && options.reps > 0) targetReps = options.reps;
    if (typeof options.restSeconds === 'number' && options.restSeconds > 0) restBetweenSets = options.restSeconds;
  }

  const ai = getAiClient();
  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `You are Fit-4rce X Master AI Coach. Generate a comprehensive workout plan in ${targetLang}.
Workout Type: ${workoutType || 'fitness'}
Fitness Level: ${fitnessLevel || 'intermediate'}
Prompt Details: ${combinedPrompt || ''}
The session protocol requires exactly ${targetSets} sets of ${targetReps} reps per exercise with ${restBetweenSets}s rest pause.
Return a JSON object with:
- "title": string
- "description": string
- "exercises": array of 5 objects, each having { "name": string, "description": string, "equipment": string, "sets": ${targetSets}, "reps": ${targetReps}, "restSeconds": ${restBetweenSets} }`,
        config: {
          responseMimeType: 'application/json'
        }
      });

      const raw = response.text || '';
      const cleaned = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
      const parsed = JSON.parse(cleaned);

      if (parsed && Array.isArray(parsed.exercises) && parsed.exercises.length > 0) {
        return res.status(200).json({
          ...parsed,
          targetSets,
          targetReps,
          restBetweenSets,
          exercises: parsed.exercises.map((e: any) => ({
            ...e,
            sets: e.sets || targetSets,
            reps: e.reps || targetReps,
            restSeconds: e.restSeconds || restBetweenSets
          }))
        });
      }
    } catch (err) {
      console.warn('Gemini generate-workout Vercel error, fallback used:', err);
    }
  }

  // Fallback exercises
  const defaultExercises = [
    { name: "Squats Biomécaniques", description: "Flexion complète avec pieds ancrés et buste gainé.", equipment: "bodyweight", sets: targetSets, reps: targetReps, restSeconds: restBetweenSets },
    { name: "Pompes Strictes", description: "Poitrine au ras du sol avec paumes bien à plat.", equipment: "bodyweight", sets: targetSets, reps: targetReps, restSeconds: restBetweenSets },
    { name: "Fentes Alternées", description: "Pas avant contrôlé avec genou frôlant le sol.", equipment: "bodyweight", sets: targetSets, reps: targetReps, restSeconds: restBetweenSets },
    { name: "Gainage Planche", description: "Maintien isométrique de l'alignement anatomique.", equipment: "bodyweight", sets: targetSets, reps: targetReps, restSeconds: restBetweenSets },
    { name: "Soulevé de Terre Poids du Corps", description: "Charnière de hanches pour la chaîne postérieure.", equipment: "bodyweight", sets: targetSets, reps: targetReps, restSeconds: restBetweenSets }
  ];

  return res.status(200).json({
    title: "Fit-4rce X 3D Protocol",
    description: "Session calibrée 3D avec coach holographique",
    targetSets,
    targetReps,
    restBetweenSets,
    exercises: defaultExercises
  });
}
