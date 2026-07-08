import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, Pause, RotateCcw, Check, CheckSquare, Square, 
  Volume2, Award, Trophy, Dumbbell, Flame, ChevronRight, HelpCircle,
  TrendingUp, Clock, AlertTriangle, ChevronLeft, X
} from 'lucide-react';
import { SprintWorkoutPlan, SprintExercise } from '../../lib/sprintPlans.ts';
import { useApp } from '../../hooks/useApp.ts';
import { Screen } from '../../types.ts';

const SPRINT_TRANSLATIONS: Record<string, Record<string, string>> = {
  en: {
    coach_clipboard: "COACH CLIPBOARD",
    event: "EVENT",
    level: "LEVEL",
    focus: "FOCUS",
    intensity: "INTENSITY",
    chrono_title: "OFFICIAL TRACK STOPWATCH",
    stop: "Stop",
    start: "Start",
    reset: "Reset",
    log_rep: "Log Rep",
    active_rest: "ACTIVE REST COUNTER",
    skip: "SKIP",
    rest_recommendation: "Recommendation: Walk slowly, relax arms and focus on box breathing.",
    no_active_rest: "NO ACTIVE REST TIMERS",
    complete_rep_trigger: "Complete a sprint rep to trigger the recovery countdown.",
    tab_warmup: "1. Warm-up",
    tab_drills: "2. Drills",
    tab_sprints: "3. Sprints Sheet",
    tab_cooldown: "4. Cool Down",
    req_warmup: "REQUIRED DYNAMIC WARM-UP",
    technical_drills: "TECHNICAL STRIDE DRILLS",
    core_sprint_board: "CORE SPRINT BOARD",
    cooldown_recovery: "ATHLETIC COOL-DOWN & RECOVERY",
    select_row: "*Select a row to connect the stopwatch",
    col_drill: "SPRINT DRILL",
    col_intensity: "INTENSITY",
    col_target: "TARGET",
    col_chrono: "CHRONO TIME",
    coaching_focus: "Coaching Focus:",
    rest_label: "REST:",
    manual_btn: "Edit",
    session_progress: "Training Session Progress",
    progress_status: "{completed} of {total} sprint intervals recorded",
    abandon_btn: "Abandon Session",
    workout_complete_btn: "WORKOUT COMPLETE!",
    complete_session_btn: "Complete Session",
    confirm_early_complete: "Do you want to complete the session now even if some sprint reps remain?",
    toast_recovery_completed: "RECOVERY COMPLETED! Line up for the next sprint!",
    toast_time_logged: "Time of {time} logged! Recovery countdown initiated.",
    toast_recovery_skipped: "Recovery skipped. Ready to run!",
    toast_workout_finished: "Congratulations on finishing this athletics session!"
  },
  fr: {
    coach_clipboard: "PLANCHE DE CHRONO",
    event: "ÉPREUVE",
    level: "NIVEAU",
    focus: "OBJECTIF",
    intensity: "INTENSITÉ",
    chrono_title: "CHRONOMÈTRE DE PISTE PRO",
    stop: "Arrêter",
    start: "Démarrer",
    reset: "Zéro",
    log_rep: "Enregistrer",
    active_rest: "RÉCUPÉRATION REPLI ACTIF",
    skip: "PASSER",
    rest_recommendation: "Recommandation : Marchez lentement, relaxez les bras et respirez.",
    no_active_rest: "PAS DE RÉCUPÉRATION EN COURS",
    complete_rep_trigger: "Terminez une série de sprint pour lancer le repos optimisé.",
    tab_warmup: "1. Échauffement",
    tab_drills: "2. Éducatifs",
    tab_sprints: "3. Séance Sprints",
    tab_cooldown: "4. Décrassage",
    req_warmup: "ÉCHAUFFEMENT DYNAMIQUE REQUIS",
    technical_drills: "ÉDUCATIFS TECHNIQUES DE COURSE",
    core_sprint_board: "SÉRIE DES SPRINT ENREGISTRÉS",
    cooldown_recovery: "RÉCUPÉRATION REPLI ACTIF / DÉCRASSAGE",
    select_row: "*Sélectionnez une ligne pour lier le chrono",
    col_drill: "EXERCICE / DISTANCE",
    col_intensity: "INTENSITÉ",
    col_target: "CIBLE",
    col_chrono: "CHRONO RÉEL",
    coaching_focus: "Instruction :",
    rest_label: "RÉCUP :",
    manual_btn: "Manuel",
    session_progress: "Progression de la Session",
    progress_status: "{completed} sprints sur {total} complétés",
    abandon_btn: "Abandonner l'Entraînement",
    workout_complete_btn: "ENTRAÎNEMENT TERMINÉ !",
    complete_session_btn: "Finaliser Session",
    confirm_early_complete: "Voulez-vous terminer la session maintenant même s'il reste des sprints ?",
    toast_recovery_completed: "RÉCUPÉRATION TERMINÉE ! Alignez-vous pour le sprint suivant !",
    toast_time_logged: "Temps de {time} enregistré ! Compte à rebours de récupération démarré.",
    toast_recovery_skipped: "Récupération écourtée. Prêt à courir !",
    toast_workout_finished: "Félicitations pour cet entraînement d'athlétisme !"
  },
  ar: {
    coach_clipboard: "لوحة المدرب",
    event: "الحدث",
    level: "المستوى",
    focus: "التركيز",
    intensity: "الشدة",
    chrono_title: "ساعة توقيت المضمار الرسمية",
    stop: "إيقاف",
    start: "بدء",
    reset: "إعادة ضبط",
    log_rep: "تسجيل الفاصل",
    active_rest: "عداد الراحة النشطة",
    skip: "تخطي",
    rest_recommendation: "توصية: اَمشِ ببطء، وأرخِ ذراعيك وركز على التنفس.",
    no_active_rest: "لا يوجد مؤقت راحة نشط",
    complete_rep_trigger: "أكمل جولة جري لتفعيل العد التنازلي للراحة.",
    tab_warmup: "١. الإحماء",
    tab_drills: "٢. تدريبات الجري",
    tab_sprints: "٣. لوحة السرعة",
    tab_cooldown: "٤. التهدئة",
    req_warmup: "الإحماء الديناميكي المطلوب",
    technical_drills: "تدريبات تقنية الخطوة",
    core_sprint_board: "لوحة قيادة السبرينت الأساسية",
    cooldown_recovery: "التهدئة والاستشفاء الرياضي",
    select_row: "*اختر صفا لربط ساعة التوقيت",
    col_drill: "التمرين / المسافة",
    col_intensity: "الشدة",
    col_target: "الهدف",
    col_chrono: "الوقت الفعلي",
    coaching_focus: "تركيز التدريب:",
    rest_label: "الراحة:",
    manual_btn: "تعديل",
    session_progress: "تقدم الجلسة التدريبية",
    progress_status: "تم تسجيل {completed} من {total} فترات سرعة",
    abandon_btn: "إلغاء التدريب",
    workout_complete_btn: "اكتمل التدريب!",
    complete_session_btn: "إنهاء الجلسة",
    confirm_early_complete: "هل تريد إنهاء الجلسة الآن على الرغم من وجود جولات متبقية؟",
    toast_recovery_completed: "انتهت الاستراحة! استعد للسباق التالي!",
    toast_time_logged: "تم تسجيل زمن {time}! بدأ العد التنازلي للراحة.",
    toast_recovery_skipped: "تم تخطي الراحة. جاهز للجري!",
    toast_workout_finished: "تهانينا على إنهاء هذه الجلسة الرياضية!"
  },
  es: {
    coach_clipboard: "TABLA DE ENTRENADOR",
    event: "PRUEBA",
    level: "NIVEL",
    focus: "ENFOQUE",
    intensity: "INTENSIDAD",
    chrono_title: "CRONÓMETRO DE PISTA OFICIAL",
    stop: "Parar",
    start: "Iniciar",
    reset: "Reiniciar",
    log_rep: "Registrar Rep",
    active_rest: "CONTADOR DE DESCANSO ACTIVO",
    skip: "SALTAR",
    rest_recommendation: "Recomendación: Camine despacio, relaje los brazos y concéntrese en la respiración.",
    no_active_rest: "SIN TIEMPOS DE DESCANSO ACTIVOS",
    complete_rep_trigger: "Complete una repetición de sprint para activar la cuenta regresiva de recuperación.",
    tab_warmup: "1. Calentamiento",
    tab_drills: "2. Ejercicios",
    tab_sprints: "3. Tabla de Sprints",
    tab_cooldown: "4. Enfriamiento",
    req_warmup: "CALENTAMIENTO DINÁMICO REQUERIDO",
    technical_drills: "EJERCICIOS TÉCNICOS DE ZANCADA",
    core_sprint_board: "TABLA PRINCIPAL DE SPRINTS",
    cooldown_recovery: "RECUPERACIÓN Y ENFRIAMIENTO ATLÉTICO",
    select_row: "*Seleccione una fila para conectar el cronómetro",
    col_drill: "EJERCICIO / DISTANCIA",
    col_intensity: "INTENSIDAD",
    col_target: "OBJETIVO",
    col_chrono: "TIEMPO REAL",
    coaching_focus: "Enfoque de entrenamiento:",
    rest_label: "DESCANS:",
    manual_btn: "Editar",
    session_progress: "Progreso de la Sesión",
    progress_status: "{completed} sprints de {total} completados",
    abandon_btn: "Abandonar Entrenamiento",
    workout_complete_btn: "¡ENTRENAMIENTO COMPLETADO!",
    complete_session_btn: "Finalizar Sesión",
    confirm_early_complete: "¿Desea finalizar la sesión ahora aunque queden repeticiones de sprint?",
    toast_recovery_completed: "¡RECUPERACIÓN COMPLETADA! ¡Alinéese para el próximo sprint!",
    toast_time_logged: "¡Tiempo de {time} registrado! Cuenta regresiva de recuperación iniciada.",
    toast_recovery_skipped: "Recuperación omitida. ¡Listo para correr!",
    toast_workout_finished: "¡Felicitaciones por terminar esta sesión de atletismo!"
  },
  pt: {
    coach_clipboard: "PRANCHETA DO TREINADOR",
    event: "PROVA",
    level: "NÍVEL",
    focus: "FOCO",
    intensity: "INTENSIDADE",
    chrono_title: "CRONÔMETRO DE PISTA OFICIAL",
    stop: "Parar",
    start: "Iniciar",
    reset: "Reiniciar",
    log_rep: "Registrar Rep",
    active_rest: "CONTADOR DE DESCANSO ATIVO",
    skip: "PULAR",
    rest_recommendation: "Recomendação: Caminhe devagar, relaxe os braços e foque na respiração.",
    no_active_rest: "SEM CRONÔMETROS DE DESCANSO ATIVOS",
    complete_rep_trigger: "Complete uma repetição de sprint para iniciar a contagem regressiva de recuperação.",
    tab_warmup: "1. Aquecimento",
    tab_drills: "2. Educativos",
    tab_sprints: "3. Treino de Sprints",
    tab_cooldown: "4. Desaquecimento",
    req_warmup: "AQUECIMENTO DINÂMICO REQUERIDO",
    technical_drills: "EDUCATIVOS TÉCNICOS DE PASSADA",
    core_sprint_board: "PRANCHETA PRINCIPAL DE SPRINTS",
    cooldown_recovery: "DESAQUECIMENTO E RECUPERAÇÃO ATLETISMO",
    select_row: "*Selecione uma linha para conectar o cronômetro",
    col_drill: "EXERCÍCIO / DISTÂNCIA",
    col_intensity: "INTENSIDADE",
    col_target: "ALVO",
    col_chrono: "TEMPO REAL",
    coaching_focus: "Foco do Treino:",
    rest_label: "RECUP:",
    manual_btn: "Editar",
    session_progress: "Progresso da Sessão",
    progress_status: "{completed} sprints de {total} completados",
    abandon_btn: "Abandonar Treino",
    workout_complete_btn: "TREINO CONCLUÍDO!",
    complete_session_btn: "Finalizar Sessão",
    confirm_early_complete: "Deseja finalizar a sessão agora mesmo que ainda restem repetições de sprint?",
    toast_recovery_completed: "RECUPERAÇÃO CONCLUÍDA! Alinhe-se para o próximo sprint!",
    toast_time_logged: "Tempo de {time} registrado! Contagem regressiva de recuperação iniciada.",
    toast_recovery_skipped: "Recuperação pulada. Pronto para correr!",
    toast_workout_finished: "Parabéns por finalizar este treino de atletismo!"
  },
  ja: {
    coach_clipboard: "コーチのクリップボード",
    event: "種目",
    level: "レベル",
    focus: "フォーカス",
    intensity: "強度",
    chrono_title: "公式トラックストップウォッチ",
    stop: "ストップ",
    start: "スタート",
    reset: "リセット",
    log_rep: "記録する",
    active_rest: "アクティブリカバリータイマー",
    skip: "スキップ",
    rest_recommendation: "推奨：ゆっくり歩き、腕の力を抜いて呼吸に集中してください。",
    no_active_rest: "アクティブな休憩はありません",
    complete_rep_trigger: "スプリントを完了するとリカバリーカウントダウンが開始します。",
    tab_warmup: "1. ウォームアップ",
    tab_drills: "2. ドリル",
    tab_sprints: "3. スプリント",
    tab_cooldown: "4. クールダウン",
    req_warmup: "必須ダイナミックウォーミングアップ",
    technical_drills: "技術的ストライドドリル",
    core_sprint_board: "コアスプリントボード",
    cooldown_recovery: "クールダウン＆アスレチックリカバリー",
    select_row: "*ストップウォッチと連動する行を選択",
    col_drill: "練習メニュー / 距離",
    col_intensity: "強度",
    col_target: "目標タイム",
    col_chrono: "実測タイム",
    coaching_focus: "コーチのアドバイス:",
    rest_label: "リカバリー:",
    manual_btn: "手動入力",
    session_progress: "セッションの進捗",
    progress_status: "{total}回中 {completed}回のスプリントを記録",
    abandon_btn: "トレーニングを中止",
    workout_complete_btn: "ワークアウト完了！",
    complete_session_btn: "セッションを終了",
    confirm_early_complete: "未完了のスプリントがありますが、今すぐセッションを終了しますか？",
    toast_recovery_completed: "リカバリー完了！次のスプリントの準備をしてください！",
    toast_time_logged: "タイム {time} を記録！リカバリーを開始します。",
    toast_recovery_skipped: "リカバリーをスキップしました。走る準備をしましょう！",
    toast_workout_finished: "陸上セッション完走おめでとうございます！"
  },
  zh: {
    coach_clipboard: "教练剪贴板",
    event: "项目",
    level: "级别",
    focus: "焦点",
    intensity: "强度",
    chrono_title: "官方田径秒表",
    stop: "停止",
    start: "开始",
    reset: "重置",
    log_rep: "记录",
    active_rest: "主动恢复计时器",
    skip: "跳过",
    rest_recommendation: "建议：慢走，放松手臂，专注于腹式呼吸。",
    no_active_rest: "当前无活跃休息",
    complete_rep_trigger: "完成一趟冲刺以触发恢复倒计时。",
    tab_warmup: "1. 热身",
    tab_drills: "2. 技术动作",
    tab_sprints: "3. 冲刺课目",
    tab_cooldown: "4. 放松",
    req_warmup: "必备动态热身",
    technical_drills: "技术跑姿训练",
    core_sprint_board: "核心冲刺记录板",
    cooldown_recovery: "田径整理放松与恢复",
    select_row: "*选择一行以连接秒表",
    col_drill: "课目 / 距离",
    col_intensity: "强度",
    col_target: "目标",
    col_chrono: "实际成绩",
    coaching_focus: "教练要点:",
    rest_label: "休息时间:",
    manual_btn: "手动",
    session_progress: "训练课目进度",
    progress_status: "已记录 {completed} / {total} 趟冲刺",
    abandon_btn: "放弃训练",
    workout_complete_btn: "训练完成！",
    complete_session_btn: "结束训练",
    confirm_early_complete: "即使还有冲刺未完成，也要现在结束训练吗？",
    toast_recovery_completed: "恢复完成！准备下一趟冲刺！",
    toast_time_logged: "已记录成绩 {time}！恢复倒计时开始。",
    toast_recovery_skipped: "已跳过恢复。准备起跑！",
    toast_workout_finished: "恭喜完成本次田径训练课目！"
  },
  ru: {
    coach_clipboard: "КЛИПБОРД ТРЕНЕРА",
    event: "ДИСЦИПЛИНА",
    level: "УРОВЕНЬ",
    focus: "ФОКУС",
    intensity: "ИНТЕНСИВНОСТЬ",
    chrono_title: "ОФИЦИАЛЬНЫЙ СЕКУНДОМЕР",
    stop: "Стоп",
    start: "Старт",
    reset: "Сброс",
    log_rep: "Записать",
    active_rest: "ТАЙМЕР АКТИВНОГО ОТДЫХА",
    skip: "ПРОПУСТИТЬ",
    rest_recommendation: "Рекомендация: Идите медленно, расслабьте руки и дышите ровно.",
    no_active_rest: "НЕТ АКТИВНОГО ОТДЫХА",
    complete_rep_trigger: "Завершите спринт, чтобы запустить обратный отсчет отдыха.",
    tab_warmup: "1. Разминка",
    tab_drills: "2. Спецупражнения",
    tab_sprints: "3. Спринты",
    tab_cooldown: "4. Заминка",
    req_warmup: "ОБЯЗАТЕЛЬНАЯ ДИНАМИЧЕСКАЯ РАЗМИНКА",
    technical_drills: "ТЕХНИЧЕСКИЕ БЕГОВЫЕ УПРАЖНЕНИЯ",
    core_sprint_board: "ОСНОВНАЯ СПРИНТЕРСКАЯ СЕРИЯ",
    cooldown_recovery: "ОТДЫХ И СПОРТИВНАЯ ЗАМИНКА",
    select_row: "*Выберите строку для привязки секундомера",
    col_drill: "УПРАЖНЕНИЕ / ДИСТАНЦИЯ",
    col_intensity: "ИНТЕНСИВНОСТЬ",
    col_target: "ЦЕЛЬ",
    col_chrono: "ВРЕМЯ",
    coaching_focus: "Совет тренера:",
    rest_label: "ОТДЫХ:",
    manual_btn: "Ввод",
    session_progress: "Прогресс тренировки",
    progress_status: "Записано {completed} из {total} спринтов",
    abandon_btn: "Прервать тренировку",
    workout_complete_btn: "ТРЕНИРОВКА ЗАВЕРШЕНА!",
    complete_session_btn: "Завершить сессию",
    confirm_early_complete: "Вы действительно хотите завершить сессию, несмотря на оставшиеся спринты?",
    toast_recovery_completed: "ОТДЫХ ЗАВЕРШЕН! Приготовьтесь к следующему спринту!",
    toast_time_logged: "Время {time} записано! Запущен обратный отсчет отдыха.",
    toast_recovery_skipped: "Отдых пропущен. Готов к старту!",
    toast_workout_finished: "Поздравляем с успешным завершением легкоатлетической тренировки!"
  }
};

