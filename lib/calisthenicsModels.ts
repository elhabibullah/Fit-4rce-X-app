/**
 * Fit-4rce X Calisthenics & Bodyweight Animated Models Registry
 * High-fidelity Android 3D models with built-in authentic animations
 * Hosted on GitHub with CORS-compliant raw delivery
 */

export interface CalisthenicsExerciseDef {
  canonicalId: string;
  modelUrl: string;
  category: 'push' | 'pull' | 'core' | 'legs' | 'cardio';
  equipment: 'bodyweight' | 'mat';
  names: {
    en: string;
    ar: string;
    fr: string;
    es: string;
    pt: string;
    ja: string;
    zh: string;
    ru: string;
  };
  descriptions: {
    en: string;
    ar: string;
    fr: string;
    es: string;
    pt: string;
    ja: string;
    zh: string;
    ru: string;
  };
}

export const CALISTHENICS_BODYWEIGHT_MODELS: Record<string, string> = {
  'alternative_arm_plank_hold': 'https://raw.githubusercontent.com/elhabibullah/mon-stockage-media/refs/heads/main/alternative%20arm%20plank%20hold.glb',
  'alternative_leg_plank_hold': 'https://raw.githubusercontent.com/elhabibullah/mon-stockage-media/refs/heads/main/alternative%20leg%20plank%20hold.glb',
  'alternative_superman_plank_advanced': 'https://raw.githubusercontent.com/elhabibullah/mon-stockage-media/refs/heads/main/alternative%20superman%20plank%20advanced.glb',
  'archer_push_up': 'https://raw.githubusercontent.com/elhabibullah/mon-stockage-media/refs/heads/main/Archer%20Push-ups.glb',
  'bear_crawl_forward_backward': 'https://raw.githubusercontent.com/elhabibullah/mon-stockage-media/refs/heads/main/Bear%20crawl%20forward%20backward.glb',
  'diamond_push_ups': 'https://raw.githubusercontent.com/elhabibullah/mon-stockage-media/refs/heads/main/Diamond%20push%20ups.glb',
  'forearm_to_pushup_plank': 'https://raw.githubusercontent.com/elhabibullah/mon-stockage-media/refs/heads/main/forearm%20to%20pushup%20plank.glb',
  'hollow_body_hold': 'https://raw.githubusercontent.com/elhabibullah/mon-stockage-media/refs/heads/main/Hollow%20body%20hold.glb',
  'jumping_squats': 'https://raw.githubusercontent.com/elhabibullah/mon-stockage-media/refs/heads/main/Jumping%20Squats.glb',
  'plank_hop_to_squat': 'https://raw.githubusercontent.com/elhabibullah/mon-stockage-media/refs/heads/main/plank%20hop%20to%20squat.glb',
  'plank_knee_to_elbow_advanced': 'https://raw.githubusercontent.com/elhabibullah/mon-stockage-media/refs/heads/main/Plank%20knee%20to%20elbow%20advanced.glb',
  'plank_walk_back_and_forth': 'https://raw.githubusercontent.com/elhabibullah/mon-stockage-media/refs/heads/main/plank%20walk%20back%20and%20forth.glb',
  'plank_walk_left_right': 'https://raw.githubusercontent.com/elhabibullah/mon-stockage-media/refs/heads/main/Plank%20walk%20left%20-%20right.glb',
  'plank_variations_buzzsaw': 'https://raw.githubusercontent.com/elhabibullah/mon-stockage-media/refs/heads/main/plank-variations_buzzsaw.glb',
};

