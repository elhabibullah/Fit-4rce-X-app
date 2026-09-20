
// Using secure backend API proxy endpoints instead of client-side SDK to prevent API key exposure
import { WorkoutPlan, Exercise, Language, UserProfile, Meal, MealPlanSection, DailyMacros } from '../types.ts';
import { MODEL_LIBRARY, VIDEO_LIBRARY } from '../lib/constants.ts';
import { generateSmartWorkout } from '../lib/workoutPools.ts';

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

const FALLBACK_TRAINING_TITLES: Record<string, string> = {
    fr: "Entraînement Haute Performance",
    en: "High-Performance Training",
    es: "Entrenamiento de Alto Rendimiento",
    pt: "Treinamento de Alto Desempenho",
    ar: "تدريب عالي الأداء",
    ja: "ハイパフォーマンストレーニング",
    zh: "高水平体能训练",
    ru: "Высокоинтенсивная тренировка"
};

const FALLBACK_TRAINING_DESCRIPTIONS: Record<string, string> = {
    fr: "Séance personnalisée générée par l'IA.",
    en: "Custom AI workout session.",
    es: "Sesión de entrenamiento personalizada con IA.",
    pt: "Sessão de treino personalizada com IA.",
    ar: "جلسة تمرين مخصصة تم إنشاؤها بالذكاء الاصطناعي.",
    ja: "AIによって生成されたカスタムワークアウトセッション。",
    zh: "由AI定制的个性化训练课目。",
    ru: "Индивидуальная тренировка, сгенерированная ИИ."
};

const FALLBACK_ACK_MESSAGES: Record<string, string> = {
    fr: "Bien reçu ! Je prépare vos exercices.",
    en: "Great! Preparing your exercises.",
    es: "¡Perfecto! Preparando tus ejercicios.",
    pt: "Recebido! Preparando seus exercícios.",
    ar: "ممتاز! جاري تجهيز التمارين.",
    ja: "了解しました！エクササイズを準備しています。",
    zh: "收到！正在为您准备训练动作。",
    ru: "Принято! Готовлю ваши упражнения."
};

export interface WorkoutConfigOptions {
    level?: 'beginner' | 'medium' | 'advanced' | string;
    goal?: 'fitness' | 'mass_gaining' | 'power_training' | string;
    workoutType?: string;
    equipment?: 'bodyweight' | 'home' | 'gym' | string;
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
            body: JSON.stringify({ 
                prompt, 
                language, 
                options: { 
                    targetSets, 
                    targetReps, 
                    restBetweenSets,
                    level: options?.level,
                    goal: options?.goal,
                    workoutType: options?.workoutType,
                    equipment: options?.equipment
                } 
            })
        });
        
        let data;
        if (response.ok) {
            data = await response.json();
        }

        if (!data || !Array.isArray(data.exercises) || data.exercises.length === 0) {
            throw new Error('Empty workout data');
        }

        const exercises = data.exercises.map((ex: any, idx: number) => ({
            id: ex.canonicalId || ex.id || `ex-${idx}`,
            canonicalId: ex.canonicalId,
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
            title: data.title || FALLBACK_TRAINING_TITLES[language] || FALLBACK_TRAINING_TITLES['en'],
            description: data.description || FALLBACK_TRAINING_DESCRIPTIONS[language] || FALLBACK_TRAINING_DESCRIPTIONS['en'],
            exercises: exercises,
            level: options?.level || 'medium',
            goal: options?.goal || 'fitness',
            targetSets,
            targetReps,
            restBetweenSets
        };
    } catch (e) {
        console.warn("Client fallback for workout plan:", e);
        return buildFallbackWorkoutPlan(language, options);
    }
};

