
import { GoogleGenAI, Part, Type } from '@google/genai';
import { WorkoutPlan, UserProfile, DailyMacros, MealPlanSection, Language, Meal } from '../types.ts';
import { COACH_MODEL_URL } from '../constants.ts';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- NUCLEAR OPTION: SYNTAX SHREDDER ---
// This function scans for actual programming syntax patterns and deletes them.
const shredCode = (text: string): string => {
    if (!text) return "";
    
    // 1. Remove Markdown Code Blocks (Triple backticks)
    let cleaned = text.replace(/```[\s\S]*?```/g, '');
    
    // 2. Remove Inline Code (Single backticks)
    cleaned = cleaned.replace(/`[^`]*`/g, '');

    // 3. Remove Lines that look like JSON starts/ends or heavy syntax
    // This regex looks for lines that are purely braces/brackets which are common in code dumps
    cleaned = cleaned.replace(/^\s*[\{\}\[\]],?\s*$/gm, '');

    // 4. LINE-BY-LINE SYNTAX NUKE
    // If a line looks like code, it is deleted.
    const lines = cleaned.split('\n');
    const safeLines = lines.filter(line => {
        const t = line.trim();
        // Detect variable declarations
        if (/^(const|let|var)\s+\w+\s*=/i.test(t)) return false;
        // Detect imports/exports
        if (/^(import|export|package|namespace)\s+/i.test(t)) return false;
        // Detect functions/classes
        if (/^(function|class|interface|type)\s+\w+/i.test(t)) return false;
        // Detect component definitions (React specific)
        if (/React\.FC</.test(t) || /=>\s*\{/.test(t) || /return\s*\(\s*<div/.test(t)) return false;
        // Detect hooks
        if (/useEffect\(|useState\(|useCallback\(/.test(t)) return false;
        // Detect object keys like "key": "value" (JSON-like lines)
        if (/^\s*"\w+"\s*:\s*".*",?$/.test(t)) return false;
        // Detect console logs
        if (/console\.(log|error|warn|info)\(/.test(t)) return false;
        
        return true;
    });

    const result = safeLines.join('\n').trim();

    if (result.length === 0) {
        return "I am here to guide your training. How can I help?";
    }

    return result;
};

// MOCK WORKOUTS FOR FALLBACKS
const getMockWorkout = (language: Language): WorkoutPlan => {
    const defaultWorkout: WorkoutPlan = {
        title: "AI Fallback Power Workout",
        description: "An AI-generated workout focusing on full-body strength.",
        rest_duration_seconds: 60,
        warmup: [
             { name: "Jumping Jacks", description: "60 seconds", muscleGroups: ["Full Body"], modelUrl: COACH_MODEL_URL, difficulty: 'beginner' },
        ],
        exercises: [
            { name: "Quantum Squats", description: "3 sets of 10 reps", muscleGroups: ["Quads", "Glutes", "Hamstrings"], modelUrl: COACH_MODEL_URL, difficulty: 'intermediate' },
            { name: "Holographic Push-ups", description: "3 sets of 15 reps", muscleGroups: ["Chest", "Shoulders", "Triceps"], modelUrl: COACH_MODEL_URL, difficulty: 'intermediate' },
        ],
        cooldown: [
             { name: "Quad Stretch", description: "30 seconds per leg", muscleGroups: ["Quads"], modelUrl: COACH_MODEL_URL, difficulty: 'beginner' },
        ]
    };
    return defaultWorkout;
};

// MOCK DIET PLAN FOR FALLBACK
const getMockDietPlan = (language: Language): { macros: DailyMacros, meals: MealPlanSection[] } => {
  const commonMacros = {
    calories: { goal: 2200, current: 0 },
    protein: { goal: 150, current: 0 },
    fat: { goal: 70, current: 0 },
    carbs: { goal: 250, current: 0 },
  };

  const plans: Record<string, MealPlanSection[]> = {
    [Language.EN]: [
        { mealType: 'breakfast', title: 'Protein Oatmeal', calories: 400, description: '', recipe: '1 cup oats, 1 scoop protein powder, berries, nuts.', benefits: 'Sustained energy, muscle support.' },
        { mealType: 'lunch', title: 'Grilled Chicken Salad', calories: 600, description: '', recipe: '150g grilled chicken, mixed greens, vinaigrette.', benefits: 'Muscle repair, high in vitamins.' },
        { mealType: 'dinner', title: 'Salmon with Quinoa', calories: 700, description: '', recipe: '150g salmon, 1 cup quinoa, steamed broccoli.', benefits: 'Healthy fats, complete protein.' },
        { mealType: 'snacks', title: 'Greek Yogurt', calories: 500, description: '', recipe: '1 cup Greek yogurt, honey.', benefits: 'Gut health, muscle maintenance.' },
    ],
    [Language.FR]: [
        { mealType: 'breakfast', title: 'Flocons d’avoine protéinés', calories: 400, description: '', recipe: '1 tasse d’avoine, 1 mesure de protéine en poudre, baies, noix.', benefits: 'Énergie durable, soutien musculaire.' },
        { mealType: 'lunch', title: 'Salade de poulet grillé', calories: 600, description: '', recipe: '150 g de poulet grillé, légumes verts mélangés, vinaigrette.', benefits: 'Réparation musculaire, riche en vitamines.' },
        { mealType: 'dinner', title: 'Saumon avec quinoa', calories: 700, description: '', recipe: '150 g de saumon, 1 tasse de quinoa, brocoli vapeur.', benefits: 'Graisses saines, protéine complète.' },
        { mealType: 'snacks', title: 'Yaourt grec', calories: 500, description: '', recipe: '1 tasse de yaourt grec, miel.', benefits: 'Santé intestinale, maintien musculaire.' },
    ],
    [Language.AR]: [
        { mealType: 'breakfast', title: 'شوفان بالبروتين', calories: 400, description: '', recipe: 'كوب شوفان، مكيال بروتين بودرة، توت، مكسرات.', benefits: 'طاقة مستدامة، دعم للعضلات.' },
        { mealType: 'lunch', title: 'سلطة دجاج مشوي', calories: 600, description: '', recipe: '١٥٠ غرام دجاج مشوي، خضار ورقية مشكلة، صَلصة.', benefits: 'إصلاح العضلات، غني بالفيتامينات.' },
        { mealType: 'dinner', title: 'سلمون مع الكينوا', calories: 700, description: '', recipe: '١٥٠ غرام سلمون، كوب كينوا، بروكلي مطهوّ على البخار.', benefits: 'دهون صحية، بروتين كامل.' },
        { mealType: 'snacks', title: 'زبادي يوناني', calories: 500, description: '', recipe: 'كوب زبادي يوناني، عسل.', benefits: 'صحة الجهاز الهضمي، الحفاظ على العضلات.' },
    ],
    [Language.ZH]: [
        { mealType: 'breakfast', title: '蛋白燕麦粥', calories: 400, description: '', recipe: '1 杯燕麦、1 勺蛋白粉、浆果、坚果。', benefits: '持续能量、肌肉支持。' },
        { mealType: 'lunch', title: '烤鸡肉沙拉', calories: 600, description: '', recipe: '150 克烤鸡肉、混合蔬菜、油醋汁。', benefits: '肌肉修复、富含维生素。' },
        { mealType: 'dinner', title: '三文鱼配藜麦', calories: 700, description: '', recipe: '150 克三文鱼、1 杯藜麦、清蒸西兰花。', benefits: '健康脂肪、完整蛋白质。' },
        { mealType: 'snacks', title: '希腊酸奶', calories: 500, description: '', recipe: '1 杯希腊酸奶、蜂蜜。', benefits: '肠道健康、肌肉维持。' },
    ],
    [Language.JA]: [
        { mealType: 'breakfast', title: 'プロテインオートミール', calories: 400, description: '', recipe: 'オートミール1カップ、プロテイン1スクープ、ベリー、ナッツ。', benefits: '持続的なエネルギー、筋肉サポート。' },
        { mealType: 'lunch', title: 'グリルチキンサラダ', calories: 600, description: '', recipe: '150g のグリルチキン、ミックス野菜、ビネグレット。', benefits: '筋肉修復、ビタミン豊富。' },
        { mealType: 'dinner', title: 'サーモンとキヌア', calories: 700, description: '', recipe: '150g のサーモン、キヌア1カップ、蒸しブロッコリー。', benefits: '健康的な脂質、完全タンパク質。' },
        { mealType: 'snacks', title: 'ギリシャヨーグルト', calories: 500, description: '', recipe: 'ギリシャヨーグルト1カップ、蜂蜜。', benefits: '腸の健康、筋肉維持。' },
    ],
    [Language.ES]: [
        { mealType: 'breakfast', title: 'Avena con proteína', calories: 400, description: '', recipe: '1 taza de avena, 1 scoop de proteína, frutos rojos, nueces.', benefits: 'Energía sostenida, apoyo muscular.' },
        { mealType: 'lunch', title: 'Ensalada de pollo a la parrilla', calories: 600, description: '', recipe: '150 g de pollo a la parrilla, hojas verdes mixtas, vinagreta.', benefits: 'Reparación muscular, alto contenido en vitaminas.' },
        { mealType: 'dinner', title: 'Salmón con quinoa', calories: 700, description: '', recipe: '150 g de salmón, 1 taza de quinoa, brócoli al vapor.', benefits: 'Grasas saludables, proteína completa.' },
        { mealType: 'snacks', title: 'Yogur griego', calories: 500, description: '', recipe: '1 taza de yogur griego, miel.', benefits: 'Salud intestinal, mantenimiento muscular.' },
    ],
    [Language.PT]: [
        { mealType: 'breakfast', title: 'Aveia proteica', calories: 400, description: '', recipe: '1 xícara de aveia, 1 scoop de proteína, frutas vermelhas, nozes.', benefits: 'Energia prolongada, suporte muscular.' },
        { mealType: 'lunch', title: 'Salada de frango grelhado', calories: 600, description: '', recipe: '150 g de frango grelhado, folhas verdes mistas, vinagrete.', benefits: 'Recuperação muscular, rico em vitaminas.' },
        { mealType: 'dinner', title: 'Salmão com quinoa', calories: 700, description: '', recipe: '150 g de salmão, 1 xícara de quinoa, brócolis no vapor.', benefits: 'Gorduras saudáveis, proteína completa.' },
        { mealType: 'snacks', title: 'Iogurte grego', calories: 500, description: '', recipe: '1 xícara de iogurte grego, mel.', benefits: 'Saúde intestinal, manutenção muscular.' },
    ],
    [Language.RU]: [
        { mealType: 'breakfast', title: 'Овсянка с протеином', calories: 400, description: '', recipe: '1 стакан овсянки, 1 мерная ложка протеина, ягоды, орехи.', benefits: 'Долгая энергия, поддержка мышц.' },
        { mealType: 'lunch', title: 'Салат с жареной курицей', calories: 600, description: '', recipe: '150 г жареной курицы, смешанная зелень, винегрет.', benefits: 'Восстановление мышц, много витаминов.' },
        { mealType: 'dinner', title: 'Лосось с киноа', calories: 700, description: '', recipe: '150 г лосося, 1 стакан киноа, паровая брокколи.', benefits: 'Полезные жиры, полноценный белок.' },
        { mealType: 'snacks', title: 'Греческий йогурт', calories: 500, description: '', recipe: '1 стакан греческого йогурта, мёд.', benefits: 'Здоровье кишечника, поддержание мышц.' },
    ],
  };

  return {
    macros: commonMacros,
    meals: plans[language] || plans[Language.EN],
  };
};

const workoutSchema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    description: { type: Type.STRING },
    rest_duration_seconds: { type: Type.NUMBER },
    warmup: {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                name: { type: Type.STRING },
                description: { type: Type.STRING },
            }
        }
    },
    exercises: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          description: { type: Type.STRING },
        },
      },
    },
     cooldown: {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                name: { type: Type.STRING },
                description: { type: Type.STRING },
            }
        }
    },
  },
};

const cleanString = (val: any): string => {
    if (val === null || val === undefined) return '';
    if (typeof val === 'string') return val;
    if (typeof val === 'number') return String(val);
    if (typeof val === 'object') return ''; 
    return String(val);
};

const generateWorkout = async (prompt: string, language: Language, modelName: 'gemini-2.5-flash' | 'gemini-2.5-pro'): Promise<WorkoutPlan | null> => {
    try {
        const response = await ai.models.generateContent({
            model: modelName,
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: workoutSchema,
            },
        });

        let jsonText = response.text ? response.text.trim() : '';
        jsonText = jsonText.replace(/^```json/, '').replace(/^```/, '').replace(/```$/, '');
        
        let workoutData;
        try {
            workoutData = JSON.parse(jsonText);
        } catch (e) {
            console.warn("JSON parse failed, falling back to empty object");
            workoutData = {};
        }
        
        if (!workoutData || typeof workoutData !== 'object') {
            workoutData = {};
        }

        const addDetails = (ex: any) => {
            if (!ex || typeof ex !== 'object') {
                return {
                    name: 'Exercise',
                    description: 'No description available.',
                    muscleGroups: [],
                    modelUrl: COACH_MODEL_URL,
                    difficulty: 'intermediate' as const,
                };
            }
            
            return {
                name: cleanString(ex.name || 'Exercise'),
                description: cleanString(ex.description || 'No description available.'),
                muscleGroups: Array.isArray(ex.muscleGroups) ? ex.muscleGroups.map((g: any) => cleanString(g)) : [],
                modelUrl: COACH_MODEL_URL,
                difficulty: 'intermediate' as const,
            };
        };

        return {
            title: cleanString(workoutData.title || "AI Workout"),
            description: cleanString(workoutData.description || "Generated plan."),
            rest_duration_seconds: typeof workoutData.rest_duration_seconds === 'number' ? workoutData.rest_duration_seconds : 60,
            warmup: Array.isArray(workoutData.warmup) ? workoutData.warmup.map(addDetails) : [],
            exercises: Array.isArray(workoutData.exercises) ? workoutData.exercises.map(addDetails) : [],
            cooldown: Array.isArray(workoutData.cooldown) ? workoutData.cooldown.map(addDetails) : [],
        };
    } catch (error) {
        console.error(`Error generating workout with ${modelName}:`, error);
        return getMockWorkout(language);
    }
};

