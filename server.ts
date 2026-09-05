import express from 'express';
import http from 'http';
import path from 'path';
import { WebSocketServer } from 'ws';
import { GoogleGenAI, Modality } from '@google/genai';
import { createServer as createViteServer } from 'vite';

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/api/live-coach' });

const PORT = 3000;

app.use(express.json());

// Standard health check route for container & control-plane orchestration
app.get('/api/health', (req: express.Request, res: express.Response) => {
  res.json({ status: 'ok' });
});

server.on('error', (err: any) => {
  console.error('HTTP Server error:', err);
});

wss.on('error', (err: any) => {
  console.error('WebSocket Server error:', err);
});

// Initialize GoogleGenAI on the server side - keeping the API key absolutely secure
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// Secure API proxy endpoints for Gemini requests
app.post('/api/translate-sprint-plan', async (req: express.Request, res: express.Response) => {
  try {
    const { plan, language } = req.body;
    if (['en', 'fr'].includes(language)) {
      res.json(plan);
      return;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `You are an elite athletics coach and translator. Translate this sprint training plan into the target language: ${language}.
      
      Structure requirements:
      - Translate all descriptive texts into ${language}: 'titleFr' (translate to target language), 'titleEn' (translate to target language), 'descriptionFr' (translate to target language), 'descriptionEn' (translate to target language).
      - Translate the array items in 'warmupFr' and 'warmupEn' into ${language}.
      - Translate the array items in 'drillsFr' and 'drillsEn' into ${language}.
      - Translate the array items in 'cooldownFr' and 'cooldownEn' into ${language}.
      - For each exercise in 'mainExercises', translate:
        - 'nameFr' and 'nameEn' into ${language}.
        - 'intensityFr' and 'intensityEn' into ${language} (e.g. "90% d'effort max" -> translated equivalent, or "90% Max Effort" -> translated equivalent).
        - 'targetTimeFr' and 'targetTimeEn' into ${language} (translate focus/approx labels, keep times like 5.5s unchanged if standard).
        - 'recoveryFr' and 'recoveryEn' into ${language}.
        - 'notesFr' and 'notesEn' into ${language}.
        - 'setsRepsFr' and 'setsRepsEn' into ${language}.
      
      Maintain all other keys exactly unchanged, such as 'id', 'distance', 'isHillWork'.
      Return ONLY the valid translated JSON matching the structure of the input.
      
      Input sprint plan JSON:
      ${JSON.stringify(plan)}`,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const parsed = JSON.parse(response.text || "{}");
    res.json(parsed);
  } catch (error: any) {
    console.error("API error translate-sprint-plan:", error);
    res.status(500).json({ error: error.message || 'Failed to translate sprint plan' });
  }
});

interface WorkoutTemplate {
  title: string;
  description: string;
  exercises: Array<{ name: string; description: string; equipment: string }>;
}

const WORKOUT_TEMPLATES_BY_LANG: Record<string, { calisthenics: WorkoutTemplate; powerlifting: WorkoutTemplate; fitness: WorkoutTemplate; pilates: WorkoutTemplate; yoga: WorkoutTemplate }> = {
  fr: {
    calisthenics: {
      title: "Session Calisthénie Explosive",
      description: "Programme de maîtrise au poids de corps axé sur la force relative et la stabilité.",
      exercises: [
        { name: "Pompes Classiques", description: "Corps gainé, descente contrôlée jusqu'à frôler le sol.", equipment: "bodyweight" },
        { name: "Tractions Pronation", description: "Tirage complet menton au-dessus de la barre, activation des dorsaux.", equipment: "pull-up bar" },
        { name: "Dips aux Barres Parallèles", description: "Flexion des coudes à 90 degrés, poussée dynamique.", equipment: "parallel bars" },
        { name: "Gainage Planche Hollow Body", description: "Rétroversion du bassin, maintien statique abdominal maximal.", equipment: "bodyweight" },
        { name: "Fentes Sautées", description: "Explosivité des quadriceps et fessiers avec atterrissage souple.", equipment: "bodyweight" }
      ]
    },
    powerlifting: {
      title: "Force & Puissance Athlétique",
      description: "Développement des schémas moteurs fondamentaux et charge neuromusculaire.",
      exercises: [
        { name: "Squats Complets", description: "Pieds largeur d'épaules, cassure parallèle et poussée des talons.", equipment: "barbell" },
        { name: "Développé Couché", description: "Pieds ancrés, trajectoire stable et verrouillage des pectoraux.", equipment: "barbell" },
        { name: "Soulevé de Terre", description: "Charnière de hanches, dos neutre et extension complète.", equipment: "barbell" },
        { name: "Fentes Haltères", description: "Stabilité unilatérale et renforcement fessiers/ischios.", equipment: "dumbbells" },
        { name: "Gainage Militaire", description: "Verrouillage de la sangle abdominale sous tension.", equipment: "bodyweight" }
      ]
    },
    pilates: {
      title: "Pilates Tonification & Posture",
      description: "Renforcement profond du centre, alignement vertébral et contrôle postural.",
      exercises: [
        { name: "Le Cent (The Hundred)", description: "Pompages dynamiques des bras avec engagement abdominal profond.", equipment: "bodyweight" },
        { name: "Pont Fessier Isométrique", description: "Élévation du bassin et contraction ciblée des fessiers.", equipment: "bodyweight" },
        { name: "Gainage Latéral Pilates", description: "Alignement tête-tronc-bassin pour les obliques.", equipment: "bodyweight" },
        { name: "Cercles de Jambes", description: "Stabilité du bassin et mobilité de la hanche.", equipment: "bodyweight" },
        { name: "Extension Dorsale Swimming", description: "Activation symétrique de la chaîne postérieure.", equipment: "bodyweight" }
      ]
    },
    yoga: {
      title: "Vinyasa Flow & Mobilité",
      description: "Fluidité respiratoire, ouverture articulaire et concentration.",
      exercises: [
        { name: "Chien Tête en Bas", description: "Allongement de la colonne et étirement de la chaîne postérieure.", equipment: "bodyweight" },
        { name: "Guerrier II", description: "Ancrage des appuis, ouverture des hanches et stabilité.", equipment: "bodyweight" },
        { name: "Posture du Cobra", description: "Extension de la poitrine et renforcement du bas du dos.", equipment: "bodyweight" },
        { name: "Fente Basse Anjaneyasana", description: "Étirement profond du psoas et des fléchisseurs de hanche.", equipment: "bodyweight" },
        { name: "Posture de l'Enfant", description: "Relaxation profonde et relâchement de la colonne.", equipment: "bodyweight" }
      ]
    },
    fitness: {
      title: "Conditionnement Fitness Haute Intensité",
      description: "Séance métabolique et fonctionnelle optimisée pour la dépense calorique et le tonus musculaire.",
      exercises: [
        { name: "Squats Dynamiques", description: "Flexion complète des jambes et extension explosive des hanches.", equipment: "bodyweight" },
        { name: "Pompes au Sol", description: "Poussée pectorale et alignement parfait tronc-bassin.", equipment: "bodyweight" },
        { name: "Fentes Alternées", description: "Grands pas vers l'avant, genou arrière proche du sol.", equipment: "bodyweight" },
        { name: "Gainage Planche Active", description: "Contraction volontaire des abdominaux et fessiers.", equipment: "bodyweight" },
        { name: "Soulevé de Terre Léger", description: "Charnière de hanches et renforcement de la chaîne postérieure.", equipment: "bodyweight" }
      ]
    }
  },
  ar: {
    calisthenics: {
      title: "جلسة كاليستثنيكس متفجرة",
      description: "برنامج احتراف وزن الجسم للتحكم في القوة العضلية والثبات الحركي.",
      exercises: [
        { name: "تمرين الضغط القياسي", description: "شد عضلات الجذع والنزول المتحكم به مع دفع قوي.", equipment: "bodyweight" },
        { name: "تمرين العقلة", description: "سحب كامل حتى يتجاوز الذقن العارضة مع تفعيل عضلات الظهر.", equipment: "pull-up bar" },
        { name: "تمرين المتوازي", description: "ثني الكوعين 90 درجة ثم الدفع لأعلى بكامل القوة.", equipment: "parallel bars" },
        { name: "بلانك مجوف", description: "تثبيت عضلات البطن العميقة واستقامة الظهر.", equipment: "bodyweight" },
        { name: "اندفاع القفز", description: "قوة انفجارية للأرجل مع هبوط ناعم وسلس.", equipment: "bodyweight" }
      ]
    },
    powerlifting: {
      title: "قوة بدنية وأثقال مكثفة",
      description: "تطوير القوة القصوى للألياف العصبية العضلية من خلال الحركات المركبة.",
      exercises: [
        { name: "السكوات بالأثقال", description: "عرض الكتفين، نزول كامل ودفع قوي بالكعبين.", equipment: "barbell" },
        { name: "بنش برس بالبار", description: "استقرار وثبات الصدر والضغط بمسار دقيق.", equipment: "barbell" },
        { name: "الرفعة الميتة (ديدلفت)", description: "مفصل الورك، استقامة العمود الفقري وتمديد كامل.", equipment: "barbell" },
        { name: "طعنات بالأثقال", description: "ثبات أحادي الجانب لتقوية أوتار الركبة والأرداف.", equipment: "dumbbells" },
        { name: "بلانك متقدم", description: "تثبيت الجذع وحماية أسفل الظهر تحت الضغط.", equipment: "bodyweight" }
      ]
    },
    pilates: {
      title: "بيلاتس لنحت القوام والمرونة",
      description: "تقوية عضلات الجذع العميقة والتحكم الحركي الكامل.",
      exercises: [
        { name: "حركة المئة (The Hundred)", description: "ضخ ديناميكي بالذراعين مع تفعيل عميق لعضلات البطن.", equipment: "bodyweight" },
        { name: "جسر الأرداف المتساوي القياس", description: "رفع الحوض والضغط المستمر على عضلات الأرداف.", equipment: "bodyweight" },
        { name: "بلانك جانبي بيلاتس", description: "محاذاة كاملة للجسم لتقوية العضلات المائلة.", equipment: "bodyweight" },
        { name: "دوائر الساقين الموجهة", description: "ثبات الحوض ومرونة مفصل الفخذ.", equipment: "bodyweight" },
        { name: "امتداد الظهر السباحة", description: "تفعيل متناسق لكامل السلسلة الخلفية.", equipment: "bodyweight" }
      ]
    },
    yoga: {
      title: "فينيازا يوجا وتدفق الطاقة",
      description: "مرونة المفاصل، التنفس العميق والاتزان الذهني والجسدي.",
      exercises: [
        { name: "وضعية الكلب المنحني لأسفل", description: "تمديد العمود الفقري وتقوية الأوتار الخلفية.", equipment: "bodyweight" },
        { name: "وضعية المحارب الثاني", description: "ثبات الأرجل وفتح مفاصل الحوض.", equipment: "bodyweight" },
        { name: "وضعية الكوبرا", description: "فتح الصدر وتقوية عضلات أسفل الظهر.", equipment: "bodyweight" },
        { name: "وضعية الاندفاع المنخفض", description: "تمديد عميق لعضلات الفخذ والحوض.", equipment: "bodyweight" },
        { name: "وضعية الطفل للاسترخاء", description: "تهدئة الجهاز العصبي وإراحة الظهر.", equipment: "bodyweight" }
      ]
    },
    fitness: {
      title: "لياقة بدنية وحرق مكثف",
      description: "تمرين عالي الكفاءة لحرق السعرات وشد كامل عضلات الجسم.",
      exercises: [
        { name: "سكوات ديناميكي", description: "نزول متحكم به ودفع قوي لعضلات الفخذين.", equipment: "bodyweight" },
        { name: "تمرين الضغط المتوازن", description: "دفع الصدر واستقامة مثالية للظهر.", equipment: "bodyweight" },
        { name: "طعنات متبادلة", description: "خطوات واسعة لتقوية الساقين واستقرار الركبة.", equipment: "bodyweight" },
        { name: "بلانك نشط", description: "شد عضلات البطن وحرق الدهون المركزة.", equipment: "bodyweight" },
        { name: "ديدلفت بوزن الجسم", description: "تقوية أوتار الركبة وأسفل الظهر.", equipment: "bodyweight" }
      ]
    }
  },
  es: {
    calisthenics: {
      title: "Sesión de Calistenia Explosiva",
      description: "Dominio del peso corporal enfocado en fuerza relativa y estabilidad articular.",
      exercises: [
        { name: "Flexiones Clásicas", description: "Cuerpo firme, descenso controlado hasta rozar el suelo.", equipment: "bodyweight" },
        { name: "Dominadas Pronas", description: "Tirón completo mentón sobre la barra, activando dorsales.", equipment: "pull-up bar" },
        { name: "Fondos en Paralelas", description: "Flexión de codos a 90 grados y empuje dinámico.", equipment: "parallel bars" },
        { name: "Plancha Hollow Body", description: "Retroversión pélvica y máxima tensión abdominal.", equipment: "bodyweight" },
        { name: "Zancadas con Salto", description: "Explosividad en cuádriceps y glúteos con aterrizaje suave.", equipment: "bodyweight" }
      ]
    },
    powerlifting: {
      title: "Fuerza y Potencia Muscular",
      description: "Patrones motores fundamentales y máximo reclutamiento neuromuscular.",
      exercises: [
        { name: "Sentadillas Profundas", description: "Pies al ancho de hombros, romper paralelo y empuje de talones.", equipment: "barbell" },
        { name: "Press de Banca", description: "Arco sólido, descenso controlado y empuje pectoral explosivo.", equipment: "barbell" },
        { name: "Peso Muerto", description: "Bisagra de cadera, espalda neutra y bloqueo firme.", equipment: "barbell" },
        { name: "Zancadas con Mancuernas", description: "Estabilidad unilateral y fuerza en glúteos e isquiotibiales.", equipment: "dumbbells" },
        { name: "Plancha Militar", description: "Bloqueo central total contra la fatiga.", equipment: "bodyweight" }
      ]
    },
    pilates: {
      title: "Pilates Tonificación y Postura",
      description: "Fortalecimiento del core, alineación de columna y control corporal.",
      exercises: [
        { name: "El Cien (The Hundred)", description: "Bombeos rítmicos con activación abdominal profunda.", equipment: "bodyweight" },
        { name: "Puente de Glúteos Isométrico", description: "Elevación de pelvis y contracción máxima de glúteos.", equipment: "bodyweight" },
        { name: "Plancha Lateral Pilates", description: "Alineación de hombro, cadera y tobillo para oblicuos.", equipment: "bodyweight" },
        { name: "Círculos de Piernas", description: "Estabilidad de pelvis y movilidad de cadera.", equipment: "bodyweight" },
        { name: "Extensión Dorsal Swimming", description: "Activación coordinada de toda la cadena posterior.", equipment: "bodyweight" }
      ]
    },
    yoga: {
      title: "Flujo Vinyasa y Movilidad",
      description: "Respiración consciente, flexibilidad articular y equilibrio.",
      exercises: [
        { name: "Perro Boca Abajo", description: "Elongación de columna y estiramiento de isquiotibiales.", equipment: "bodyweight" },
        { name: "Guerrero II", description: "Base sólida, apertura de caderas y concentración.", equipment: "bodyweight" },
        { name: "Postura de la Cobra", description: "Apertura del pecho y fortalecimiento lumbar.", equipment: "bodyweight" },
        { name: "Zancada Baja Anjaneyasana", description: "Estiramiento profundo de psoas y flexores de cadera.", equipment: "bodyweight" },
        { name: "Postura del Niño", description: "Descanso activo y relajación de la columna.", equipment: "bodyweight" }
      ]
    },
    fitness: {
      title: "Acondicionamiento Fitness de Alta Intensidad",
      description: "Sesión metabólica y funcional para quema calórica y tono muscular integral.",
      exercises: [
        { name: "Sentadillas Dinámicas", description: "Flexión profunda de piernas y extensión potente de cadera.", equipment: "bodyweight" },
        { name: "Flexiones de Brazos", description: "Empuje de pecho y alineación recta de tronco.", equipment: "bodyweight" },
        { name: "Zancadas Alternas", description: "Pasos amplios manteniendo el torso erguido.", equipment: "bodyweight" },
        { name: "Plancha Abdominal Activa", description: "Contracción máxima de abdomen y glúteos.", equipment: "bodyweight" },
        { name: "Bisagra de Cadera (Peso Muerto)", description: "Activación de isquiosurales y zona lumbar.", equipment: "bodyweight" }
      ]
    }
  },
  pt: {
    calisthenics: {
      title: "Sessão de Calistenia Explosiva",
      description: "Domínio do peso corporal focado em força relativa e estabilidade articular.",
      exercises: [
        { name: "Flexões Clássicas", description: "Tronco firme, descida controlada até quase tocar o chão.", equipment: "bodyweight" },
        { name: "Barra Fixa Pronada", description: "Puxada completa até o queixo passar da barra.", equipment: "pull-up bar" },
        { name: "Mergulho nas Paralelas", description: "Flexão de cotovelos a 90 graus e impulso firme.", equipment: "parallel bars" },
        { name: "Prancha Hollow Body", description: "Tensão abdominal profunda e retroversão pélvica.", equipment: "bodyweight" },
        { name: "Avanço com Salto", description: "Explosão de pernas e aterrissagem suave.", equipment: "bodyweight" }
      ]
    },
    powerlifting: {
      title: "Força e Potência Máxima",
      description: "Padrões motores essenciais e ativação neuromuscular avançada.",
      exercises: [
        { name: "Agachamento com Barra", description: "Pés na largura dos ombros, quebra de paralelo e subida forte.", equipment: "barbell" },
        { name: "Supino Reto", description: "Pegada firme, descida controlada e empurrão peitoral.", equipment: "barbell" },
        { name: "Levantamento Terra", description: "Extensão de quadril com coluna neutra e trava no topo.", equipment: "barbell" },
        { name: "Avanço com Halteres", description: "Estabilidade unilateral para glúteos e posteriores.", equipment: "dumbbells" },
        { name: "Prancha Militar", description: "Contração máxima do core para estabilização da coluna.", equipment: "bodyweight" }
      ]
    },
    pilates: {
      title: "Pilates Postura e Tonificação",
      description: "Fortalecimento do centro de força, alinhamento espinhal e mobilidade.",
      exercises: [
        { name: "The Hundred", description: "Bombeamento dos braços com ativação abdominal contínua.", equipment: "bodyweight" },
        { name: "Ponte de Glúteos Isométrica", description: "Elevação da pelve e ativação de glúteos.", equipment: "bodyweight" },
        { name: "Prancha Lateral de Pilates", description: "Alinhamento preciso de coluna e oblíquos.", equipment: "bodyweight" },
        { name: "Círculos de Pernas", description: "Estabilidade da bacia e controle do quadril.", equipment: "bodyweight" },
        { name: "Extensão Lombar Swimming", description: "Trabalho dinâmico para os extensores das costas.", equipment: "bodyweight" }
      ]
    },
    yoga: {
      title: "Fluxo Vinyasa e Flexibilidade",
      description: "Respiração sincronizada, amplitude de movimento e equilíbrio.",
      exercises: [
        { name: "Cachorro Olhando para Baixo", description: "Alongamento da cadeia posterior e coluna.", equipment: "bodyweight" },
        { name: "Guerreiro II", description: "Firmeza nas pernas e abertura pélvica.", equipment: "bodyweight" },
        { name: "Postura da Cobra", description: "Expansão torácica e fortalecimento lombar.", equipment: "bodyweight" },
        { name: "Passada Baixa Anjaneyasana", description: "Alongamento profundo do psoas.", equipment: "bodyweight" },
        { name: "Postura da Criança", description: "Descanso restaurador e descompressão da coluna.", equipment: "bodyweight" }
      ]
    },
    fitness: {
      title: "Condicionamento Fitness Alta Intensidade",
      description: "Treino funcional metabólico para queima de gordura e tônus muscular.",
      exercises: [
        { name: "Agachamento Dinâmico", description: "Flexão completa de pernas e impulsão de quadril.", equipment: "bodyweight" },
        { name: "Flexão de Braços", description: "Empurrão peitoral com alinhamento lombar.", equipment: "bodyweight" },
        { name: "Avanço Alternado", description: "Passos firmes para frente mantendo o tronco ereto.", equipment: "bodyweight" },
        { name: "Prancha Abdominal Ativa", description: "Tensão voluntária em todo o abdômen.", equipment: "bodyweight" },
        { name: "Stiff com Peso Corporal", description: "Ativação de glúteos e posteriores de coxa.", equipment: "bodyweight" }
      ]
    }
  },
  ja: {
    calisthenics: {
      title: "爆発的自重キャリステニクス",
      description: "相対的筋力と体幹安定性を高める自重トレーニングプログラム。",
      exercises: [
        { name: "スタンダード・プッシュアップ", description: "体幹を固定し、胸を床に近づけて力強く押し上げます。", equipment: "bodyweight" },
        { name: "懸垂（プルアップ）", description: "顎がバーを超えるまで背筋を使って引き上げます。", equipment: "pull-up bar" },
        { name: "ディップス", description: "肘を90度まで曲げて力強く押し出します。", equipment: "parallel bars" },
        { name: "ホローボディ・プランク", description: "骨盤を後傾させ腹筋群を最大限収縮させます。", equipment: "bodyweight" },
        { name: "ジャンピング・ランジ", description: "大腿四頭筋とお尻の瞬発力を使って着地します。", equipment: "bodyweight" }
      ]
    },
    powerlifting: {
      title: "マックスパワー＆ストレングス",
      description: "全身の筋力と神経系を高める複合リフティングメニュー。",
      exercises: [
        { name: "バックスクワット", description: "肩幅で立ち、股関節を深く曲げて踵で押し上げます。", equipment: "barbell" },
        { name: "ベンチプレス", description: "胸を張り、バーをコントロールしながら力強く押し上げます。", equipment: "barbell" },
        { name: "デッドリフト", description: "背筋を真っ直ぐ保ち、股関節伸展でバーを引き上げます。", equipment: "barbell" },
        { name: "ダンベルランジ", description: "片脚ずつの安定性とお尻の筋肉を鍛えます。", equipment: "dumbbells" },
        { name: "ヘビープランク", description: "高負荷下で体幹のブレーシングを維持します。", equipment: "bodyweight" }
      ]
    },
    pilates: {
      title: "ピラティス・体幹と姿勢改善",
      description: "インナーマッスルの強化と背骨の美しいアライメント。",
      exercises: [
        { name: "ハンドレッド", description: "腕のリズミカルなポンピングで深層腹筋を刺激します。", equipment: "bodyweight" },
        { name: "アイソメトリック・ヒップブリッジ", description: "骨盤を持ち上げ、お尻とお腹を引き締めます。", equipment: "bodyweight" },
        { name: "サイドプランク・ピラティス", description: "側腹筋と骨盤のアライメントを整えます。", equipment: "bodyweight" },
        { name: "シングルレッグサークル", description: "骨盤を安定させ股関節の可動域を広げます。", equipment: "bodyweight" },
        { name: "バックエクステンション・スイミング", description: "背部全体を均等に強化します。", equipment: "bodyweight" }
      ]
    },
    yoga: {
      title: "ヴィンヤサフロー＆モビリティ",
      description: "呼吸と動きを連動させ、柔軟性と集中力を高めます。",
      exercises: [
        { name: "ダウンドッグ", description: "背骨を伸ばし、太もも裏をしっかりストレッチします。", equipment: "bodyweight" },
        { name: "ウォーリアー II", description: "下半身の安定と股関節の柔軟性を高めます。", equipment: "bodyweight" },
        { name: "コブラのポーズ", description: "胸を開き、腰回りの筋肉を強化します。", equipment: "bodyweight" },
        { name: "ローランジ", description: "腸腰筋と股関節前面を深く伸ばします。", equipment: "bodyweight" },
        { name: "チャイルドポーズ", description: "深い呼吸で心身と背骨をリラックスさせます。", equipment: "bodyweight" }
      ]
    },
    fitness: {
      title: "高強度フィットネス・コンディショニング",
      description: "カロリー消費と筋トーンを最大化する全身運動。",
      exercises: [
        { name: "ダイナミックスクワット", description: "股関節をしっかり曲げて爆発的に立ち上がります。", equipment: "bodyweight" },
        { name: "腕立て伏せ", description: "体幹を一直線に保ち大胸筋を効かせます。", equipment: "bodyweight" },
        { name: "オルタネイティング・ランジ", description: "大きく一歩を踏み出し下半身を鍛えます。", equipment: "bodyweight" },
        { name: "アクティブ・プランク", description: "お腹とお尻を意識して姿勢をキープします。", equipment: "bodyweight" },
        { name: "ヒップヒンジ・デッドリフト", description: "太もも裏と背筋を強化します。", equipment: "bodyweight" }
      ]
    }
  },
  zh: {
    calisthenics: {
      title: "爆发力自体重徒手健身",
      description: "专注于相对力量和关节稳定性的自重控制训练。",
      exercises: [
        { name: "标准俯卧撑", description: "核心收紧，下落至胸部接近地面后爆发推起。", equipment: "bodyweight" },
        { name: "正握引体向上", description: "全程拉至下巴过杠，充分激活背阔肌。", equipment: "pull-up bar" },
        { name: "双杠臂屈伸", description: "手肘弯曲至90度后有力推起。", equipment: "parallel bars" },
        { name: "空心支撑平板支撑", description: "骨盆后倾，深层腹肌全力收紧。", equipment: "bodyweight" },
        { name: "跳跃箭步蹲", description: "股四头肌和臀大肌爆发发力，平稳落地。", equipment: "bodyweight" }
      ]
    },
    powerlifting: {
      title: "极限力量与爆发力突破",
      description: "复合举重模式，激活全身最大神经肌肉招募。",
      exercises: [
        { name: "杠铃深蹲", description: "双脚与肩同宽，蹲过水平线，脚后跟发力蹬起。", equipment: "barbell" },
        { name: "平板卧推", description: "起桥稳定，控制下落，胸大肌爆发推起。", equipment: "barbell" },
        { name: "传统硬拉", description: "髋关节铰链，保持脊柱中立，有力锁死。", equipment: "barbell" },
        { name: "哑铃箭步蹲", description: "单侧稳定性训练，强化臀腿力量。", equipment: "dumbbells" },
        { name: "强化平板支撑", description: "高负荷下的腹内压支撑抗疲劳训练。", equipment: "bodyweight" }
      ]
    },
    pilates: {
      title: "普拉提塑形与体态雕刻",
      description: "强化核心控制，优化脊柱排列与身体平衡。",
      exercises: [
        { name: "百次拍击 (The Hundred)", description: "呼吸配合手臂律动，深度激活腹横肌。", equipment: "bodyweight" },
        { name: "等长臀桥", description: "抬高骨盆，持续收紧臀大肌与核心。", equipment: "bodyweight" },
        { name: "普拉提侧平板支撑", description: "保持头部、躯干和骨盆一条直线，强化侧腹。", equipment: "bodyweight" },
        { name: "单腿划圈", description: "稳定骨盆，提升髋关节灵活性。", equipment: "bodyweight" },
        { name: "俯卧背部伸展", description: "强化背部肌群与身体后侧链协调。", equipment: "bodyweight" }
      ]
    },
    yoga: {
      title: "流瑜伽流动与柔韧伸展",
      description: "呼吸与体式流动融合，增强关节灵活性与身心平衡。",
      exercises: [
        { name: "下犬式", description: "延展脊柱，深度拉伸腿后侧肌群。", equipment: "bodyweight" },
        { name: "战士二式", description: "稳固下盘，打开髋部并建立专注力量。", equipment: "bodyweight" },
        { name: "眼镜蛇式", description: "展开胸腔，强化下背部力量。", equipment: "bodyweight" },
        { name: "低位箭步式", description: "深层拉伸髂腰肌和髋屈肌。", equipment: "bodyweight" },
        { name: "婴儿式放松", description: "深度呼吸，放松脊柱和神经系统。", equipment: "bodyweight" }
      ]
    },
    fitness: {
      title: "高效燃脂全身功能性体能",
      description: "全面提升心肺耐力、代谢率和肌肉线条。",
      exercises: [
        { name: "动态深蹲", description: "下蹲充分，髋部爆发蹬直。", equipment: "bodyweight" },
        { name: "标准俯卧撑", description: "胸肌充分收缩，身体呈一条直线。", equipment: "bodyweight" },
        { name: "交替箭步蹲", description: "迈步稳健，膝盖不内扣，躯干直立。", equipment: "bodyweight" },
        { name: "动态核心平板", description: "紧绷腹肌和臀部，保持均匀呼吸。", equipment: "bodyweight" },
        { name: "自重硬拉髋铰链", description: "强化腘绳肌与下背部后链肌群。", equipment: "bodyweight" }
      ]
    }
  },
  ru: {
    calisthenics: {
      title: "Взрывная калистеника с собственным весом",
      description: "Программа контроля собственного веса для развития относительной силы.",
      exercises: [
        { name: "Классические отжимания", description: "Прямой корпус, контролируемый спуск и мощный подъем.", equipment: "bodyweight" },
        { name: "Подтягивания прямым хватом", description: "Полная амплитуда с подбородком выше перекладины.", equipment: "pull-up bar" },
        { name: "Отжимания на брусьях", description: "Сгибание локтей до 90 градусов и мощный толчок вверх.", equipment: "parallel bars" },
        { name: "Планка Холлоу Боди", description: "Подкручивание таза и максимальное напряжение пресса.", equipment: "bodyweight" },
        { name: "Выпады с выпрыгиванием", description: "Взрывная сила ног с мягким безопасным приземлением.", equipment: "bodyweight" }
      ]
    },
    powerlifting: {
      title: "Силовой пауэрлифтинг и мощь",
      description: "Базовые движения для максимальной активации нейромышечной системы.",
      exercises: [
        { name: "Приседания со штангой", description: "Постановка ног на ширине плеч, сед ниже параллели и толчок пятками.", equipment: "barbell" },
        { name: "Жим штанги лежа", description: "Жесткий мост, подконтрольный спуск и взрывной жим грудью.", equipment: "barbell" },
        { name: "Становая тяга", description: "Движение в тазобедренных суставах, прямая спина и четкий замок.", equipment: "barbell" },
        { name: "Выпады с гантелями", description: "Односторонняя стабильность и сила ягодиц и бицепса бедра.", equipment: "dumbbells" },
        { name: "Утяжеленная планка", description: "Глубокое внутрибрюшное давление и защита позвоночника.", equipment: "bodyweight" }
      ]
    },
    pilates: {
      title: "Пилатес тонус и осанка",
      description: "Укрепление глубокого кора, выравнивание позвоночника и баланс.",
      exercises: [
        { name: "Сотня (The Hundred)", description: "Ритмичные покачивания руками с глубокой активацией пресса.", equipment: "bodyweight" },
        { name: "Ягодичный мостик", description: "Подъем таза и изометрическое сжатие ягодичных мышц.", equipment: "bodyweight" },
        { name: "Боковая планка пилатес", description: "Выравнивание тела в одну линию для тренировки косых мышц.", equipment: "bodyweight" },
        { name: "Круги ногой", description: "Стабильность таза и подвижность тазобедренного сустава.", equipment: "bodyweight" },
        { name: "Пловец (Swimming)", description: "Симметричная активация мышц задней поверхности тела.", equipment: "bodyweight" }
      ]
    },
    yoga: {
      title: "Виньяса-флоу и гибкость",
      description: "Синхронизация дыхания и движений для гибкости и концентрации.",
      exercises: [
        { name: "Собака мордой вниз", description: "Вытяжение позвоночника и растяжка задней поверхности бедра.", equipment: "bodyweight" },
        { name: "Воин II", description: "Уверенная стойка, раскрытие таза и концентрация.", equipment: "bodyweight" },
        { name: "Поза кобры", description: "Раскрытие грудной клетки и укрепление поясницы.", equipment: "bodyweight" },
        { name: "Низкий выпад", description: "Глубокая растяжка подвздошно-поясничной мышцы.", equipment: "bodyweight" },
        { name: "Поза ребенка", description: "Полное расслабление позвоночника и нервной системы.", equipment: "bodyweight" }
      ]
    },
    fitness: {
      title: "Высокоинтенсивный функциональный фитнес",
      description: "Метаболическая тренировка для сжигания калорий и рельефа мышц.",
      exercises: [
        { name: "Динамические приседания", description: "Глубокий сед и мощное разгибание в тазобедренных суставах.", equipment: "bodyweight" },
        { name: "Отжимания от пола", description: "Прямая линия тела и работа грудных мышц.", equipment: "bodyweight" },
        { name: "Чередующиеся выпады", description: "Широкие шаги вперед с удержанием вертикального корпуса.", equipment: "bodyweight" },
        { name: "Активная планка", description: "Максимальное статическое напряжение пресса и ягодиц.", equipment: "bodyweight" },
        { name: "Наклоны (Хип-хиндж)", description: "Проработка бицепсов бедер и мышц спины.", equipment: "bodyweight" }
      ]
    }
  },
  en: {
    calisthenics: {
      title: "Explosive Calisthenics Routine",
      description: "Bodyweight mastery focusing on relative power and kinetic chain stability.",
      exercises: [
        { name: "Standard Push-Ups", description: "Keep core tight, lower chest close to the floor, push explosively.", equipment: "bodyweight" },
        { name: "Pull-Ups", description: "Full range chin-over-bar pull focusing on lat engagement.", equipment: "pull-up bar" },
        { name: "Parallel Dips", description: "Lower to 90 degree elbow flexion and drive up powerfully.", equipment: "parallel bars" },
        { name: "Hollow Body Plank", description: "Maintain posterior pelvic tilt and deep core bracing.", equipment: "bodyweight" },
        { name: "Jumping Lunges", description: "Explosive quad and glute drive with controlled landing.", equipment: "bodyweight" }
      ]
    },
    powerlifting: {
      title: "Max Power & Strength Protocol",
      description: "Fundamental compound lifts targeting total neuromuscular recruitment.",
      exercises: [
        { name: "Back Squats", description: "Feet shoulder-width apart, break parallel, drive through heels.", equipment: "barbell" },
        { name: "Bench Press", description: "Solid arch, controlled bar descent, press with full pectoral drive.", equipment: "barbell" },
        { name: "Deadlift", description: "Hip hinge pattern, neutral spine, aggressive lock out.", equipment: "barbell" },
        { name: "Walking Lunges", description: "Unilateral stability and hamstring/glute power.", equipment: "dumbbells" },
        { name: "Heavy Plank", description: "Deep intra-abdominal bracing against fatigue.", equipment: "bodyweight" }
      ]
    },
    pilates: {
      title: "Pilates Core & Posture Sculpture",
      description: "Deep core toning, spinal alignment, and full kinetic control.",
      exercises: [
        { name: "The Hundred", description: "Dynamic arm pumps with deep transverse abdominal activation.", equipment: "bodyweight" },
        { name: "Isometric Glute Bridge", description: "Pelvic lift maintaining continuous glute tension.", equipment: "bodyweight" },
        { name: "Pilates Side Plank", description: "Head-to-heel linear alignment targeting the obliques.", equipment: "bodyweight" },
        { name: "Single Leg Circles", description: "Pelvic stabilization and femoral mobility.", equipment: "bodyweight" },
        { name: "Spine Swimming Extension", description: "Symmetrical posterior chain activation.", equipment: "bodyweight" }
      ]
    },
    yoga: {
      title: "Vinyasa Flow & Dynamic Mobility",
      description: "Breath-synchronized movement opening joints and building grounded focus.",
      exercises: [
        { name: "Downward Facing Dog", description: "Spinal elongation and posterior hamstring stretch.", equipment: "bodyweight" },
        { name: "Warrior II", description: "Solid grounding, hip opening, and unwavering focus.", equipment: "bodyweight" },
        { name: "Cobra Pose", description: "Chest opening and lumbar spine strengthening.", equipment: "bodyweight" },
        { name: "Low Lunge Anjaneyasana", description: "Deep psoas and hip flexor lengthening.", equipment: "bodyweight" },
        { name: "Child's Rest Pose", description: "Deep breath restoration and spinal decompression.", equipment: "bodyweight" }
      ]
    },
    fitness: {
      title: "High-Intensity Fitness Conditioning",
      description: "Metabolic and functional conditioning tailored for caloric burn and muscular endurance.",
      exercises: [
        { name: "Dynamic Squats", description: "Full hip flexion and explosive upward drive.", equipment: "bodyweight" },
        { name: "Push-Ups", description: "Pectoral activation with strict spine alignment.", equipment: "bodyweight" },
        { name: "Alternating Lunges", description: "Deep stride keeping front knee tracking over toes.", equipment: "bodyweight" },
        { name: "Active Plank Hold", description: "Maximal abdominal contraction and pelvic stability.", equipment: "bodyweight" },
        { name: "Posterior Deadlift Hinge", description: "Hip hinge targeting hamstrings and erector spinae.", equipment: "bodyweight" }
      ]
    }
  }
};

const getDynamicWorkoutFallback = (prompt: string = '', language: string = 'en') => {
  const p = (prompt || '').toLowerCase();
  const rawLang = (language || 'en').toLowerCase().slice(0, 2);
  const lang = WORKOUT_TEMPLATES_BY_LANG[rawLang] ? rawLang : 'en';
  const templates = WORKOUT_TEMPLATES_BY_LANG[lang];

  if (p.includes('calisthenic') || p.includes('calisthénie') || p.includes('كاليست') || p.includes('自重') || p.includes('калистеник')) {
    return templates.calisthenics;
  }
  if (p.includes('powerlift') || p.includes('force') || p.includes('fuerza') || p.includes('força') || p.includes('قوة') || p.includes('パワー') || p.includes('力量') || p.includes('сил')) {
    return templates.powerlifting;
  }
  if (p.includes('pilate') || p.includes('بيلاتس') || p.includes('ピラティス') || p.includes('普拉提')) {
    return templates.pilates;
  }
  if (p.includes('yoga') || p.includes('يوغا') || p.includes('يوجا') || p.includes('ヨガ') || p.includes('瑜伽') || p.includes('йог')) {
    return templates.yoga;
  }

  return templates.fitness;
};

app.post('/api/generate-workout', async (req: express.Request, res: express.Response) => {
  const { prompt, language, options } = req.body;
  const targetSets = options?.targetSets || 4;
  const targetReps = options?.targetReps || 14;
  const restBetweenSets = options?.restBetweenSets || 30;

  try {
    let generatedData = null;
    if (process.env.GEMINI_API_KEY) {
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: `As a world-class certified fitness coach, generate a high quality structured workout plan in ${language || 'fr'} for this request: "${prompt || 'full body fitness'}".
          The session protocol requires exactly ${targetSets} sets of ${targetReps} reps per exercise with ${restBetweenSets}s rest pause between sets.
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
          generatedData = {
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
          };
        }
      } catch (geminiErr) {
        console.warn("Gemini direct call error, utilizing dynamic fallback:", geminiErr);
      }
    }

    if (generatedData) {
      res.json(generatedData);
      return;
    }

    const fallback = getDynamicWorkoutFallback(prompt, language);
    res.json({
      ...fallback,
      targetSets,
      targetReps,
      restBetweenSets,
      exercises: fallback.exercises.map((e: any) => ({
        ...e,
        sets: targetSets,
        reps: targetReps,
        restSeconds: restBetweenSets
      }))
    });
  } catch (error: any) {
    console.error("API error generate-workout:", error);
    const fallback = getDynamicWorkoutFallback(prompt, language);
    res.json(fallback);
  }
});

app.post('/api/chatbot-response', async (req: express.Request, res: express.Response) => {
  try {
    const { msg, language, history } = req.body;
    const targetLang = language || 'en';
    
    if (process.env.GEMINI_API_KEY) {
      try {
        let contents: any = msg;
        if (Array.isArray(history) && history.length > 0) {
          contents = [
            ...history.map((h: any) => ({
              role: h.role === 'user' ? 'user' : 'model',
              parts: [{ text: h.text }]
            })),
            { role: 'user', parts: [{ text: msg }] }
          ];
        }

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: contents,
          config: {
            systemInstruction: `You are Fit-4rce X AI Holographic Coach, a high-level personal trainer speaking via live voice with the athlete (like ChatGPT Voice or Gemini Live).
Respond naturally, concisely, warmly, and like an authentic elite coach.
Talk back in a human, encouraging, conversational tone without robotic phrases or markdown symbols.
If the user mentions wanting a workout, ask any clarifying question or confirm the plan.
If the user confirms they are ready to begin (e.g., "je suis prêt", "c'est parti", "lance", "commence", "let's go", "ready", "listo", "vamos", "يلا", "ابدأ"), warmly confirm that you are generating their custom exercises right now!

CRITICAL MANDATE: You MUST reply entirely in the requested language code: "${targetLang}".
- If language is 'fr': reply in French.
- If language is 'es': reply in Spanish.
- If language is 'ar': reply in Arabic.
- If language is 'pt': reply in Portuguese.
- If language is 'ja': reply in Japanese.
- If language is 'zh': reply in Chinese.
- If language is 'ru': reply in Russian.
- If language is 'en': reply in English.
Keep responses short and punchy (1 to 2 sentences max) suitable for direct speech output.`
          }
        });
        res.json({ text: response.text || "OK" });
        return;
      } catch (geminiErr) {
        console.warn("Gemini chatbot error:", geminiErr);
      }
    }

    const fallbacks: Record<string, string> = {
      fr: "Bien reçu ! Je prépare vos exercices sur mesure.",
      es: "¡Perfecto! Estoy preparando tus ejercicios personalizados.",
      ar: "ممتاز! أقوم بإعداد تمارينك المخصصة الآن.",
      pt: "Perfeito! Estou preparando seus exercícios personalizados.",
      ja: "了解しました！あなた専用のエクササイズを準備しています。",
      zh: "收到！正在为您准备定制训练动作。",
      ru: "Отлично! Подготавливаю ваши индивидуальные упражнения.",
      en: "Awesome! I'm preparing your custom exercises right now."
    };
    const reply = fallbacks[targetLang] || fallbacks.en;
    res.json({ text: reply });
  } catch (error: any) {
    console.error("API error chatbot-response:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/diet-plan', async (req: express.Request, res: express.Response) => {
  try {
    const { profile, language } = req.body;
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Generate a high-performance daily nutrition plan for ${profile?.full_name || 'the user'} in ${language}. Goal: 3200 kcal. Return JSON only.`,
      config: {
        responseMimeType: 'application/json'
      }
    });
    res.json(JSON.parse(response.text || '{}'));
  } catch (error: any) {
    console.error("API error diet-plan:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/diet-al-response', async (req: express.Request, res: express.Response) => {
  try {
    const { msg } = req.body;
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: msg
    });
    res.json({ text: response.text || "Analyzing..." });
  } catch (error: any) {
    console.error("API error diet-al-response:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/trainer-cv', async (req: express.Request, res: express.Response) => {
  try {
    const { name, bio, language } = req.body;
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Generate a professional, structured trainer CV for ${name} with the following biography: ${bio} in ${language}.`
    });
    res.json({ text: response.text || "Profile data loaded..." });
  } catch (error: any) {
    console.error("API error trainer-cv:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/fasting-phase', async (req: express.Request, res: express.Response) => {
  try {
    const { phaseName, language } = req.body;
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Explain the physiological state and benefits of the fasting phase: "${phaseName}" in ${language}. Keep it scientifically accurate yet accessible.`
    });
    res.json({ text: response.text || "Analyzing physiological state..." });
  } catch (error: any) {
    console.error("API error fasting-phase:", error);
    res.status(500).json({ error: error.message });
  }
});

