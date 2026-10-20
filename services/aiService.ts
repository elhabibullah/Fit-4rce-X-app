
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

import { resolveCalisthenicsModel } from '../lib/calisthenicsModels.ts';

const mapToModel = (canonicalId?: string, name?: string): string => {
    const custom = resolveCalisthenicsModel(canonicalId) || resolveCalisthenicsModel(name);
    if (custom) return custom;
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
            modelUrl: (ex as any).modelUrl || mapToModel(ex.canonicalId || ex.id, ex.name),
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
            modelUrl: ex.modelUrl || mapToModel(ex.canonicalId, ex.name),
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
export const getVoiceCoachResponse = async (
    query: { msg?: string; audioBase64?: string; mimeType?: string },
    language: string = 'en',
    history?: Array<{ role: string; text: string }>,
    userProfile?: any
): Promise<{ text: string; audio: string | null }> => {
    try {
        const response = await fetch('/api/chatbot-response', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                msg: query.msg,
                audioBase64: query.audioBase64,
                mimeType: query.mimeType,
                language,
                history,
                userProfile
            })
        });
        const contentType = response.headers.get('content-type') || '';
        if (response.ok && contentType.includes('application/json')) {
            const data = await response.json();
            if (data && typeof data.text === 'string') {
                return { text: data.text.trim(), audio: data.audio || null };
            }
        }
    } catch (e) {
        console.warn("API chatbot-response unreachable, switching to fallback:", e);
    }
    const fallbackText = getSmartFallbackReply(query.msg || 'hello', language);
    return { text: fallbackText, audio: null };
};

export const getChatbotResponse = async (msg: string, language: string = 'en', history?: Array<{ role: string; text: string }>) => {
    const res = await getVoiceCoachResponse({ msg }, language, history);
    return res.text;
};