export const buildFallbackWorkoutPlan = (language: Language = Language.EN, options?: WorkoutConfigOptions): WorkoutPlan => {
    const level = options?.level || 'medium';
    const normLevel = level.toLowerCase();
    const targetSets = options?.targetSets || (normLevel === 'low' || normLevel === 'beginner' ? 3 : normLevel === 'high' || normLevel === 'advanced' ? 5 : 4);
    const targetReps = options?.targetReps || (normLevel === 'medium' ? 14 : 15);
    const restBetweenSets = options?.restBetweenSets || (options?.goal === 'power_training' || options?.goal === 'powerlifting' ? 60 : options?.goal === 'mass_gaining' ? 45 : 30);

    const discipline = (options?.workoutType || options?.goal || 'fitness').toLowerCase();
    const equipment = options?.equipment || 'bodyweight';

    const smartWorkout = generateSmartWorkout(discipline, targetSets, targetReps, restBetweenSets, language, equipment);

    return {
        title: smartWorkout.title,
        description: smartWorkout.description,
        exercises: smartWorkout.exercises.map((ex: any, idx: number) => ({
            id: ex.canonicalId || `ex-${idx}`,
            canonicalId: ex.canonicalId,
            name: ex.name,
            description: ex.description,
            modelUrl: mapToModel(ex.equipment),
            videoUrl: mapToVideoUrl(ex.name),
            difficulty: 'intermediate' as any,
            muscleGroups: [],
            sets: targetSets,
            reps: targetReps,
            restSeconds: restBetweenSets
        })),
        level,
        goal: options?.goal || (discipline as any) || 'fitness',
        targetSets,
        targetReps,
        restBetweenSets
    };
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
        const contentType = response.headers.get('content-type') || '';
        if (response.ok && contentType.includes('application/json')) {
            const data = await response.json();
            if (data && typeof data.text === 'string' && data.text.trim()) {
                return data.text.trim();
            }
        }
    } catch (e) {
        console.warn("API chatbot-response offline or unreachable, switching to local coach engine:", e);
    }

    // High-level client-side conversational AI intelligence:
    const l = (language || 'en').toLowerCase().slice(0, 2);
    const lower = (msg || '').toLowerCase();

    const isReady = (
        lower.includes('prêt') || lower.includes('pret') || lower.includes('lance') ||
        lower.includes('start') || lower.includes('ready') || lower.includes('commencer') ||
        lower.includes('go') || lower.includes('parti') || lower.includes('vamos') ||
        lower.includes('listo') || lower.includes('جاهز') || lower.includes('يلا') ||
        lower.includes('開始') || lower.includes('准备') || lower.includes('готов') || lower.includes('поехали')
    );

    const isGreeting = (
        lower.includes('bonjour') || lower.includes('salut') || lower.includes('hello') ||
        lower.includes('hi') || lower.includes('hola') || lower.includes('مرحبا') ||
        lower.includes('olá') || lower.includes('ola') || lower.includes('こんにちは') || lower.includes('你好')
    );

    const isEquipment = (
        lower.includes('haltere') || lower.includes('haltère') || lower.includes('dumbbell') ||
        lower.includes('poids') || lower.includes('machine') || lower.includes('corps') ||
        lower.includes('mancuerna') || lower.includes('وزن') || lower.includes('自重') || lower.includes('哑铃')
    );

    const isFocus = (
        lower.includes('bras') || lower.includes('jambe') || lower.includes('dos') ||
        lower.includes('pectoraux') || lower.includes('abdos') || lower.includes('core') ||
        lower.includes('upper') || lower.includes('lower') || lower.includes('leg') || lower.includes('chest')
    );

    const DIALOGUES: Record<string, { ready: string; greet: string; equip: string; focus: string; generic: string }> = {
        fr: {
            ready: "C'est parti ! Je génère ta séance 3D sur mesure. Donne le meilleur de toi-même ! [GENERATE_WORKOUT]",
            greet: "Bonjour ! Je suis ton coach Fit-4rce X. Quel est ton objectif aujourd'hui : full body, haut du corps ou bas du corps ?",
            equip: "Parfait pour l'équipement ! Dis-moi quand tu es prêt et je lance ton entraînement 3D.",
            focus: "Zone bien ciblée ! Dis-moi 'lance la séance' ou 'je suis prêt' pour démarrer !",
            generic: "Bien reçu ! Dis-moi 'je suis prêt' dès que tu souhaites commencer ton entraînement. [GENERATE_WORKOUT]"
        },
        en: {
            ready: "Awesome! Generating your custom 3D workout now. Let's crush this! [GENERATE_WORKOUT]",
            greet: "Hello! I'm your Fit-4rce X coach. What's our focus today: full body, upper body, or lower body?",
            equip: "Great choice! Tell me whenever you're ready and I'll generate your 3D session.",
            focus: "Target locked! Say 'start' or 'I am ready' whenever you want to begin!",
            generic: "Understood! Whenever you're ready to start, let me know! [GENERATE_WORKOUT]"
        },
        es: {
            ready: "¡Vamos con todo! Preparando tu entrenamiento 3D ahora mismo. [GENERATE_WORKOUT]",
            greet: "¡Hola! Soy tu entrenador Fit-4rce X. ¿Cuál es tu objetivo hoy: cuerpo completo, tren superior o piernas?",
            equip: "¡Excelente! Dime cuando estés listo para generar tu entrenamiento 3D.",
            focus: "¡Objetivo fijado! Di 'estoy listo' o 'vamos' para comenzar.",
            generic: "¡Perfecto! Cuando estés listo para comenzar, ¡avísame! [GENERATE_WORKOUT]"
        },
        ar: {
            ready: "هيا بنا! أقوم بتجهيز تمارينك ثلاثية الأبعاد الآن. بالتوفيق! [GENERATE_WORKOUT]",
            greet: "أهلاً بك! أنا مدربك الشخصي Fit-4rce X. ما هو هدفك اليوم: تدريب كامل، الجزء العلوي أم السفلي؟",
            equip: "ممتاز! أخبرني عندما تكون جاهزاً وسأقوم بتوليد تدريبك ثلاثي الأبعاد.",
            focus: "تم تحديد الهدف! قل 'أنا جاهز' أو 'ابدأ' للبدء فوراً.",
            generic: "رائع! أخبرني عندما تكون مستعداً للبدء! [GENERATE_WORKOUT]"
        },
        pt: {
            ready: "Vamos com tudo! Preparando seu treino 3D personalizado agora. [GENERATE_WORKOUT]",
            greet: "Olá! Sou seu treinador Fit-4rce X. Qual é o foco de hoje: corpo inteiro, superior ou pernas?",
            equip: "Perfeito! Diga quando estiver pronto para gerar seu treino 3D.",
            focus: "Foco definido! Diga 'estou pronto' ou 'vamos' para começar.",
            generic: "Perfeito! Quando estiver pronto para começar, me avise! [GENERATE_WORKOUT]"
        },
        ja: {
            ready: "さあ始めましょう！あなた専用の3Dワークアウトを準備しています。[GENERATE_WORKOUT]",
            greet: "こんにちは！Fit-4rce Xコーチです。本日のターゲットは全身、上半身、それとも下半身ですか？",
            equip: "素晴らしい！準備ができたら「スタート」と声をかけてください。",
            focus: "ターゲット設定完了！準備ができたら教えてください。",
            generic: "了解しました！準備ができたら声をかけてください！[GENERATE_WORKOUT]"
        },
        zh: {
            ready: "全力以赴！正在为你准备定制的3D训练动作。[GENERATE_WORKOUT]",
            greet: "你好！我是你的 Fit-4rce X 专属教练。今天想练全身、上半身还是下肢？",
            equip: "太好了！准备好时告诉我，我将为你生成3D动作序列。",
            focus: "目标已锁定！准备好了就说‘开始’吧。",
            generic: "收到！准备好时随时告诉我！[GENERATE_WORKOUT]"
        },
        ru: {
            ready: "Поехали! Создаю твою персональную 3D тренировку прямо сейчас. [GENERATE_WORKOUT]",
            greet: "Привет! Я твой тренер Fit-4rce X. Какова цель сегодня: все тело, верхняя часть или ноги?",
            equip: "Отлично! Скажи, когда будешь готов, и я создам твою 3D тренировку.",
            focus: "Цель определена! Скажи 'готов' или 'старт', чтобы начать.",
            generic: "Отлично! Как только будешь готов начать, дай знать! [GENERATE_WORKOUT]"
        }
    };

    const d = DIALOGUES[l] || DIALOGUES.en;
    if (isReady) return d.ready;
    if (isGreeting) return d.greet;
    if (isEquipment) return d.equip;
    if (isFocus) return d.focus;
    return d.generic;
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

