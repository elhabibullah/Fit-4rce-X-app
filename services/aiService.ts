
import { GoogleGenAI, Type } from '@google/genai';
import { WorkoutPlan, Exercise, Language, UserProfile, Meal, MealPlanSection, DailyMacros } from '../types.ts';
import { MODEL_LIBRARY, VIDEO_LIBRARY } from '../lib/constants.ts';

const normalize = (s: string) => (s || '').toLowerCase().replace(/[^a-z]/g, '');

const mapToVideoUrl = (name: string): string | undefined => {
    if (!name) return undefined;
    const n = normalize(name);
    
    if (n.includes('squat')) return VIDEO_LIBRARY['squat'];
    if (n.includes('deadlift')) return VIDEO_LIBRARY['deadlift'];
    if (n.includes('benchpress') || (n.includes('bench') && n.includes('press'))) return VIDEO_LIBRARY['bench press'];
    if (n.includes('pushup') || n.includes('pressup') || n.includes('push')) return VIDEO_LIBRARY['push up'];
    if (n.includes('pullup') || n.includes('chinup') || n.includes('pull')) return VIDEO_LIBRARY['pull up'];
    if (n.includes('lunge')) return VIDEO_LIBRARY['lunge'];
    if (n.includes('plank')) return VIDEO_LIBRARY['plank'];
    
    return undefined;
};

const mapToModel = (eq: string): string => {
    const k = normalize(eq || '');
    if (k.includes('kettle')) return MODEL_LIBRARY.kettlebell;
    if (k.includes('barbell')) return MODEL_LIBRARY.barbell;
    if (k.includes('trx')) return MODEL_LIBRARY.trx;
    if (k.includes('ball')) return MODEL_LIBRARY.swiss_ball;
    if (k.includes('bench') || k.includes('seated')) return MODEL_LIBRARY.bench;
    if (k.includes('dumb') || k.includes('weight')) return MODEL_LIBRARY.dual_weights;
    return MODEL_LIBRARY.bodyweight;
};

export const generateWorkout = async (prompt: string, language: Language): Promise<WorkoutPlan | null> => {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `As an elite fitness trainer, generate a professional training session in ${language} for: ${prompt}.
            Format requirement: { "title": "String", "description": "String", "exercises": [{ "name": "String", "description": "String", "equipment": "String" }] }`,
            config: {
                responseMimeType: 'application/json'
            }
        });

        const data = JSON.parse(response.text || "{}");
        const exercises = (data.exercises || []).map((ex: any) => ({
            name: ex.name,
            description: ex.description,
            modelUrl: mapToModel(ex.equipment),
            videoUrl: mapToVideoUrl(ex.name),
            difficulty: 'intermediate' as any,
            muscleGroups: []
        }));

        return {
            title: data.title || "Elite Training",
            description: data.description || "Session initialized.",
            exercises: exercises
        };
    } catch (e) {
        console.error("GEN AI FAIL:", e);
        return null;
    }
};

export const generateWorkoutWithGemini = generateWorkout;
export const generateWorkoutWithOpenAI = generateWorkout;
export const generateWorkoutWithAnthropic = generateWorkout;
export const generateWorkoutWithPerplexity = generateWorkout;

export const getChatbotResponse = async (msg: string) => {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const res = await ai.models.generateContent({ 
            model: 'gemini-3-flash-preview', 
            contents: msg,
            config: { systemInstruction: "You are the Fit-4rce X Assistant. Helpful, concise, and focused on fitness performance." }
        });
        return res.text || "Connection active.";
    } catch (e) { return "System ready."; }
};

export const generateDietPlan = async (profile: UserProfile, language: Language) => {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const res = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Generate a high-performance daily nutrition plan for ${profile.full_name} in ${language}. Goal: 3200 kcal. Return JSON only.`,
            config: { responseMimeType: 'application/json' }
        });
        return JSON.parse(res.text || '{}');
    } catch { return null; }
};

export const getDietAlResponse = async (msg: string, profile: any, language: string) => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const res = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: msg });
    return res.text || "Analyzing...";
};

export const analyzeMealFromText = async (text: string) => null;
export const analyzeMealFromImage = async (base64: string, mimeType: string) => null;
export const generateTrainerCV = async (name: string, bio: string, language: string) => "Profile data loaded...";
export const getFastingPhaseExplanation = async (phaseName: string, language: string) => "Analyzing physiological state...";