interface SprintDashboardProps {
  plan: SprintWorkoutPlan;
  event: string;
  level: string;
  language: string;
  onClose: () => void;
  showStatus: (msg: string) => void;
}

export const SprintDashboard: React.FC<SprintDashboardProps> = ({
  plan,
  event,
  level,
  language,
  onClose,
  showStatus
}) => {
  const { setScreen, logWorkout } = useApp();

  const t = (key: string) => {
    const dict = SPRINT_TRANSLATIONS[language] || SPRINT_TRANSLATIONS['en'];
    return dict[key] || SPRINT_TRANSLATIONS['en'][key] || key;
  };

  // Tab control
  const [activeTab, setActiveTab] = useState<'warmup' | 'drills' | 'main' | 'cooldown'>('main');

  // Interactive Checklist states
  const [completedWarmup, setCompletedWarmup] = useState<Record<number, boolean>>({});
  const [completedDrills, setCompletedDrills] = useState<Record<number, boolean>>({});
  const [completedCooldown, setCompletedCooldown] = useState<Record<number, boolean>>({});

  // Core Sprints logging states
  const [reps, setReps] = useState<SprintExercise[]>(() => {
    // Make sure we have flat list of exercises to track individually
    return (plan?.mainExercises || []).map(ex => ({ ...ex }));
  });
  
  const [selectedRepId, setSelectedRepId] = useState<string>(() => {
    return plan?.mainExercises?.[0]?.id || '';
  });

  const [repLogs, setRepLogs] = useState<Record<string, string>>({});
  const [editingRepId, setEditingRepId] = useState<string | null>(null);
  const [manualTimeVal, setManualTimeVal] = useState<string>('');

  // Precision Centisecond Stopwatch states
  const [stopwatchTime, setStopwatchTime] = useState(0); // in milliseconds
  const [isStopwatchRunning, setIsStopwatchRunning] = useState(false);
  const stopwatchIntervalRef = useRef<number | null>(null);
  const stopwatchStartTimeRef = useRef<number>(0);
  const stopwatchElapsedRef = useRef<number>(0);

  // Recovery Timer states
  const [recoveryTimer, setRecoveryTimer] = useState<number>(0); // in seconds
  const [recoveryTotal, setRecoveryTotal] = useState<number>(180);
  const [isRecoveryActive, setIsRecoveryActive] = useState(false);

  const [isTimerPanelCollapsed, setIsTimerPanelCollapsed] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [showEarlyCompleteConfirm, setShowEarlyCompleteConfirm] = useState(false);

  // Load session state from localStorage
  useEffect(() => {
    try {
      const key = `sprint_session_${event}_${level}`;
      const saved = localStorage.getItem(key);
      if (saved) {
        const data = JSON.parse(saved);
        if (data.completedWarmup) setCompletedWarmup(data.completedWarmup);
        if (data.completedDrills) setCompletedDrills(data.completedDrills);
        if (data.completedCooldown) setCompletedCooldown(data.completedCooldown);
        if (data.repLogs) setRepLogs(data.repLogs);
        if (data.selectedRepId) setSelectedRepId(data.selectedRepId);
        if (data.stopwatchTime !== undefined) {
          setStopwatchTime(data.stopwatchTime);
          stopwatchElapsedRef.current = data.stopwatchTime;
        }
        if (data.recoveryTimer !== undefined) setRecoveryTimer(data.recoveryTimer);
        if (data.isRecoveryActive !== undefined) setIsRecoveryActive(data.isRecoveryActive);
        if (data.recoveryTotal !== undefined) setRecoveryTotal(data.recoveryTotal);
        if (data.activeTab) setActiveTab(data.activeTab);
        if (data.isTimerPanelCollapsed !== undefined) setIsTimerPanelCollapsed(data.isTimerPanelCollapsed);
      }
    } catch (e) {
      console.warn("Could not load sprint session from localStorage", e);
    }
  }, [event, level]);

  // Save session state to localStorage
  useEffect(() => {
    try {
      const key = `sprint_session_${event}_${level}`;
      const data = {
        completedWarmup,
        completedDrills,
        completedCooldown,
        repLogs,
        selectedRepId,
        stopwatchTime,
        recoveryTimer,
        isRecoveryActive,
        recoveryTotal,
        activeTab,
        isTimerPanelCollapsed
      };
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.warn("Could not save sprint session to localStorage", e);
    }
  }, [
    event,
    level,
    completedWarmup,
    completedDrills,
    completedCooldown,
    repLogs,
    selectedRepId,
    stopwatchTime,
    recoveryTimer,
    isRecoveryActive,
    recoveryTotal,
    activeTab,
    isTimerPanelCollapsed
  ]);

  // Sound and Haptic helpers
  const playWhistle = () => {
    try {
      // Create a clean synthetic athletic whistle sound using Web Audio API
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      // Whistle multi-frequency modulation
      osc.frequency.setValueAtTime(2200, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(2400, ctx.currentTime + 0.1);
      osc.frequency.exponentialRampToValueAtTime(1800, ctx.currentTime + 0.4);
      
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
      
      // Haptic vibrate
      if ('vibrate' in navigator) {
        navigator.vibrate([100, 50, 100]);
      }
    } catch (e) {
      console.warn("Audio Whistle error", e);
    }
  };

  const playClickSound = (freq = 800, dur = 0.05) => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + dur);
    } catch {}
  };

  // Centisecond stopwatch effect (High precision performance.now() tick)
  useEffect(() => {
    if (isStopwatchRunning) {
      stopwatchStartTimeRef.current = performance.now() - stopwatchElapsedRef.current;
      
      const tick = () => {
        stopwatchElapsedRef.current = performance.now() - stopwatchStartTimeRef.current;
        setStopwatchTime(stopwatchElapsedRef.current);
        stopwatchIntervalRef.current = requestAnimationFrame(tick);
      };
      stopwatchIntervalRef.current = requestAnimationFrame(tick);
    } else {
      if (stopwatchIntervalRef.current) {
        cancelAnimationFrame(stopwatchIntervalRef.current);
      }
    }

    return () => {
      if (stopwatchIntervalRef.current) {
        cancelAnimationFrame(stopwatchIntervalRef.current);
      }
    };
  }, [isStopwatchRunning]);

  // Recovery countdown timer effect
  useEffect(() => {
    let interval: number;
    if (isRecoveryActive && recoveryTimer > 0) {
      interval = window.setInterval(() => {
        setRecoveryTimer(tVal => {
          if (tVal <= 1) {
            setIsRecoveryActive(false);
            playWhistle();
            showStatus(t('toast_recovery_completed'));
            return 0;
          }
          return tVal - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecoveryActive, recoveryTimer]);

  // Format stopwatch time to minutes : seconds . centiseconds
  const formatStopwatch = (ms: number) => {
    const totalSecs = Math.floor(ms / 1000);
    const m = Math.floor(totalSecs / 60);
    const s = totalSecs % 60;
    const cents = Math.floor((ms % 1000) / 10);
    
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(cents).padStart(2, '0')}`;
  };

  // Format recovery seconds to minutes : seconds
  const formatRecovery = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // Stopwatch actions
  const handleStartStopwatch = () => {
    playClickSound(1000, 0.08);
    setIsStopwatchRunning(!isStopwatchRunning);
  };

  const handleResetStopwatch = () => {
    playClickSound(500, 0.1);
    setIsStopwatchRunning(false);
    stopwatchElapsedRef.current = 0;
    setStopwatchTime(0);
  };

  // Mark the selected rep as complete and log the stopwatch split
  const handleLogActiveRep = (repId: string, durationMs?: number, fallbackTime?: string) => {
    let finalLoggedTime = "";
    
    if (durationMs !== undefined) {
      // Use current stopwatch reading
      const totalSecs = durationMs / 1000;
      finalLoggedTime = totalSecs.toFixed(2) + "s";
      // Pause stopwatch
      setIsStopwatchRunning(false);
    } else if (fallbackTime !== undefined) {
      // Use direct quick check-off / tick value
      finalLoggedTime = fallbackTime;
    } else {
      // Manual trigger from textbox
      finalLoggedTime = manualTimeVal.trim();
      if (!finalLoggedTime) return;
      if (!finalLoggedTime.toLowerCase().endsWith('s')) {
        finalLoggedTime += 's';
      }
      setEditingRepId(null);
      setManualTimeVal('');
    }

    setRepLogs(prev => ({
      ...prev,
      [repId]: finalLoggedTime
    }));

    // Trigger standard athletic whistle for completion
    playWhistle();

    // Auto launch the appropriate recovery countdown for this exercise!
    const matchingEx = reps.find(r => r.id === repId);
    let recoverySecs = 180; // default 3 minutes

    if (matchingEx) {
      const recStr = language === 'fr' ? (matchingEx.recoveryFr || '') : (matchingEx.recoveryEn || '');
      // Try to parse number of minutes from recovery string (e.g., "3 min" or "5 to 6 minutes")
      const matches = recStr.match(/(\d+)\s*(min|minute)/i);
      if (matches && matches[1]) {
        recoverySecs = parseInt(matches[1], 10) * 60;
      } else if (matchingEx.isHillWork) {
        recoverySecs = 90; // hill recoveries are usually 90s walk-downs
      }
    }

    setRecoveryTotal(recoverySecs);
    setRecoveryTimer(recoverySecs);
    setIsRecoveryActive(true);

    showStatus(
      t('toast_time_logged').replace('{time}', finalLoggedTime)
    );

    // Auto-advance to the next incomplete rep
    const currentIndex = reps.findIndex(r => r.id === repId);
    if (currentIndex !== -1 && currentIndex < reps.length - 1) {
      const nextId = reps[currentIndex + 1].id;
      setSelectedRepId(nextId);
    }
  };

  // Quick manual logging open
  const startManualEdit = (repId: string) => {
    setEditingRepId(repId);
    setManualTimeVal(repLogs[repId] ? repLogs[repId].replace('s', '') : '');
  };

  const skipRecovery = () => {
    playClickSound(600, 0.05);
    setIsRecoveryActive(false);
    setRecoveryTimer(0);
    showStatus(t('toast_recovery_skipped'));
  };

  const handleCompleteWorkout = () => {
    // 1. Format the logged info
    const numLogged = Object.keys(repLogs).length;
    const totalReps = reps.length;
    const workoutTitle = language === 'fr' 
      ? `Séance Athlé Sprint (${event})` 
      : `Athletics Sprint Session (${event})`;
    
    const workoutDesc = language === 'fr'
      ? `Sprints complétés : ${numLogged}/${totalReps} répétitions avec récupération de repli actif (Niveau: ${level.toUpperCase()}).`
      : `Sprints completed: ${numLogged}/${totalReps} reps with active recovery guidelines (Level: ${level.toUpperCase()}).`;

    // Formulate exercises structure for App history logging
    const exercisesForHistory = reps.map(r => ({
      name: language === 'fr' ? r.nameFr : r.nameEn,
      description: `${language === 'fr' ? r.notesFr : r.notesEn} - Chrono: ${repLogs[r.id] || "Non complété / Not completed"}`,
      muscleGroups: ['Quadriceps', 'Hamstrings', 'Calves', 'Core'],
      modelUrl: '',
      difficulty: level as any
    }));

    // 2. Log workout to App history state (the user's profile history!)
    logWorkout({
      title: workoutTitle,
      description: workoutDesc,
      exercises: exercisesForHistory
    });

    // 3. Play whistle & notify user
    playWhistle();
    showStatus(language === 'fr' ? "Séance enregistrée sur votre profil !" : "Session logged to your profile!");
    
    // 3b. Clear session state from localStorage
    try {
      localStorage.removeItem(`sprint_session_${event}_${level}`);
    } catch (err) {
      console.warn("Could not clear sprint session storage", err);
    }

    // 4. Close
    onClose();
  };

  const activeRepIndex = reps.findIndex(r => r.id === selectedRepId);
  const activeRep = activeRepIndex !== -1 ? reps[activeRepIndex] : null;
  const nextRep = activeRepIndex !== -1 && activeRepIndex + 1 < reps.length ? reps[activeRepIndex + 1] : null;

  return (
    <div className="flex-1 flex flex-col h-full bg-neutral-950 font-['Poppins'] overflow-y-auto max-h-screen">
      
      {/* PROFESSIONAL CLIPBOARD TOP FLAP */}
      <div className="flex-none pt-2 pb-1 bg-neutral-900 border-b border-neutral-800">
        <div className="w-40 h-8 bg-gradient-to-b from-neutral-700 via-neutral-800 to-neutral-900 rounded-b-xl mx-auto border-x border-b border-neutral-600 shadow-lg flex items-center justify-center relative">
          <div className="absolute top-1 left-3 w-2 h-2 rounded-full bg-neutral-950 border border-neutral-500 shadow-inner"></div>
          <div className="absolute top-1 right-3 w-2 h-2 rounded-full bg-neutral-950 border border-neutral-500 shadow-inner"></div>
          <span className="text-[9px] font-black tracking-[0.25em] text-neutral-400 uppercase">{t('coach_clipboard')}</span>
        </div>
      </div>

      {/* HEADER NAVIGATION/EXIT BAR */}
      <div className="flex-none bg-neutral-900 px-5 py-3.5 flex items-center justify-between border-b border-neutral-850">
        <button 
          onClick={onClose} 
          className="flex items-center text-gray-400 hover:text-white font-bold uppercase text-[10px] tracking-widest transition-colors"
        >
          <ChevronLeft className="w-4 h-4 mr-1.5" />
          {language === 'fr' ? 'Configuration' : 'Configure'}
        </button>
        <button 
          onClick={() => {
            playClickSound(800, 0.05);
            setShowExitConfirm(true);
          }} 
          className="flex items-center text-red-500 hover:text-red-400 font-bold uppercase text-[10px] tracking-widest transition-colors bg-red-950/10 border border-red-900/20 px-3 py-1.5 rounded-lg"
        >
          <X className="w-4 h-4 mr-1.5" />
          {language === 'fr' ? 'Quitter' : 'Exit'}
        </button>
      </div>

      {/* METRICS HUD HEADER */}
      <div className="flex-none p-4 bg-neutral-950 border-b border-neutral-900 grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-neutral-900/40 p-3 rounded-2xl border border-neutral-900 flex items-center gap-3">
          <div className="p-2 bg-purple-950/40 rounded-xl text-purple-400">
            <Trophy size={16} />
          </div>
          <div>
            <p className="text-[8px] text-neutral-500 font-bold uppercase tracking-wider">{t('event')}</p>
            <p className="text-sm font-black text-white font-mono tracking-wider">{event}</p>
          </div>
        </div>

        <div className="bg-neutral-900/40 p-3 rounded-2xl border border-neutral-900 flex items-center gap-3">
          <div className="p-2 bg-amber-950/40 rounded-xl text-amber-500">
            <Award size={16} />
          </div>
          <div>
            <p className="text-[8px] text-neutral-500 font-bold uppercase tracking-wider">{t('level')}</p>
            <p className="text-sm font-black text-amber-400 font-mono tracking-wider uppercase">{level}</p>
          </div>
        </div>

        <div className="bg-neutral-900/40 p-3 rounded-2xl border border-neutral-900 flex items-center gap-3 col-span-1">
          <div className="p-2 bg-emerald-950/40 rounded-xl text-emerald-400">
            <Dumbbell size={16} />
          </div>
          <div>
            <p className="text-[8px] text-neutral-500 font-bold uppercase tracking-wider">{t('focus')}</p>
            <p className="text-xs font-black text-white truncate max-w-[100px] uppercase">
              {plan?.titleFr && language === 'fr' ? plan.titleFr.split(' ')[0] : (plan?.titleEn || plan?.titleFr || "Sprint").split(' ')[0]}
            </p>
          </div>
        </div>

        <div className="bg-neutral-900/40 p-3 rounded-2xl border border-neutral-900 flex items-center gap-3 col-span-1">
          <div className="p-2 bg-red-950/40 rounded-xl text-red-400 animate-pulse">
            <Flame size={16} />
          </div>
          <div>
            <p className="text-[8px] text-neutral-500 font-bold uppercase tracking-wider">{t('intensity')}</p>
            <p className="text-xs font-black text-red-500 font-mono tracking-wider">85% - 100%</p>
          </div>
        </div>
      </div>

      {/* TIMERS PANEL HEADER CONTROL & MINI INLINE READOUT */}
      <div className="flex-none bg-neutral-900/80 px-4 py-2 flex items-center justify-between border-b border-neutral-850">
        <div className="flex items-center gap-2">
          <Clock size={13} className="text-purple-400 animate-pulse" />
          <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">
            {language === 'fr' ? 'Chronomètre & Étape Active' : 'Stopwatch & Active Step'}
          </span>
          {isTimerPanelCollapsed && (
            <span className="ml-2 font-mono text-[10px] bg-purple-950/40 text-purple-400 px-2 py-0.5 border border-purple-900/30 rounded font-black shadow-inner">
              ⏱️ {formatStopwatch(stopwatchTime)}
            </span>
          )}
        </div>
        <button 
          onClick={() => {
            playClickSound(800, 0.02);
            setIsTimerPanelCollapsed(!isTimerPanelCollapsed);
          }}
          className="text-purple-400 hover:text-white text-[9px] font-black uppercase tracking-widest bg-purple-950/20 px-2.5 py-1 rounded-lg border border-purple-900/30 transition-all active:scale-95 flex items-center gap-1 shadow-sm"
        >
          {isTimerPanelCollapsed ? (
            <>
              {language === 'fr' ? 'AFFICHER ▲' : 'EXPAND ▲'}
            </>
          ) : (
            <>
              {language === 'fr' ? 'MASQUER ▼' : 'COLLAPSE ▼'}
            </>
          )}
        </button>
      </div>

      {/* TRACK CHRONOMETER SCREEN & RECOVERY OVERLAY */}
      {!isTimerPanelCollapsed && (
        <div className="flex-none p-5 bg-black border-b border-neutral-900 relative overflow-hidden flex flex-col lg:flex-row gap-5 items-stretch justify-between animate-fadeIn">
          
          {/* Dynamic Track Graphic Lane Background */}
          <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-red-600 via-amber-500 to-emerald-500 opacity-20"></div>

          {/* Stopwatch Readout Container */}
          <div className="flex flex-col items-center lg:items-start justify-center z-10 p-2 min-w-[200px]">
            <div className="flex items-center gap-2 mb-1">
              <Clock size={12} className="text-neutral-500 animate-pulse" />
              <span className="text-[9px] font-black text-neutral-500 uppercase tracking-[0.2em] font-mono">
                {t('chrono_title')}
              </span>
            </div>
            <div className="text-5xl md:text-6xl font-black text-white font-mono tracking-tighter tabular-nums drop-shadow-[0_0_15px_rgba(255,255,255,0.1)] select-none">
              {formatStopwatch(stopwatchTime)}
            </div>
            <div className="flex gap-2 mt-3">
              <button 
                onClick={handleStartStopwatch}
                className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 active:scale-95 ${isStopwatchRunning ? 'bg-red-600 text-white shadow-[0_0_15px_rgba(220,38,38,0.4)]' : 'bg-emerald-500 text-neutral-950 shadow-[0_0_15px_rgba(16,185,129,0.4)]'}`}
              >
                {isStopwatchRunning ? <Pause size={12} fill="white" /> : <Play size={12} fill="black" />}
                {isStopwatchRunning ? t('stop') : t('start')}
              </button>
              <button 
                onClick={handleResetStopwatch}
                className="px-4 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-[10px] font-black uppercase tracking-wider text-neutral-400 hover:text-white transition-all flex items-center gap-1 active:scale-95"
              >
                <RotateCcw size={12} />
                {t('reset')}
              </button>
              {stopwatchTime > 0 && selectedRepId && (
                <button 
                  onClick={() => handleLogActiveRep(selectedRepId, stopwatchTime)}
                  className="px-4 py-2 bg-amber-500 text-neutral-950 rounded-xl text-[10px] font-black uppercase tracking-wider shadow-[0_0_15px_rgba(245,158,11,0.3)] transition-all flex items-center gap-1.5 active:scale-95 animate-fadeIn"
                >
                  <Check size={12} strokeWidth={3} />
                  {t('log_rep')}
                </button>
              )}
            </div>
          </div>

          {/* Dynamic Road Book Active Step HUD */}
          {activeRep && (
            <div className="flex-1 w-full p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800/80 text-left relative z-10 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1.5 gap-2">
                  <span className="text-[8px] font-black uppercase text-purple-400 tracking-[0.2em] flex items-center gap-1 whitespace-nowrap">
                    <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-pulse shadow-[0_0_8px_#a855f7]"></span>
                    {language === 'fr' ? 'FEUILLE DE ROUTE ACTIVE' : 'ACTIVE ROADMAP STEP'}
                  </span>
                  
                  {/* PREVIOUS / NEXT BROWSING BUTTONS */}
                  <div className="flex items-center gap-1 flex-none">
                    <button 
                      disabled={activeRepIndex === 0}
                      onClick={(e) => {
                        e.stopPropagation();
                        playClickSound(800, 0.03);
                        setSelectedRepId(reps[activeRepIndex - 1].id);
                      }}
                      className="p-1 rounded bg-neutral-950 border border-neutral-800 text-neutral-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors"
                      title={language === 'fr' ? 'Précédent' : 'Previous'}
                    >
                      <ChevronLeft size={10} strokeWidth={3} />
                    </button>
                    <span className="text-[8px] font-black font-mono text-neutral-300 bg-neutral-950 px-1.5 py-0.5 rounded border border-neutral-800">
                      {activeRepIndex + 1} / {reps.length}
                    </span>
                    <button 
                      disabled={activeRepIndex === reps.length - 1}
                      onClick={(e) => {
                        e.stopPropagation();
                        playClickSound(800, 0.03);
                        setSelectedRepId(reps[activeRepIndex + 1].id);
                      }}
                      className="p-1 rounded bg-neutral-950 border border-neutral-800 text-neutral-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors"
                      title={language === 'fr' ? 'Suivant' : 'Next'}
                    >
                      <ChevronRight size={10} strokeWidth={3} />
                    </button>
                  </div>
                </div>
                
                <h4 className="text-xs font-black text-white uppercase tracking-wider leading-tight">
                  {language === 'fr' ? activeRep.nameFr : activeRep.nameEn}
                </h4>
                
                <p className="text-[9px] text-neutral-400 mt-1.5 leading-relaxed bg-neutral-950/40 p-2 rounded-xl border border-neutral-900">
                  <span className="text-[8px] font-bold uppercase text-neutral-500 tracking-wider block mb-0.5">Focus technique / Coaching :</span>
                  {language === 'fr' ? activeRep.notesFr : activeRep.notesEn}
                </p>
              </div>

              <div className="mt-2.5 pt-2 border-t border-neutral-900/80 flex items-center justify-between gap-4">
                <div className="flex flex-col">
                  <div className="flex gap-2 text-[9px] text-neutral-500 font-bold uppercase">
                    <span>CIBLE : <span className="font-mono text-amber-500 font-black">{language === 'fr' ? activeRep.targetTimeFr : activeRep.targetTimeEn}</span></span>
                    <span>RÉCUP : <span className="font-mono text-purple-400 font-black">{language === 'fr' ? activeRep.recoveryFr : activeRep.recoveryEn}</span></span>
                  </div>
                  {repLogs[activeRep.id] && (
                    <span className="text-[8px] text-emerald-400 font-black uppercase mt-1.5 font-mono">
                      ✓ {language === 'fr' ? 'COMPLÉTÉ : ' : 'LOGGED: '} {repLogs[activeRep.id]}
                    </span>
                  )}
                </div>
                
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    playClickSound(800, 0.05);
                    const target = language === 'fr' ? activeRep.targetTimeFr : activeRep.targetTimeEn;
                    if (repLogs[activeRep.id]) {
                      setRepLogs(prev => {
                        const next = { ...prev };
                        delete next[activeRep.id];
                        return next;
                      });
                      showStatus(language === 'fr' ? "Sprint réinitialisé" : "Sprint reset");
                    } else {
                      handleLogActiveRep(activeRep.id, undefined, target);
                    }
                  }}
                  className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center gap-1 transition-all ${repLogs[activeRep.id] ? 'bg-emerald-500 text-black shadow-[0_0_10px_rgba(16,185,129,0.3)]' : 'bg-purple-600 text-white hover:bg-purple-500 shadow-md'}`}
                >
                  <Check size={11} strokeWidth={4} />
                  {repLogs[activeRep.id] ? (language === 'fr' ? 'Annuler' : 'Reset') : (language === 'fr' ? 'Valider' : 'Confirm')}
                </button>
              </div>
            </div>
          )}

          {/* Dynamic Recovery Timer Board */}
          <div className={`w-full lg:w-80 p-4 rounded-2xl border transition-all duration-500 z-10 flex flex-col justify-center relative overflow-hidden ${isRecoveryActive ? 'bg-red-950/20 border-red-800/60 shadow-[0_0_30px_rgba(239,68,68,0.1)]' : 'bg-neutral-900/30 border-neutral-800/40'}`}>
            {isRecoveryActive ? (
              <div className="space-y-2 animate-fadeIn">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-1.5">
                    <Volume2 size={14} className="text-red-500 animate-bounce" />
                    <span className="text-[9px] font-bold text-red-500 uppercase tracking-wider">
                      {t('active_rest')}
                    </span>
                  </div>
                  <button onClick={skipRecovery} className="text-[9px] font-black text-neutral-400 hover:text-white uppercase tracking-widest border border-neutral-800 px-2 py-0.5 rounded bg-black/40">
                    {t('skip')}
                  </button>
                </div>
                <div className="text-3xl font-black text-red-500 font-mono tracking-tight text-center lg:text-left">
                  {formatRecovery(recoveryTimer)}
                </div>
                {/* Rest Progress Bar */}
                <div className="w-full bg-neutral-900 rounded-full h-1.5 overflow-hidden border border-neutral-800">
                  <div 
                    className="bg-red-500 h-1.5 transition-all duration-1000 rounded-full" 
                    style={{ width: `${(recoveryTimer / recoveryTotal) * 100}%` }}
                  ></div>
                </div>
                <p className="text-[8px] text-neutral-500 font-semibold italic text-center lg:text-left">
                  {t('rest_recommendation')}
                </p>
              </div>
            ) : (
              <div className="text-center py-4 text-neutral-600 flex flex-col items-center justify-center space-y-1">
                <span className="text-[10px] font-black uppercase tracking-widest">
                  {t('no_active_rest')}
                </span>
                <p className="text-[9px] text-neutral-500 max-w-[200px]">
                  {t('complete_rep_trigger')}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ROADMAP ROAD BOOK - WORKOUT LIST SECTIONS */}
      <div className="flex-none flex flex-col">
        
        {/* TAB SWITCHER */}
        <div className="flex-none bg-neutral-900/60 p-1 flex border-b border-neutral-900 overflow-x-auto">
          {[
            { id: 'warmup', label: t('tab_warmup'), count: (language === 'fr' ? plan?.warmupFr : plan?.warmupEn)?.length || plan?.warmupFr?.length || plan?.warmupEn?.length || 0 },
            { id: 'drills', label: t('tab_drills'), count: (language === 'fr' ? plan?.drillsFr : plan?.drillsEn)?.length || plan?.drillsFr?.length || plan?.drillsEn?.length || 0 },
            { id: 'main', label: t('tab_sprints'), count: reps?.length || 0 },
            { id: 'cooldown', label: t('tab_cooldown'), count: (language === 'fr' ? plan?.cooldownFr : plan?.cooldownEn)?.length || plan?.cooldownFr?.length || plan?.cooldownEn?.length || 0 }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                playClickSound(900, 0.03);
                setActiveTab(tab.id as any);
              }}
              className={`flex-1 min-w-[100px] text-center py-3 px-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${activeTab === tab.id ? 'bg-purple-900/20 border border-purple-500/50 text-white shadow-md' : 'text-neutral-500 hover:text-neutral-300'}`}
            >
              {tab.label}
              <span className={`px-1.5 py-0.2 rounded-full text-[8px] font-mono ${activeTab === tab.id ? 'bg-purple-500 text-neutral-950 font-black' : 'bg-neutral-800 text-neutral-600'}`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* WORKOUT TAB CONTENTS */}
        <div className="p-5 bg-neutral-950/40">
          
          {/* TAB 1: WARMUP */}
          {activeTab === 'warmup' && (
            <div className="space-y-4 animate-fadeIn max-w-xl mx-auto">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-1.5 h-3 bg-purple-500 rounded-sm"></span>
                <h3 className="text-[11px] font-black uppercase tracking-widest text-neutral-400">
                  {t('req_warmup')}
                </h3>
              </div>
              <div className="space-y-2.5">
                {((language === 'fr' ? plan?.warmupFr : plan?.warmupEn) || plan?.warmupFr || plan?.warmupEn || []).map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      playClickSound(750, 0.04);
                      setCompletedWarmup(prev => ({ ...prev, [idx]: !prev[idx] }));
                    }}
                    className={`w-full text-left p-4 rounded-2xl border transition-all flex items-start gap-3 active:scale-[0.99] ${completedWarmup[idx] ? 'bg-neutral-900/40 border-neutral-900/50 text-neutral-500 line-through' : 'bg-neutral-900/80 border-neutral-800/80 hover:border-neutral-700 text-white'}`}
                  >
                    <div className={`mt-0.5 w-4 h-4 rounded-md border flex items-center justify-center transition-all flex-none ${completedWarmup[idx] ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400' : 'border-neutral-700 bg-neutral-950 text-transparent'}`}>
                      <Check size={10} strokeWidth={4} />
                    </div>
                    <span className="text-xs font-semibold leading-relaxed">{item}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: DRILLS */}
          {activeTab === 'drills' && (
            <div className="space-y-4 animate-fadeIn max-w-xl mx-auto">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-1.5 h-3 bg-purple-500 rounded-sm"></span>
                <h3 className="text-[11px] font-black uppercase tracking-widest text-neutral-400">
                  {t('technical_drills')}
                </h3>
              </div>
              <div className="space-y-2.5">
                {((language === 'fr' ? plan?.drillsFr : plan?.drillsEn) || plan?.drillsFr || plan?.drillsEn || []).map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      playClickSound(750, 0.04);
                      setCompletedDrills(prev => ({ ...prev, [idx]: !prev[idx] }));
                    }}
                    className={`w-full text-left p-4 rounded-2xl border transition-all flex items-start gap-3 active:scale-[0.99] ${completedDrills[idx] ? 'bg-neutral-900/40 border-neutral-900/50 text-neutral-500 line-through' : 'bg-neutral-900/80 border-neutral-800/80 hover:border-neutral-700 text-white'}`}
                  >
                    <div className={`mt-0.5 w-4 h-4 rounded-md border flex items-center justify-center transition-all flex-none ${completedDrills[idx] ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400' : 'border-neutral-700 bg-neutral-950 text-transparent'}`}>
                      <Check size={10} strokeWidth={4} />
                    </div>
                    <span className="text-xs font-semibold leading-relaxed">{item}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: SPRINT SHEET / COACH TABLE (MAIN INTENT) */}
          {activeTab === 'main' && (
            <div className="space-y-6 animate-fadeIn max-w-3xl mx-auto">
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-3 bg-amber-500 rounded-sm"></span>
                  <h3 className="text-[11px] font-black uppercase tracking-widest text-neutral-400">
                    {t('core_sprint_board')}
                  </h3>
                </div>
                <span className="text-[9px] font-bold text-neutral-500 uppercase tracking-wider font-mono">
                  {t('select_row')}
                </span>
              </div>

              {/* SPRINT RECORD TABLE */}
              <div className="border border-neutral-900 rounded-2xl overflow-hidden bg-neutral-950">
                
                {/* TABLE HEADER */}
                <div className="grid grid-cols-12 gap-1 p-3 bg-neutral-900 text-[8px] font-black uppercase tracking-wider text-neutral-500 border-b border-neutral-800">
                  <div className="col-span-1 text-center font-mono">#</div>
                  <div className="col-span-4 md:col-span-5">{t('col_drill')}</div>
                  <div className="col-span-2 text-center">{t('col_intensity')}</div>
                  <div className="col-span-2 text-center text-amber-500">{t('col_target')}</div>
                  <div className="col-span-3 text-center text-emerald-400 font-mono">{t('col_chrono')}</div>
                </div>

                {/* TABLE BODY ROWS */}
                <div className="divide-y divide-neutral-900">
                  {reps.map((rep, idx) => {
                    const isSelected = selectedRepId === rep.id;
                    const loggedTime = repLogs[rep.id];
                    const repTitle = language === 'fr' ? rep.nameFr : rep.nameEn;
                    const intensity = language === 'fr' ? rep.intensityFr : rep.intensityEn;
                    const target = language === 'fr' ? rep.targetTimeFr : rep.targetTimeEn;
                    const recovery = language === 'fr' ? rep.recoveryFr : rep.recoveryEn;
                    const notes = language === 'fr' ? rep.notesFr : rep.notesEn;

                    return (
                      <div 
                        key={rep.id}
                        onClick={() => {
                          playClickSound(800, 0.02);
                          setSelectedRepId(rep.id);
                        }}
                        className={`group transition-all duration-300 cursor-pointer ${isSelected ? 'bg-purple-950/15 border-l-2 border-purple-500' : 'hover:bg-neutral-900/30'}`}
                      >
                        {/* Core Data Row */}
                        <div className="grid grid-cols-12 gap-1 items-center p-3 text-xs">
                          {/* Checked/Vink status checkbox */}
                          <div 
                            className="col-span-1 text-center flex justify-center items-center"
                            onClick={(e) => {
                              e.stopPropagation();
                              playClickSound(800, 0.05);
                              if (loggedTime) {
                                // Toggle back to unlogged
                                setRepLogs(prev => {
                                  const next = { ...prev };
                                  delete next[rep.id];
                                  return next;
                                });
                                showStatus(language === 'fr' ? "Sprint réinitialisé" : "Sprint reset");
                              } else {
                                // Fast check-off (vink/tick) using the target time!
                                handleLogActiveRep(rep.id, undefined, target); 
                              }
                            }}
                          >
                            <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all cursor-pointer ${loggedTime ? 'bg-emerald-500 border-emerald-400 text-black shadow-[0_0_10px_rgba(16,185,129,0.3)]' : 'border-neutral-700 hover:border-purple-500 bg-neutral-950/80 text-transparent'}`}>
                              <Check size={11} strokeWidth={4} />
                            </div>
                          </div>

                          {/* Exercise name and details */}
                          <div className="col-span-4 md:col-span-5 pr-2">
                            <span className="font-bold text-white block truncate">{repTitle}</span>
                            <span className="text-[10px] text-neutral-400 font-semibold flex items-center gap-1">
                              {rep.distance && <span className="bg-neutral-900 px-1.5 py-0.2 rounded font-mono font-black text-[9px] border border-neutral-800 text-purple-400">{rep.distance}</span>}
                              {rep.isHillWork && <span className="bg-orange-950/20 text-orange-400 border border-orange-900/40 px-1 py-0.2 rounded text-[8px] uppercase font-bold tracking-widest">▲ CÔTE / HILL</span>}
                            </span>
                          </div>

                          {/* Target intensity percentage */}
                          <div className="col-span-2 text-center font-mono font-black text-neutral-400 text-[10px]">
                            {intensity?.replace(" d'effort max", "").replace(" Target Intensity", "").replace(" Effort", "")}
                          </div>

                          {/* Calculated Target times */}
                          <div className="col-span-2 text-center text-amber-500 font-mono font-black text-[10px]">
                            {target}
                          </div>

                          {/* Actual logged time with editing state */}
                          <div className="col-span-3 flex justify-center items-center">
                            {editingRepId === rep.id ? (
                              <div className="flex gap-1 items-center max-w-[100px]" onClick={e => e.stopPropagation()}>
                                <input
                                  type="text"
                                  value={manualTimeVal}
                                  onChange={e => setManualTimeVal(e.target.value)}
                                  placeholder="12.4s"
                                  className="w-14 bg-black border border-neutral-700 text-white rounded px-1.5 py-0.5 text-center font-mono text-[10px]"
                                  autoFocus
                                />
                                <button 
                                  onClick={() => handleLogActiveRep(rep.id)}
                                  className="bg-emerald-500 text-neutral-950 rounded p-1"
                                >
                                  ✓
                                </button>
                              </div>
                            ) : loggedTime ? (
                              <div className="flex items-center gap-1">
                                <span className="bg-emerald-950/40 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded font-mono font-black text-[10px] shadow-sm">
                                  {loggedTime}
                                </span>
                                <button 
                                  onClick={(e) => { e.stopPropagation(); startManualEdit(rep.id); }}
                                  className="text-[9px] text-neutral-500 hover:text-white transition-colors"
                                >
                                  ✎
                                </button>
                              </div>
                            ) : (
                              <div className="flex gap-1.5">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedRepId(rep.id);
                                    handleResetStopwatch();
                                    handleStartStopwatch();
                                  }}
                                  className="px-2 py-0.5 bg-purple-900/20 hover:bg-purple-900/40 text-purple-400 border border-purple-500/30 rounded text-[9px] font-black uppercase tracking-wider flex items-center gap-0.5 transition-all"
                                >
                                  ⏱️ GO!
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); startManualEdit(rep.id); }}
                                  className="text-[9px] text-neutral-600 hover:text-neutral-400 transition-colors"
                                >
                                  {t('manual_btn')}
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Expandable Coach Guidance / Technical instructions */}
                        <div className="px-3 pb-3 pt-0.5 bg-neutral-900/20 border-t border-neutral-900/40 flex flex-col md:flex-row md:items-center justify-between text-[10px] gap-2">
                          <p className="text-neutral-400 leading-relaxed max-w-xl font-medium">
                            💡 <span className="font-bold uppercase text-[9px] text-purple-400">{t('coaching_focus')}</span> {notes}
                          </p>
                          <p className="text-neutral-500 flex items-center gap-1 text-[9px] font-semibold whitespace-nowrap">
                            ⏳ <span className="font-bold text-neutral-400 uppercase text-[8px]">{t('rest_label')}</span> {recovery}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* STATS PROGRESS BRIEFING */}
              <div className="p-4 rounded-2xl border border-neutral-900 bg-neutral-900/10 flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-950/30 rounded-xl text-purple-400">
                    <TrendingUp size={16} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase">{t('session_progress')}</h4>
                    <p className="text-[10px] text-neutral-500 font-medium">
                      {t('progress_status').replace('{completed}', String(Object.keys(repLogs).length)).replace('{total}', String(reps.length))}
                    </p>
                  </div>
                </div>
                <div className="w-full md:w-48 bg-neutral-900 h-2 rounded-full overflow-hidden border border-neutral-800">
                  <div 
                    className="bg-purple-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${(Object.keys(repLogs).length / reps.length) * 100}%` }}
                  ></div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 4: COOLDOWN */}
          {activeTab === 'cooldown' && (
            <div className="space-y-4 animate-fadeIn max-w-xl mx-auto">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-1.5 h-3 bg-purple-500 rounded-sm"></span>
                <h3 className="text-[11px] font-black uppercase tracking-widest text-neutral-400">
                  {t('cooldown_recovery')}
                </h3>
              </div>
              <div className="space-y-2.5">
                {((language === 'fr' ? plan?.cooldownFr : plan?.cooldownEn) || plan?.cooldownFr || plan?.cooldownEn || []).map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      playClickSound(750, 0.04);
                      setCompletedCooldown(prev => ({ ...prev, [idx]: !prev[idx] }));
                    }}
                    className={`w-full text-left p-4 rounded-2xl border transition-all flex items-start gap-3 active:scale-[0.99] ${completedCooldown[idx] ? 'bg-neutral-900/40 border-neutral-900/50 text-neutral-500 line-through' : 'bg-neutral-900/80 border-neutral-800/80 hover:border-neutral-700 text-white'}`}
                  >
                    <div className={`mt-0.5 w-4 h-4 rounded-md border flex items-center justify-center transition-all flex-none ${completedCooldown[idx] ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400' : 'border-neutral-700 bg-neutral-950 text-transparent'}`}>
                      <Check size={10} strokeWidth={4} />
                    </div>
                    <span className="text-xs font-semibold leading-relaxed">{item}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* FOOTER TERMINATION CONTROLS */}
      <div className="flex-none p-5 bg-neutral-900 border-t border-neutral-800 flex justify-between items-center">
        <button 
          onClick={onClose}
          className="text-[10px] font-black uppercase tracking-widest text-red-500 hover:text-red-400 transition-colors bg-red-950/20 border border-red-900/30 px-5 py-3 rounded-xl active:scale-95"
        >
          {t('abandon_btn')}
        </button>

        {Object.keys(repLogs).length === reps.length ? (
          <button
            onClick={() => {
              handleCompleteWorkout();
            }}
            className="bg-purple-600 hover:bg-purple-500 text-white shadow-[0_0_15px_rgba(138,43,226,0.4)] transition-all font-black uppercase tracking-widest text-[10px] px-6 py-3 rounded-xl animate-bounce"
          >
            🏁 {t('workout_complete_btn')}
          </button>
        ) : (
          <button
            onClick={() => {
              playClickSound(800, 0.05);
              setShowEarlyCompleteConfirm(true);
            }}
            className="text-[10px] font-black uppercase tracking-widest text-neutral-400 hover:text-white transition-colors bg-neutral-800 border border-neutral-700 px-5 py-3 rounded-xl active:scale-95"
          >
            {t('complete_session_btn')}
          </button>
        )}
      </div>

      {/* BEAUTIFUL CUSTOM EXIT CONFIRMATION DIALOG */}
      {showExitConfirm && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[5000] flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-red-950/40 text-red-500 flex items-center justify-center mx-auto border border-red-900/30">
              <AlertTriangle size={24} />
            </div>
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-wider">
                {language === 'fr' ? "Quitter la Séance ?" : "Quit Workout Session?"}
              </h3>
              <p className="text-xs text-neutral-400 mt-2 leading-relaxed">
                {language === 'fr' 
                  ? "Votre progression actuelle ne sera pas enregistrée si vous quittez maintenant." 
                  : "Your current progress will not be logged if you quit now."}
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button 
                onClick={() => {
                  playClickSound(600, 0.05);
                  setShowExitConfirm(false);
                }}
                className="flex-1 py-2.5 bg-neutral-950 hover:bg-neutral-850 border border-neutral-800 rounded-xl text-[10px] font-black uppercase tracking-widest text-neutral-400 transition-all active:scale-95"
              >
                {language === 'fr' ? 'Annuler' : 'Cancel'}
              </button>
              <button 
                onClick={() => {
                  playClickSound(600, 0.05);
                  setShowExitConfirm(false);
                  setScreen(Screen.Home);
                }}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 rounded-xl text-[10px] font-black uppercase tracking-widest text-white transition-all active:scale-95 shadow-lg shadow-red-900/20"
              >
                {language === 'fr' ? 'Quitter' : 'Quit'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BEAUTIFUL CUSTOM EARLY COMPLETE DIALOG */}
      {showEarlyCompleteConfirm && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[5000] flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-purple-950/40 text-purple-400 flex items-center justify-center mx-auto border border-purple-900/30">
              <HelpCircle size={24} />
            </div>
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-wider">
                {language === 'fr' ? "Finaliser la séance ?" : "Complete Session?"}
              </h3>
              <p className="text-xs text-neutral-400 mt-2 leading-relaxed">
                {t('confirm_early_complete')}
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button 
                onClick={() => {
                  playClickSound(600, 0.05);
                  setShowEarlyCompleteConfirm(false);
                }}
                className="flex-1 py-2.5 bg-neutral-950 hover:bg-neutral-850 border border-neutral-800 rounded-xl text-[10px] font-black uppercase tracking-widest text-neutral-400 transition-all active:scale-95"
              >
                {language === 'fr' ? 'Reprendre' : 'Resume'}
              </button>
              <button 
                onClick={() => {
                  playClickSound(600, 0.05);
                  setShowEarlyCompleteConfirm(false);
                  handleCompleteWorkout();
                }}
                className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-500 rounded-xl text-[10px] font-black uppercase tracking-widest text-white transition-all active:scale-95 shadow-lg shadow-purple-900/20"
              >
                {language === 'fr' ? 'Valider' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

