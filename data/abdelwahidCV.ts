import { Language } from '../types.ts';

export interface LocalizedTrainerCV {
  name: string;
  titles: string[];
  quote: string;
  summary: string;
  domainsTitle: string;
  domains: { title: string; desc: string }[];
  qualificationsTitle: string;
  qualifications: string[];
  philosophyTitle: string;
  philosophyIntro: string;
  philosophyPoints: { title: string; desc: string }[];
  spokenLanguagesTitle: string;
  spokenLanguages: string;
  specializations: string[];
  certsBadges: { title: string; subtitle: string }[];
}

export const ABDELWAHID_CV: Record<Language, LocalizedTrainerCV> = {
  [Language.FR]: {
    name: 'Abdelwahid Habibullah',
    titles: ['Elite Performance Coach', 'Holistic Bio-Trainer', 'Maître de Kung-Fu'],
    quote: "« La discipline est le fondement de tout progrès. L'entraînement authentique vise des objectifs clairs et mesurables pour bâtir le corps, l'esprit et l'âme. »",
    summary: "Ancien sprinteur professionnel international et Maître de Kung-Fu reconnu, Abdelwahid combine des décennies d'expérience athlétique de haut niveau avec une expertise scientifique et holistique de l'entraînement. Sa méthodologie unique fusionne la puissance de la force fonctionnelle, la rigueur des arts martiaux traditionnels et un accompagnement mental et spirituel pour transformer durablement les athlètes et les professionnels.",
    domainsTitle: "Domaines d'Expertise & Disciplines",
    domains: [
      {
        title: "Préparation Physique & Athlétique",
        desc: "Ancien sprinteur international sur 100 mètres, conditionnement physique de pointe, powerlifting et cross-training intensif."
      },
      {
        title: "Arts Martiaux & Arts Internes",
        desc: "Maître de Kung-Fu, intégration du Tai Chi chuan et maîtrise des arts martiaux et dynamiques internes chinois."
      },
      {
        title: "Gymnastique & Force Fonctionnelle",
        desc: "Renforcement avancé au poids de corps, calisthénie de haut niveau et mouvements composés dynamiques."
      },
      {
        title: "Bio-Training & Mobilité",
        desc: "Optimisation de la flexibilité, protocoles de stretching fascial et développement global de l'endurance cardiovasculaire."
      },
      {
        title: "Coaching Holistique",
        desc: "Nutrition sportive individualisée, hygiène de vie régénératrice, résilience mentale et alignement spirituel profond."
      }
    ],
    qualificationsTitle: "Qualifications & Certifications Officielles",
    qualifications: [
      "Maître de Kung-Fu & Ancien Athlète International de Haut Niveau (Sprint 100m)",
      "Instructeur Sportif Certifié – Diplômé de la Vlaamse Trainersschool (Niveau Baccalauréat / Enseignement supérieur)",
      "Certifié en Nutrition Sportive (Essentials of Healthy Nutrition)",
      "Certifié en Coaching Spirituel (Essentials of Spiritual Coaching)"
    ],
    philosophyTitle: "Philosophie d'Entraînement",
    philosophyIntro: "Le système d'entraînement d'Abdelwahid repose sur une synergie en deux piliers complémentaires :",
    philosophyPoints: [
      {
        title: "Gymnastique & Force Fonctionnelle",
        desc: "Maîtrise absolue du poids de corps, puissance athlétique brute et contrôle spatial."
      },
      {
        title: "Intégration Martiale",
        desc: "Discipline, précision millimétrée et maîtrise du geste issues des arts martiaux traditionnels combinées aux sciences modernes du sport."
      }
    ],
    spokenLanguagesTitle: "Langues parlées",
    spokenLanguages: "Français, Néerlandais, Anglais, Arabe — pour une communication claire et un coaching sur-mesure d'excellence internationale.",
    specializations: [
      "Force Fonctionnelle",
      "Sprint & Vitesse",
      "Kung-Fu & Tai Chi",
      "Nutrition Sportive",
      "Coaching Holistique"
    ],
    certsBadges: [
      { title: "Vlaamse Trainersschool", subtitle: "Niveau Baccalauréat / Enseignement Supérieur" },
      { title: "Kung-Fu Master", subtitle: "Athlète International 100m" },
      { title: "Nutrition & Spirituel", subtitle: "Certifié Essentials of Nutrition & Coaching" }
    ]
  },
  [Language.EN]: {
    name: 'Abdelwahid Habibullah',
    titles: ['Elite Performance Coach', 'Holistic Bio-Trainer', 'Kung-Fu Master'],
    quote: '"Discipline is the bedrock of all progress. Authentic training aims for clear, measurable objectives to build body, mind, and spirit."',
    summary: 'Former international professional sprinter and recognized Kung-Fu Master, Abdelwahid brings together decades of elite athletic excellence with scientific and holistic coaching expertise. His unique methodology merges functional power, martial arts rigor, and mental/spiritual guidance to sustainably elevate athletes and driven professionals.',
    domainsTitle: 'Areas of Expertise & Disciplines',
    domains: [
      {
        title: 'Athletic Conditioning & Physical Preparation',
        desc: 'Former international 100m sprinter, advanced athletic conditioning, powerlifting, and high-performance cross-training.'
      },
      {
        title: 'Martial Arts & Internal Disciplines',
        desc: 'Kung-Fu Master, seamless integration of Tai Chi and traditional Chinese internal martial arts.'
      },
      {
        title: 'Gymnastics & Functional Strength',
        desc: 'Advanced bodyweight mastery, calisthenics, and dynamic compound movements.'
      },
      {
        title: 'Bio-Training & Mobility',
        desc: 'Full-body flexibility, myofascial stretching protocols, and comprehensive endurance development.'
      },
      {
        title: 'Holistic Coaching',
        desc: 'Sports nutrition, circadian lifestyle optimization, mental resilience, and spiritual alignment.'
      }
    ],
    qualificationsTitle: 'Official Qualifications & Certifications',
    qualifications: [
      'Kung-Fu Master & Former Elite International Athlete (100m Sprint)',
      'Certified Sports Instructor – Graduated from Vlaamse Trainersschool (Bachelor / Higher Education level)',
      'Certified in Sports Nutrition (Essentials of Healthy Nutrition)',
      'Certified in Spiritual Coaching (Essentials of Spiritual Coaching)'
    ],
    philosophyTitle: 'Training Philosophy',
    philosophyIntro: "Abdelwahid's training system rests upon a complementary dual-pillar synergy:",
    philosophyPoints: [
      {
        title: 'Gymnastics & Functional Strength',
        desc: 'Absolute bodyweight mastery and pure athletic functional power.'
      },
      {
        title: 'Martial Integration',
        desc: 'Discipline, millimeter precision, and movement mastery derived from traditional martial arts paired with modern sports science.'
      }
    ],
    spokenLanguagesTitle: 'Spoken Languages',
    spokenLanguages: 'French, Dutch, English, Arabic — ensuring clear communication and bespoke world-class coaching.',
    specializations: [
      'Functional Strength',
      'Sprint & Speed',
      'Kung-Fu & Tai Chi',
      'Sports Nutrition',
      'Holistic Coaching'
    ],
    certsBadges: [
      { title: 'Vlaamse Trainersschool', subtitle: 'Higher Education / Bachelor Level' },
      { title: 'Kung-Fu Master', subtitle: '100m International Athlete' },
      { title: 'Nutrition & Spiritual', subtitle: 'Certified Essentials of Nutrition & Coaching' }
    ]
  },
  [Language.AR]: {
    name: 'عبد الواحد حبيب الله',
    titles: ['مدرب أداء النخبة', 'مدرب بيولوجي شمولي', 'ماستر كونغ فو'],
    quote: '«الانضباط هو أساس كل تقدم. التدريب الحقيقي يهدف إلى أهداف واضحة وقابلة للقياس لبناء الجسد والعقل والروح.»',
    summary: 'عداء دولي محترف سابق وماستر كونغ فو معترف به، يجمع عبد الواحد بين عقود من الخبرة الرياضية رفيعة المستوى والخبرة العلمية والشمولية في التدريب. يدمج نظامه الفريد بين القوة الوظيفية، وانضباط الفنون القتالية، والتوجيه العقلي والروحي لبناء الرياضيين والمهنيين بشكل مستدام.',
    domainsTitle: 'مجالات الخبرة والتخصصات',
    domains: [
      {
        title: 'الإعداد البدني والرياضي',
        desc: 'عداء دولي سابق في سباق 100 متر، إعداد بدني متقدم، رفع الأثقال وتدريب القوة الشامل.'
      },
      {
        title: 'الفنون القتالية والداخلية',
        desc: 'ماستر كونغ فو، دمج تاي تشي والحركات الصينية التقليدية وضبط التنفس والطاقة.'
      },
      {
        title: 'الجمباز والقوة الوظيفية',
        desc: 'إتقان وزن الجسم، كاليستثنكس متقدم، وحركات ديناميكية مركبة.'
      },
      {
        title: 'التدريب الحيوي والمرونة',
        desc: 'مرونة المفاصل، إطالة الأوتار، وتطوير التحمل القلبي والتنفسي المتكامل.'
      },
      {
        title: 'التدريب الشمولي ونمط الحياة',
        desc: 'التغذية الرياضية المخصصة، نمط حياة صحي، المرونة النفسية والاتساق الروحي.'
      }
    ],
    qualificationsTitle: 'المؤهلات والشهادات الرسمية',
    qualifications: [
      'ماستر في الكونغ فو ورياضي دولي سابق رفيع المستوى (سباق 100م)',
      'مدرب رياضي معتمد – خريج المدرسة الفلمنكية للمدربين Vlaamse Trainersschool (مستوى بكالوريوس / تعليم عالي)',
      'معتمد في التغذية الرياضية (Essentials of Healthy Nutrition)',
      'معتمد في التدريب الروحي والتوجيه (Essentials of Spiritual Coaching)'
    ],
    philosophyTitle: 'فلسفة التدريب',
    philosophyIntro: 'يقوم نظام التدريب لدى عبد الواحد على ركيزتين متكاملتين:',
    philosophyPoints: [
      {
        title: 'الجمباز والقوة الوظيفية',
        desc: 'السيطرة الكاملة على وزن الجسم وتوليد القوة البدنية الحقيقية.'
      },
      {
        title: 'التكامل القتالي',
        desc: 'الانضباط والدقة الصارمة المكتسبة من الفنون القتالية التقليدية مدمجة مع علوم الرياضة الحديثة.'
      }
    ],
    spokenLanguagesTitle: 'اللغات المتحدثة',
    spokenLanguages: 'الفرنسية، الهولندية، الإنجليزية، العربية — لتواصل دقيق وتدريب مخصص على أعلى مستوى دولي.',
    specializations: [
      'القوة الوظيفية',
      'السرعة والسباق',
      'كونغ فو وتاي تشي',
      'التغذية الرياضية',
      'التدريب الشمولي'
    ],
    certsBadges: [
      { title: 'Vlaamse Trainersschool', subtitle: 'تعليم عالي / مستوى بكالوريوس' },
      { title: 'ماستر كونغ فو', subtitle: 'رياضي دولي 100م' },
      { title: 'التغذية والتدريب الروحي', subtitle: 'شهادات معتمدة عالمياً' }
    ]
  },
  [Language.ES]: {
    name: 'Abdelwahid Habibullah',
    titles: ['Entrenador de Rendimiento de Élite', 'Bio-Entrenador Holístico', 'Maestro de Kung-Fu'],
    quote: '«La disciplina es el fundamento de todo progreso. El entrenamiento auténtico apunta a metas claras y medibles para forjar cuerpo, mente y alma.»',
    summary: 'Ex-velocista internacional profesional y reconocido Maestro de Kung-Fu, Abdelwahid combina décadas de trayectoria deportiva de primer nivel con una metodología científica y holística del entrenamiento. Su sistema une la fuerza funcional, la precisión de las artes marciales y el desarrollo mental y espiritual para transformar atletas y profesionales de manera duradera.',
    domainsTitle: 'Áreas de Experiencia y Disciplinas',
    domains: [
      {
        title: 'Preparación Física y Atlética',
        desc: 'Ex-velocista internacional de 100 metros, acondicionamiento físico avanzado, powerlifting y cross-training.'
      },
      {
        title: 'Artes Marciales e Internas',
        desc: 'Maestro de Kung-Fu, integración de Tai Chi y artes internas tradicionales chinas.'
      },
      {
        title: 'Gimnasia y Fuerza Funcional',
        desc: 'Dominio absoluto del peso corporal, calistenia avanzada y movimientos compuestos dinámicos.'
      },
      {
        title: 'Bio-Training y Movilidad',
        desc: 'Flexibilidad profunda, estiramientos miofasciales y desarrollo de la resistencia cardiovascular.'
      },
      {
        title: 'Coaching Holístico',
        desc: 'Nutrición deportiva personalizada, hábitos saludables, resiliencia mental y alineación espiritual.'
      }
    ],
    qualificationsTitle: 'Cualificaciones y Certificaciones Oficiales',
    qualifications: [
      'Maestro de Kung-Fu y Ex-Atleta Internacional de Alto Rendimiento (100m Sprint)',
      'Instructor Deportivo Certificado – Vlaamse Trainersschool (Nivel Grado Universitario / Educación Superior)',
      'Certificado en Nutrición Deportiva (Essentials of Healthy Nutrition)',
      'Certificado en Coaching Espiritual (Essentials of Spiritual Coaching)'
    ],
    philosophyTitle: 'Filosofía de Entrenamiento',
    philosophyIntro: 'El sistema de Abdelwahid se fundamenta en dos pilares sinérgicos:',
    philosophyPoints: [
      {
        title: 'Gimnasia y Fuerza Funcional',
        desc: 'Control total del peso corporal y potencia atlética pura.'
      },
      {
        title: 'Integración Marcial',
        desc: 'Disciplina, precisión milimétrica y maestría del movimiento combinadas con las ciencias del deporte.'
      }
    ],
    spokenLanguagesTitle: 'Idiomas Hablados',
    spokenLanguages: 'Francés, Neerlandés, Inglés, Árabe — para una comunicación clara y un asesoramiento de nivel internacional.',
    specializations: [
      'Fuerza Funcional',
      'Sprint y Velocidad',
      'Kung-Fu y Tai Chi',
      'Nutrición Deportiva',
      'Coaching Holístico'
    ],
    certsBadges: [
      { title: 'Vlaamse Trainersschool', subtitle: 'Educación Superior / Nivel Grado' },
      { title: 'Kung-Fu Master', subtitle: 'Atleta Internacional 100m' },
      { title: 'Nutrición y Espiritual', subtitle: 'Certificado Essentials' }
    ]
  },
  [Language.PT]: {
    name: 'Abdelwahid Habibullah',
    titles: ['Treinador de Desempenho de Elite', 'Bio-Treinador Holístico', 'Mestre de Kung-Fu'],
    quote: '"A disciplina é o fundamento de todo o progresso. O treino autêntico visa objetivos claros e mensuráveis para construir o corpo, a mente e o espírito."',
    summary: 'Ex-velocista profissional internacional e conceituado Mestre de Kung-Fu, Abdelwahid alia décadas de experiência atlética de alto rendimento a uma metodologia científica e holística de treino. O seu método funde a força funcional, o rigor marcial e o apoio mental e espiritual para transformar atletas e profissionais de forma duradoura.',
    domainsTitle: 'Áreas de Especialização e Disciplinas',
    domains: [
      {
        title: 'Preparação Física e Atlética',
        desc: 'Ex-velocista internacional de 100 metros, condicionamento físico de ponta, powerlifting e cross-training.'
      },
      {
        title: 'Artes Marciais e Internas',
        desc: 'Mestre de Kung-Fu, integração de Tai Chi e movimentos tradicionais chineses.'
      },
      {
        title: 'Ginástica e Força Funcional',
        desc: 'Domínio do peso corporal, calistenia avançada e movimentos compostos dinâmicos.'
      },
      {
        title: 'Bio-Training e Mobilidade',
        desc: 'Flexibilidade fascial, mobilidade articular e desenvolvimento da resistência cardiovascular.'
      },
      {
        title: 'Coaching Holístico',
        desc: 'Nutrição desportiva, estilo de vida regenerativo, resiliência mental e alinhamento espiritual.'
      }
    ],
    qualificationsTitle: 'Qualificações e Certificações Oficiais',
    qualifications: [
      'Mestre de Kung-Fu e Ex-Atleta Internacional de Elite (Sprint 100m)',
      'Instrutor Desportivo Certificado – Vlaamse Trainersschool (Nível Licenciatura / Ensino Superior)',
      'Certificado em Nutrição Desportiva (Essentials of Healthy Nutrition)',
      'Certificado em Coaching Espiritual (Essentials of Spiritual Coaching)'
    ],
    philosophyTitle: 'Filosofia de Treino',
    philosophyIntro: 'O sistema de treino assenta em dois pilares complementares:',
    philosophyPoints: [
      {
        title: 'Ginástica e Força Funcional',
        desc: 'Domínio total do peso corporal e potência atlética genuína.'
      },
      {
        title: 'Integração Marcial',
        desc: 'Disciplina, precisão milimétrica e mestria do movimento aliadas às ciências desportivas modernas.'
      }
    ],
    spokenLanguagesTitle: 'Idiomas Falados',
    spokenLanguages: 'Francês, Neerlandês, Inglês, Árabe — para uma comunicação límpida e um coaching personalizado de nível mundial.',
    specializations: [
      'Força Funcional',
      'Sprint e Velocidade',
      'Kung-Fu e Tai Chi',
      'Nutrição Desportiva',
      'Coaching Holístico'
    ],
    certsBadges: [
      { title: 'Vlaamse Trainersschool', subtitle: 'Ensino Superior / Bacharelato' },
      { title: 'Kung-Fu Master', subtitle: 'Atleta Internacional 100m' },
      { title: 'Nutrição e Espiritual', subtitle: 'Certificações Essentials' }
    ]
  },
  [Language.ZH]: {
    name: 'Abdelwahid Habibullah (阿卜杜勒瓦希德·哈比卜拉)',
    titles: ['精英运动表现导师', '全息身心生物教练', '传统功夫宗师'],
    quote: '“自律乃一切精进之根本。真正的训练追求清晰且可量化的目标，以淬炼体魄、磨砺心智、升华灵魂。”',
    summary: '作为前国际职业短跑名将与权威功夫宗师，Abdelwahid 将数十载顶尖竞技经验与科学、全方位的现代身心训练理论完美融合。他开创的独特体系将功能性爆发力、传统武术严谨风骨与心智精神指引相结合，为精英运动员与专业人士带来质的蜕变。',
    domainsTitle: '专业领域与训练体系',
    domains: [
      {
        title: '体能与竞技备战',
        desc: '前国际百米短跑名将、进阶体能强化、力量举重与高强度交叉综合体能训练。'
      },
      {
        title: '武术与内家功夫',
        desc: '传统功夫宗师，深谙太极拳理与中国传统内外合一的功法奥秘。'
      },
      {
        title: '体操与功能性力量',
        desc: '自重极致控制、进阶街头健身（Calisthenics）及动态复合多关节发力。'
      },
      {
        title: '生物训练与柔韧性',
        desc: '筋膜与关节灵活性、全身伸展恢复规程以及全面心肺耐力提升。'
      },
      {
        title: '全息身心指导',
        desc: '精准运动营养学、身心健康节律优化、心智坚韧度与内在精神同频。'
      }
    ],
    qualificationsTitle: '官方资历与权威认证',
    qualifications: [
      '功夫宗师兼前高水平国际职业田径运动员（100米短跑）',
      '认证国家级体育教练 – 毕业于比利时弗拉芒教练学校 Vlaamse Trainersschool（本科学士/高等教育学历）',
      '运动营养学权威认证（Essentials of Healthy Nutrition）',
      '心智精神赋能教练认证（Essentials of Spiritual Coaching）'
    ],
    philosophyTitle: '训练核心哲学',
    philosophyIntro: 'Abdelwahid 的训练体系建立在两大相辅相成的支柱之上：',
    philosophyPoints: [
      {
        title: '体操与功能性力量',
        desc: '极致的自重掌控力与坚实纯粹的运动功能爆发力。'
      },
      {
        title: '武道精义融合',
        desc: '源自传统武术的严谨自律与毫厘级动作把控，深度赋能现代竞技运动科学。'
      }
    ],
    spokenLanguagesTitle: '沟通语言',
    spokenLanguages: '法语、荷兰语、英语、阿拉伯语 — 确保无障碍精准沟通，提供世界顶尖水准定制私教。',
    specializations: [
      '功能性力量',
      '短跑与绝对速度',
      '功夫与太极',
      '运动营养学',
      '全息身心私教'
    ],
    certsBadges: [
      { title: 'Vlaamse Trainersschool', subtitle: '高等教育 / 本科水平' },
      { title: '功夫宗师', subtitle: '国际百米专业运动员' },
      { title: '营养与精神赋能', subtitle: '官方认证资质' }
    ]
  },
  [Language.JA]: {
    name: 'Abdelwahid Habibullah (アブデルワヒド・ハビブラ)',
    titles: ['エリートパフォーマンスコーチ', 'ホリスティック・バイオトレーナー', 'カンフーマスター'],
    quote: '「規律こそがすべての進歩の礎である。本物の鍛錬とは、明確で測定可能な目標を持ち、肉体、精神、そして魂を磨き上げることにある。」',
    summary: '元国際プロスプリンターであり高名なカンフーマスターであるアブデルワヒドは、数十年にわたるトップアスリートとしての実践と、科学的かつホリスティックなトレーニング理論を結実させました。機能的筋力、伝統武術の極意、そして精神的レジリエンスを調和させた独自メソッドにより、アスリートやプロフェッショナルを持続的な高みへと導きます。',
    domainsTitle: '専門領域および指導種目',
    domains: [
      {
        title: 'アスレティック＆フィジカルトレーニング',
        desc: '元国際100mスプリンター、高度な体力調整、パワーリフティング、クロストレーニング。'
      },
      {
        title: '武術および内家拳',
        desc: 'カンフーマスター、太極拳および伝統中国武術の内外調和動作の統合。'
      },
      {
        title: '体操＆機能的筋力',
        desc: '完全なる自重コントロール、高度なキャリステニクス、複合ダイナミックムーブメント。'
      },
      {
        title: 'バイオトレーニング＆モビリティ',
        desc: '筋膜リリースと柔軟性向上、全身ストレッチ、総合的心肺持久力開発。'
      },
      {
        title: 'ホリスティックコーチング',
        desc: 'スポーツ栄養学、ライフスタイル改善、メンタルレジリエンス、精神的アライメント。'
      }
    ],
    qualificationsTitle: '公的資格および認定証',
    qualifications: [
      'カンフーマスター ＆ 元国際トップアスリート（100mスプリント）',
      '公認スポーツ指導員 – フランダース・トレーナースクール（Vlaamse Trainersschool 高等教育・学士水準）修了',
      'スポーツ栄養学認定（Essentials of Healthy Nutrition）',
      'スピリチュアルコーチング認定（Essentials of Spiritual Coaching）'
    ],
    philosophyTitle: 'トレーニング哲学',
    philosophyIntro: 'アブデルワヒドのトレーニング体系は、2つの相互補完的な柱に基づいています：',
    philosophyPoints: [
      {
        title: '体操および機能的筋力',
        desc: '己の体重を自在に操る自重制覇と、力強いアスリートパワー。'
      },
      {
        title: '武術の精髄との融合',
        desc: '伝統武術に宿るミリ単位の精密動作と規律を、現代スポーツ科学と完全統合。'
      }
    ],
    spokenLanguagesTitle: '対応言語',
    spokenLanguages: 'フランス語、オランダ語、英語、アラビア語 — 世界最高水準の明瞭な対話と個別指導。',
    specializations: [
      '機能的筋力',
      'スプリント＆瞬発力',
      'カンフー＆太極拳',
      'スポーツ栄養',
      'ホリスティック指導'
    ],
    certsBadges: [
      { title: 'Vlaamse Trainersschool', subtitle: '高等教育 / 学士水準修了' },
      { title: 'カンフーマスター', subtitle: '元100m国際アスリート' },
      { title: '栄養学＆精神指導', subtitle: '公認マスター資格' }
    ]
  },
  [Language.RU]: {
    name: 'Абдельвахид Хабибулла (Abdelwahid Habibullah)',
    titles: ['Элитный тренер по спортивной подготовке', 'Холистический био-тренер', 'Мастер кунг-фу'],
    quote: '«Дисциплина — основа любого прогресса. Подлинные тренировки ставят ясные, измеримые цели для созидания тела, разума и духа.»',
    summary: 'Бывший международный профессиональный спринтер и признанный мастер кунг-фу, Абдельвахид объединяет десятилетия опыта элитного спорта с передовой научной и целостной методологией. Его авторская система сочетает функциональную мощь, строгость традиционных боевых искусств и духовное наставничество для долгосрочной трансформации атлетов.',
    domainsTitle: 'Области экспертизы и дисциплины',
    domains: [
      {
        title: 'Атлетическая и физическая подготовка',
        desc: 'Бывший спринтер мирового уровня (100м), продвинутое кондиционирование, пауэрлифтинг и кросс-тренинг.'
      },
      {
        title: 'Боевые искусства и внутренние практики',
        desc: 'Мастер кунг-фу, интеграция тайцзицюань и традиционной китайской биомеханики движения.'
      },
      {
        title: 'Гимнастика и функциональная сила',
        desc: 'Владение собственным весом, калистеника высокого уровня и сложные составные упражнения.'
      },
      {
        title: 'Био-тренинг и мобильность',
        desc: 'Глубокая растяжка, фасциальная подвижность и всестороннее развитие кардио-выносливости.'
      },
      {
        title: 'Холистический коучинг',
        desc: 'Спортивная нутрициология, гигиена сна и восстановления, ментальная стойкость и духовный баланс.'
      }
    ],
    qualificationsTitle: 'Официальная квалификация и сертификаты',
    qualifications: [
      'Мастер кунг-фу и экс-атлет международного класса (бег 100 м)',
      'Сертифицированный спортивный инструктор — выпускник Фламандской тренерской школы Vlaamse Trainersschool (уровень бакалавра / высшее образование)',
      'Сертифицированный специалист по спортивному питанию (Essentials of Healthy Nutrition)',
      'Сертифицированный наставник по духовному коучингу (Essentials of Spiritual Coaching)'
    ],
    philosophyTitle: 'Философия тренировок',
    philosophyIntro: 'Система подготовки Абдельвахида базируется на двух ключевых принципах:',
    philosophyPoints: [
      {
        title: 'Гимнастика и функциональная сила',
        desc: 'Абсолютный контроль тела в пространстве и взрывная атлетическая мощь.'
      },
      {
        title: 'Интеграция боевых искусств',
        desc: 'Дисциплина, миллиметровая точность движений из вековых традиций в союзе с современной спортивной наукой.'
      }
    ],
    spokenLanguagesTitle: 'Языки общения',
    spokenLanguages: 'Французский, нидерландский, английский, арабский — для четкой коммуникации и персонального коучинга мирового уровня.',
    specializations: [
      'Функциональная сила',
      'Спринт и скорость',
      'Кунг-фу и тайцзи',
      'Спортивное питание',
      'Холистический коучинг'
    ],
    certsBadges: [
      { title: 'Vlaamse Trainersschool', subtitle: 'Высшее образование / Бакалавриат' },
      { title: 'Мастер кунг-фу', subtitle: 'Международный спринтер 100м' },
      { title: 'Питание и духовный коучинг', subtitle: 'Сертификаты Essentials' }
    ]
  }
};