export const CALISTHENICS_EXERCISE_DEFINITIONS: CalisthenicsExerciseDef[] = [
  {
    canonicalId: 'archer_push_up',
    modelUrl: CALISTHENICS_BODYWEIGHT_MODELS['archer_push_up'],
    category: 'push',
    equipment: 'bodyweight',
    names: {
      en: 'Archer Push-ups',
      ar: 'تمرين ضغط القوس (آرتشر بوش أب)',
      fr: 'Pompes Archer',
      es: 'Flexiones arquero (Archer push-ups)',
      pt: 'Flexões arqueiro (Archer push-ups)',
      ja: 'アーチャー・プッシュアップ',
      zh: '弓箭手俯卧撑（射手俯卧撑）',
      ru: 'Отжимания лучника (Archer push-ups)',
    },
    descriptions: {
      en: 'Descend to one side while extending the opposite arm straight out, mastering unilateral pressing strength.',
      ar: 'الانخفاض نحو جهة واحدة مع مد الذراع الأخرى مستقيمة بالكامل لبناء قوة دفع أحادية متقدمة.',
      fr: 'Descendez sur un côté en tendant le bras opposé pour développer une force de poussée unilatérale impressionnante.',
      es: 'Desciende hacia un lado extendiendo el brazo opuesto recto para dominar la fuerza de empuje unilateral.',
      pt: 'Desça para um lado estendendo o braço oposto reto para dominar a força de empurrão unilateral.',
      ja: '片側に体を下ろし、反対の腕をまっすぐ伸ばして片腕のプッシュ力を強化します。',
      zh: '向一侧下落同时将另一侧手臂水平伸直，锻造强大的单侧推力与核心稳定。',
      ru: 'Опускание к одной руке с полным выпрямлением противоположной для развития односторонней силы.',
    },
  },
  {
    canonicalId: 'diamond_push_ups',
    modelUrl: CALISTHENICS_BODYWEIGHT_MODELS['diamond_push_ups'],
    category: 'push',
    equipment: 'bodyweight',
    names: {
      en: 'Diamond Push-ups',
      ar: 'تمرين ضغط الماس (دايموند بوش أب)',
      fr: 'Pompes diamant',
      es: 'Flexiones diamante',
      pt: 'Flexões diamante',
      ja: 'ダイヤモンド・プッシュアップ',
      zh: '钻石俯卧撑',
      ru: 'Алмазные отжимания (узким хватом)',
    },
    descriptions: {
      en: 'Position hands together forming a diamond under the chest to maximize triceps and inner pectoral recruitment.',
      ar: 'وضع اليدين متقاربتين على شكل ماسة تحت الصدر لتركيز أقصى جهد على الترايسبس وعضلات الصدر الداخلية.',
      fr: 'Mains jointes formant un losange sous le sternum pour recruter intensément les triceps et la portion sternale.',
      es: 'Junta las manos formando un diamante bajo el pecho para aislar tríceps y pectorales internos.',
      pt: 'Junte as mãos formando um diamante sob o peito para focar nos tríceps e peitoral medial.',
      ja: '胸の下で手でダイヤモンド形を作り、上腕三頭筋と大胸筋の内側を強力に刺激します。',
      zh: '双手拇指食指相触呈钻石菱形置于胸口正下方，极大强化肱三头肌与胸大肌内侧。',
      ru: 'Расположите кисти треугольником под грудью для максимальной нагрузки на трицепс.',
    },
  },
  {
    canonicalId: 'jumping_squats',
    modelUrl: CALISTHENICS_BODYWEIGHT_MODELS['jumping_squats'],
    category: 'legs',
    equipment: 'bodyweight',
    names: {
      en: 'Jumping Squats',
      ar: 'قرفصاء مع القفز الانفجاري (جامبينغ سكوات)',
      fr: 'Squats sautés plyométriques',
      es: 'Sentadillas con salto pliométricas',
      pt: 'Agachamentos com salto pliométricos',
      ja: 'ジャンプ・スクワット（プライオメトリクス）',
      zh: '爆发力弹跳深蹲（深蹲跳）',
      ru: 'Приседания с выпрыгиванием (Jump Squats)',
    },
    descriptions: {
      en: 'Drop into a biomechanically sound squat, explode vertically through the balls of the feet, and land softly.',
      ar: 'الانخفاض في قرفصاء صحيحة ثم الانطلاق عمودياً بقوة انفجارية والهبوط بسلاسة لامتصاص الصدمات.',
      fr: 'Descendez en squat profond puis explosez verticalement, réception souple sur la pointe des pieds.',
      es: 'Baja en sentadilla y explota verticalmente empujando con las puntas, amortiguando la caída con suavidad.',
      pt: 'Agache profundamente e salte explosivamente para cima, aterrissando suavemente.',
      ja: '正しいフォームでスクワットし、足裏で床を蹴って真上に爆発的に跳び上がります。',
      zh: '标准深蹲下沉，随后双足强劲蹬地垂直起跳，轻柔落地缓冲顺势进入下一次。',
      ru: 'Опуститесь в глубокий присед и взрывным движением выпрыгните вверх с мягким приземлением.',
    },
  },
  {
    canonicalId: 'bear_crawl_forward_backward',
    modelUrl: CALISTHENICS_BODYWEIGHT_MODELS['bear_crawl_forward_backward'],
    category: 'cardio',
    equipment: 'bodyweight',
    names: {
      en: 'Bear Crawl Forward & Backward',
      ar: 'زحف الدب للأمام والخلف',
      fr: "Marche de l'ours avant-arrière",
      es: 'Paso del oso adelante y atrás',
      pt: 'Caminhada do urso frente e trás',
      ja: 'ベアクロール（前後移動）',
      zh: '熊爬前后往返',
      ru: 'Медвежья походка вперед-назад',
    },
    descriptions: {
      en: 'Hover knees 2 inches above the ground and crawl forward and backward with tight core and quadrupedal coordination.',
      ar: 'إبقاء الركبتين على بعد سنتيمترات من الأرض والزحف للأمام والخلف بتنسيق رباعي يشتعل فيه الجذع والكتفان.',
      fr: "Genoux rasant le sol, rampez vers l'avant puis l'arrière avec une coordination quadrupédique dynamique.",
      es: 'Mantén las rodillas a 5 cm del suelo y gatea hacia adelante y atrás con abdomen activo y coordinación.',
      pt: 'Mantenha os joelhos a poucos centímetros do chão e rasteje para frente e para trás com o core ativado.',
      ja: '膝を床から数センチ浮かせ、四足歩行の連動性で前後へ這うように進みます。',
      zh: '双膝离地数厘米，四肢对角协调同步前后爬行，点燃全身核心肌群与肩胛稳定。',
      ru: 'Удерживая колени в паре сантиметров от пола, перемещайтесь вперед и назад на четвереньках.',
    },
  },
  {
    canonicalId: 'hollow_body_hold',
    modelUrl: CALISTHENICS_BODYWEIGHT_MODELS['hollow_body_hold'],
    category: 'core',
    equipment: 'bodyweight',
    names: {
      en: 'Hollow Body Hold',
      ar: 'تثبيت وضعية التجويف (هولو بودي هولد)',
      fr: 'Maintien Hollow Body (Bananier)',
      es: 'Postura hollow body isométrica',
      pt: 'Sustentação hollow body isométrica',
      ja: 'ホローボディ・ホールド（体操式体幹保持）',
      zh: '核心空心仰卧保持（Hollow Body）',
      ru: 'Удержание лодочки на спине (Hollow Body)',
    },
    descriptions: {
      en: 'Foundational gymnastic shape: press lower back flat into the mat with arms and legs extended in a tight banana curve.',
      ar: 'الوضعية الأساسية للجمباز: ضغط أسفل الظهر بإحكام على الأرض ومد الذراعين والساقين في قوس محكم وثابت.',
      fr: 'Figure fondamentale de gymnastique : plaquez les lombaires au sol, bras et jambes tendus dans une cambrure inversée.',
      es: 'Figura gimnástica fundamental: pega la zona lumbar al suelo con brazos y piernas estirados.',
      pt: 'Forma ginástica fundamental: cole a lombar no chão com braços e pernas estendidos.',
      ja: '体操の基本姿勢：腰を床に完全に密着させ、手足を伸ばしてバナナのような曲線でキープします。',
      zh: '体操核心精髓动作：腰椎完全贴紧地面，双臂与双腿悬空延展，锁紧全身体干。',
      ru: 'Базовое гимнастическое упражнение: прижмите поясницу к полу, вытянув руки и ноги в дугу.',
    },
  },
  {
    canonicalId: 'forearm_to_pushup_plank',
    modelUrl: CALISTHENICS_BODYWEIGHT_MODELS['forearm_to_pushup_plank'],
    category: 'core',
    equipment: 'bodyweight',
    names: {
      en: 'Forearm to Push-up Plank (Commandos)',
      ar: 'بلانك كوماندوز (من الساعدين إلى وضعية الضغط)',
      fr: 'Planche commando (avant-bras vers pompes)',
      es: 'Plancha militar / comandos (antebrazos a palmas)',
      pt: 'Prancha comando (antebraços para palmas)',
      ja: 'コマンドー・プランク（前腕から腕立てへ）',
      zh: '交替升降平板支撑（特种兵支撑）',
      ru: 'Планка коммандос (с предплечий в упор лежа)',
    },
    descriptions: {
      en: 'Transition rhythmically between elbow plank and high plank, locking hips to resist side-to-side sway.',
      ar: 'الصعود والهبوط الإيقاعي بين البلانك على الساعدين ووضعية الضغط مع تثبيت الحوض ومنع التأرجح.',
      fr: 'Alternez avec dynamisme entre planche coudes et planche paumes en verrouillant les hanches sans torsion.',
      es: 'Alterna fluidamente entre plancha de antebrazos y plancha alta bloqueando las caderas.',
      pt: 'Alterne dinamicamente entre prancha de cotovelos e prancha alta travando os quadris.',
      ja: '肘立ちプランクと腕立てプランクを交互にリズミカルに昇降し、骨盤を水平に固定します。',
      zh: '在肘桥支撑与掌屈伸支撑之间交替升降，骨盆锁紧抵抗身体两侧摆动。',
      ru: 'Динамический переход с предплечий на ладони и обратно без раскачивания таза.',
    },
  },
  {
    canonicalId: 'plank_hop_to_squat',
    modelUrl: CALISTHENICS_BODYWEIGHT_MODELS['plank_hop_to_squat'],
    category: 'legs',
    equipment: 'bodyweight',
    names: {
      en: 'Plank Hop to Squat',
      ar: 'القفز من وضعية البلانك إلى القرفصاء',
      fr: 'Saut de planche vers squat profond',
      es: 'Salto de plancha a sentadilla profunda',
      pt: 'Salto de prancha para agachamento',
      ja: 'プランク・ホップ・トゥ・スクワット',
      zh: '平板支撑跳至深蹲（青蛙跳蹲）',
      ru: 'Прыжок из планки в глубокий присед',
    },
    descriptions: {
      en: 'From high plank, jump both feet forward outside your hands into a low athletic squat, then hop back with control.',
      ar: 'من وضعية البلانك المرتفعة، اقفز بالقدمين للأمام بجانب اليدين في قرفصاء منخفضة ثم عد للخلف بتحكم تام.',
      fr: "Depuis la planche haute, projetez les pieds vers l'extérieur des mains en squat athlétique puis repartez en arrière.",
      es: 'Desde plancha alta, salta con los pies por fuera de las manos a sentadilla baja y regresa con control.',
      pt: 'Da prancha alta, salte com os pés para fora das mãos em agachamento e volte controladamente.',
      ja: '高いプランクから両足を手の外側へ一気に飛び込ませて低いスクワットを作り、元の位置へ跳び戻ります。',
      zh: '自高位俯卧撑姿态双脚敏捷跃至双手外侧呈深蹲，随后平稳蹬回平板支撑。',
      ru: 'Из планки прыжком перейдите в глубокий присед, поставив стопы по бокам от ладоней, и вернитесь назад.',
    },
  },
  {
    canonicalId: 'plank_knee_to_elbow_advanced',
    modelUrl: CALISTHENICS_BODYWEIGHT_MODELS['plank_knee_to_elbow_advanced'],
    category: 'core',
    equipment: 'bodyweight',
    names: {
      en: 'Advanced Plank Knee to Elbow (Spider Plank)',
      ar: 'بلانك متقدم ركبة إلى الكوع (سبايدر بلانك)',
      fr: 'Planche avancée genou au coude (Planche Spider)',
      es: 'Plancha Spiderman avanzada (rodilla al codo)',
      pt: 'Prancha Spiderman avançada (joelho ao cotovelo)',
      ja: 'アドバンスド・スパイダー・プランク（膝を肘へ）',
      zh: '进阶蜘蛛人平板支撑（膝触肘）',
      ru: 'Продвинутая планка Спайдермен (колено к локтю)',
    },
    descriptions: {
      en: 'Drive the knee laterally to touch the tricep/elbow on each repetition, firing up obliques and serratus.',
      ar: 'سحب الركبة جانبياً لتلامس الكوع في كل تكرار لشد ونحت عضلات الخواصر (الأوبليكس) وعضلات الجذع.',
      fr: 'Amenez le genou latéralement au contact du coude à chaque répétition pour recruter intensément les obliques.',
      es: 'Lleva la rodilla lateralmente hacia el codo en cada repetición activando oblicuos y serratos.',
      pt: 'Traga o joelho lateralmente até tocar o cotovelo a cada repetição ativando oblíquos.',
      ja: '膝を外側から肘の高さまで引き寄せてタッチし、腹斜筋と前鋸筋を極限まで収縮させます。',
      zh: '膝关节沿体侧外展向前冲顶直至轻触同侧肘关节，极致压榨腹斜肌与前锯肌。',
      ru: 'Подтягивайте колено через сторону к локтю на каждом повторении, нагружая косые мышцы живота.',
    },
  },
  {
    canonicalId: 'plank_walk_back_and_forth',
    modelUrl: CALISTHENICS_BODYWEIGHT_MODELS['plank_walk_back_and_forth'],
    category: 'core',
    equipment: 'bodyweight',
    names: {
      en: 'Plank Walk Back & Forth',
      ar: 'مشي البلانك للأمام والخلف',
      fr: 'Déplacement en planche avant-arrière',
      es: 'Caminata en plancha adelante y atrás',
      pt: 'Caminhada em prancha frente e trás',
      ja: 'プランク・ウォーク（前後ステップ）',
      zh: '平板支撑前后手步移动',
      ru: 'Проходка в планке вперед и назад',
    },
    descriptions: {
      en: 'Maintain horizontal board posture while walking forward and backward using synchronous hand and foot steps.',
      ar: 'الحفاظ على استقامة الجسم كاللوح الخشبي أثناء المشي للأمام والخلف بخطوات متزامنة للأيدي والأقدام.',
      fr: 'Gardez le corps rigide comme une planche tout en marchant vers l\'avant et l\'arrière par petits pas synchronisés.',
      es: 'Mantén el cuerpo firme como una tabla caminando adelante y atrás con pasos cortos y coordinados.',
      pt: 'Mantenha o corpo reto caminhando para frente e para trás com passos curtos e coordenados.',
      ja: '体幹を板のように真っ直ぐ保ち、手足を同調させて前後へリズミカルに歩行移動します。',
      zh: '躯干如刚性铁板保持绝对水平，手足协同微步前后移动，强化动态全身抗伸展能力。',
      ru: 'Сохраняйте ровное положение тела, передвигаясь вперед и назад небольшими синхронными шагами.',
    },
  },
  {
    canonicalId: 'plank_walk_left_right',
    modelUrl: CALISTHENICS_BODYWEIGHT_MODELS['plank_walk_left_right'],
    category: 'core',
    equipment: 'bodyweight',
    names: {
      en: 'Lateral Plank Walk (Left - Right)',
      ar: 'مشي البلانك الجانبي (يسار - يمين)',
      fr: 'Déplacement latéral en planche (gauche - droite)',
      es: 'Caminata lateral en plancha (izquierda - derecha)',
      pt: 'Caminhada lateral em prancha (esquerda - direita)',
      ja: 'ラテラル・プランク・ウォーク（左右移動）',
      zh: '横向移动平板支撑（左右平移）',
      ru: 'Боковая проходка в планке (влево - вправо)',
    },
    descriptions: {
      en: 'Step laterally hands and feet together across the mat, challenging shoulder stability and lateral core chain.',
      ar: 'التحرك جانبياً على البساط بخطوات متناسقة للأيدي والأرجل لتطوير استقرار الكتفين والجانبين.',
      fr: 'Déplacez-vous latéralement en pas chassés mains et pieds pour défier la ceinture scapulaire et la chaîne latérale.',
      es: 'Desplázate lateralmente combinando manos y pies, desafiando la estabilidad de hombros y el core lateral.',
      pt: 'Desloque-se lateralmente com mãos e pés, desafiando a estabilidade dos ombros e cadeia lateral.',
      ja: 'プランクの姿勢のまま手足を左右へサイドステップさせ、肩甲骨の安定性と側腹部を鍛えます。',
      zh: '维持高位侧向滑步，双手双足交替水平移步，深度考验肩带承压与侧链抗侧屈控制。',
      ru: 'Перемещайтесь вбок вдоль коврика синхронными шагами рук и ног, развивая латеральную стабильность.',
    },
  },
  {
    canonicalId: 'plank_variations_buzzsaw',
    modelUrl: CALISTHENICS_BODYWEIGHT_MODELS['plank_variations_buzzsaw'],
    category: 'core',
    equipment: 'bodyweight',
    names: {
      en: 'Buzzsaw Plank (Body Saw)',
      ar: 'بلانك المنشار المتأرجح (بودي سو / باز سو)',
      fr: 'Planche en va-et-vient (Buzzsaw / Scie)',
      es: 'Plancha sierra corporal (Body saw / Buzzsaw)',
      pt: 'Prancha serrote (Body saw / Buzzsaw)',
      ja: 'バズソー・プランク（ボディ・ソー）',
      zh: '锯子式核心滑移平板支撑（Body Saw）',
      ru: 'Планка-пила (Body Saw / Buzzsaw)',
    },
    descriptions: {
      en: 'Rock back and forth on the toes and forearms like a saw, levering the torso to dramatically amplify core load.',
      ar: 'التأرجح للأمام والخلف على أصابع القدمين والساعدين كحركة المنشار لمضاعفة الضغط على عضلات البطن العميقة.',
      fr: 'Basculez d\'avant en arrière sur les orteils et coudes comme une scie pour démultiplier la tension sur le grand droit.',
      es: 'Balancéate adelante y atrás sobre puntas y antebrazos como una sierra, multiplicando la tensión abdominal.',
      pt: 'Balance para frente e para trás sobre os pés e antebraços como uma serra, multiplicando a tensão no core.',
      ja: 'つま先と前腕でノコギリのように前後に揺れ、レバー比を変えて腹筋に強烈な負荷をかけます。',
      zh: '以前臂与脚趾为支点，如拉锯般平滑前后推动身体，瞬间成倍放大腹横肌与直肌负荷。',
      ru: 'Раскачивайтесь вперед и назад на носках и предплечьях подобно пиле, увеличивая нагрузку на пресс.',
    },
  },
  {
    canonicalId: 'alternative_arm_plank_hold',
    modelUrl: CALISTHENICS_BODYWEIGHT_MODELS['alternative_arm_plank_hold'],
    category: 'core',
    equipment: 'bodyweight',
    names: {
      en: 'Alternative Arm Plank Hold',
      ar: 'بلانك مع رفع الذراع بالتناوب',
      fr: 'Planche avec levée de bras alternée',
      es: 'Plancha con elevación de brazo alterna',
      pt: 'Prancha com elevação alternada de braço',
      ja: 'オルタネイト・アーム・プランクホールド',
      zh: '交替抬臂平板支撑',
      ru: 'Планка с поочередным подъемом рук',
    },
    descriptions: {
      en: 'Hold a rigid forearm plank while extending one arm forward at a time to challenge anti-rotational core stability.',
      ar: 'حافظ على ثبات وضعية البلانك مع مد ذراع واحدة للأمام بالتناوب لتحدي استقرار عضلات الجذع ومقاومة الالتفاف.',
      fr: 'Maintenez une planche solide tout en tendant un bras vers l\'avant en alternance pour renforcer la stabilité anti-rotationnelle.',
      es: 'Mantén una plancha firme extendiendo un brazo al frente alternadamente para desafiar la anti-rotación.',
      pt: 'Mantenha a prancha firme estendendo um braço à frente alternadamente para desafiar a estabilidade anti-rotacional.',
      ja: '前腕プランクを維持したまま片腕ずつ前方に伸ばし、回旋に抗する体幹の固定力を養います。',
      zh: '在平板支撑中保持髋部水平不倾斜，交替向前单臂平举延伸，强化抗旋转核心力量。',
      ru: 'Удерживайте планку, вытягивая по одной руке вперед для развития антиротационной устойчивости.',
    },
  },
  {
    canonicalId: 'alternative_leg_plank_hold',
    modelUrl: CALISTHENICS_BODYWEIGHT_MODELS['alternative_leg_plank_hold'],
    category: 'core',
    equipment: 'bodyweight',
    names: {
      en: 'Alternative Leg Plank Hold',
      ar: 'بلانك مع رفع الساق بالتناوب',
      fr: 'Planche avec levée de jambe alternée',
      es: 'Plancha con elevación de pierna alterna',
      pt: 'Prancha com elevação alternada de perna',
      ja: 'オルタネイト・レッグ・プランクホールド',
      zh: '交替抬腿平板支撑',
      ru: 'Планка с поочередным подъемом ног',
    },
    descriptions: {
      en: 'Maintain neutral spine plank posture while lifting one leg off the floor with deliberate glute activation.',
      ar: 'حافظ على استقامة العمود الفقري أثناء رفع ساق واحدة عن الأرض مع تفعيل مركز لعضلات المؤخرة والجذع.',
      fr: 'Gardez la colonne alignée en planche tout en soulevant une jambe avec une contraction ciblée des fessiers.',
      es: 'Mantén la columna neutra levantando una pierna del suelo con activación deliberada de glúteos.',
      pt: 'Mantenha a coluna neutra levantando uma perna do chão com ativação consciente dos glúteos.',
      ja: '骨盤を床と平行に保ち、片脚ずつ床上へ浮かせて臀筋とお腹を同時に引き締めます。',
      zh: '中立脊柱姿态保持平板支撑，交替后上方抬起单腿，精准孤立激活臀肌并维稳骨盆。',
      ru: 'Сохраняйте нейтральное положение спины, поочередно поднимая ноги за счет включения ягодиц.',
    },
  },
  {
    canonicalId: 'alternative_superman_plank_advanced',
    modelUrl: CALISTHENICS_BODYWEIGHT_MODELS['alternative_superman_plank_advanced'],
    category: 'core',
    equipment: 'bodyweight',
    names: {
      en: 'Advanced Alternative Superman Plank',
      ar: 'بلانك سوبرمان المتقدم بالتناوب',
      fr: 'Planche Superman avancée alternée',
      es: 'Plancha Superman avanzada alterna',
      pt: 'Prancha Superman avançada alternada',
      ja: 'アドバンスド・スーパーマン・プランク',
      zh: '进阶交替超人平板支撑',
      ru: 'Продвинутая планка Супермена с поочередным подъемом',
    },
    descriptions: {
      en: 'Advanced contralateral hold lifting opposite arm and leg simultaneously to forge elite full-body tension.',
      ar: 'تمرين متقدم برفع الذراع والساق المعاكسة في وقت واحد لبناء ثبات خارق لكامل الجسم والعمود الفقري.',
      fr: 'Élévation controlatérale simultanée du bras et de la jambe opposée pour forger un gainage total de haut niveau.',
      es: 'Elevación contralateral simultánea de brazo y pierna opuestos para desarrollar tensión corporal total.',
      pt: 'Elevação contralateral simultânea de braço e perna opostos para criar tensão corporal máxima.',
      ja: '対角の手と足を同時に浮かせて一直線に伸ばす最高難度の対角線体幹保持種目です。',
      zh: '同时悬空前举对侧手臂与后抬对侧大腿，在两点支撑下建立极致的全身抗扭张力。',
      ru: 'Одновременный подъем противоположных руки и ноги в планке для развития тотального баланса.',
    },
  },
];

