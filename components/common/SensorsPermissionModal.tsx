import React, { useState, useEffect } from 'react';
import { Mic, MapPin, ShieldCheck, X } from 'lucide-react';
import { useApp } from '../../hooks/useApp.ts';
import { Language } from '../../types.ts';

const MODAL_STRINGS: Record<Language, {
  title: string;
  badge: string;
  desc: string;
  micLabel: string;
  micDesc: string;
  gpsLabel: string;
  gpsDesc: string;
  btnAuthorize: string;
  btnLater: string;
}> = {
  [Language.FR]: {
    title: "ACTIVATION DES CAPTEURS",
    badge: "COACH IA & GPS",
    desc: "Pour discuter directement avec le coach vocal 3D et suivre vos parcours running en temps réel, veuillez autoriser l'accès au microphone et à la localisation.",
    micLabel: "Microphone",
    micDesc: "Dialogue vocal en direct avec le coach sportif 3D",
    gpsLabel: "Localisation GPS",
    gpsDesc: "Tracé de vos sessions running et calcul d'allure",
    btnAuthorize: "ACTIVER LE MICRO & LE GPS",
    btnLater: "Plus tard"
  },
  [Language.EN]: {
    title: "ACTIVATE SENSORS",
    badge: "AI COACH & GPS",
    desc: "To speak live with your 3D voice coach and track your outdoor running sessions in real time, please allow access to your microphone and location.",
    micLabel: "Microphone",
    micDesc: "Live voice conversation with your 3D sports coach",
    gpsLabel: "GPS Location",
    gpsDesc: "Track running routes and real-time pace calculation",
    btnAuthorize: "ENABLE MIC & GPS",
    btnLater: "Later"
  },
  [Language.ES]: {
    title: "ACTIVACIÓN DE SENSORES",
    badge: "ENTRENADOR IA & GPS",
    desc: "Para hablar en vivo con tu entrenador 3D y registrar tus rutas de running en tiempo real, permite el acceso al micrófono y a la ubicación.",
    micLabel: "Micrófono",
    micDesc: "Conversación de voz en directo con el entrenador 3D",
    gpsLabel: "Ubicación GPS",
    gpsDesc: "Seguimiento de carreras y cálculo de ritmo",
    btnAuthorize: "ACTIVAR MICRÓFONO Y GPS",
    btnLater: "Más tarde"
  },
  [Language.AR]: {
    title: "تفعيل المستشعرات",
    badge: "المدرب الذكي و GPS",
    desc: "للتحدث مباشرة مع المدرب الصوتي ثلاثي الأبعاد وتتبع مسارات الجري في الوقت الفعلي، يرجى السماح بالوصول إلى الميكروفون والموقع الجغرافي.",
    micLabel: "الميكروفون",
    micDesc: "محادثة صوتية مباشرة مع المدرب الرياضي 3D",
    gpsLabel: "تحديد الموقع GPS",
    gpsDesc: "تتبع مسار الجري وحساب السرعة والمسافة",
    btnAuthorize: "تفعيل الميكروفون والموقع",
    btnLater: "لاحقاً"
  },
  [Language.PT]: {
    title: "ATIVAÇÃO DE SENSORES",
    badge: "TREINADOR IA & GPS",
    desc: "Para falar ao vivo com o treinador 3D e rastrear suas corridas em tempo real, permita o acesso ao microfone e à localização.",
    micLabel: "Microfone",
    micDesc: "Conversa de voz em direto com o treinador 3D",
    gpsLabel: "Localização GPS",
    gpsDesc: "Mapeamento de corridas e cálculo de ritmo",
    btnAuthorize: "ATIVAR MICROFONE E GPS",
    btnLater: "Mais tarde"
  },
  [Language.JA]: {
    title: "センサーの有効化",
    badge: "AIコーチ & GPS",
    desc: "3D音声コーチと対話し、ランニングコースをリアルタイムで追跡するために、マイクと位置情報へのアクセスを許可してください。",
    micLabel: "マイク",
    micDesc: "3Dスポーツコーチとのリアルタイム音声対話",
    gpsLabel: "GPS位置情報",
    gpsDesc: "ランニングルートの追跡とペース計算",
    btnAuthorize: "マイクとGPSを許可する",
    btnLater: "後で"
  },
  [Language.ZH]: {
    title: "启用传感器",
    badge: "AI教练与GPS",
    desc: "为了与3D语音教练实时交流并实时追踪跑步路线，请允许访问麦克风和地理位置权限。",
    micLabel: "麦克风",
    micDesc: "与3D运动教练进行实时语音对话",
    gpsLabel: "GPS位置信息",
    gpsDesc: "跑步路线轨迹与配速实时计算",
    btnAuthorize: "允许麦克风和GPS权限",
    btnLater: "稍后"
  },
  [Language.RU]: {
    title: "АКТИВАЦИЯ ДАТЧИКОВ",
    badge: "ИИ ТРЕНЕР И GPS",
    desc: "Чтобы общаться голосом с 3D тренером и отслеживать пробежки в реальном времени, разрешите доступ к микрофону и геолокации.",
    micLabel: "Микрофон",
    micDesc: "Прямой голосовой диалог с 3D тренером",
    gpsLabel: "GPS-локация",
    gpsDesc: "Запись маршрутов пробежек и расчет темпа",
    btnAuthorize: "ВКЛЮЧИТЬ МИКРОФОН И GPS",
    btnLater: "Позже"
  }
};

