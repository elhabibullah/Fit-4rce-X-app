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

  const body = req.body || {};
  const workoutType = body.workoutType || body.options?.workoutType || 'fitness';
  const fitnessLevel = body.fitnessLevel || body.options?.level || 'intermediate';
  const equipment = body.equipment || body.options?.equipment || 'bodyweight';
  const combinedPrompt = body.prompt || body.combinedPrompt || '';
  const targetLang = body.language || 'fr';

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

  const disciplineRules = `
CRITICAL DISCIPLINE RULES:
- If workoutType is "yoga": ONLY return authentic yoga postures/asanas (e.g. Vinyasa, Guerrier, Chien tête en bas, Cobra, Posture de l'arbre). DO NOT include heavy barbell lifts, bench press, or burpees.
- If workoutType is "calisthenics": ONLY return pure bodyweight exercises (e.g. Tractions/Pull-ups, Dips aux barres, Pompes strictes, Relevés de jambes à la barre, Squats unilatéraux).
- If workoutType is "powerlifting": ONLY return power movements (e.g. Squat barre arrière, Développé couché, Soulevé de terre traditionnel, Développé militaire, Rowing barre).
- If workoutType is "pilates": ONLY return authentic mat pilates movements (e.g. The Hundred, Pont Fessier isométrique, Gainage latéral Pilates, Swimming, Relevé de bassin).
- If workoutType is "mass_gaining": ONLY return muscle hypertrophy exercises (e.g. Développé couché, Squats, Soulevé de terre roumain, Tractions lestées, Fentes marchées).
- If workoutType is "fitness": Return balanced conditioning and toning movements (Squats, Pompes, Fentes, Gainage, Mountain Climbers).
`;

  const ai = getAiClient();
  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `You are Fit-4rce X Master AI Coach. Generate a comprehensive workout plan in ${targetLang}.
Workout Type: ${workoutType}
Fitness Level: ${fitnessLevel}
Equipment Mode: ${equipment} (bodyweight = sans matériel, home = haltères/bandes/tapis, gym = salle de sport/barres/machines)
Prompt Details: ${combinedPrompt}
${disciplineRules}
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

  // Authentic per-discipline fallbacks ensuring 100% fidelity to the user's selected sport
  const normType = (workoutType || '').toLowerCase();
  let defaultExercises: any[];

  if (normType.includes('yoga')) {
    defaultExercises = [
      { name: "Salutation au Soleil (Surya Namaskar)", description: "Enchaînement fluide synchronisant souffle et mobilité vertébrale.", equipment: "mat", sets: targetSets, reps: targetReps, restSeconds: restBetweenSets },
      { name: "Posture du Guerrier II (Virabhadrasana II)", description: "Ancrage des pieds au sol, alignement des bras et ouverture du bassin.", equipment: "mat", sets: targetSets, reps: targetReps, restSeconds: restBetweenSets },
      { name: "Chien Tête en Bas (Adho Mukha Svanasana)", description: "Allongement de la colonne et étirement de la chaîne postérieure.", equipment: "mat", sets: targetSets, reps: targetReps, restSeconds: restBetweenSets },
      { name: "Posture du Cobra (Bhujangasana)", description: "Extension douce du thorax avec paumes à plat au sol sans comprimer les lombaires.", equipment: "mat", sets: targetSets, reps: targetReps, restSeconds: restBetweenSets },
      { name: "Posture de l'Arbre (Vrksasana)", description: "Équilibre unipodal et alignement postural sur le plateau.", equipment: "mat", sets: targetSets, reps: targetReps, restSeconds: restBetweenSets }
    ];
  } else if (normType.includes('calisthenic')) {
    defaultExercises = [
      { name: "Tractions Pronation Strictes", description: "Tirage vertical complet au poids du corps avec verrouillage scapulaire.", equipment: "pullup_bar", sets: targetSets, reps: targetReps, restSeconds: restBetweenSets },
      { name: "Dips aux Barres Parallèles", description: "Flexion des coudes à 90° avec buste légèrement incliné.", equipment: "dip_bars", sets: targetSets, reps: targetReps, restSeconds: restBetweenSets },
      { name: "Pompes Déclinées Strictes", description: "Pieds surélevés, paumes à plat au sol, trajectoire anatomique des coudes.", equipment: "bodyweight", sets: targetSets, reps: targetReps, restSeconds: restBetweenSets },
      { name: "Relevés de Jambes Suspendu", description: "Contrôle du tronc sans élan pour engager le grand droit.", equipment: "pullup_bar", sets: targetSets, reps: targetReps, restSeconds: restBetweenSets },
      { name: "Squats Pistol / Unilatéraux", description: "Flexion sur une jambe avec pieds solidement ancrés au sol.", equipment: "bodyweight", sets: targetSets, reps: targetReps, restSeconds: restBetweenSets }
    ];
  } else if (normType.includes('power')) {
    defaultExercises = [
      { name: "Squat Arrière Barre Olympique", description: "Descente contrôlée sous la parallèle avec poussée talon.", equipment: "barbell", sets: targetSets, reps: targetReps, restSeconds: restBetweenSets },
      { name: "Développé Couché Prise Moyenne", description: "Arche dorsale, omoplates serrées et contact contrôlé sur le sternum.", equipment: "barbell", sets: targetSets, reps: targetReps, restSeconds: restBetweenSets },
      { name: "Soulevé de Terre Conventionnel", description: "Pieds ancrés, chaîne postérieure engagée et verrouillage des hanches.", equipment: "barbell", sets: targetSets, reps: targetReps, restSeconds: restBetweenSets },
      { name: "Développé Militaire Debout", description: "Poussée verticale stricte au-dessus de la tête sans élan des genoux.", equipment: "barbell", sets: targetSets, reps: targetReps, restSeconds: restBetweenSets },
      { name: "Rowing Barre Buste Penché", description: "Tirage dorsal lourd en préservant l'alignement neutre de la colonne.", equipment: "barbell", sets: targetSets, reps: targetReps, restSeconds: restBetweenSets }
    ];
  } else if (normType.includes('pilate')) {
    defaultExercises = [
      { name: "The Hundred (La Centaine)", description: "Battements toniques des bras avec engagement du transverse.", equipment: "mat", sets: targetSets, reps: targetReps, restSeconds: restBetweenSets },
      { name: "Pont Fessier Isométrique", description: "Élévation du bassin maintenant une tension continue des fessiers.", equipment: "mat", sets: targetSets, reps: targetReps, restSeconds: restBetweenSets },
      { name: "Gainage Latéral Pilates", description: "Alignement tête-bassin ciblant les obliques et la stabilité.", equipment: "mat", sets: targetSets, reps: targetReps, restSeconds: restBetweenSets },
      { name: "Cercles de Jambes Unilatéraux", description: "Stabilité du bassin et mobilité fémorale contrôlée.", equipment: "mat", sets: targetSets, reps: targetReps, restSeconds: restBetweenSets },
      { name: "Extension Dorsale Swimming", description: "Activation symétrique de la chaîne postérieure sans cambrer.", equipment: "mat", sets: targetSets, reps: targetReps, restSeconds: restBetweenSets }
    ];
  } else if (normType.includes('mass') || normType.includes('hypertrophi')) {
    defaultExercises = [
      { name: "Développé Incliné Haltères", description: "Tension continue sur le faisceau claviculaire des pectoraux.", equipment: "dumbbells", sets: targetSets, reps: targetReps, restSeconds: restBetweenSets },
      { name: "Squats Hack / Cuisses", description: "Amplitude complète pour maximiser le recrutement des quadriceps.", equipment: "barbell", sets: targetSets, reps: targetReps, restSeconds: restBetweenSets },
      { name: "Soulevé de Terre Roumain", description: "Étirement intense des ischio-jambiers à la descente.", equipment: "dumbbells", sets: targetSets, reps: targetReps, restSeconds: restBetweenSets },
      { name: "Élévations Latérales Haltères", description: "Isolation stricte des deltoïdes latéraux sans balancier.", equipment: "dumbbells", sets: targetSets, reps: targetReps, restSeconds: restBetweenSets },
      { name: "Curl Biceps Incliné", description: "Étirement maximal du chef long du biceps sur banc.", equipment: "dumbbells", sets: targetSets, reps: targetReps, restSeconds: restBetweenSets }
    ];
  } else {
    defaultExercises = [
      { name: "Squats Biomécaniques", description: "Flexion complète avec pieds ancrés et buste gainé.", equipment: "bodyweight", sets: targetSets, reps: targetReps, restSeconds: restBetweenSets },
      { name: "Pompes Strictes", description: "Poitrine au ras du sol avec paumes bien à plat sur le sol.", equipment: "bodyweight", sets: targetSets, reps: targetReps, restSeconds: restBetweenSets },
      { name: "Fentes Alternées", description: "Pas avant contrôlé avec genou arrière frôlant le sol.", equipment: "bodyweight", sets: targetSets, reps: targetReps, restSeconds: restBetweenSets },
      { name: "Gainage Planche Isométrique", description: "Maintien isométrique de l'alignement anatomique.", equipment: "bodyweight", sets: targetSets, reps: targetReps, restSeconds: restBetweenSets },
      { name: "Mountain Climbers Cardio", description: "Montées de genoux dynamiques en appui paumes au sol.", equipment: "bodyweight", sets: targetSets, reps: targetReps, restSeconds: restBetweenSets }
    ];
  }

  return res.status(200).json({
    title: `Fit-4rce X • ${workoutType.toUpperCase()}`,
    description: `Programme calibré haute précision pour ${workoutType}`,
    targetSets,
    targetReps,
    restBetweenSets,
    exercises: defaultExercises
  });
}