const checkIsConfirmationClient = (text: string): boolean => {
    const lower = (text || '').toLowerCase().trim();
    return /^(oui|yes|ouais|yep|yeah|let's go|lets go|c'est parti|cest parti|je suis pr[eê]t|im ready|i am ready|go|on y va|lance|lance la s[eé]ance|d[eé]marre|start|pret|prête|ready|d'accord|daccord|ok|allons-y)\b/i.test(lower) ||
        /\b(c'est parti|lance la s[eé]ance|d[eé]marre la s[eé]ance|on commence|je suis prêt|ready to start|let's go|on y va)\b/i.test(lower);
};

const getSmartFallbackReply = (msg: string, language: string): string => {
    const l = (language || 'en').toLowerCase().slice(0, 2);
    const lower = (msg || '').toLowerCase().trim();

    const isReady = checkIsConfirmationClient(msg);
    const isGreeting = (
        lower.includes('bonjour') || lower.includes('salut') || lower.includes('hello') ||
        lower.includes('hi') || lower.includes('hola') || lower.includes('مرحبا') ||
        lower.includes('olá') || lower.includes('ola') || lower.includes('こんにちは') || lower.includes('你好')
    );

    const isFocus = (
        lower.includes('bras') || lower.includes('jambe') || lower.includes('cuisse') || lower.includes('squat') ||
        lower.includes('dos') || lower.includes('pectoraux') || lower.includes('pec') || lower.includes('abdo') ||
        lower.includes('core') || lower.includes('fessier') || lower.includes('upper') || lower.includes('lower') ||
        lower.includes('leg') || lower.includes('chest') || lower.includes('full body') || lower.includes('cardio')
    );

    const isEquipment = (
        lower.includes('haltere') || lower.includes('haltère') || lower.includes('dumbbell') ||
        lower.includes('poids') || lower.includes('machine') || lower.includes('corps') ||
        lower.includes('calisth') || lower.includes('salle') || lower.includes('gym') ||
        lower.includes('bande') || lower.includes('elastique') || lower.includes('élastique') ||
        lower.includes('swiss') || lower.includes('ballon') || lower.includes('rien') ||
        lower.includes('mancuerna') || lower.includes('وزن') || lower.includes('自重') || lower.includes('哑铃')
    );

    const isConstraint = (
        lower.includes('douleur') || lower.includes('blessure') || lower.includes('mal') ||
        lower.includes('genou') || lower.includes('dos') || lower.includes('epaule') ||
        lower.includes('épaule') || lower.includes('fatigu') || lower.includes('forme') ||
        lower.includes('intense') || lower.includes('doux') || lower.includes('moyen') ||
        lower.includes('aucune')
    );

    const DIALOGUES: Record<string, { ready: string; greet: string; focus: string; equip: string; constraint: string; generic: string }> = {
        fr: {
            ready: "C'est parti Habib, on donne tout ! Je génère ta séance 3D sur mesure. [GENERATE_WORKOUT]",
            greet: "Bonjour ! Comment te sens-tu aujourd'hui ? Dis-moi quel groupe musculaire ou quelle discipline tu souhaites travailler !",
            focus: "Super choix ! Dis-moi, tu souhaites t'entraîner au poids du corps ou as-tu accès à une salle de musculation ? Et as-tu du matériel à disposition comme des haltères, des bandes de résistance ou un ballon Swiss ball ?",
            equip: "C'est bien noté pour le matériel ! As-tu des douleurs, gênes articulaires ou blessures particulières à prendre en compte aujourd'hui (par exemple aux genoux ou au dos) ? Et quel niveau d'intensité souhaites-tu ?",
            constraint: "Parfait, je prends tout cela en compte pour sécuriser et optimiser ta séance. Je t'ai préparé un entraînement sur-mesure ! Es-tu prêt et d'accord pour que je lance la séance ?",
            generic: "Bien reçu ! Quel groupe musculaire ou discipline souhaites-tu travailler aujourd'hui ?"
        },
        en: {
            ready: "Awesome, let's crush this! Generating your custom 3D workout now. [GENERATE_WORKOUT]",
            greet: "Hi! How are you feeling today? Tell me what muscle group or workout style you'd like to focus on!",
            focus: "Great choice! Tell me: are you doing bodyweight training or do you have gym access? And do you have equipment like dumbbells, resistance bands, or a Swiss ball?",
            equip: "Noted! Do you have any injuries, joint pains, or areas to protect today, and what intensity level would you prefer?",
            constraint: "Perfect, everything is set! A tailor-made session is prepared for you. Are you ready and excited to start?",
            generic: "Understood! Which muscle group or discipline would you like to target today?"
        },
        es: {
            ready: "¡Vamos con todo! Preparando tu entrenamiento 3D ahora mismo. [GENERATE_WORKOUT]",
            greet: "¡Hola! ¿Cómo te sientes hoy? ¡Dime qué grupo muscular o disciplina te gustaría entrenar!",
            focus: "¡Excelente elección! Dime: ¿entrenarás con peso corporal o en un gimnasio? ¿Y cuentas con mancuernas, bandas elásticas o balón suizo?",
            equip: "¡Perfecto! ¿Tienes alguna molestia o lesión articular hoy? ¿Y qué nivel de intensidad buscas?",
            constraint: "¡Genial! Tengo todo listo para tu sesión personalizada. ¿Estás listo y de acuerdo para comenzar?",
            generic: "¡Perfecto! ¿Qué grupo muscular o estilo de entrenamiento deseas trabajar hoy?"
        },
        ar: {
            ready: "رائع! هيا بنا نبدأ تمرينك المخصص الآن. بالتوفيق! [GENERATE_WORKOUT]",
            greet: "مرحباً! كيف تشعر اليوم؟ أخبرني ما هي العضلات أو نوع التمارين التي ترغب في تدريبها اليوم!",
            focus: "اختيار ممتاز! هل تتدرب بوزن الجسم أم في صالة رياضية؟ وهل لديك أثقال دمبل، أربطة مقاومة، أو كرة سويسرية؟",
            equip: "ممتاز! هل لديك أي إصابات أو آلام في المفاصل اليوم؟ وما هو مستوى الشدة الذي تفضله؟",
            constraint: "رائع، جهزت لك تدريباً مخصصاً بالكامل. هل أنت جاهز وموافق لنبدأ الآن؟",
            generic: "أهلاً بك! ما العضلة أو التمرين الذي تريد التركيز عليه اليوم؟"
        },
        pt: {
            ready: "Vamos com tudo! Preparando seu treino 3D personalizado agora. [GENERATE_WORKOUT]",
            greet: "Olá! Como você está se sentindo hoje? Me diga qual grupo muscular ou disciplina deseja treinar!",
            focus: "Ótima escolha! Você vai treinar com peso do corpo ou na academia? Tem halteres, elásticos ou bola suíça?",
            equip: "Perfeito! Tem alguma dor ou lesão hoje? E qual intensidade você prefere?",
            constraint: "Excelente! Sessão preparada sob medida para você. Está pronto para começar?",
            generic: "Perfeito! Qual grupo muscular você gostaria de treinar hoje?"
        },
        ja: {
            ready: "素晴らしい、スタートしましょう！あなた専用の3Dワークアウトを準備しています。[GENERATE_WORKOUT]",
            greet: "こんにちは！今日の体調はいかがですか？どの部位や種目をトレーニングしたいか教えてください！",
            focus: "素晴らしいターゲットです！自重トレーニングですか、それともジムですか？ダンベルやレジスタンスバンド、バランスボールはありますか？",
            equip: "了解しました！怪我や関節の痛みはありますか？また強度はどのくらいが希望ですか？",
            constraint: "完璧です！あなたに合わせたメニューを準備しました。スタートしてよろしいですか？",
            generic: "了解しました！本日鍛えたい部位を教えてください。"
        },
        zh: {
            ready: "全力以赴！正在为你准备定制的3D训练动作。[GENERATE_WORKOUT]",
            greet: "你好！今天状态如何？告诉我你今天想针对哪个肌群或项目进行训练！",
            focus: "很好的选择！请问你是自重训练还是在健身房？有哑铃、弹力带或瑞士球等器械吗？",
            equip: "收到！今天有关节疼痛或伤病需要避开吗？想要多大的运动强度？",
            constraint: "太好了！已为你量身定制好训练计划。你准备好开始了了吗？",
            generic: "收到！请问今天想练什么部位？"
        },
        ru: {
            ready: "Поехали! Создаю твою персональную 3D тренировку прямо сейчас. [GENERATE_WORKOUT]",
            greet: "Привет! Как самочувствие сегодня? Расскажи, какую группу мышц или стиль тренировки ты хочешь проработать!",
            focus: "Отличный выбор! Ты тренируешься с собственным весом или в зале? Есть ли гантели, резинки или фитбол?",
            equip: "Понял! Есть ли травмы или боли в суставах сегодня? Какую интенсивность предпочитаешь?",
            constraint: "Отлично, всё готово для твоей персональной тренировки. Готов начать?",
            generic: "Понял! Какую группу мышц хочешь потренировать сегодня?"
        }
    };

    const d = DIALOGUES[l] || DIALOGUES.en;
    if (isReady) return d.ready;
    if (isGreeting) return d.greet;
    if (isFocus) return d.focus;
    if (isEquipment) return d.equip;
    if (isConstraint) return d.constraint;
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

