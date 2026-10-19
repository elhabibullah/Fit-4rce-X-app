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
- NO INVENTED OR WEIRD NAMES. Use ONLY standard, real exercises known by certified personal trainers.
- Every exercise must include a valid "canonicalId" from:
  "archer_push_up", "diamond_push_ups", "jumping_squats", "bear_crawl_forward_backward",
  "hollow_body_hold", "forearm_to_pushup_plank", "plank_hop_to_squat", "plank_knee_to_elbow_advanced",
  "plank_walk_back_and_forth", "plank_walk_left_right", "plank_variations_buzzsaw",
  "alternative_arm_plank_hold", "alternative_leg_plank_hold", "alternative_superman_plank_advanced",
  "push_up", "squat", "lunge", "reverse_lunge", "plank", "burpee", "crunch", "glute_bridge", "jumping_jack", "high_knees", "bent_over_row", "bicep_curl", "overhead_press", "deadlift".

CRITICAL BODYWEIGHT / CALISTHENICS RULE:
When Equipment Mode is "bodyweight" (no machines, no weights) or workout discipline is "calisthenics" / "corps" / "core":
You MUST PRIORITIZE the 14 movements with built-in authentic 3D Android animations:
1. archer_push_up (Archer Push-ups / Pompes Archer / تمرين ضغط القوس)
2. diamond_push_ups (Diamond Push-ups / Pompes diamant / تمرين ضغط الماس)
3. jumping_squats (Jumping Squats / Squats sautés / قرفصاء مع القفز الانفجاري)
4. bear_crawl_forward_backward (Bear Crawl / Marche de l'ours / زحف الدب للأمام والخلف)
5. hollow_body_hold (Hollow Body Hold / Maintien Hollow Body / تثبيت وضعية التجويف)
6. forearm_to_pushup_plank (Commandos / Planche commando / بلانك كوماندوز)
7. plank_hop_to_squat (Plank Hop to Squat / Saut de planche vers squat / القفز من البلانك إلى القرفصاء)
8. plank_knee_to_elbow_advanced (Spider Plank Knee to Elbow / Planche genou-coude / بلانك متقدم ركبة إلى الكوع)
9. plank_walk_back_and_forth (Plank Walk Back & Forth / Planche avant-arrière / مشي البلانك للأمام والخلف)
10. plank_walk_left_right (Lateral Plank Walk / Planche latérale / مشي البلانك الجانبي)
11. plank_variations_buzzsaw (Buzzsaw Plank / Planche scie va-et-vient / بلانك المنشار المتأرجح)
12. alternative_arm_plank_hold (Arm Plank Hold / Planche levée de bras / بلانك مع رفع الذراع بالتناوب)
13. alternative_leg_plank_hold (Leg Plank Hold / Planche levée de jambe / بلانك مع رفع الساق بالتناوب)
14. alternative_superman_plank_advanced (Advanced Superman Plank / Planche Superman avancée / بلانك سوبرمان المتقدم بالتناوب)

CRITICAL ARABIC ATHLETIC TRANSLATION MANDATE:
When target language is "ar" (Arabic):
Provide natural, high-level sports translations in Arabic for all titles, names, and descriptions (e.g. use terms like تمرين ضغط القوس, بلانك كوماندوز, زحف الدب للأمام والخلف, etc.).

Workout Discipline: ${workoutType}
Fitness Level: ${fitnessLevel}
Equipment Mode: ${equipment}
Specific User Instructions: ${combinedPrompt}

CRITICAL DIVERSITY & ANATOMICAL MANDATE:
- DO NOT RESTRICT YOURSELF to a narrow, repetitive set of 2-4 standard exercises!
- Tap into the vast encyclopedic repertoire of hundreds of authentic movements in this discipline.

The session protocol requires exactly ${targetSets} sets of ${targetReps} reps per exercise with ${restBetweenSets}s rest pause.
Return a JSON object with:
- "title": string (engaging, sport-accurate title in ${targetLang})
- "description": string (clear summary of the session benefits in ${targetLang})
- "exercises": array of 5 distinct, well-balanced objects, each having:
  { "canonicalId": string, "name": string, "description": string, "equipment": string, "sets": ${targetSets}, "reps": ${targetReps}, "restSeconds": ${restBetweenSets} }`,
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
