import { GoogleGenAI } from '@google/genai';
import { generateSmartWorkout } from '../lib/workoutPools.ts';

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

  const body = req.body || {};
  const workoutType = body.workoutType || body.options?.workoutType || 'fitness';
  const fitnessLevel = body.fitnessLevel || body.options?.level || 'intermediate';
  const equipment = body.equipment || body.options?.equipment || 'bodyweight';
  const combinedPrompt = body.prompt || body.combinedPrompt || '';
  const targetLang = body.language || 'en';

  let targetSets = 4;
  let targetReps = 14;
  let restBetweenSets = 30;

  if (body.options && typeof body.options === 'object') {
    if (typeof body.options.targetSets === 'number' && body.options.targetSets > 0) targetSets = body.options.targetSets;
    else if (typeof body.options.sets === 'number' && body.options.sets > 0) targetSets = body.options.sets;

    if (typeof body.options.targetReps === 'number' && body.options.targetReps > 0) targetReps = body.options.targetReps;
    else if (typeof body.options.reps === 'number' && body.options.reps > 0) targetReps = body.options.reps;

    if (typeof body.options.restBetweenSets === 'number' && body.options.restBetweenSets > 0) restBetweenSets = body.options.restBetweenSets;
    else if (typeof body.options.restSeconds === 'number' && body.options.restSeconds > 0) restBetweenSets = body.options.restSeconds;
  }

  const ai = getAiClient();
  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `You are Fit-4rce X Master Sports Biomechanist & Conditioning Coach.
Generate an authentic, professional 5-exercise workout plan in the exact target language: "${targetLang}".

CRITICAL LANGUAGE RULE:
- All exercise names, descriptions, title, and instructions MUST BE IN ${targetLang}. If ${targetLang} is "en", DO NOT use French names.
- NO INVENTED OR WEIRD NAMES. Use ONLY standard, real exercises known by certified personal trainers (e.g. in English: Push-ups, Squats, Lunges, Plank, Burpees, Crunches, Glute Bridge, Jumping Jacks, High Knees, Inverted Rows).
- Every exercise must include a valid "canonicalId" from: "push_up", "squat", "lunge", "reverse_lunge", "plank", "burpee", "crunch", "glute_bridge", "jumping_jack", "high_knees", "bent_over_row", "bicep_curl", "overhead_press", "deadlift".

Workout Discipline: ${workoutType}
Fitness Level: ${fitnessLevel}
Equipment Mode: ${equipment}
Specific User Instructions: ${combinedPrompt}
Specific User Instructions: ${combinedPrompt}

CRITICAL DIVERSITY & ANATOMICAL MANDATE:
- DO NOT RESTRICT YOURSELF to a narrow, repetitive set of 2-4 standard exercises!
- Tap into the vast encyclopedic repertoire of hundreds of authentic movements in this discipline:
  * For Calisthenics: Variations of pull-ups (pronated, supinated, wide, archer, typewriter, commando, inverted rows), dips (parallel, straight bar, rings), push-ups (diamond, decline, pseudo-planche, pike, handstand, archer, hindu), levers & core holds (L-sit, dragon flag, hollow body), and bodyweight leg mastery (pistol, shrimp, sissy, cossack, Nordic curls).
  * For Core, Abdominals & Planks: Over 500 movement variations exist! Forearm planks, RKC planks, Copenhagen planks, dynamic side planks with hip drop or leg lift, hollow body holds/rocks, ab wheel rollouts, hanging leg raises, deadbugs, bird dogs, Russian twists, reverse crunches, bear crawl holds, etc.
  * For Pilates: Full classical & contemporary repertoire (The Hundred, Roll Up, Roll Over, Single/Double Leg Stretch, Criss-cross, Spine Stretch, Saw, Swan Dive, Single/Double Leg Kick, Scissors, Bicycle, Shoulder Bridge, Side Kick series, Teasers, Swimming, Leg Pulls, Boomerang, Seal, etc.).
  * For Yoga: Vast classical asana repertoire (Surya Namaskar, Virabhadrasana I/II/III, Trikonasana, Bakasana, Sirsasana, Urdhva Dhanurasana, Matsyasana, Bhujangasana, Gomukhasana, Paschimottanasana, Ardha Matsyendrasana, Baddha Konasana, etc.).
  * For Powerlifting: Squats (low bar, high bar, paused, pin, box, front), Bench Press (competition, close-grip, spoto, floor press), Deadlifts (conventional, sumo, Romanian, deficit, block pull), Military press, Pendlay/Yates rows, good mornings, hip thrusts.
  * For Hypertrophy / Bodybuilding: Incline/decline presses, dumbbell flyes, Arnold presses, lateral raises, Romanian deadlifts, Bulgarian split squats, hammer curls, skull crushers.
  * For Conditioning / HIIT: Burpees, mountain climbers, skater jumps, tuck jumps, box jumps, kettlebell swings, bear crawls.

The session protocol requires exactly ${targetSets} sets of ${targetReps} reps per exercise with ${restBetweenSets}s rest pause.
Return a JSON object with:
- "title": string (engaging, sport-accurate title)
- "description": string (clear summary of the session benefits)
- "exercises": array of 5 distinct, well-balanced objects, each having:
  { "name": string, "description": string, "equipment": string, "sets": ${targetSets}, "reps": ${targetReps}, "restSeconds": ${restBetweenSets} }`,
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
      console.warn('Gemini generate-workout Vercel error, dynamic fallback activated:', err);
    }
  }

  // Dynamic diversified fallback pulling from hundreds of authentic movements
  const smartWorkout = generateSmartWorkout(workoutType, targetSets, targetReps, restBetweenSets, targetLang, equipment);
  return res.status(200).json(smartWorkout);
}
