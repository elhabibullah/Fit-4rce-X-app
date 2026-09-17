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

const CONVERSATIONAL_FALLBACKS: Record<string, {
  greet: string;
  level: string;
  equipment: string;
  focus: string;
  ready: string;
  generic: string;
}> = {
  fr: {
    greet: "Bonjour ! Je suis ton coach Fit-4rce X. Quel est ton objectif aujourd'hui : full body, haut du corps, ou bas du corps ?",
    level: "Très bien, je prends note de ton niveau. As-tu des haltères ou tu souhaites une séance au poids du corps ?",
    equipment: "Parfait ! Dis-moi quand tu es prêt et je génère ta séance 3D sur mesure.",
    focus: "Objectif bien ciblé ! Tout est paramétré. Dis-moi 'lance la séance' ou 'je suis prêt' pour démarrer !",
    ready: "C'est parti ! Je prépare ta séance 3D sur mesure. Donnons tout ! [GENERATE_WORKOUT]",
    generic: "Parfait, je personnalise ton entraînement. Dis-moi quand tu es prêt à démarrer ! [GENERATE_WORKOUT]"
  },
  en: {
    greet: "Hello! I'm your Fit-4rce X coach. What's our focus today: full body, upper body, or lower body?",
    level: "Got it! Do you have dumbbells available or prefer bodyweight calisthenics?",
    equipment: "Awesome! Let me know as soon as you are ready and I'll generate your 3D session.",
    focus: "Target locked! Whenever you're ready, say 'ready' or 'start' to begin!",
    ready: "Let's crush this! Preparing your custom 3D workout now. Let's go! [GENERATE_WORKOUT]",
    generic: "Understood! Whenever you're ready to start, let me know! [GENERATE_WORKOUT]"
  },
  es: {
    greet: "¡Hola! Soy tu entrenador Fit-4rce X. ¿Cuál es tu objetivo hoy: cuerpo completo, tren superior o piernas?",
    level: "¡Entendido! ¿Tienes mancuernas o prefieres calistenia con peso corporal?",
    equipment: "¡Excelente! Dime cuando estés listo para generar tu entrenamiento 3D.",
    focus: "¡Objetivo fijado! Di 'estoy listo' o 'vamos' para comenzar.",
    ready: "¡Vamos a darle con todo! Preparando tu entrenamiento 3D ahora mismo. [GENERATE_WORKOUT]",
    generic: "¡Perfecto! Cuando estés listo para comenzar, ¡avísame! [GENERATE_WORKOUT]"
  },
  ar: {
    greet: "أهلاً بك! أنا مدربك الشخصي Fit-4rce X. ما هو هدفك اليوم: تدريب كامل، الجزء العلوي أم السفلي؟",
    level: "رائع! هل لديك أوزان دمبل أم تفضل تمارين بوزن الجسم؟",
    equipment: "ممتاز! أخبرني عندما تكون جاهزاً وسأقوم بتوليد تدريبك ثلاثي الأبعاد.",
    focus: "تم تحديد الهدف! قل 'أنا جاهز' أو 'ابدأ' للبدء فوراً.",
    ready: "هيا بنا! أقوم بتجهيز تمارينك ثلاثية الأبعاد الآن. بالتوفيق! [GENERATE_WORKOUT]",
    generic: "رائع! أخبرني عندما تكون مستعداً للبدء! [GENERATE_WORKOUT]"
  },
  pt: {
    greet: "Olá! Sou seu treinador Fit-4rce X. Qual é o foco de hoje: corpo inteiro, superior ou pernas?",
    level: "Entendido! Você tem halteres ou prefere exercícios com o peso do corpo?",
    equipment: "Perfeito! Diga quando estiver pronto para gerar seu treino 3D.",
    focus: "Foco definido! Diga 'estou pronto' ou 'vamos' para começar.",
    ready: "Vamos com tudo! Preparando seu treino 3D personalizado agora. [GENERATE_WORKOUT]",
    generic: "Perfeito! Quando estiver pronto para começar, me avise! [GENERATE_WORKOUT]"
  },
  ja: {
    greet: "こんにちは！Fit-4rce Xコーチです。本日のターゲットは全身、上半身、それとも下半身ですか？",
    level: "了解しました！ダンベルは使いますか、それとも自重トレーニングにしますか？",
    equipment: "素晴らしい！準備ができたら「スタート」と声をかけてください。",
    focus: "ターゲット設定完了！準備ができたら教えてください。",
    ready: "さあ始めましょう！あなた専用の3Dワークアウトを準備しています。[GENERATE_WORKOUT]",
    generic: "了解しました！準備ができたら声をかけてください！[GENERATE_WORKOUT]"
  },
  zh: {
    greet: "你好！我是你的 Fit-4rce X 专属教练。今天想练全身、上半身还是下肢？",
    level: "收到！你有哑铃器械，还是希望进行自重训练？",
    equipment: "太好了！准备好时告诉我，我将为你生成3D动作序列。",
    focus: "目标已锁定！准备好了就说‘开始’吧。",
    ready: "全力以赴！正在为你准备定制的3D训练动作。[GENERATE_WORKOUT]",
    generic: "收到！准备好时随时告诉我！[GENERATE_WORKOUT]"
  },
  ru: {
    greet: "Привет! Я твой тренер Fit-4rce X. Какова цель сегодня: все тело, верхняя часть или ноги?",
    level: "Понял! Есть гантели или предпочитаешь тренировку с собственным весом?",
    equipment: "Отлично! Скажи, когда будешь готов, и я создам твою 3D тренировку.",
    focus: "Цель определена! Скажи 'готов' или 'старт', чтобы начать.",
    ready: "Поехали! Создаю твою персональную 3D тренировку прямо сейчас. [GENERATE_WORKOUT]",
    generic: "Отлично! Как только будешь готов начать, дай знать! [GENERATE_WORKOUT]"
  }
};

