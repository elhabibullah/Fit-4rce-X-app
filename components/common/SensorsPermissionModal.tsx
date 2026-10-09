import React, { useState, useEffect, useRef } from 'react';
import { Mic, MapPin, Camera, ShieldCheck, X, Check, ArrowRight, Sparkles } from 'lucide-react';
import { useApp } from '../../hooks/useApp.ts';
import { Language } from '../../types.ts';

interface PermissionTexts {
  title: string;
  badge: string;
  desc: string;
  micLabel: string;
  micDesc: string;
  gpsLabel: string;
  gpsDesc: string;
  camLabel: string;
  camDesc: string;
  slideHint: string;
  btnAccept: string;
  btnLater: string;
  accepted: string;
}

const MODAL_STRINGS: Record<Language, PermissionTexts> = {
  [Language.FR]: {
    title: "ACTIVATION DES 3 CAPTEURS",
    badge: "EXPÉRIENCE IMMERSIVE 3D",
    desc: "Pour profiter de l'expérience complète Fit-4rce-X, faites glisser les boutons vers la droite pour activer les 3 capteurs clés.",
    micLabel: "1. Microphone",
    micDesc: "Dialogue vocal en direct avec le coach sportif 3D",
    gpsLabel: "2. Localisation GPS",
    gpsDesc: "Tracé du parcours running, vitesse et distance en temps réel",
    camLabel: "3. Caméra & Capteurs AR",
    camDesc: "Analyse posturale biomécanique et projection sur écran",
    slideHint: "Glisser vers la droite pour accepter",
    btnAccept: "TOUT ACCEPTER & DÉMARRER",
    btnLater: "Continuer sans capteurs",
    accepted: "ACTIVÉ"
  },
  [Language.EN]: {
    title: "ACTIVATE 3 CORE SENSORS",
    badge: "IMMERSIVE 3D EXPERIENCE",
    desc: "To unlock the full Fit-4rce-X experience, slide the toggles to the right to authorize the 3 core capabilities.",
    micLabel: "1. Microphone",
    micDesc: "Live two-way voice conversation with your 3D coach",
    gpsLabel: "2. GPS Location",
    gpsDesc: "Outdoor route mapping, real-time pace and distance",
    camLabel: "3. Camera & AR Sensors",
    camDesc: "Biomechanical posture analysis and screen projection",
    slideHint: "Slide to right to accept",
    btnAccept: "ACCEPT ALL & LAUNCH",
    btnLater: "Continue without sensors",
    accepted: "ACTIVE"
  },
  [Language.ES]: {
    title: "ACTIVACIÓN DE LOS 3 SENSORES",
    badge: "EXPERIENCIA 3D INMERSIVA",
    desc: "Para desbloquear la experiencia Fit-4rce-X completa, desliza hacia la derecha para autorizar los 3 sensores principales.",
    micLabel: "1. Micrófono",
    micDesc: "Diálogo de voz en directo con el entrenador 3D",
    gpsLabel: "2. Ubicación GPS",
    gpsDesc: "Trazado de rutas running, ritmo y distancia en tiempo real",
    camLabel: "3. Cámara y Sensores AR",
    camDesc: "Análisis biomecánico de posturas y proyección en pantalla",
    slideHint: "Desliza a la derecha para aceptar",
    btnAccept: "ACEPTAR TODO Y EMPEZAR",
    btnLater: "Continuar sin sensores",
    accepted: "ACTIVADO"
  },
  [Language.AR]: {
    title: "تفعيل المستشعرات الثلاثة",
    badge: "تجربة ثلاثية الأبعاد تفاعلية",
    desc: "للاستمتاع بالتجربة الكاملة في Fit-4rce-X، اسحب الأزرار نحو اليمين لتفعيل المستشعرات الأساسية.",
    micLabel: "1. الميكروفون",
    micDesc: "محادثة صوتية مباشرة مع المدرب الرياضي 3D",
    gpsLabel: "2. نظام تحديد المواقع GPS",
    gpsDesc: "تتبع مسار الجري والسرعة والمسافة في الوقت الفعلي",
    camLabel: "3. الكاميرا ومستشعرات AR",
    camDesc: "تحليل الحركة الميكانيكية الحيوية والبث على الشاشات",
    slideHint: "اسحب لليمين للموافقة",
    btnAccept: "قبول الكل والبدء",
    btnLater: "المتابعة لاحقاً",
    accepted: "مفعل"
  },
  [Language.PT]: {
    title: "ATIVAÇÃO DOS 3 SENSORES",
    badge: "EXPERIÊNCIA 3D IMERSIVA",
    desc: "Para aproveitar a experiência completa Fit-4rce-X, deslize para a direita para autorizar os 3 sensores essenciais.",
    micLabel: "1. Microfone",
    micDesc: "Conversa por voz em tempo real com o treinador 3D",
    gpsLabel: "2. Localização GPS",
    gpsDesc: "Mapeamento de corrida, ritmo e distância em tempo real",
    camLabel: "3. Câmera e Sensores AR",
    camDesc: "Análise postural biomecânica e projeção em tela",
    slideHint: "Deslize para a direita para aceitar",
    btnAccept: "ACEITAR TUDO E INICIAR",
    btnLater: "Continuar sem sensores",
    accepted: "ATIVO"
  },
  [Language.JA]: {
    title: "3つのセンサーを有効化",
    badge: "没入型3D体験",
    desc: "Fit-4rce-Xの全機能を使用するには、トグルを右にスライドして3つの権限を許可してください。",
    micLabel: "1. マイク",
    micDesc: "3Dスポーツコーチとのリアルタイム音声対話",
    gpsLabel: "2. GPS位置情報",
    gpsDesc: "ランニングルート追跡、リアルタイムペースと距離",
    camLabel: "3. カメラ & ARセンサー",
    camDesc: "生体力学フォーム分析および画面ミラーリング",
    slideHint: "右にスライドして許可",
    btnAccept: "すべて許可して開始",
    btnLater: "後で設定する",
    accepted: "有効"
  },
  [Language.ZH]: {
    title: "启用三大核心传感器",
    badge: "沉浸式3D智能体验",
    desc: "为体验Fit-4rce-X全部功能，请向右滑动开启3项核心传感器权限。",
    micLabel: "1. 麦克风",
    micDesc: "与3D运动教练进行双向实时语音对话",
    gpsLabel: "2. GPS定位",
    gpsDesc: "户外跑步轨迹、实时配速与距离记录",
    camLabel: "3. 摄像头与AR传感器",
    camDesc: "生物力学姿态实时分析与无线大屏投射",
    slideHint: "向右滑动以接受",
    btnAccept: "全部允许并启动",
    btnLater: "稍后设置",
    accepted: "已开启"
  },
  [Language.RU]: {
    title: "АКТИВАЦИЯ 3 ДАТЧИКОВ",
    badge: "ИММЕРСИВНЫЙ 3D РЕЖИМ",
    desc: "Чтобы разблокировать все возможности Fit-4rce-X, сдвиньте переключатели вправо для активации 3 ключевых датчиков.",
    micLabel: "1. Микрофон",
    micDesc: "Живой голосовой диалог с 3D тренером",
    gpsLabel: "2. GPS-локация",
    gpsDesc: "Запись маршрута пробежки, темпа и дистанции",
    camLabel: "3. Камера и AR датчики",
    camDesc: "Биомеханический анализ движений и проекция на экран",
    slideHint: "Сдвиньте вправо для согласия",
    btnAccept: "ПРИНЯТЬ ВСЕ И НАЧАТЬ",
    btnLater: "Продолжить без датчиков",
    accepted: "АКТИВНО"
  }
};

