
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

    const discipline = (options?.workoutType || options?.goal || '').toLowerCase();
    const isPilates = discipline.includes('pilate') || discipline.includes('بيلاتس') || discipline.includes('ピラティス') || discipline.includes('普拉提');
    const isYoga = discipline.includes('yoga') || discipline.includes('يوغا') || discipline.includes('يوجا') || discipline.includes('ヨガ') || discipline.includes('瑜伽');
    const isCalisthenics = discipline.includes('calisthenic') || discipline.includes('calisthénie') || discipline.includes('كاليست') || discipline.includes('自重');
    const isPower = discipline.includes('power') || discipline.includes('force') || discipline.includes('fuerza') || discipline.includes('قوة');

    if (isPilates) {
        const pilatesDict: Record<Language, { title: string; desc: string; e1: string; d1: string; e2: string; d2: string; e3: string; d3: string; e4: string; d4: string; e5: string; d5: string }> = {
            [Language.FR]: {
                title: "Sculpture & Posture Pilates",
                desc: "Renforcement profond du transverse, alignement vertébral et contrôle postural.",
                e1: "Le Cent (The Hundred)", d1: "Battements toniques des bras avec engagement abdominal profond.",
                e2: "Pont Fessier Isométrique", d2: "Élévation du bassin maintenant une tension continue des fessiers.",
                e3: "Gainage Latéral Pilates", d3: "Alignement tête-bassin ciblant les obliques et la stabilité.",
                e4: "Cercles de Jambes", d4: "Stabilité du bassin et mobilité fémorale contrôlée.",
                e5: "Extension Dorsale Swimming", d5: "Activation symétrique de la chaîne postérieure sans cambrer."
            },
            [Language.EN]: {
                title: "Pilates Core & Posture Sculpture",
                desc: "Deep core toning, spinal alignment, and full kinetic control.",
                e1: "The Hundred", d1: "Dynamic arm pumps with deep transverse abdominal activation.",
                e2: "Isometric Glute Bridge", d2: "Pelvic lift maintaining continuous glute tension.",
                e3: "Pilates Side Plank", d3: "Head-to-heel linear alignment targeting the obliques.",
                e4: "Single Leg Circles", d4: "Pelvic stabilization and femoral mobility.",
                e5: "Spine Swimming Extension", d5: "Symmetrical posterior chain activation."
            },
            [Language.AR]: {
                title: "بيلاتس لنحت القوام وتقوية الجذع",
                desc: "تقوية عضلات البطن العميقة واستقامة العمود الفقري والتوازن الحركي.",
                e1: "تمرين المئة (The Hundred)", d1: "حركات ضخ ذراعين مع شد عضلات البطن العميقة.",
                e2: "جسر الألوية الثابت", d2: "رفع الحوض مع ثبات كامل لعضلات المؤخرة وأسفل الظهر.",
                e3: "بلانك جانبي بيلاتس", d3: "استقامة كاملة للجسم لاستهداف الخواصر وعضلات التوازن.",
                e4: "دوائر الساق الفردية", d4: "تثبيت الحوض وتوسيع مرونة مفصل الورك.",
                e5: "السباحة الظهرية (Swimming)", d5: "تمديد الظهر وتفعيل السلسلة الخلفية بحركات متناسقة."
            },
            [Language.ES]: {
                title: "Escultura y Postura Pilates",
                desc: "Activación del abdomen profundo, alineación espinal y control postural.",
                e1: "El Cien (The Hundred)", d1: "Bateo dinámico de brazos con contracción abdominal profunda.",
                e2: "Puente de Glúteos Isométrico", d2: "Elevación de pelvis manteniendo tensión constante.",
                e3: "Plancha Lateral Pilates", d3: "Alineación cabeza-tobillos enfocada en los oblicuos.",
                e4: "Círculos de Pierna", d4: "Estabilización pélvica y movilidad de cadera.",
                e5: "Natación Dorsal (Swimming)", d5: "Fortalecimiento de toda la cadena posterior."
            },
            [Language.PT]: {
                title: "Escultura e Postura Pilates",
                desc: "Ativação profunda do core, alinhamento da coluna e controle cinético.",
                e1: "The Hundred", d1: "Movimentos rítmicos dos braços com abdômen travado.",
                e2: "Ponte de Glúteos Isométrica", d2: "Elevação pélvica com foco nos glúteos e estabilização lombar.",
                e3: "Prancha Lateral Pilates", d3: "Alinhamento axial com foco nos oblíquos.",
                e4: "Círculos de Perna Unilaterais", d4: "Controle pélvico e mobilidade coxofemoral.",
                e5: "Extensão Swimming", d5: "Trabalho postural simétrico da cadeia posterior."
            },
            [Language.JA]: {
                title: "ピラティス・体幹＆姿勢スカルプト",
                desc: "深層コア筋の強化、背骨のアライメント、全身のコントロール。",
                e1: "ハンドレッド (The Hundred)", d1: "腹筋深層を活性化しながらリズミカルに腕を振ります。",
                e2: "アイソメトリック・ヒップリフト", d2: "骨盤を引き上げ臀筋の緊張をキープします。",
                e3: "ピラティス・サイドプランク", d3: "体側ラインを一直線に保ち腹斜筋を鍛えます。",
                e4: "シングルレッグサークル", d4: "骨盤を安定させたまま股関節を柔軟に回します。",
                e5: "スパイナル・スイミング", d5: "背筋全体を左右対称に引き締めます。"
            },
            [Language.ZH]: {
                title: "普拉提核心雕刻与体态重塑",
                desc: "深层腹横肌激活，脊柱延展与精准动作控制。",
                e1: "百次拍打 (The Hundred)", d1: "核心深层收紧，双臂规律拍打呼吸配合。",
                e2: "静态臀桥骨盆悬停", d2: "骨盆上顶，保持臀肌与核心稳定收缩。",
                e3: "普拉提侧支撑", d3: "头顶至脚跟呈直线，强化腹斜肌与肩胛稳定。",
                e4: "单腿划圈控制", d4: "骨盆完全中立稳定，髋关节灵活画圈。",
                e5: "背腹对抗游泳式", d5: "对侧手脚交替向上微抬，强化背部后链。"
            },
            [Language.RU]: {
                title: "Пилатес: Кор и королевская осанка",
                desc: "Глубокая активация кора, вытяжение позвоночника и баланс.",
                e1: "Сотня (The Hundred)", d1: "Динамичные махи руками с фиксацией глубокого пресса.",
                e2: "Изометрический ягодичный мостик", d2: "Удержание таза на весу с постоянным напряжением ягодиц.",
                e3: "Боковая планка Пилатес", d3: "Идеальная прямая линия тела для акцента на косые мышцы.",
                e4: "Круги одной ногой", d4: "Фиксация таза и мягкое вращение в тазобедренном суставе.",
                e5: "Пловец (Swimming)", d5: "Симметричное укрепление всей задней поверхности тела."
            }
        };
        const pDict = pilatesDict[language] || pilatesDict[Language.EN];
        return {
            title: pDict.title,
            description: pDict.desc,
            exercises: [
                { name: pDict.e1, description: pDict.d1, modelUrl: MODEL_LIBRARY.bodyweight, videoUrl: VIDEO_LIBRARY['plank'], difficulty: 'intermediate' as any, muscleGroups: [], sets: targetSets, reps: targetReps, restSeconds: restBetweenSets },
                { name: pDict.e2, description: pDict.d2, modelUrl: MODEL_LIBRARY.bodyweight, videoUrl: VIDEO_LIBRARY['squat'], difficulty: 'intermediate' as any, muscleGroups: [], sets: targetSets, reps: targetReps, restSeconds: restBetweenSets },
                { name: pDict.e3, description: pDict.d3, modelUrl: MODEL_LIBRARY.bodyweight, videoUrl: VIDEO_LIBRARY['plank'], difficulty: 'intermediate' as any, muscleGroups: [], sets: targetSets, reps: targetReps, restSeconds: restBetweenSets },
                { name: pDict.e4, description: pDict.d4, modelUrl: MODEL_LIBRARY.bodyweight, videoUrl: VIDEO_LIBRARY['lunge'], difficulty: 'intermediate' as any, muscleGroups: [], sets: targetSets, reps: targetReps, restSeconds: restBetweenSets },
                { name: pDict.e5, description: pDict.d5, modelUrl: MODEL_LIBRARY.bodyweight, videoUrl: VIDEO_LIBRARY['deadlift'], difficulty: 'intermediate' as any, muscleGroups: [], sets: targetSets, reps: targetReps, restSeconds: restBetweenSets }
            ],
            level,
            goal: 'pilates',
            targetSets,
            targetReps,
            restBetweenSets
        };
    }

    if (isYoga) {
        const yogaDict: Record<Language, { title: string; desc: string; e1: string; d1: string; e2: string; d2: string; e3: string; d3: string; e4: string; d4: string; e5: string; d5: string }> = {
            [Language.FR]: {
                title: "Vinyasa Flow & Mobilité Articulaire",
                desc: "Respiration synchronisée, décompression vertébrale et équilibre.",
                e1: "Chien Tête en Bas", d1: "Allongement de la colonne et étirement des ischios.",
                e2: "Guerrier II Virabhadrasana", d2: "Ancrage puissant des appuis et ouverture des hanches.",
                e3: "Posture du Cobra Bhujangasana", d3: "Ouverture de la cage thoracique et renforcement lombaire.",
                e4: "Fente Basse Anjaneyasana", d4: "Étirement profond du psoas et stabilité du bassin.",
                e5: "Posture de l'Enfant Balasana", d5: "Décompression vertébrale et retour au calme respiratoire."
            },
            [Language.EN]: {
                title: "Vinyasa Flow & Dynamic Mobility",
                desc: "Breath-synchronized movement opening joints and building grounded focus.",
                e1: "Downward Facing Dog", d1: "Spinal elongation and posterior hamstring stretch.",
                e2: "Warrior II", d2: "Solid grounding, hip opening, and unwavering focus.",
                e3: "Cobra Pose", d3: "Chest opening and lumbar spine strengthening.",
                e4: "Low Lunge Anjaneyasana", d4: "Deep psoas and hip flexor lengthening.",
                e5: "Child's Rest Pose", d5: "Deep breath restoration and spinal decompression."
            },
            [Language.AR]: {
                title: "يوغا التدفق والمرونة الديناميكية",
                desc: "تناغم التنفس مع الحركة، وإطالة العمود الفقري وفتح المفاصل.",
                e1: "وضعية الكلب المنحني لأسفل", d1: "إطالة العمود الفقري وأوتار الركبة الخلفية.",
                e2: "وضعية المحارب الثاني", d2: "ثبات قوي للأقدام وفتح الوركين وتركيز كامل.",
                e3: "وضعية الكوبرا", d3: "فتح الصدر وتقوية أسفل الظهر بمرونة.",
                e4: "الطعنة المنخفضة (أنجانياسانا)", d4: "إطالة عضلات الحوض والورك الأمامية.",
                e5: "وضعية الطفل للاسترخاء", d5: "تهدئة التنفس وإراحة الظهر بالكامل."
            },
            [Language.ES]: {
                title: "Vinyasa Flow y Movilidad Dinámica",
                desc: "Movimiento sincronizado con la respiración, apertura articular y equilibrio.",
                e1: "Perro Boca Abajo", d1: "Elongación espinal y estiramiento de isquiotibiales.",
                e2: "Guerrero II", d2: "Enraizamiento firme, apertura de cadera y enfoque.",
                e3: "Postura de la Cobra", d3: "Apertura de pecho y fortalecimiento lumbar suave.",
                e4: "Zancada Baja Anjaneyasana", d4: "Estiramiento profundo del psoas.",
                e5: "Postura del Niño Balasana", d5: "Descompresión vertebral y relajación respiratoria."
            },
            [Language.PT]: {
                title: "Vinyasa Flow e Mobilidade Dinâmica",
                desc: "Movimento sincronizado com a respiração para flexibilidade e equilíbrio.",
                e1: "Cachorro Olhando para Baixo", d1: "Alongamento da coluna e posteriores de coxa.",
                e2: "Guerreiro II", d2: "Base sólida, abertura de quadril e concentração.",
                e3: "Postura da Cobra", d3: "Abertura torácica e fortalecimento lombar.",
                e4: "Avanço Baixo Anjaneyasana", d4: "Alongamento do psoas e flexores do quadril.",
                e5: "Postura da Criança Balasana", d5: "Recuperação respiratória e relaxamento da coluna."
            },
            [Language.JA]: {
                title: "ヴィンヤサ・フロー＆ダイナミック・モビリティ",
                desc: "呼吸と連動した流れるような動きで関節を開き、体軸を整えます。",
                e1: "ダウンドッグ (下を向いた犬のポーズ)", d1: "背骨を伸ばしハムストリングスを心地よくストレッチ。",
                e2: "ウォーリアII (戦士のポーズ2)", d2: "下半身の安定と股関節の開き、集中力を高めます。",
                e3: "コブラのポーズ", d3: "胸を開き、腰背部を穏やかに強化します。",
                e4: "ローランジ (アンジャネーヤーサナ)", d4: "腸腰筋と股関節前側を深く伸ばします。",
                e5: "チャイルドポーズ", d5: "呼吸を整え、背骨を緩めてリフレッシュします。"
            },
            [Language.ZH]: {
                title: "流瑜伽与动态关节灵活性",
                desc: "呼吸与体式同步流动，打开胸腔髋部，舒展脊柱。",
                e1: "下犬式 (Adho Mukha)", d1: "延展脊柱后背，拉伸大腿后侧肌群。",
                e2: "战士二式 (Virabhadrasana II)", d2: "扎实双腿根基，开展髋部，凝神聚力。",
                e3: "眼镜蛇式 (Bhujangasana)", d3: "打开前胸，强化后腰背肌群。",
                e4: "低位箭步式 (Anjaneyasana)", d4: "深度拉伸髂腰肌与髋屈肌群。",
                e5: "大休息婴儿式 (Balasana)", d5: "放松脊柱与神经系统，平稳呼吸。"
            },
            [Language.RU]: {
                title: "Виньяса Флоу и Раскрытие Суставов",
                desc: "Дыхание в движении, мягкая растяжка и центрирование ума.",
                e1: "Собака мордой вниз", d1: "Вытяжение позвоночника и растяжка подколенных сухожилий.",
                e2: "Воин II", d2: "Мощная опора стоп, раскрытие таза и концентрация.",
                e3: "Поза Кобры", d3: "Раскрытие грудной клетки и укрепление поясницы.",
                e4: "Низкий выпад Анжанеясана", d4: "Глубокое вытяжение подвздошно-поясничной мышцы.",
                e5: "Поза ребенка Баласана", d5: "Полная разгрузка позвоночника и ровное дыхание."
            }
        };
        const yDict = yogaDict[language] || yogaDict[Language.EN];
        return {
            title: yDict.title,
            description: yDict.desc,
            exercises: [
                { name: yDict.e1, description: yDict.d1, modelUrl: MODEL_LIBRARY.bodyweight, videoUrl: VIDEO_LIBRARY['deadlift'], difficulty: 'intermediate' as any, muscleGroups: [], sets: targetSets, reps: targetReps, restSeconds: restBetweenSets },
                { name: yDict.e2, description: yDict.d2, modelUrl: MODEL_LIBRARY.bodyweight, videoUrl: VIDEO_LIBRARY['lunge'], difficulty: 'intermediate' as any, muscleGroups: [], sets: targetSets, reps: targetReps, restSeconds: restBetweenSets },
                { name: yDict.e3, description: yDict.d3, modelUrl: MODEL_LIBRARY.bodyweight, videoUrl: VIDEO_LIBRARY['push up'], difficulty: 'intermediate' as any, muscleGroups: [], sets: targetSets, reps: targetReps, restSeconds: restBetweenSets },
                { name: yDict.e4, description: yDict.d4, modelUrl: MODEL_LIBRARY.bodyweight, videoUrl: VIDEO_LIBRARY['lunge'], difficulty: 'intermediate' as any, muscleGroups: [], sets: targetSets, reps: targetReps, restSeconds: restBetweenSets },
                { name: yDict.e5, description: yDict.d5, modelUrl: MODEL_LIBRARY.bodyweight, videoUrl: VIDEO_LIBRARY['plank'], difficulty: 'intermediate' as any, muscleGroups: [], sets: targetSets, reps: targetReps, restSeconds: restBetweenSets }
            ],
            level,
            goal: 'yoga',
            targetSets,
            targetReps,
            restBetweenSets
        };
    }

    if (isCalisthenics) {
        const calisthenicsDict: Record<Language, { title: string; desc: string; e1: string; d1: string; e2: string; d2: string; e3: string; d3: string; e4: string; d4: string; e5: string; d5: string }> = {
            [Language.FR]: {
                title: "Calisthénie & Maîtrise Poids du Corps",
                desc: "Poussée explosive, verrouillage scapulaire et contrôle statique athlétique.",
                e1: "Pompes Strictes Explosives", d1: "Descente contrôlée et poussée explosive avec protraction scapulaire.",
                e2: "Dips au Sol Triceps", d2: "Extension complète des coudes et isolation des triceps.",
                e3: "Fentes Sautées Plyométriques", d3: "Explosion verticale et réception amortie sur la jambe avant.",
                e4: "Gainage Hollow Body", d4: "Rétroversion du bassin et verrouillage complet de la sangle abdominale.",
                e5: "Squats Poids de Corps Tempo", d5: "Contrôle excentrique 3 secondes et verrouillage des fessiers."
            },
            [Language.EN]: {
                title: "Calisthenics Bodyweight Dominance",
                desc: "Upper-body pressing power, scapular control, and core rigidity.",
                e1: "Explosive Push-Ups", d1: "Chest to floor, explosive pressing power with scapular protraction.",
                e2: "Floor Tricep Dips", d2: "Full elbow extension isolating the triceps and anterior deltoids.",
                e3: "Plyometric Jump Lunges", d3: "Vertical explosion and soft controlled landing on lead foot.",
                e4: "Hollow Body Core Hold", d4: "Pelvic posterior tilt with maximal abdominal compression.",
                e5: "Tempo Bodyweight Squats", d5: "Strict 3-second descent with deep hip crease flexion."
            },
            [Language.AR]: {
                title: "كاليستثنكس وقوة وزن الجسم",
                desc: "قوة دفع متفجرة، ثبات الكتفين واللوحين، وصلابة كاملة للجذع.",
                e1: "ضغط متفجر دقيق", d1: "نزول للصدر ودفع قوي مع استقامة كاملة للظهر.",
                e2: "دبس أرضي للترايسبس", d2: "تمديد كامل للكوعين لعزل الترايسبس والأكتاف.",
                e3: "طعنات قفز بلايوميترية", d3: "قفز انفجاري مع هبوط ممتص على الساق الأمامية.",
                e4: "تثبيت هولو بودي (Hollow Body)", d4: "شد عميق لعضلات البطن مع التصاق أسفل الظهر.",
                e5: "سكوات بوزن الجسم مع تحكم", d5: "نزول بطيء وصعود قوي لتقوية الساقين."
            },
            [Language.ES]: {
                title: "Calistenia y Dominio Corporal",
                desc: "Empuje explosivo, estabilidad escapular y control abdominal estricto.",
                e1: "Flexiones Explosivas", d1: "Pecho al suelo y empuje potente con protracción escapular.",
                e2: "Fondos de Tríceps en Suelo", d2: "Extensión total de codos aislando tríceps.",
                e3: "Zancadas con Salto Pliométricas", d3: "Potencia vertical con aterrizaje suave y controlado.",
                e4: "Bloqueo Hollow Body", d4: "Retroversión pélvica y compresión abdominal total.",
                e5: "Sentadillas con Tempo Controlado", d5: "Descenso de 3 segundos y subida explosiva."
            },
            [Language.PT]: {
                title: "Calistenia e Força Corporal",
                desc: "Empurre explosivo, controle escapular e rigidez muscular completa.",
                e1: "Flexões Explosivas", d1: "Descida controlada e empurrão potente.",
                e2: "Mergulho de Tríceps no Chão", d2: "Extensão completa dos cotovelos isolando tríceps.",
                e3: "Avanço com Salto Pliométrico", d3: "Explosão vertical e aterrissagem suave.",
                e4: "Hollow Body Isométrico", d4: "Tração pélvica e compressão profunda do abdômen.",
                e5: "Agachamento com Tempo", d5: "Descida controlada e extensão potente de quadril."
            },
            [Language.JA]: {
                title: "自重キャリステニクス・パワー",
                desc: "爆発的なプッシュ力、肩甲骨の安定性、強靭な体幹コントロール。",
                e1: "エクスプロシブ・プッシュアップ", d1: "胸をしっかり下ろし爆発的な推進力で押し上げます。",
                e2: "フロア・トライセップディップス", d2: "肘をしっかり伸ばし上腕三頭筋を集中強化します。",
                e3: "プライオメトリック・ジャンプランジ", d3: "跳躍力を高め、前足で衝撃を吸収しながら着地します。",
                e4: "ホロウボディ・ホールド", d4: "骨盤を後傾させ、腹筋を最大限に引き締めて静止します。",
                e5: "テンポ・スクワット", d5: "3秒かけて下ろし、力強く立ち上がります。"
            },
            [Language.ZH]: {
                title: "街头自重体能与身体掌控",
                desc: "爆发力推力、肩胛控制与强悍的核心抗屈能力。",
                e1: "爆发力标准俯卧撑", d1: "胸部触地，爆发推起，肩胛充分前引。",
                e2: "地面窄距三头支撑臂屈伸", d2: "肘关节完全伸展，孤立刺激肱三头肌。",
                e3: "跳跃箭步蹲换腿", d3: "纵向爆发跳跃，前腿轻盈缓冲着地。",
                e4: "香蕉船空心支撑 (Hollow Body)", d4: "骨盆后倾贴地，腹直肌最大张力紧绷。",
                e5: "节奏自重深蹲", d5: "三秒下蹲控制节奏，臀部爆发站起。"
            },
            [Language.RU]: {
                title: "Калистеника и Владение Телом",
                desc: "Взрывной жим, контроль лопаток и жесткая фиксация кора.",
                e1: "Взрывные отжимания", d1: "Касание грудью пола и мощный толчок с протолканием лопаток.",
                e2: "Отжимания на трицепс от пола", d2: "Четкое разгибание в локтях для проработки трицепсов.",
                e3: "Плиометрические выпады с прыжком", d3: "Вертикальный взрыв и мягкое контролируемое приземление.",
                e4: "Лодочка Холлоу Боди", d4: "Прижатая к полу поясница и железобетонный пресс.",
                e5: "Приседания с темпом", d5: "Медленный сед за 3 секунды и мощное разгибание."
            }
        };
        const cDict = calisthenicsDict[language] || calisthenicsDict[Language.EN];
        return {
            title: cDict.title,
            description: cDict.desc,
            exercises: [
                { name: cDict.e1, description: cDict.d1, modelUrl: MODEL_LIBRARY.bodyweight, videoUrl: VIDEO_LIBRARY['push up'], difficulty: 'intermediate' as any, muscleGroups: [], sets: targetSets, reps: targetReps, restSeconds: restBetweenSets },
                { name: cDict.e2, description: cDict.d2, modelUrl: MODEL_LIBRARY.bodyweight, videoUrl: VIDEO_LIBRARY['push up'], difficulty: 'intermediate' as any, muscleGroups: [], sets: targetSets, reps: targetReps, restSeconds: restBetweenSets },
                { name: cDict.e3, description: cDict.d3, modelUrl: MODEL_LIBRARY.bodyweight, videoUrl: VIDEO_LIBRARY['lunge'], difficulty: 'intermediate' as any, muscleGroups: [], sets: targetSets, reps: targetReps, restSeconds: restBetweenSets },
                { name: cDict.e4, description: cDict.d4, modelUrl: MODEL_LIBRARY.bodyweight, videoUrl: VIDEO_LIBRARY['plank'], difficulty: 'intermediate' as any, muscleGroups: [], sets: targetSets, reps: targetReps, restSeconds: restBetweenSets },
                { name: cDict.e5, description: cDict.d5, modelUrl: MODEL_LIBRARY.bodyweight, videoUrl: VIDEO_LIBRARY['squat'], difficulty: 'intermediate' as any, muscleGroups: [], sets: targetSets, reps: targetReps, restSeconds: restBetweenSets }
            ],
            level,
            goal: 'calisthenics',
            targetSets,
            targetReps,
            restBetweenSets
        };
    }

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
            sName: "Sentadillas Dinámicas", sDesc: "Flexion profunda de piernas y extensión potente de cadera.",
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
        level,
        goal: options?.goal || 'fitness',
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