function getSmartFallbackReply(userText: string, lang: string): string {
  const l = (lang || 'en').toLowerCase().slice(0, 2);
  const fb = CONVERSATIONAL_FALLBACKS[l] || CONVERSATIONAL_FALLBACKS.en;
  const lower = userText.toLowerCase();

  const isReady = (
    lower.includes('prêt') || lower.includes('pret') || lower.includes('lance') ||
    lower.includes('start') || lower.includes('ready') || lower.includes('commencer') ||
    lower.includes('go') || lower.includes('parti') || lower.includes('vamos') ||
    lower.includes('listo') || lower.includes('جاهز') || lower.includes('يلا') ||
    lower.includes('開始') || lower.includes('准备') || lower.includes('готов') || lower.includes('поехали')
  );
  if (isReady) return fb.ready;

  const isGreeting = (
    lower.includes('bonjour') || lower.includes('salut') || lower.includes('hello') ||
    lower.includes('hi') || lower.includes('hola') || lower.includes('مرحبا') ||
    lower.includes('olá') || lower.includes('ola') || lower.includes('こんにちは') || lower.includes('你好')
  );
  if (isGreeting) return fb.greet;

  const isEquipment = (
    lower.includes('haltere') || lower.includes('haltère') || lower.includes('dumbbell') ||
    lower.includes('poids') || lower.includes('machine') || lower.includes('corps') ||
    lower.includes('mancuerna') || lower.includes('وزن') || lower.includes('自重') || lower.includes('哑铃')
  );
  if (isEquipment) return fb.equipment;

  const isFocus = (
    lower.includes('bras') || lower.includes('jambe') || lower.includes('dos') ||
    lower.includes('pectoraux') || lower.includes('abdos') || lower.includes('core') ||
    lower.includes('upper') || lower.includes('lower') || lower.includes('leg') || lower.includes('chest')
  );
  if (isFocus) return fb.focus;

  return fb.generic;
}

export default async function handler(req: any, res: any) {
  // CORS support
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { msg, language, history } = req.body || {};
  const targetLang = language || 'en';
  const cleanMsg = (msg || '').trim();

  if (!cleanMsg) {
    return res.status(200).json({ text: getSmartFallbackReply('hello', targetLang) });
  }

  const ai = getAiClient();
  if (ai) {
    try {
      let contents: any = cleanMsg;
      if (Array.isArray(history) && history.length > 0) {
        contents = [
          ...history.map((h: any) => ({
            role: h.role === 'user' ? 'user' : 'model',
            parts: [{ text: h.text }]
          })),
          { role: 'user', parts: [{ text: cleanMsg }] }
        ];
      }

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents,
        config: {
          systemInstruction: `You are Fit-4rce X AI Holographic Coach, an authentic, elite personal trainer speaking via live voice with the athlete.
Roleplay like a real human coach interacting with their athlete:
1. Exchange naturally, warmly, and concisely in spoken conversation (1-2 sentences per turn max, no markdown, no bullet points).
2. Ask natural coaching questions to tailor the session (level, equipment, target muscle group).
3. Whenever the athlete indicates they want to start (e.g. "c'est bon", "lance", "je suis prêt", "ready", "start", "vamos", "go"), warmly conclude that you are generating their 3D workout right now, and append "[GENERATE_WORKOUT]" at the very end of your response.

CRITICAL: Reply entirely in language code "${targetLang}". Keep responses short, direct, and conversational for audio speech output.`
        }
      });

      const replyText = response.text || getSmartFallbackReply(cleanMsg, targetLang);
      return res.status(200).json({ text: replyText });
    } catch (err) {
      console.warn('Gemini Vercel API Error, using smart fallback:', err);
    }
  }

  const smartReply = getSmartFallbackReply(cleanMsg, targetLang);
  return res.status(200).json({ text: smartReply });
}