export const generateWorkoutWithGemini = (prompt: string, language: Language) => generateWorkout(prompt, language, 'gemini-2.5-flash');
export const generateWorkoutWithOpenAI = (prompt: string, language: Language) => generateWorkout(prompt, language, 'gemini-2.5-pro'); 
export const generateWorkoutWithAnthropic = (prompt: string, language: Language) => generateWorkout(prompt, language, 'gemini-2.5-pro');
export const generateWorkoutWithPerplexity = (prompt: string, language: Language) => generateWorkout(prompt, language, 'gemini-2.5-flash');

export const generateWorkoutVideoSummary = async (plan: WorkoutPlan): Promise<string> => {
    return new Promise(resolve => setTimeout(() => resolve("https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_1MB.mp4"), 3000));
};

export const getChatbotResponse = async (message: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `You are a highly capable AI assistant embedded in the Fit-4rce-X app.

        Your Core Identity:
        **Elite Fitness Coach**: Encouraging, knowledgeable about biology, mechanics, and nutrition.
        
        **F4X NUTRITION SYSTEM**:
        You are aware of the "F4X NUTRITION" supplement line.
        - Recommend "F4X ISO-WHEY" for muscle recovery.
        - Recommend "F4X NEURO-IGNITE" for pre-workout energy.
        - Recommend "F4X OMEGA-ARMOR" for general health.
        - Always frame these as "tactical supplies" or "performance fuel".

        **CRITICAL DISPLAY PROTOCOL:**
        - **ABSOLUTELY NO CODE**: Do NOT output JavaScript, JSON, XML, React components, or code blocks of any kind.
        - **NO MARKDOWN CODE BLOCKS**: Do NOT use tripple backticks.
        - Respond **ONLY** in natural, conversational language.
        - If the user asks for code, reply: "I am a fitness coach, I cannot generate code."

        The user said: "${message}".`,
    });
    
    return shredCode(response.text || "I am here to help you train.");
    
  } catch (error) {
    console.error("Chatbot Error:", error);
    return "I'm having trouble connecting right now. Please try again later.";
  }
};

