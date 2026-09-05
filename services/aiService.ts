
// Using secure backend API proxy endpoints instead of client-side SDK to prevent API key exposure
import { WorkoutPlan, Exercise, Language, UserProfile, Meal, MealPlanSection, DailyMacros } from '../types.ts';
import { MODEL_LIBRARY, VIDEO_LIBRARY } from '../lib/constants.ts';

const normalize = (s: string) => (s || '').toLowerCase().replace(/[^a-z]/g, '');

const mapToVideoUrl = (name: string): string => {
    if (!name) return VIDEO_LIBRARY['squat'];
    const n = normalize(name);
    
    if (n.includes('squat') || n.includes('flexion') || n.includes('cuisse') || n.includes('jambe')) return VIDEO_LIBRARY['squat'];
    if (n.includes('deadlift') || n.includes('souleve') || n.includes('terre') || n.includes('hinge')) return VIDEO_LIBRARY['deadlift'];
    if (n.includes('benchpress') || (n.includes('bench') && n.includes('press')) || n.includes('developpe') || n.includes('couche') || n.includes('chest') || n.includes('pec')) return VIDEO_LIBRARY['bench press'];
    if (n.includes('pushup') || n.includes('pressup') || n.includes('push') || n.includes('pompe') || n.includes('pompes')) return VIDEO_LIBRARY['push up'];
    if (n.includes('pullup') || n.includes('chinup') || n.includes('pull') || n.includes('traction') || n.includes('tractions') || n.includes('dors')) return VIDEO_LIBRARY['pull up'];
    if (n.includes('lunge') || n.includes('fente') || n.includes('fentes') || n.includes('stride')) return VIDEO_LIBRARY['lunge'];
    if (n.includes('plank') || n.includes('gainage') || n.includes('planche') || n.includes('abdo') || n.includes('core') || n.includes('hollow')) return VIDEO_LIBRARY['plank'];
    
    // Consistent fallback from video library
    const videoKeys = ['squat', 'push up', 'lunge', 'plank', 'deadlift', 'pull up', 'bench press'];
    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const selectedKey = videoKeys[Math.abs(hash) % videoKeys.length];
    return VIDEO_LIBRARY[selectedKey];
};

const mapToModel = (eq: string): string => {
    return MODEL_LIBRARY.bodyweight;
};

export interface WorkoutConfigOptions {
    level?: 'beginner' | 'medium' | 'advanced' | string;
    goal?: 'fitness' | 'mass_gaining' | 'power_training' | string;
    targetSets?: number;
    targetReps?: number;
    restBetweenSets?: number;
}

export const getWorkoutSeriesAndRest = (level?: string, goal?: string) => {
    const normLevel = (level || 'medium').toLowerCase();
    const normGoal = (goal || 'fitness').toLowerCase();

    // Sets and Reps rule:
    // Beginner: 3x15
    // Medium: 4x14
    // Advanced: 5x15
    let sets = 4;
    let reps = 14;
    if (normLevel === 'low' || normLevel === 'beginner' || normLevel === 'debutant') {
        sets = 3;
        reps = 15;
    } else if (normLevel === 'high' || normLevel === 'advanced' || normLevel === 'avance') {
        sets = 5;
        reps = 15;
    } else {
        // Medium default
        sets = 4;
        reps = 14;
    }

    // Rest period rule:
    // Power training: 60s
    // Mass gaining: 45s
    // Standard / Fitness: 30s max
    let restSeconds = 30;
    if (normGoal.includes('power') || normGoal.includes('force')) {
        restSeconds = 60;
    } else if (normGoal.includes('mass') || normGoal.includes('hypertrophie')) {
        restSeconds = 45;
    } else {
        restSeconds = 30;
    }

    return { sets, reps, restSeconds };
};