/**
 * Resolves whether a given exercise query (ID or Name) matches one of the 14 custom animated models.
 */
export function resolveCalisthenicsModel(idOrName?: string): string | null {
  if (!idOrName) return null;
  const clean = idOrName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

  // Direct ID check
  if (CALISTHENICS_BODYWEIGHT_MODELS[clean]) {
    return CALISTHENICS_BODYWEIGHT_MODELS[clean];
  }

  // Matching patterns
  if (clean.includes('archer') && (clean.includes('push') || clean.includes('pompe') || clean.includes('ضغط'))) {
    return CALISTHENICS_BODYWEIGHT_MODELS['archer_push_up'];
  }
  if (clean.includes('diamond') || clean.includes('diamant') || clean.includes('الماس') || clean.includes('دايموند')) {
    return CALISTHENICS_BODYWEIGHT_MODELS['diamond_push_ups'];
  }
  if ((clean.includes('jump') || clean.includes('saute') || clean.includes('قفز')) && (clean.includes('squat') || clean.includes('قرفصاء'))) {
    return CALISTHENICS_BODYWEIGHT_MODELS['jumping_squats'];
  }
  if (clean.includes('bear') || clean.includes('ours') || clean.includes('الدب') || clean.includes('crawl')) {
    return CALISTHENICS_BODYWEIGHT_MODELS['bear_crawl_forward_backward'];
  }
  if (clean.includes('hollow') || clean.includes('bananier') || clean.includes('هولو')) {
    return CALISTHENICS_BODYWEIGHT_MODELS['hollow_body_hold'];
  }
  if (clean.includes('commando') || clean.includes('forearm to pushup') || (clean.includes('avant-bras') && clean.includes('pompe')) || clean.includes('كوماندوز')) {
    return CALISTHENICS_BODYWEIGHT_MODELS['forearm_to_pushup_plank'];
  }
  if ((clean.includes('hop') || clean.includes('saut')) && (clean.includes('squat') || clean.includes('قرفصاء')) && (clean.includes('plank') || clean.includes('planche') || clean.includes('بلانك'))) {
    return CALISTHENICS_BODYWEIGHT_MODELS['plank_hop_to_squat'];
  }
  if ((clean.includes('knee') || clean.includes('genou') || clean.includes('ركبة')) && (clean.includes('elbow') || clean.includes('coude') || clean.includes('كوع')) || clean.includes('spider')) {
    return CALISTHENICS_BODYWEIGHT_MODELS['plank_knee_to_elbow_advanced'];
  }
  if ((clean.includes('walk') || clean.includes('marche') || clean.includes('مشي')) && (clean.includes('back') || clean.includes('forth') || clean.includes('avant') || clean.includes('arriere') || clean.includes('خلف'))) {
    return CALISTHENICS_BODYWEIGHT_MODELS['plank_walk_back_and_forth'];
  }
  if ((clean.includes('walk') || clean.includes('marche') || clean.includes('مشي')) && (clean.includes('left') || clean.includes('right') || clean.includes('lateral') || clean.includes('gauche') || clean.includes('droite') || clean.includes('جانبي') || clean.includes('يسار') || clean.includes('يمين'))) {
    return CALISTHENICS_BODYWEIGHT_MODELS['plank_walk_left_right'];
  }
  if (clean.includes('buzzsaw') || clean.includes('scie') || clean.includes('body saw') || clean.includes('منشار')) {
    return CALISTHENICS_BODYWEIGHT_MODELS['plank_variations_buzzsaw'];
  }
  if (clean.includes('superman') || clean.includes('سوبرمان')) {
    return CALISTHENICS_BODYWEIGHT_MODELS['alternative_superman_plank_advanced'];
  }
  if ((clean.includes('arm') || clean.includes('bras') || clean.includes('ذراع')) && (clean.includes('plank') || clean.includes('planche') || clean.includes('بلانك'))) {
    return CALISTHENICS_BODYWEIGHT_MODELS['alternative_arm_plank_hold'];
  }
  if ((clean.includes('leg') || clean.includes('jambe') || clean.includes('ساق')) && (clean.includes('plank') || clean.includes('planche') || clean.includes('بلانك'))) {
    return CALISTHENICS_BODYWEIGHT_MODELS['alternative_leg_plank_hold'];
  }

  // Broad category fallbacks to guarantee 100% authentic 3D Android animations for any bodyweight workout
  if (clean.includes('push') || clean.includes('pompe') || clean.includes('press') || clean.includes('ضغط')) {
    return CALISTHENICS_BODYWEIGHT_MODELS['diamond_push_ups'];
  }
  if (clean.includes('squat') || clean.includes('cuisse') || clean.includes('leg') || clean.includes('jambe') || clean.includes('قرفصاء')) {
    return CALISTHENICS_BODYWEIGHT_MODELS['jumping_squats'];
  }
  if (clean.includes('lunge') || clean.includes('fente') || clean.includes('saut') || clean.includes('jump')) {
    return CALISTHENICS_BODYWEIGHT_MODELS['plank_hop_to_squat'];
  }
  if (clean.includes('plank') || clean.includes('gainage') || clean.includes('planche') || clean.includes('بلانك')) {
    return CALISTHENICS_BODYWEIGHT_MODELS['plank_walk_back_and_forth'];
  }
  if (clean.includes('core') || clean.includes('abdo') || clean.includes('abs') || clean.includes('ventre') || clean.includes('crunch')) {
    return CALISTHENICS_BODYWEIGHT_MODELS['hollow_body_hold'];
  }
  if (clean.includes('cardio') || clean.includes('crawl') || clean.includes('ours') || clean.includes('bear')) {
    return CALISTHENICS_BODYWEIGHT_MODELS['bear_crawl_forward_backward'];
  }

  return null;
}

/**
 * Returns the localized name of an exercise across all 8 supported languages.
 */
export function getLocalizedExerciseName(idOrName?: string, lang: string = 'en'): string {
  if (!idOrName) return '';
  const clean = idOrName.toLowerCase().trim();
  const langKey = (lang || 'en').toLowerCase().slice(0, 2) as 'en' | 'ar' | 'fr' | 'es' | 'pt' | 'ja' | 'zh' | 'ru';
  
  const def = CALISTHENICS_EXERCISE_DEFINITIONS.find(
    d => d.canonicalId === clean || 
         d.names.en.toLowerCase() === clean || 
         d.names.fr.toLowerCase() === clean ||
         d.modelUrl === idOrName
  );

  if (def && def.names[langKey]) {
    return def.names[langKey];
  }
  return idOrName;
}