wss.on('connection', (ws) => {
  console.log('Client connected to Live Coach WebSocket proxy');
  let session: any = null;
  let isConnecting = false;

  ws.on('message', async (message) => {
    try {
      const parsed = JSON.parse(message.toString());

      if (parsed.type === 'setup') {
        const { systemPrompt, voiceName } = parsed;
        console.log('Establishing secure live session with voice name:', voiceName);
        isConnecting = true;
        
        try {
          session = await ai.live.connect({
            model: 'gemini-3.1-flash-live-preview',
            config: {
              responseModalities: [Modality.AUDIO],
              speechConfig: {
                voiceConfig: { prebuiltVoiceConfig: { voiceName: voiceName || 'Zephyr' } },
              },
              systemInstruction: `${systemPrompt || 'You are Fit-4rce-X Coach.'} When the user confirms they are ready or asks for a workout session (e.g. "I am ready", "let's train", "prépare l'entraînement", "je suis prêt", "go"), you MUST immediately call the tool startWorkoutGeneration to prepare and launch their workout program.`,
              tools: [
                {
                  functionDeclarations: [
                    {
                      name: 'startWorkoutGeneration',
                      description: 'Generates and starts the personalized workout training program with holographic 3D coach and exercise videos when the user is ready to begin.',
                      parameters: {
                        type: 'OBJECT' as any,
                        properties: {
                          workoutType: {
                            type: 'STRING' as any,
                            description: 'The type of workout: fitness, calisthenics, powerlifting, pilates, yoga, crossfit, cardio, or full body.'
                          },
                          intensity: {
                            type: 'STRING' as any,
                            description: 'Intensity level: low, medium, or high.'
                          },
                          targetArea: {
                            type: 'ARRAY' as any,
                            items: { type: 'STRING' as any },
                            description: 'Target body areas (e.g. chest, legs, abs, full body).'
                          },
                          customPrompt: {
                            type: 'STRING' as any,
                            description: 'Specific goals or constraints mentioned by the user.'
                          }
                        }
                      }
                    }
                  ]
                }
              ],
              inputAudioTranscription: {},
              outputAudioTranscription: {},
            },
            callbacks: {
              onmessage: (msg: any) => {
                if (ws.readyState === ws.OPEN) {
                  const audio = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                  if (audio) {
                    ws.send(JSON.stringify({ audio, ...msg }));
                  } else {
                    ws.send(JSON.stringify(msg));
                  }
                }
              },
              onclose: () => {
                console.log('Gemini live session closed');
                if (ws.readyState === ws.OPEN) {
                  ws.send(JSON.stringify({ type: 'status', status: 'Link closed' }));
                }
              },
              onerror: (err) => {
                console.error('Gemini live session error:', err);
                if (ws.readyState === ws.OPEN) {
                  ws.send(JSON.stringify({ type: 'status', status: 'Connection error' }));
                }
              }
            }
          });
          isConnecting = false;
          if (ws.readyState === ws.OPEN) {
            ws.send(JSON.stringify({ type: 'status', status: 'Listening...' }));
          }
        } catch (connErr) {
          console.warn('Gemini Live API direct connect failed, fallback ready:', connErr);
          isConnecting = false;
          if (ws.readyState === ws.OPEN) {
            ws.send(JSON.stringify({ type: 'status', status: 'fallback_ready' }));
          }
        }
      } else if (parsed.audio) {
        if (session && !isConnecting) {
          try {
            session.sendRealtimeInput({
              audio: { data: parsed.audio, mimeType: 'audio/pcm;rate=16000' }
            });
          } catch (sendErr) {
            console.error('Error sending realtime input to Gemini:', sendErr);
          }
        }
      }
    } catch (err) {
      console.error('WebSocket proxy message processing error:', err);
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected from Live Coach WebSocket proxy');
    if (session) {
      try {
        session.close();
      } catch (e) {}
    }
  });
});

async function startServer() {
  // Vite middleware for development / serving files in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Fit-4rce-X Full-Stack Server running on port ${PORT}`);
  });
}

startServer();