export const generateWorkout = async (
    prompt: string, 
    language: Language,
    options?: WorkoutConfigOptions
): Promise<WorkoutPlan> => {
    const { sets, reps, restSeconds } = getWorkoutSeriesAndRest(options?.level, options?.goal);
    const targetSets = options?.targetSets || sets;
    const targetReps = options?.targetReps || reps;
    const restBetweenSets = options?.restBetweenSets || restSeconds;

    try {
        const response = await fetch('/api/generate-workout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt, language, options: { targetSets, targetReps, restBetweenSets } })
        });
        
        let data;
        if (response.ok) {
            data = await response.json();
        }

        if (!data || !Array.isArray(data.exercises) || data.exercises.length === 0) {
            throw new Error('Empty workout data');
        }

        const exercises = data.exercises.map((ex: any) => ({
            name: ex.name,
            description: ex.description,
            modelUrl: mapToModel(ex.equipment),
            videoUrl: mapToVideoUrl(ex.name),
            difficulty: 'intermediate' as any,
            muscleGroups: [],
            sets: targetSets,
            reps: targetReps,
            restSeconds: restBetweenSets
        }));

        return {
            title: data.title || (language === Language.FR ? "Entraînement Haute Performance" : "High-Performance Training"),
            description: data.description || (language === Language.FR ? "Séance personnalisée générée par l'IA." : "Custom AI workout session."),
            exercises: exercises,
            level: options?.level || 'medium',
            goal: options?.goal || 'fitness',
            targetSets,
            targetReps,
            restBetweenSets
        };
    } catch (e) {
        console.warn("Client fallback for workout plan:", e);
        const fallbackTitles: Record<Language, { title: string; desc: string; sName: string; sDesc: string; pName: string; pDesc: string; lName: string; lDesc: string; plName: string; plDesc: string; dName: string; dDesc: string }> = {
            [Language.FR]: {
                title: "Conditionnement Fitness Haute Intensité",
                desc: "Séance dynamique optimisée pour la puissance musculaire et l'endurance.",
                sName: "Squats Dynamiques", sDesc: "Flexion complète et poussée explosive.",
                pName: "Pompes au Sol", pDesc: "Alignement parfait et poussée pectorale.",
                lName: "Fentes Alternées", lDesc: "Grands pas stables vers l'avant.",
                plName: "Gainage Planche Active", plDesc: "Verrouillage abdominal maximal.",
                dName: "Soulevé de Terre Léger", dDesc: "Activation des fessiers et ischios."
            },
            [Language.AR]: {
                title: "لياقة بدنية وحرق مكثف",
                desc: "تمرين عالي الكفاءة لحرق السعرات وشد كامل عضلات الجسم.",
                sName: "سكوات ديناميكي", sDesc: "نزول متحكم به ودفع قوي لعضلات الفخذين.",
                pName: "تمرين الضغط المتوازن", pDesc: "دفع الصدر واستقامة مثالية للظهر.",
                lName: "طعنات متبادلة", lDesc: "خطوات واسعة لتقوية الساقين واستقرار الركبة.",
                plName: "بلانك نشط", plDesc: "شد عضلات البطن وحرق الدهون المركزة.",
                dName: "ديدلفت بوزن الجسم", dDesc: "تقوية أوتار الركبة وأسفل الظهر."
            },
            [Language.ES]: {
                title: "Acondicionamiento Fitness de Alta Intensidad",
                desc: "Sesión metabólica y funcional para quema calórica y tono muscular integral.",
                sName: "Sentadillas Dinámicas", sDesc: "Flexión profunda de piernas y extensión potente de cadera.",
                pName: "Flexiones de Brazos", pDesc: "Empuje de pecho y alineación recta de tronco.",
                lName: "Zancadas Alternas", lDesc: "Pasos amplios manteniendo el torso erguido.",
                plName: "Plancha Abdominal Activa", plDesc: "Contracción máxima de abdomen y glúteos.",
                dName: "Bisagra de Cadera (Peso Muerto)", dDesc: "Activación de isquiosurales y zona lumbar."
            },
            [Language.PT]: {
                title: "Condicionamento Fitness Alta Intensidade",
                desc: "Treino funcional metabólico para queima de gordura e tônus muscular.",
                sName: "Agachamento Dinâmico", sDesc: "Flexão completa de pernas e impulsão de quadril.",
                pName: "Flexão de Braços", pDesc: "Empurrão peitoral com alinhamento lombar.",
                lName: "Avanço Alternado", lDesc: "Passos firmes para frente mantendo o tronco ereto.",
                plName: "Prancha Abdominal Ativa", plDesc: "Tensão voluntária em todo o abdômen.",
                dName: "Stiff com Peso Corporal", dDesc: "Ativação de glúteos e posteriores de coxa."
            },
            [Language.JA]: {
                title: "高強度フィットネス・コンディショニング",
                desc: "カロリー消費と筋トーンを最大化する全身運動。",
                sName: "ダイナミックスクワット", sDesc: "股関節をしっかり曲げて爆発的に立ち上がります。",
                pName: "腕立て伏せ", pDesc: "体幹を一直線に保ち大胸筋を効かせます。",
                lName: "オルタネイティング・ランジ", lDesc: "大きく一歩を踏み出し下半身を鍛えます。",
                plName: "アクティブ・プランク", plDesc: "お腹とお尻を意識して姿勢をキープします。",
                dName: "ヒップヒンジ・デッドリフト", dDesc: "太もも裏と背筋を強化します。"
            },
            [Language.ZH]: {
                title: "高效燃脂全身功能性体能",
                desc: "全面提升心肺耐力、代谢率和肌肉线条。",
                sName: "动态深蹲", sDesc: "下蹲充分，髋部爆发蹬直。",
                pName: "标准俯卧撑", pDesc: "胸肌充分收缩，身体呈一条直线。",
                lName: "交替箭步蹲", lDesc: "迈步稳健，膝盖不内扣，躯干直立。",
                plName: "动态核心平板", plDesc: "紧绷腹肌和臀部，保持均匀呼吸。",
                dName: "自重硬拉髋铰链", dDesc: "强化腘绳肌与下背部后链肌群。"
            },
            [Language.RU]: {
                title: "Высокоинтенсивный функциональный фитнес",
                desc: "Метаболическая тренировка для сжигания калорий и рельефа мышц.",
                sName: "Динамические приседания", sDesc: "Глубокий сед и мощное разгибание в тазобедренных суставах.",
                pName: "Отжимания от пола", pDesc: "Прямая линия тела и работа грудных мышц.",
                lName: "Чередующиеся выпады", lDesc: "Широкие шаги вперед с удержанием вертикального корпуса.",
                plName: "Активная планка", plDesc: "Максимальное статическое напряжение пресса и ягодиц.",
                dName: "Наклоны (Хип-хиндж)", dDesc: "Проработка бицепсов бедер и мышц спины."
            },
            [Language.EN]: {
                title: "High-Intensity Fitness Conditioning",
                desc: "Metabolic and functional conditioning tailored for caloric burn and muscular endurance.",
                sName: "Dynamic Squats", sDesc: "Full hip flexion and explosive upward drive.",
                pName: "Push-Ups", pDesc: "Pectoral activation with strict spine alignment.",
                lName: "Alternating Lunges", lDesc: "Deep stride keeping front knee tracking over toes.",
                plName: "Active Plank Hold", plDesc: "Maximal abdominal contraction and pelvic stability.",
                dName: "Posterior Deadlift Hinge", dDesc: "Hip hinge targeting hamstrings and erector spinae."
            }
        };

        const currentDict = fallbackTitles[language] || fallbackTitles[Language.EN];
        return {
            title: currentDict.title,
            description: currentDict.desc,
            exercises: [
                { name: currentDict.sName, description: currentDict.sDesc, modelUrl: MODEL_LIBRARY.bodyweight, videoUrl: VIDEO_LIBRARY['squat'], difficulty: 'intermediate' as any, muscleGroups: [], sets: targetSets, reps: targetReps, restSeconds: restBetweenSets },
                { name: currentDict.pName, description: currentDict.pDesc, modelUrl: MODEL_LIBRARY.bodyweight, videoUrl: VIDEO_LIBRARY['push up'], difficulty: 'intermediate' as any, muscleGroups: [], sets: targetSets, reps: targetReps, restSeconds: restBetweenSets },
                { name: currentDict.lName, description: currentDict.lDesc, modelUrl: MODEL_LIBRARY.bodyweight, videoUrl: VIDEO_LIBRARY['lunge'], difficulty: 'intermediate' as any, muscleGroups: [], sets: targetSets, reps: targetReps, restSeconds: restBetweenSets },
                { name: currentDict.plName, description: currentDict.plDesc, modelUrl: MODEL_LIBRARY.bodyweight, videoUrl: VIDEO_LIBRARY['plank'], difficulty: 'intermediate' as any, muscleGroups: [], sets: targetSets, reps: targetReps, restSeconds: restBetweenSets },
                { name: currentDict.dName, description: currentDict.dDesc, modelUrl: MODEL_LIBRARY.bodyweight, videoUrl: VIDEO_LIBRARY['deadlift'], difficulty: 'intermediate' as any, muscleGroups: [], sets: targetSets, reps: targetReps, restSeconds: restBetweenSets }
            ],
            level: options?.level || 'medium',
            goal: options?.goal || 'fitness',
            targetSets,
            targetReps,
            restBetweenSets
        };
    }
};

export const generateWorkoutWithGemini = generateWorkout;
export const generateWorkoutWithOpenAI = generateWorkout;
export const generateWorkoutWithAnthropic = generateWorkout;
export const generateWorkoutWithPerplexity = generateWorkout;

export const getChatbotResponse = async (msg: string, language: string = 'en', history?: Array<{ role: string; text: string }>) => {
    try {
        const response = await fetch('/api/chatbot-response', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ msg, language, history })
        });
        if (!response.ok) throw new Error('Chatbot response failed');
        const data = await response.json();
        return data.text || (language === 'fr' ? "Bien reçu ! Je prépare vos exercices." : (language === 'es' ? "¡Perfecto! Preparando tus ejercicios." : (language === 'ar' ? "ممتاز! جاري تجهيز التمارين." : "Great! Preparing your exercises.")));
    } catch (e) {
        return language === 'fr' ? "Bien reçu ! Je prépare vos exercices." : (language === 'es' ? "¡Perfecto! Preparando tus ejercicios." : (language === 'ar' ? "ممتاز! جاري تجهيز التمارين." : "Great! Preparing your exercises."));
    }
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

