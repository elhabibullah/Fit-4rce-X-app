import { GoogleGenAI } from '@google/genai';

let aiInstance: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY || process.env.GOOGLE_API_KEY || process.env.API_KEY || process.env.VITE_GEMINI_API_KEY;
  if (!apiKey) return null;
  if (!aiInstance) {
    aiInstance = new GoogleGenAI({ apiKey });
  }
  return aiInstance;
}

function checkIsConfirmation(text: string): boolean {
  const lower = (text || '').toLowerCase().trim();
  return /^(oui|yes|ouais|yep|yeah|let's go|lets go|c'est parti|cest parti|je suis pr[eê]t|im ready|i am ready|go|on y va|lance|lance la s[eé]ance|d[eé]marre|start|pret|prête|ready|d'accord|daccord|ok|allons-y)\b/i.test(lower) ||
    /\b(c'est parti|lance la s[eé]ance|d[eé]marre la s[eé]ance|on commence|je suis prêt|ready to start|let's go|on y va)\b/i.test(lower);
}

function getSmartFallbackReply(userText: string, lang: string): string {
  const targetLang = (lang || 'en').toLowerCase().slice(0, 2);
  const lower = (userText || '').toLowerCase().trim();
  const isConfirm = checkIsConfirmation(userText);

  const isTarget = /jambe|leg|cuisse|squat|bras|arm|bicep|tricep|dos|back|poitrine|chest|pec|abdo|abs|core|fessier|glute|corps entier|full body|cardio|hiit/i.test(lower);
  const isEquipmentResponse = /poids du corps|bodyweight|calisth|salle|gym|halt[eè]re|dumbbell|poids|barre|bande|elastique|élastique|resistance|swiss|ballon|rien|aucun/i.test(lower);
  const isPainOrConstraint = /douleur|blessure|mal|genou|dos|epaule|épaule|cheville|aucune|rien|fatigu[eé]|en forme|intense|doux|moyen/i.test(lower);

  let fallbackFr = "";
  if (isConfirm) {
    fallbackFr = "C'est parti Habib, on donne tout ! Je lance ta séance 3D personnalisée. [GENERATE_WORKOUT]";
  } else if (isTarget) {
    fallbackFr = "Super choix ! Dis-moi, tu souhaites t'entraîner au poids du corps ou as-tu accès à une salle de musculation ? Et as-tu du matériel à disposition comme des haltères, des bandes de résistance ou un ballon Swiss ball ?";
  } else if (isEquipmentResponse) {
    fallbackFr = "C'est bien noté pour le matériel ! As-tu des douleurs, gênes articulaires ou blessures particulières à prendre en compte aujourd'hui (par exemple aux genoux ou au dos) ? Et quel niveau d'intensité souhaites-tu ?";
  } else if (isPainOrConstraint) {
    fallbackFr = "Parfait, je prends tout cela en compte pour sécuriser et optimiser ta séance. Je t'ai préparé un entraînement sur-mesure ! Es-tu prêt et d'accord pour que je lance la séance ?";
  } else {
    fallbackFr = "Bien reçu ! Quel groupe musculaire ou discipline souhaites-tu travailler aujourd'hui ?";
  }

  const fallbacks: Record<string, string> = {
    fr: fallbackFr,
    en: isConfirm 
      ? "Awesome, let's crush this! Generating your custom 3D workout now. [GENERATE_WORKOUT]" 
      : isTarget 
        ? "Great choice! Tell me: are you doing bodyweight training or do you have gym access? And do you have equipment like dumbbells, resistance bands, or a Swiss ball?"
        : isEquipmentResponse
          ? "Noted! Do you have any injuries, joint pains, or areas to protect today, and what intensity level would you prefer?"
          : "Understood! Are you ready and excited to start your workout?",
    es: isConfirm
      ? "¡Vamos con todo! Preparando tu sesión 3D ahora mismo. [GENERATE_WORKOUT]"
      : isTarget
        ? "¡Excelente elección! Dime: ¿entrenarás con peso corporal o en un gimnasio? ¿Y cuentas con mancuernas, bandas elásticas o balón suizo?"
        : "¡Perfecto! ¿Tienes alguna molestia o lesión hoy? ¿Estás listo para comenzar?",
    ar: isConfirm
      ? "رائع! هيا بنا نبدأ تمرينك المخصص الآن. [GENERATE_WORKOUT]"
      : isTarget
        ? "اختيار ممتاز! هل تتدرب بوزن الجسم أم في صالة رياضية؟ وهل لديك أثقال، أربطة مقاومة، أو كرة سويسرية؟"
        : "ممتاز! هل لديك أي إصابات أو آلام نراعيها اليوم؟ هل أنت جاهز للبدء؟",
    pt: isConfirm
      ? "Vamos lá! Gerando seu treino 3D personalizado agora. [GENERATE_WORKOUT]"
      : isTarget
        ? "Ótima escolha! Você vai treinar com peso do corpo ou na academia? Tem halteres, elásticos ou bola suíça?"
        : "Perfeito! Tem alguma dor ou lesão hoje? Está pronto para começar?",
    ja: isConfirm
      ? "素晴らしい、スタートしましょう！あなた専用の3Dワークアウトを準備しています。[GENERATE_WORKOUT]"
      : isTarget
        ? "素晴らしいターゲットです！自重トレーニングですか、それともジムですか？ダンベルやレジスタンスバンド、バランスボールはありますか？"
        : "了解しました！怪我や痛みはありますか？準備ができたら声をかけてください！",
    zh: isConfirm
      ? "太棒了，让我们开始吧！正在为你生成专属3D训练。[GENERATE_WORKOUT]"
      : isTarget
        ? "很好的选择！请问你是自重训练还是在健身房？有哑铃、弹力带或瑞士球等器械吗？"
        : "收到！今天有任何伤痛需要注意吗？准备好开始了吗？",
    ru: isConfirm
      ? "Отлично, поехали! Генерирую твою персональную 3D тренировку. [GENERATE_WORKOUT]"
      : isTarget
        ? "Отличный выбор! Ты тренируешься с собственным весом или в зале? Есть ли гантели, резинки или фитбол?"
        : "Понял! Есть ли травмы или боли сегодня? Готов начать тренировку?"
  };

  return fallbacks[targetLang] || fallbacks.en;
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

  const { msg, language, history, audioBase64, mimeType, userProfile } = req.body || {};
  const targetLang = (language || 'en').toLowerCase().slice(0, 2);
  const cleanMsg = (msg || '').trim();

  // Handle special initial greeting request
  if (cleanMsg === '__GREETING__') {
    const name = userProfile?.full_name ? userProfile.full_name.trim().split(' ')[0] : '';
    const greetings: Record<string, string> = {
      fr: name ? `Bonjour ${name} ! Comment te sens-tu aujourd'hui ? Dis-moi quel groupe musculaire ou quelle discipline tu souhaites travailler !` : "Bonjour ! Comment te sens-tu aujourd'hui ? Dis-moi quel groupe musculaire ou quelle discipline tu souhaites travailler !",
      en: name ? `Hi ${name}! How are you feeling today? Tell me what muscle group or workout style you'd like to focus on!` : "Hi! How are you feeling today? Tell me what muscle group or workout style you'd like to focus on!",
      es: name ? `¡Hola ${name}! ¿Cómo te sientes hoy? ¡Dime qué grupo muscular o disciplina te gustaría entrenar!` : "¡Hola! ¿Cómo te sientes hoy? ¡Dime qué grupo muscular o disciplina te gustaría entrenar!",
      ar: name ? `مرحباً ${name}، كيف تشعر اليوم؟ أخبرني ما هي العضلات أو نوع التمارين التي ترغب في تدريبها اليوم!` : "مرحباً، كيف تشعر اليوم؟ أخبرني ما هي العضلات أو نوع التمارين التي ترغب في تدريبها اليوم!",
      pt: name ? `Olá ${name}! Como você está se sentindo hoje? Me diga qual grupo muscular ou disciplina deseja treinar!` : "Olá! Como você está se sentindo hoje? Me diga qual grupo muscular ou disciplina deseja treinar!",
      ja: name ? `こんにちは、${name}さん！今日の体調はいかがですか？どの部位や種目をトレーニングしたいか教えてください！` : "こんにちは！今日の体調はいかがですか？どの部位や種目をトレーニングしたいか教えてください！",
      zh: name ? `你好，${name}！今天状态如何？告诉我你今天想针对哪个肌群或项目进行训练！` : "你好！今天状态如何？告诉我你今天想针对哪个肌群或项目进行训练！",
      ru: name ? `Привет, ${name}! Как самочувствие сегодня? Расскажи, какую группу мышц или стиль тренировки ты хочешь проработать!` : "Привет! Как самочувствие сегодня? Расскажи, какую группу мышц или стиль тренировки ты хочешь проработать!"
    };
    const greetText = greetings[targetLang] || greetings.en;

    const ai = getAiClient();
    if (ai) {
      try {
        const ttsRes = await ai.models.generateContent({
          model: 'gemini-3.8-flash-lite-tts',
          contents: [{ role: 'user', parts: [{ text: greetText }] }],
          config: {
            responseModalities: ['AUDIO'],
            speechConfig: {
              voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
            }
          }
        });
        const audio = ttsRes.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;
        return res.status(200).json({ text: greetText, audio });
      } catch (e) {
        console.warn('Greeting TTS error:', e);
      }
    }
    return res.status(200).json({ text: greetText, audio: null });
  }

  const ai = getAiClient();
  if (ai) {
    try {
      let profileContext = '';
      if (userProfile && typeof userProfile === 'object') {
        const parts: string[] = [];
        if (userProfile.full_name) parts.push(`Athlete Name: ${userProfile.full_name}`);
        if (userProfile.fitness_level) parts.push(`Level: ${userProfile.fitness_level}`);
        if (userProfile.goal && Array.isArray(userProfile.goal) && userProfile.goal.length > 0) {
          parts.push(`Goals: ${userProfile.goal.join(', ')}`);
        }
        if (userProfile.gender) parts.push(`Gender: ${userProfile.gender}`);
        if (userProfile.age) parts.push(`Age: ${userProfile.age}`);
        if (parts.length > 0) {
          profileContext = `\nAthlete known profile information: [${parts.join(' | ')}]`;
        }
      }

      const systemInstruction = `You are Fit Force AI Coach, an inspiring, energetic, empathetic, world-class personal female fitness coach speaking live with your athlete.
${profileContext}

STRICT CONVERSATIONAL COACHING METHODOLOGY (MANDATORY & ENFORCED):
You are a genuine, passionate personal trainer in a one-on-one consultation.
You NEVER rush to generate a workout. You converse step-by-step and ask in-depth questions before ever starting.

STEP 1 — Accueil & Prise de contact:
- When athlete greets or arrives, greet warmly by name, ask how they are feeling and what muscle group or discipline they wish to train.
- NEVER output [GENERATE_WORKOUT] here.

STEP 2 — Questions Approfondies sur l'Équipement et le Lieu (DÈS QUE L'ATHLÈTE NOMME UN GROUPE MUSCULAIRE OU OBJECTIF):
- Whenever the athlete mentions what they want to work on (e.g. "des exercices pour les jambes", "legs", "pectoraux", "dos", "bras", "abdos", "full body", etc.):
  1. Validate enthusiastically ("Super choix pour les jambes !", "Génial, les jambes c'est le socle de la puissance !").
  2. Ask IN-DEPTH, THOROUGH questions about equipment and training environment:
     - "Est-ce que tu souhaites travailler au poids du corps ou as-tu accès à une salle de sport ?"
     - "Et quels outils as-tu à disposition : des haltères, des poids, un ballon Swiss ball, des bandes élastiques de résistance, ou aucun matériel ?"
  3. ABSOLUTE PROHIBITION: DO NOT output [GENERATE_WORKOUT] here! The athlete has ONLY stated their target area!

STEP 3 — Questions Approfondies sur les Douleurs, Blessures et Intensité (QUAND L'ATHLÈTE RÉPOND SUR LE MATÉRIEL):
- When the athlete answers about equipment / location:
  1. Acknowledge their setup ("Parfait, au poids du corps avec des bandes élastiques, c'est ultra efficace !").
  2. Ask about physical condition, joint aches or injuries:
     - "As-tu des douleurs, gênes articulaires ou blessures particulières à signaler aujourd'hui (par exemple aux genoux, au bas du dos ou aux épaules) ?"
     - "Et quel niveau d'intensité souhaites-tu pour cette séance ?"
  3. ABSOLUTE PROHIBITION: DO NOT output [GENERATE_WORKOUT] here!

STEP 4 — Synthèse Personnalisée & Demande d'Accord (QUAND TU AS TOUTES LES INFORMATIONS):
- When you know: (1) target area, (2) equipment/location, and (3) physical constraints/intensity:
  1. Summarize the tailored session in 1 inspiring sentence (e.g. "Super Habib ! Je t'ai concocté une séance jambes sur mesure au poids du corps avec bandes de résistance, sans impact sur les genoux.").
  2. Ask if they agree and are ready: "Es-tu prêt et d'accord pour que je lance ta séance ?"
  3. ABSOLUTE PROHIBITION: DO NOT output [GENERATE_WORKOUT] here! You MUST wait for explicit confirmation from the athlete!

STEP 5 — Lancement Uniquement Après Confirmation Explicite:
- ONLY WHEN the athlete explicitly confirms that they agree and are ready (e.g. "Oui", "Je suis prêt", "D'accord", "C'est parti", "Lance", "On y va", "Yes", "Ready", "Let's go"):
  1. Give an energetic, motivating launch phrase (e.g. "C'est parti Habib, on donne tout !").
  2. Append the exact token "[GENERATE_WORKOUT]" at the very end of your response!

Tone & Persona:
- Warm, charismatic, encouraging, spoken sentences (2 to 3 sentences max per turn).
- Speak naturally: NEVER use markdown asterisks (*), bullets (-), or headers (#) because your words are voiced directly aloud through audio.
- Respond completely in language: "${targetLang}".`;

      let contents: any;

      if (audioBase64) {
        const audioPart = { inlineData: { mimeType: mimeType || 'audio/webm', data: audioBase64 } };
        const promptPart = { text: `Listen carefully to my voice. Transcribe mentally and respond as my personal female fitness coach in language: ${targetLang}. Follow the in-depth coaching consultation protocol. Never output [GENERATE_WORKOUT] unless I explicitly tell you I am ready to start the workout.` };

        if (Array.isArray(history) && history.length > 0) {
          const alternating: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];
          for (const h of history) {
            const role = h.role === 'user' ? 'user' : 'model';
            const text = String(h.text || '').trim();
            if (!text) continue;
            if (alternating.length > 0 && alternating[alternating.length - 1].role === role) {
              alternating[alternating.length - 1].parts[0].text += '\n' + text;
            } else {
              alternating.push({ role, parts: [{ text }] });
            }
          }
          if (alternating.length > 0 && alternating[0].role !== 'user') {
            alternating.unshift({ role: 'user', parts: [{ text: 'Hello coach' }] });
          }
          alternating.push({
            role: 'user',
            parts: [audioPart, promptPart] as any
          });
          contents = alternating;
        } else {
          contents = [
            {
              role: 'user',
              parts: [audioPart, promptPart]
            }
          ];
        }
      } else {
        if (Array.isArray(history) && history.length > 0) {
          const alternating: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];
          for (const h of history) {
            const role = h.role === 'user' ? 'user' : 'model';
            const text = String(h.text || '').trim();
            if (!text) continue;
            if (alternating.length > 0 && alternating[alternating.length - 1].role === role) {
              alternating[alternating.length - 1].parts[0].text += '\n' + text;
            } else {
              alternating.push({ role, parts: [{ text }] });
            }
          }
          if (alternating.length > 0 && alternating[0].role !== 'user') {
            alternating.unshift({ role: 'user', parts: [{ text: 'Hello coach' }] });
          }
          alternating.push({ role: 'user', parts: [{ text: cleanMsg }] });
          contents = alternating;
        } else {
          contents = cleanMsg;
        }
      }

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents,
        config: {
          systemInstruction
        }
      });

      let replyText = (response.text || "").trim();

      // STRICT GUARD: Check if the user's message is an explicit confirmation
      const isConfirmation = checkIsConfirmation(cleanMsg);
      const lastCoachMessage = Array.isArray(history) 
        ? [...history].reverse().find((h: any) => h.role === 'model' || h.role === 'assistant')?.text || '' 
        : '';
      const wasAskedReadiness = /pr[eê]t|ready|d'accord|commencer|d[eé]marrer|on lance/i.test(lastCoachMessage);

      // If reply contains [GENERATE_WORKOUT], but user didn't explicitly confirm readiness, STRIP IT IMMEDIATELY!
      if (replyText.includes('[GENERATE_WORKOUT]')) {
        if (!isConfirmation && !wasAskedReadiness) {
          replyText = replyText.replace(/\[GENERATE_WORKOUT\]/gi, '').trim();
        }
      }

      // Generate natural, ultra-realistic human female voice audio via Gemini TTS
      let audio: string | null = null;
      try {
        const spokenScript = replyText.replace(/\[GENERATE_WORKOUT\]/gi, '').trim();
        if (spokenScript) {
          const ttsResponse = await ai.models.generateContent({
            model: 'gemini-3.8-flash-lite-tts',
            contents: [{ role: 'user', parts: [{ text: spokenScript }] }],
            config: {
              responseModalities: ['AUDIO'],
              speechConfig: {
                voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
              }
            }
          });
          audio = ttsResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;
        }
      } catch (ttsErr) {
        console.warn('Gemini audio TTS generation notice:', ttsErr);
      }

      return res.status(200).json({ text: replyText, audio });
    } catch (err) {
      console.warn('Gemini Vercel API Error, using smart fallback:', err);
    }
  }

  const smartReply = getSmartFallbackReply(cleanMsg || 'hello', targetLang);
  return res.status(200).json({ text: smartReply, audio: null });
}