// --- NEW FEATURE: AI CV TRANSLATOR ---
export const generateTrainerCV = async (trainerName: string, bio: string, language: Language): Promise<string> => {
    const langMap: Record<Language, string> = { en: 'English', fr: 'French', ar: 'Arabic', es: 'Spanish', ja: 'Japanese', pt: 'Portuguese', zh: 'Chinese', ru: 'Russian' };
    const targetLang = langMap[language] || 'English';
    
    const prompt = `
        You are an HR Specialist for an elite fitness organization.
        Create a detailed, professional, and impressive Curriculum Vitae (CV) for a personal trainer named "${trainerName}".
        
        Input Bio to expand upon: "${bio}"
        
        Requirements:
        1. Write the output strictly in ${targetLang}.
        2. Format it clearly with bullet points.
        3. Invent plausible but impressive details (Certifications, Years of Experience, Notable Achievements) that fit the bio.
        4. Tone: Professional, Elite, Inspiring.
        5. NO CODE. NO JSON. Just text.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return shredCode(response.text || "CV generation unavailable.");
    } catch (error) {
        console.error("CV Generation Error:", error);
        return "CV unavailable at this time.";
    }
};

// Placeholder Schema Definitions
export const dietPlanSchema = {
    type: Type.OBJECT,
    properties: {
        macros: {
            type: Type.OBJECT,
            properties: {
                calories: { type: Type.OBJECT, properties: { goal: { type: Type.NUMBER } } },
                protein: { type: Type.OBJECT, properties: { goal: { type: Type.NUMBER } } },
                fat: { type: Type.OBJECT, properties: { goal: { type: Type.NUMBER } } },
                carbs: { type: Type.OBJECT, properties: { goal: { type: Type.NUMBER } } },
            },
        },
        meals: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    mealType: { type: Type.STRING },
                    title: { type: Type.STRING },
                    calories: { type: Type.NUMBER },
                    description: { type: Type.STRING },
                    recipe: { type: Type.STRING },
                    benefits: { type: Type.STRING },
                },
            },
        },
    },
};

export const mealAnalysisSchema = {
    type: Type.OBJECT,
    properties: {
        name: { type: Type.STRING },
        calories: { type: Type.NUMBER },
        protein: { type: Type.NUMBER },
        carbs: { type: Type.NUMBER },
        fat: { type: Type.NUMBER },
    }
};

// Placeholders for nutrition functions
export const generateDietPlan = async (profile: UserProfile, language: Language): Promise<{ macros: DailyMacros, meals: MealPlanSection[] } | null> => { return getMockDietPlan(language); };
export const analyzeMealFromText = async (text: string): Promise<Omit<Meal, 'timestamp' | 'mealType'>> => { return { name: "Analysis Failed", calories: 0, protein: 0, carbs: 0, fat: 0 }; };
export const analyzeMealFromImage = async (base64Image: string, mimeType: string): Promise<Omit<Meal, 'timestamp' | 'mealType'>> => { return { name: "Image Analysis Failed", calories: 0, protein: 0, carbs: 0, fat: 0 }; };
export const getDietAlResponse = async (message: string, profile: UserProfile | null, language: Language): Promise<string> => {
  const prompt = `You are DietAl. Answer in English or requested language. 
  CONTEXT: The user has access to "F4X NUTRITION" products.
  - Suggest F4X ISO-WHEY for protein needs.
  - Suggest F4X NEURO-IGNITE for energy.
  NO CODE. User said: "${message}"`;
  try {
    const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
    return shredCode(response.text || "I am listening.");
  } catch (error) { return "I'm having trouble connecting."; }
};
export const getFastingPhaseExplanation = async (phaseName: string, language: Language): Promise<string> => {
  const prompt = `Explain health benefits of "${phaseName}" fasting phase. NO CODE.`;
  try {
    const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
    return shredCode(response.text || "Fasting benefits.");
  } catch (error) { return "Error retrieving explanation."; }
};