export const SensorsPermissionModal: React.FC = () => {
  const { language } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);

  const texts = MODAL_STRINGS[language] || MODAL_STRINGS[Language.EN];

  useEffect(() => {
    let isMounted = true;
    let timer: any = null;

    const isDismissed = sessionStorage.getItem('fit4rce_sensors_dismissed');
    if (isDismissed) return;

    const checkAndPrompt = async () => {
      let needsPrompt = true;
      try {
        if (navigator.permissions && navigator.permissions.query) {
          try {
            const mic = await navigator.permissions.query({ name: 'microphone' as any });
            const geo = await navigator.permissions.query({ name: 'geolocation' as any });
            if (mic.state === 'granted' && geo.state === 'granted') {
              needsPrompt = false;
            }
          } catch (e) {
            needsPrompt = true;
          }
        }
      } catch (e) {
        needsPrompt = true;
      }

      if (needsPrompt && isMounted) {
        timer = setTimeout(() => {
          if (isMounted) setIsOpen(true);
        }, 900);
      }
    };

    checkAndPrompt();

    return () => {
      isMounted = false;
      if (timer) clearTimeout(timer);
    };
  }, []);

  const handleAuthorize = async () => {
    setIsRequesting(true);

    // 1. Microphone request - opens native browser popup
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(t => t.stop());
      }
    } catch (e) {
      console.warn("Microphone prompt result:", e);
    }

    // 2. Geolocation request - opens native browser popup
    try {
      if (navigator.geolocation) {
        await new Promise<void>((resolve) => {
          navigator.geolocation.getCurrentPosition(
            () => resolve(),
            () => resolve(),
            { timeout: 6000, enableHighAccuracy: true }
          );
        });
      }
    } catch (e) {
      console.warn("Geolocation prompt result:", e);
    }

    setIsRequesting(false);
    setIsOpen(false);
    sessionStorage.setItem('fit4rce_sensors_dismissed', 'true');
  };

  const handleDismiss = () => {
    setIsOpen(false);
    sessionStorage.setItem('fit4rce_sensors_dismissed', 'true');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10002] bg-black/85 backdrop-blur-xl flex items-center justify-center p-4 font-['Poppins'] animate-fadeIn">
      <div className="relative w-full max-w-sm rounded-3xl bg-zinc-950 border border-purple-500/40 p-6 shadow-2xl shadow-purple-950/50 space-y-5 text-center">
        
        {/* Dismiss X */}
        <button
          type="button"
          onClick={handleDismiss}
          className="absolute top-4 right-4 p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all"
        >
          <X size={16} />
        </button>

        {/* Icon & Badge */}
        <div className="flex flex-col items-center gap-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-900 to-indigo-800 border border-purple-400/50 flex items-center justify-center shadow-[0_0_30px_rgba(168,85,247,0.4)]">
            <ShieldCheck className="w-7 h-7 text-purple-200" />
          </div>
          <span className="text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 mt-1">
            {texts.badge}
          </span>
          <h3 className="text-sm font-black text-white uppercase tracking-wider">
            {texts.title}
          </h3>
          <p className="text-xs text-gray-300 leading-relaxed max-w-xs">
            {texts.desc}
          </p>
        </div>

        {/* Permission items overview */}
        <div className="space-y-2.5 text-left bg-black/50 p-3.5 rounded-2xl border border-white/10 text-xs">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 shrink-0 mt-0.5">
              <Mic size={15} />
            </div>
            <div>
              <strong className="text-white text-xs block font-bold">{texts.micLabel}</strong>
              <p className="text-[10px] text-gray-400 mt-0.5">{texts.micDesc}</p>
            </div>
          </div>

          <div className="h-px bg-white/10" />

          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-purple-950/80 border border-purple-500/40 text-purple-300 shrink-0 mt-0.5">
              <MapPin size={15} />
            </div>
            <div>
              <strong className="text-white text-xs block font-bold">{texts.gpsLabel}</strong>
              <p className="text-[10px] text-gray-400 mt-0.5">{texts.gpsDesc}</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-1">
          <button
            type="button"
            onClick={handleAuthorize}
            disabled={isRequesting}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 active:scale-95 text-white font-black uppercase text-xs tracking-wider shadow-lg shadow-purple-900/40 transition-all border border-purple-400/30 disabled:opacity-50"
          >
            {isRequesting ? '...' : texts.btnAuthorize}
          </button>

          <button
            type="button"
            onClick={handleDismiss}
            className="w-full py-2 text-gray-400 hover:text-white text-[11px] font-medium transition-colors"
          >
            {texts.btnLater}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SensorsPermissionModal;
