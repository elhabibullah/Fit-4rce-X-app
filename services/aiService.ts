
// Using secure backend API proxy endpoints instead of client-side SDK to prevent API key exposure
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
    return MODEL_LIBRARY.bodyweight;
};

export const generateWorkout = async (prompt: string, language: Language): Promise<WorkoutPlan | null> => {
    try {
        const response = await fetch('/api/generate-workout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt, language })
        });
        if (!response.ok) throw new Error('Failed to generate workout');
        const data = await response.json();
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
        const response = await fetch('/api/chatbot-response', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ msg })
        });
        if (!response.ok) throw new Error('Chatbot response failed');
        const data = await response.json();
        return data.text || "Connection active.";
    } catch (e) { return "System ready."; }
};

export const generateDietPlan = async (profile: UserProfile, language: Language) => {
    try {
        const response = await fetch('/api/diet-plan', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ profile, language })
        });
        if (!response.ok) throw new Error('Diet plan generation failed');
        return await response.json();
    } catch { return null; }
};

export const getDietAlResponse = async (msg: string, profile: any, language: string) => {
    try {
        const response = await fetch('/api/diet-al-response', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ msg, profile, language })
        });
        if (!response.ok) throw new Error('Diet response failed');
        const data = await response.json();
        return data.text || "Analyzing...";
    } catch { return "Analyzing..."; }
};

export const analyzeMealFromText = async (text: string) => null;
export const analyzeMealFromImage = async (base64: string, mimeType: string) => null;

export const generateTrainerCV = async (name: string, bio: string, language: string) => {
    try {
        const response = await fetch('/api/trainer-cv', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, bio, language })
        });
        if (!response.ok) throw new Error('Trainer CV failed');
        const data = await response.json();
        return data.text || "Profile data loaded...";
    } catch { return "Profile data loaded..."; }
};

export const getFastingPhaseExplanation = async (phaseName: string, language: string) => {
    try {
        const response = await fetch('/api/fasting-phase', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phaseName, language })
        });
        if (!response.ok) throw new Error('Fasting explanation failed');
        const data = await response.json();
        return data.text || "Analyzing physiological state...";
    } catch { return "Analyzing physiological state..."; }
};

export const translateSprintPlan = async (plan: any, language: string): Promise<any> => {
    try {
        const response = await fetch('/api/translate-sprint-plan', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ plan, language })
        });
        if (response.ok) {
            return await response.json();
        }
        throw new Error('Translation API failed');
    } catch (e) {
        console.error("Sprint plan translation client-side helper fail:", e);
        return plan;
    }
};