export const SensorsPermissionModal: React.FC = () => {
  const { language } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  
  // 3 independent slider toggles: Mic, GPS, Camera/AR
  const [micEnabled, setMicEnabled] = useState(true);
  const [gpsEnabled, setGpsEnabled] = useState(true);
  const [camEnabled, setCamEnabled] = useState(true);

  // Swipe track state
  const [slideProgress, setSlideProgress] = useState(0); // 0 to 100
  const isDraggingRef = useRef(false);
  const trackRef = useRef<HTMLDivElement>(null);

  const texts = MODAL_STRINGS[language] || MODAL_STRINGS[Language.FR];

  useEffect(() => {
    // Check if user already dismissed or accepted during this active session
    const isDismissed = sessionStorage.getItem('fit4rce_sensors_dismissed');

    if (isDismissed) {
      return;
    }

    // Delay showing smoothly at start
    const timer = setTimeout(() => {
      setIsOpen(true);
    }, 600);

    return () => clearTimeout(timer);
  }, []);

  // Safe non-blocking permission triggers
  const triggerNativePermissionsSafely = () => {
    // 1. Microphone request in background (safe non-blocking)
    if (micEnabled && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
          stream.getTracks().forEach(t => t.stop());
        })
        .catch(e => console.log('Mic note:', e));
    }

    // 2. Geolocation request in background (safe non-blocking with 1.5s timeout)
    if (gpsEnabled && navigator.geolocation) {
      try {
        navigator.geolocation.getCurrentPosition(
          () => {},
          () => {},
          { timeout: 1500, enableHighAccuracy: true, maximumAge: 60000 }
        );
      } catch (e) {
        console.log('Geo note:', e);
      }
    }

    // 3. Camera / AR preview check in background
    if (camEnabled && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => {
          stream.getTracks().forEach(t => t.stop());
        })
        .catch(e => console.log('Camera note:', e));
    }
  };

  const handleDismiss = () => {
    setIsOpen(false);
    sessionStorage.setItem('fit4rce_sensors_dismissed', 'true');
  };

  const handleAcceptAll = () => {
    // 1. Mark as accepted for this session
    sessionStorage.setItem('fit4rce_sensors_dismissed', 'true');
    try {
      localStorage.removeItem('fit4rce_sensors_consent_v2');
    } catch {}

    // 2. Close modal immediately without ANY lag or freeze
    setIsOpen(false);

    // 3. Trigger native browser permission dialogs safely in background
    setTimeout(() => {
      triggerNativePermissionsSafely();
    }, 100);
  };

  // Drag handlers for the bottom slider
  const handleTouchStart = () => {
    isDraggingRef.current = true;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDraggingRef.current || !trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const touchX = e.touches[0].clientX - rect.left;
    const progress = Math.max(0, Math.min(100, (touchX / rect.width) * 100));
    setSlideProgress(progress);
    if (progress >= 85) {
      isDraggingRef.current = false;
      setSlideProgress(100);
      handleAcceptAll();
    }
  };

  const handleTouchEnd = () => {
    isDraggingRef.current = false;
    if (slideProgress < 85) {
      setSlideProgress(0);
    }
  };

  const handleMouseDown = () => {
    isDraggingRef.current = true;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current || !trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const progress = Math.max(0, Math.min(100, (mouseX / rect.width) * 100));
    setSlideProgress(progress);
    if (progress >= 85) {
      isDraggingRef.current = false;
      setSlideProgress(100);
      handleAcceptAll();
    }
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
    if (slideProgress < 85) {
      setSlideProgress(0);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[10002] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 font-['Poppins'] animate-fadeIn select-none"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      <div className="relative w-full max-w-sm rounded-3xl bg-zinc-950 border border-purple-500/40 p-6 shadow-2xl shadow-purple-950/60 space-y-5 text-center">
        
        {/* Dismiss X button - always works immediately */}
        <button
          type="button"
          onClick={handleDismiss}
          className="absolute top-4 right-4 p-2 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all z-20"
          aria-label="Fermer"
        >
          <X size={16} />
        </button>

        {/* Header with glowing badge */}
        <div className="flex flex-col items-center gap-2 pt-1">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-900 via-indigo-900 to-purple-800 border border-purple-400/50 flex items-center justify-center shadow-[0_0_35px_rgba(168,85,247,0.45)]">
            <ShieldCheck className="w-7 h-7 text-purple-200" />
          </div>
          <span className="text-[9px] font-black uppercase tracking-widest px-3 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 mt-1 flex items-center gap-1">
            <Sparkles size={11} className="text-purple-400" />
            {texts.badge}
          </span>
          <h3 className="text-base font-black text-white uppercase tracking-wider">
            {texts.title}
          </h3>
          <p className="text-xs text-gray-300 leading-relaxed max-w-xs">
            {texts.desc}
          </p>
        </div>

        {/* 3 PERMISSION ITEMS WITH SLIDER TOGGLES ("Faire glisser vers la droite") */}
        <div className="space-y-2.5 text-left bg-black/60 p-3 rounded-2xl border border-white/10 text-xs">
          
          {/* 1. Microphone Toggle */}
          <div className="flex items-center justify-between gap-3 p-2 rounded-xl bg-zinc-900/60 border border-white/5">
            <div className="flex items-start gap-2.5 min-w-0">
              <div className="p-2 rounded-xl bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 shrink-0 mt-0.5">
                <Mic size={14} />
              </div>
              <div className="min-w-0">
                <strong className="text-white text-xs block font-bold truncate">{texts.micLabel}</strong>
                <p className="text-[10px] text-gray-400 leading-tight mt-0.5">{texts.micDesc}</p>
              </div>
            </div>

            {/* Slider Toggle (Slide to right) */}
            <button
              type="button"
              onClick={() => setMicEnabled(prev => !prev)}
              className={`w-12 h-6.5 rounded-full p-0.5 transition-colors duration-300 shrink-0 relative flex items-center ${
                micEnabled 
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 shadow-[0_0_12px_rgba(168,85,247,0.5)]' 
                  : 'bg-zinc-800'
              }`}
              title="Glisser vers la droite pour activer"
            >
              <div 
                className={`w-5.5 h-5.5 rounded-full bg-white shadow-md flex items-center justify-center transform transition-transform duration-300 ${
                  micEnabled ? 'translate-x-5.5 bg-white' : 'translate-x-0 bg-gray-400'
                }`}
              >
                {micEnabled && <Check size={11} className="text-purple-700 stroke-[3]" />}
              </div>
            </button>
          </div>

          {/* 2. GPS Location Toggle */}
          <div className="flex items-center justify-between gap-3 p-2 rounded-xl bg-zinc-900/60 border border-white/5">
            <div className="flex items-start gap-2.5 min-w-0">
              <div className="p-2 rounded-xl bg-purple-950/80 border border-purple-500/40 text-purple-300 shrink-0 mt-0.5">
                <MapPin size={14} />
              </div>
              <div className="min-w-0">
                <strong className="text-white text-xs block font-bold truncate">{texts.gpsLabel}</strong>
                <p className="text-[10px] text-gray-400 leading-tight mt-0.5">{texts.gpsDesc}</p>
              </div>
            </div>

            {/* Slider Toggle (Slide to right) */}
            <button
              type="button"
              onClick={() => setGpsEnabled(prev => !prev)}
              className={`w-12 h-6.5 rounded-full p-0.5 transition-colors duration-300 shrink-0 relative flex items-center ${
                gpsEnabled 
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 shadow-[0_0_12px_rgba(168,85,247,0.5)]' 
                  : 'bg-zinc-800'
              }`}
              title="Glisser vers la droite pour activer"
            >
              <div 
                className={`w-5.5 h-5.5 rounded-full bg-white shadow-md flex items-center justify-center transform transition-transform duration-300 ${
                  gpsEnabled ? 'translate-x-5.5 bg-white' : 'translate-x-0 bg-gray-400'
                }`}
              >
                {gpsEnabled && <Check size={11} className="text-purple-700 stroke-[3]" />}
              </div>
            </button>
          </div>

          {/* 3. Camera & AR Motion Sensors Toggle */}
          <div className="flex items-center justify-between gap-3 p-2 rounded-xl bg-zinc-900/60 border border-white/5">
            <div className="flex items-start gap-2.5 min-w-0">
              <div className="p-2 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 shrink-0 mt-0.5">
                <Camera size={14} />
              </div>
              <div className="min-w-0">
                <strong className="text-white text-xs block font-bold truncate">{texts.camLabel}</strong>
                <p className="text-[10px] text-gray-400 leading-tight mt-0.5">{texts.camDesc}</p>
              </div>
            </div>

            {/* Slider Toggle (Slide to right) */}
            <button
              type="button"
              onClick={() => setCamEnabled(prev => !prev)}
              className={`w-12 h-6.5 rounded-full p-0.5 transition-colors duration-300 shrink-0 relative flex items-center ${
                camEnabled 
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 shadow-[0_0_12px_rgba(168,85,247,0.5)]' 
                  : 'bg-zinc-800'
              }`}
              title="Glisser vers la droite pour activer"
            >
              <div 
                className={`w-5.5 h-5.5 rounded-full bg-white shadow-md flex items-center justify-center transform transition-transform duration-300 ${
                  camEnabled ? 'translate-x-5.5 bg-white' : 'translate-x-0 bg-gray-400'
                }`}
              >
                {camEnabled && <Check size={11} className="text-purple-700 stroke-[3]" />}
              </div>
            </button>
          </div>
        </div>

        {/* SWIPE SLIDER TRACK: "Glisser vers la droite pour accepter" */}
        <div 
          ref={trackRef}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
          onClick={handleAcceptAll}
          className="relative w-full h-13 rounded-2xl bg-zinc-900/90 border border-purple-500/30 overflow-hidden flex items-center justify-center cursor-pointer group shadow-inner"
        >
          {/* Progress fill */}
          <div 
            className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-purple-800 to-indigo-600 opacity-60 transition-all pointer-events-none"
            style={{ width: `${Math.max(slideProgress, 12)}%` }}
          />

          {/* Track label */}
          <span className="relative z-10 text-[10px] font-black uppercase tracking-widest text-gray-300 flex items-center gap-1.5 px-10 pointer-events-none">
            {texts.slideHint}
            <ArrowRight size={13} className="text-purple-400 animate-pulse" />
          </span>

          {/* Draggable knob handle on the left, moves right */}
          <div 
            className="absolute top-1 bottom-1 w-11 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 text-white flex items-center justify-center shadow-lg shadow-purple-900/50 z-20 transition-all pointer-events-none"
            style={{ left: `calc(${slideProgress}% * 0.78 + 4px)` }}
          >
            <ArrowRight size={18} className="stroke-[2.5]" />
          </div>
        </div>

        {/* Direct Action Button + Dismiss */}
        <div className="space-y-2 pt-1">
          <button
            type="button"
            onClick={handleAcceptAll}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 active:scale-95 text-white font-black uppercase text-xs tracking-wider shadow-xl shadow-purple-900/40 transition-all border border-purple-400/30"
          >
            {texts.btnAccept}
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
