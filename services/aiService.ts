
import { GoogleGenAI, Type } from '@google/genai';
import { WorkoutPlan, UserProfile, DailyMacros, MealPlanSection, Language, Meal } from '../types.ts';
import { COACH_MODEL_URL } from '../constants.ts';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- NUCLEAR OPTION: SYNTAX SHREDDER ---
const shredCode = (text: string): string => {
    if (!text) return "";
    let cleaned = text.replace(/```[\s\S]*?```/g, '');
    cleaned = cleaned.replace(/`[^`]*`/g, '');
    cleaned = cleaned.replace(/^\s*[\{\}\[\]],?\s*$/gm, '');
    const lines = cleaned.split('\n');
    const safeLines = lines.filter(line => {
        const t = line.trim();
        if (/^(const|let|var)\s+\w+\s*=/i.test(t)) return false;
        if (/^(import|export|package|namespace)\s+/i.test(t)) return false;
        if (/^(function|class|interface|type)\s+\w+/i.test(t)) return false;
        if (/React\.FC</.test(t) || /=>\s*\{/.test(t) || /return\s*\(\s*<div/.test(t)) return false;
        if (/useEffect\(|useState\(|useCallback\(/.test(t)) return false;
        if (/^\s*"\w+"\s*:\s*".*",?$/.test(t)) return false;
        if (/console\.(log|error|warn|info)\(/.test(t)) return false;
        return true;
    });
    const result = safeLines.join('\n').trim();
    return result.length > 0 ? result : "I am here to guide your training. How can I help?";
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
  required: ['title', 'description', 'exercises']
};

const mealAnalysisSchema = {
    type: Type.OBJECT,
    properties: {
        name: { type: Type.STRING },
        calories: { type: Type.NUMBER },
        protein: { type: Type.NUMBER },
        carbs: { type: Type.NUMBER },
        fat: { type: Type.NUMBER },
    },
    required: ['name', 'calories', 'protein', 'carbs', 'fat']
};

const dietPlanSchema = {
    type: Type.OBJECT,
    properties: {
        macros: {
            type: Type.OBJECT,
            properties: {
                calories: { type: Type.OBJECT, properties: { goal: { type: Type.NUMBER } }, required: ['goal'] },
                protein: { type: Type.OBJECT, properties: { goal: { type: Type.NUMBER } }, required: ['goal'] },
                fat: { type: Type.OBJECT, properties: { goal: { type: Type.NUMBER } }, required: ['goal'] },
                carbs: { type: Type.OBJECT, properties: { goal: { type: Type.NUMBER } }, required: ['goal'] },
            },
            required: ['calories', 'protein', 'fat', 'carbs']
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
                required: ['mealType', 'title', 'calories', 'recipe', 'benefits']
            },
        },
    },
    required: ['macros', 'meals']
};

const cleanString = (val: any): string => {
    if (val === null || val === undefined) return '';
    if (typeof val === 'string') return val;
    return String(val);
};

export const generateWorkout = async (prompt: string, language: Language, modelName: string = 'gemini-3-pro-preview'): Promise<WorkoutPlan | null> => {
    try {
        const response = await ai.models.generateContent({
            model: modelName,
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: workoutSchema,
            },
        });

        const workoutData = JSON.parse(response.text || '{}');
        const addDetails = (ex: any) => ({
            name: cleanString(ex.name || 'Exercise'),
            description: cleanString(ex.description || 'No description available.'),
            muscleGroups: [],
            modelUrl: COACH_MODEL_URL,
            difficulty: 'intermediate' as const,
        });

        return {
            title: cleanString(workoutData.title || "AI Workout"),
            description: cleanString(workoutData.description || "Generated plan."),
            rest_duration_seconds: workoutData.rest_duration_seconds || 60,
            warmup: (workoutData.warmup || []).map(addDetails),
            exercises: (workoutData.exercises || []).map(addDetails),
            cooldown: (workoutData.cooldown || []).map(addDetails),
        };
    } catch (error) {
        console.error(`Error generating workout:`, error);
        return null;
    }
};

export const generateWorkoutWithGemini = (prompt: string, language: Language) => generateWorkout(prompt, language, 'gemini-3-flash-preview');
export const generateWorkoutWithOpenAI = (prompt: string, language: Language) => generateWorkout(prompt, language, 'gemini-3-pro-preview'); 
export const generateWorkoutWithAnthropic = (prompt: string, language: Language) => generateWorkout(prompt, language, 'gemini-3-pro-preview');
export const generateWorkoutWithPerplexity = (prompt: string, language: Language) => generateWorkout(prompt, language, 'gemini-3-flash-preview');

export const getChatbotResponse = async (message: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `You are Fit-4rce-X Elite Coach. No code. No JSON. NATURAL TEXT ONLY. User: ${message}`,
    });
    return shredCode(response.text || "I am here to help.");
  } catch (error) {
    return "Connection error.";
  }
};

export const generateTrainerCV = async (trainerName: string, bio: string, language: Language): Promise<string> => {
    const prompt = `Create a professional CV for ${trainerName} in ${language}. Bio: ${bio}. No code. Text only.`;
    try {
        const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: prompt });
        return shredCode(response.text || "CV generation unavailable.");
    } catch (error) {
        return "CV unavailable.";
    }
};

export const generateDietPlan = async (profile: UserProfile, language: Language): Promise<{ macros: DailyMacros, meals: MealPlanSection[] } | null> => {
    const prompt = `Generate a daily diet plan in ${language} for a ${profile.age} year old ${profile.gender} with goals: ${profile.goal?.join(', ')}. Height: ${profile.height}cm, Weight: ${profile.weight}kg. Return JSON.`;
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
            config: { responseMimeType: 'application/json', responseSchema: dietPlanSchema }
        });
        return JSON.parse(response.text || 'null');
    } catch (error) {
        console.error("Diet plan error:", error);
        return null;
    }
};

export const analyzeMealFromText = async (text: string): Promise<Omit<Meal, 'timestamp' | 'mealType'> | null> => {
    const prompt = `Analyze this meal description and provide nutritional facts in JSON: "${text}"`;
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
            config: { responseMimeType: 'application/json', responseSchema: mealAnalysisSchema }
        });
        return JSON.parse(response.text || 'null');
    } catch (error) {
        return null;
    }
};

export const analyzeMealFromImage = async (base64Image: string, mimeType: string): Promise<Omit<Meal, 'timestamp' | 'mealType'> | null> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: {
                parts: [
                    { inlineData: { data: base64Image, mimeType } },
                    { text: "Analyze the nutrients in this food image. Return JSON." }
                ]
            },
            config: { responseMimeType: 'application/json', responseSchema: mealAnalysisSchema }
        });
        return JSON.parse(response.text || 'null');
    } catch (error) {
        return null;
    }
};

export const getDietAlResponse = async (message: string, profile: UserProfile | null, language: Language): Promise<string> => {
  const prompt = `You are DietAI. No code. User: ${message}`;
  try {
    const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: prompt });
    return shredCode(response.text || "I'm listening.");
  } catch (error) { return "Error connecting."; }
};

export const getFastingPhaseExplanation = async (phaseName: string, language: Language): Promise<string> => {
  const prompt = `Explain health benefits of ${phaseName} fasting phase in ${language}. No code.`;
  try {
    const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: prompt });
    return shredCode(response.text || "Fasting benefits.");
  } catch (error) { return "Error retrieving explanation."; }
};
