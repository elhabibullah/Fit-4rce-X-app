/**
 * Fit-4rce X Comprehensive Exercise & Workout Generation Engine
 * Contains an exhaustive encyclopedic repertoire of hundreds of athletic movements
 * across Calisthenics, Core & Planks, Pilates, Yoga, Powerlifting, Bodybuilding, and HIIT.
 */

export interface ExerciseItem {
  name: string;
  description: string;
  equipment: string;
  category: 'push' | 'pull' | 'core' | 'legs' | 'posture' | 'power' | 'cardio';
  canonicalId?: string;
}

/**
 * Maps any multilingual or descriptive exercise name to its canonical 3D animation ID
 */
export function getCanonicalIdForExercise(name: string, category?: string): string {
  if (!name) return 'squat';
  const clean = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

  // 1. Martial arts
  if (clean.includes('cavalier') || clean.includes('mabu') || clean.includes('ma bu') || clean.includes('horse')) return 'martial_mabu';
  if (clean.includes('poing') || clean.includes('punch') || clean.includes('strike')) return 'martial_punch';
  if (clean.includes('paume') || clean.includes('palm') || clean.includes('deflect')) return 'martial_palm';
  if (clean.includes('pied') || clean.includes('kick') || clean.includes('fouette')) return 'martial_kick';
  if (clean.includes('tai chi') || clean.includes('taichi') || clean.includes('qi gong') || clean.includes('respiration')) return 'martial_taichi';

  // 2. Burpee
  if (clean.includes('burpee') || clean.includes('burpe') || clean.includes('берпи')) return 'burpee';

  // 3. Push-up & Dip variations (Pompes, Pompages, Pushups, Press-up)
  if (
    clean.includes('pompe') || clean.includes('pompage') || clean.includes('push_up') || clean.includes('pushup') ||
    clean.includes('push-up') || clean.includes('press-up') || clean.includes('dips') || clean.includes('flexion') ||
    clean.includes('liegestutz') || clean.includes('отжимания') || clean.includes('piegamenti')
  ) {
    return 'push_up';
  }

  // 4. Squat variations
  if (
    clean.includes('squat') || clean.includes('cuisse') || clean.includes('chaise') ||
    clean.includes('sentadilla') || clean.includes('agachamento') || clean.includes('kniebeuge') ||
    clean.includes('присед')
  ) {
    if (clean.includes('pistol')) return 'pistol_squat';
    if (clean.includes('sumo')) return 'sumo_squat';
    return 'squat';
  }

  // 5. Lunges / Fentes
  if (
    clean.includes('fente') || clean.includes('lunge') || clean.includes('zancada') ||
    clean.includes('afundo') || clean.includes('ausfallschritt') || clean.includes('выпад')
  ) {
    if (clean.includes('arriere') || clean.includes('reverse')) return 'reverse_lunge';
    return 'lunge';
  }

  // 6. Planks / Gainage
  if (
    clean.includes('gainage') || clean.includes('planche') || clean.includes('plank') ||
    clean.includes('plancha') || clean.includes('prancha') || clean.includes('hollow') ||
    clean.includes('планка')
  ) {
    return 'plank';
  }

  // 7. Core / Crunch / Abdominals / Situp
  if (
    clean.includes('crunch') || clean.includes('abdo') || clean.includes('situp') ||
    clean.includes('releve de jambe') || clean.includes('releves de jambe') || clean.includes('dragon flag') ||
    clean.includes('скручиван')
  ) {
    return 'crunch';
  }

  // 8. Posterior chain / Glute Bridge / Superman
  if (clean.includes('pont fessier') || clean.includes('glute bridge') || clean.includes('hip thrust')) return 'glute_bridge';
  if (clean.includes('superman') || clean.includes('lombaire') || clean.includes('swan dive')) return 'superman';

  // 9. Back / Pull / Rows
  if (
    clean.includes('traction') || clean.includes('rowing') || clean.includes('row') ||
    clean.includes('tirage') || clean.includes('pull-up') || clean.includes('chin-up')
  ) {
    return 'bent_over_row';
  }

  // 10. Cardio / Jacks / High knees
  if (clean.includes('jack') || clean.includes('saut') || clean.includes('corde') || clean.includes('jump')) return 'jumping_jack';
  if (clean.includes('genoux') || clean.includes('knee')) return 'high_knees';

  // 11. Biceps / Arms
  if (clean.includes('curl') || clean.includes('bicep')) return 'bicep_curl';

  // 12. Shoulders / Overhead
  if (clean.includes('epaule') || clean.includes('shoulder') || clean.includes('overhead') || clean.includes('elevation')) return 'overhead_press';

  // Category fallbacks
  if (category === 'push') return 'push_up';
  if (category === 'legs') return 'squat';
  if (category === 'core') return 'plank';
  if (category === 'pull') return 'bent_over_row';
  if (category === 'cardio') return 'jumping_jack';

  return 'squat';
}

export const CALISTHENICS_POOL: ExerciseItem[] = [
  { name: "Tractions Pronation Strictes", description: "Tirage vertical complet menton au-dessus de la barre, verrouillage scapulaire.", equipment: "pullup_bar", category: "pull" },
  { name: "Tractions Prise Supination", description: "Tirage axé sur le recrutement intense des biceps et du grand dorsal.", equipment: "pullup_bar", category: "pull" },
  { name: "Tractions Prise Large", description: "Écartement large des mains pour maximiser l'ouverture et l'épaisseur du grand dorsal.", equipment: "pullup_bar", category: "pull" },
  { name: "Tractions Commando", description: "Prise neutre le long de la barre avec montée alternée de chaque côté de la tête.", equipment: "pullup_bar", category: "pull" },
  { name: "Tractions Archer", description: "Tirage unilatéral où un bras tire pendant que l'autre s'étend en levier horizontal.", equipment: "pullup_bar", category: "pull" },
  { name: "Tractions Australiennes (Inverted Row)", description: "Tirage horizontal au poids de corps sous barre basse avec corps rigide.", equipment: "pullup_bar", category: "pull" },
  { name: "Dips aux Barres Parallèles", description: "Flexion des coudes à 90° avec buste légèrement incliné pour charger pectoraux et triceps.", equipment: "dip_bars", category: "push" },
  { name: "Dips sur Barre Unique Droite", description: "Dips sur une seule barre horizontale devant soi avec gainage oblique renforcé.", equipment: "pullup_bar", category: "push" },
  { name: "Pompes Déclinées Strictes", description: "Pieds surélevés sur support, trajectoire plongeante ciblant le haut des pectoraux.", equipment: "bodyweight", category: "push" },
  { name: "Pompes Diamant", description: "Index et pouces joints sous le sternum pour un recrutement maximal des triceps.", equipment: "bodyweight", category: "push" },
  { name: "Pompes Pseudo Planche", description: "Mains au niveau de la taille avec bascule avant, préparant la planche de gymnastique.", equipment: "bodyweight", category: "push" },
  { name: "Pompes Pique Épaules (Pike Push-ups)", description: "Hanches levées en V inversé avec poussée verticale vers le sol pour les deltoïdes.", equipment: "bodyweight", category: "push" },
  { name: "Pompes Archer au Sol", description: "Descente latérale sur un seul bras avec l'autre bras tendu sur le côté.", equipment: "bodyweight", category: "push" },
  { name: "Pompes Hindoues (Dive Bomber)", description: "Trajectoire ondulatoire plongeante combinant flexion d'épaules et cambrure thoracique.", equipment: "bodyweight", category: "push" },
  { name: "Pompes Handstand au Mur", description: "Équilibre contre le mur et poussée verticale stricte pour la force des épaules.", equipment: "bodyweight", category: "push" },
  { name: "Relevés de Jambes Suspendu", description: "Pieds montés jusqu'à la barre sans élan, contraction maximale des abdominaux.", equipment: "pullup_bar", category: "core" },
  { name: "Relevés de Genoux avec Torsion", description: "Suspension à la barre avec montées de genoux latérales pour les obliques.", equipment: "pullup_bar", category: "core" },
  { name: "Maintien L-Sit aux Barres", description: "Appui sur les mains avec jambes tendues à l'horizontale en angle droit.", equipment: "dip_bars", category: "core" },
  { name: "Dragon Flag Contrôlé", description: "Élévation du corps entier en appui sur les épaules avec descente lente et droite.", equipment: "bodyweight", category: "core" },
  { name: "Gainage Planche Hollow Body", description: "Rétroversion pelvienne et décollement des omoplates en arc de cercle inversé.", equipment: "bodyweight", category: "core" },
  { name: "Squats Pistol Unilatéraux", description: "Flexion complète sur une jambe avec la jambe opposée tendue vers l'avant.", equipment: "bodyweight", category: "legs" },
  { name: "Squats Sissy au Poids de Corps", description: "Poussée des genoux vers l'avant sur la pointe des pieds avec buste aligné.", equipment: "bodyweight", category: "legs" },
  { name: "Squats Crevette (Shrimp Squats)", description: "Flexion unipodale avec talon arrière maintenu contre le fessier.", equipment: "bodyweight", category: "legs" },
  { name: "Squats Cosaques Latéraux", description: "Flexion profonde sur une jambe avec ouverture latérale et mobilité de cheville.", equipment: "bodyweight", category: "legs" },
  { name: "Fentes Bulgares au Poids de Corps", description: "Pied arrière surélevé, descente verticale profonde renforçant fessier et quadriceps.", equipment: "bodyweight", category: "legs" },
  { name: "Nordic Curls Ischios", description: "Pieds calés, bascule avant contrôlée par la tension excentrique des ischio-jambiers.", equipment: "bodyweight", category: "legs" }
];

export const CORE_PLANK_POOL: ExerciseItem[] = [
  { name: "Gainage Planche Avant sur Coudes", description: "Alignement rigide chevilles-bassin-épaules avec rétroversion active du bassin.", equipment: "mat", category: "core" },
  { name: "Gainage RKC Haute Tension", description: "Planche avec poings serrés et contraction volontaire maximale de tout le corps.", equipment: "mat", category: "core" },
  { name: "Planche Copenhagen Adducteurs", description: "Appui latéral avec jambe supérieure sur banc, renforçant l'aine et les obliques.", equipment: "mat", category: "core" },
  { name: "Planche Latérale avec Élévation de Jambe", description: "Maintien latéral sur un avant-bras avec abduction de la jambe supérieure.", equipment: "mat", category: "core" },
  { name: "Planche Latérale avec Torsion du Buste", description: "Passage du bras sous le flanc puis ouverture vers le ciel avec rotation thoracique.", equipment: "mat", category: "core" },
  { name: "Gainage Bateau (Hollow Body Hold)", description: "Bas du dos plaqué au sol, bras et jambes décollés en tension continue.", equipment: "mat", category: "core" },
  { name: "Hollow Body Rocks", description: "Bascule fluide avant-arrière tout en maintenant la forme indéformable de cuillère.", equipment: "mat", category: "core" },
  { name: "Relevés de Bassin Chandelle", description: "Enroulement du bas du ventre et poussée verticale des pieds vers le plafond.", equipment: "mat", category: "core" },
  { name: "Roulette Abdominale (Ab Wheel Rollout)", description: "Extension contrôlée vers l'avant au ras du sol avec retour par les abdominaux.", equipment: "mat", category: "core" },
  { name: "Deadbug Croisé Contrôlé", description: "Sur le dos, extension simultanée du bras droit et jambe gauche sans cambrer.", equipment: "mat", category: "core" },
  { name: "Bird-Dog Isométrique", description: "À 4 pattes, extension horizontale bras/jambe opposés avec verrouillage lombo-pelvien.", equipment: "mat", category: "core" },
  { name: "Planche Spiderman aux Coudes", description: "Flexion alternée du genou vers le coude extérieur pour engager les obliques.", equipment: "mat", category: "core" },
  { name: "Gainage Marche de l'Ours Isométrique", description: "Position 4 pattes genoux décollés de 2cm du sol sous tension permanente.", equipment: "mat", category: "core" },
  { name: "Essuie-Glaces Abdominaux au Sol", description: "Jambes levées à 90° pivotant de gauche à droite sans décoller les épaules.", equipment: "mat", category: "core" },
  { name: "Russian Twists Contrôlés", description: "Buste incliné en équilibre fessier avec rotation maîtrisée des épaules d'un flanc à l'autre.", equipment: "mat", category: "core" },
  { name: "Gainage Planche Commando (Up-Down)", description: "Alternance continue entre appui sur les coudes et appui sur les paumes de mains.", equipment: "mat", category: "core" },
  { name: "Crunch Bicyclette Lente", description: "Rotation lente coude-genou opposé avec extension complète de la jambe libre.", equipment: "mat", category: "core" },
  { name: "Planche Étoile en Extension", description: "Mains et pieds largement écartés au sol créant un bras de levier extrême.", equipment: "mat", category: "core" },
  { name: "Gainage Superman Chaîne Postérieure", description: "À plat ventre, décollement simultané poitrine et cuisses pour les érecteurs du rachis.", equipment: "mat", category: "posture" }
];

export const PILATES_POOL: ExerciseItem[] = [
  { name: "The Hundred (La Centaine)", description: "100 battements toniques des bras au ras du sol avec engagement profond du transverse.", equipment: "mat", category: "core" },
  { name: "The Roll Up", description: "Enroulement vertébral fluide vertèbre après vertèbre depuis la position allongée.", equipment: "mat", category: "core" },
  { name: "The Roll Over", description: "Passage contrôlé des jambes au-delà de la tête avec écartement et descente freinée.", equipment: "mat", category: "core" },
  { name: "Single Leg Circles", description: "Cercles amples de la jambe tendue avec immobilité absolue du bassin au sol.", equipment: "mat", category: "legs" },
  { name: "Rolling Like a Ball", description: "Roulade en boule compacte sur la colonne vertébrale avec équilibre fessier à la remontée.", equipment: "mat", category: "core" },
  { name: "Single Leg Stretch", description: "Tirage alterné genou-poitrine avec l'autre jambe tendue à 45° et transverse engagé.", equipment: "mat", category: "core" },
  { name: "Double Leg Stretch", description: "Ouverture simultanée des bras et des jambes en étoile avec retour fluide.", equipment: "mat", category: "core" },
  { name: "Spine Stretch Forward", description: "Étirement de la colonne vertébrale vers l'avant assis jambes tendues en respirant.", equipment: "mat", category: "posture" },
  { name: "The Saw (La Scie)", description: "Rotation thoracique assise avec découpe du petit orteil par la main opposée.", equipment: "mat", category: "posture" },
  { name: "The Swan Dive", description: "Extension cambrée du haut du dos avec bascule équilibrée sur le thorax.", equipment: "mat", category: "posture" },
  { name: "Single Leg Kick", description: "Appui sphinx avec doubles battements de talons vers les fessiers en stabilisant le bassin.", equipment: "mat", category: "legs" },
  { name: "Double Leg Kick", description: "Mains dans le dos, double frappe des talons puis extension complète bras et torse.", equipment: "mat", category: "posture" },
  { name: "The Neck Pull", description: "Mains derrière la nuque, montée vertébrale stricte avec étirement frontal.", equipment: "mat", category: "core" },
  { name: "The Scissors (Les Ciseaux)", description: "Bassin surélevé dans les mains, ciseaux verticaux amples des jambes tendues.", equipment: "mat", category: "legs" },
  { name: "The Bicycle", description: "Grand mouvement circulaire de pédalage aérien jambes tendues en rétroversion.", equipment: "mat", category: "legs" },
  { name: "Shoulder Bridge Pilates", description: "Pont fessier d'épaules avec battements de jambe verticaux et pointes de pieds tendues.", equipment: "mat", category: "legs" },
  { name: "The Spine Twist", description: "Torsion segmentaire de la cage thoracique en position assise sans bouger le bassin.", equipment: "mat", category: "posture" },
  { name: "Side Kick Series - Front & Back", description: "Couché sur le côté, balancier avant-arrière contrôlé de la jambe sans bouger le tronc.", equipment: "mat", category: "legs" },
  { name: "Side Kick Series - Up & Down", description: "Élévation verticale de la jambe tendue avec contrôle des stabilisateurs de hanche.", equipment: "mat", category: "legs" },
  { name: "The Teaser (La Bascule en V)", description: "Montée simultanée en V assis sur les ischions avec bras parallèles aux jambes.", equipment: "mat", category: "core" },
  { name: "The Hip Twist", description: "En appui arrière sur les mains, cercles complets décrits par les jambes jointes.", equipment: "mat", category: "core" },
  { name: "Swimming Pilates", description: "À plat ventre, battements croisés rapides bras et jambes opposés en suspension.", equipment: "mat", category: "posture" },
  { name: "Leg Pull Front", description: "Planche haute avec levée alternée des pointes de pieds sous tension axiale.", equipment: "mat", category: "core" },
  { name: "Leg Pull Back", description: "Planche inversée face au plafond avec élévation dynamique de jambe.", equipment: "mat", category: "posture" },
  { name: "The Side Bend", description: "Appui sur une main, arc de cercle latéral montant le bassin vers le ciel.", equipment: "mat", category: "core" },
  { name: "The Boomerang", description: "Enchaînement fluide enroulement arrière, ciseaux, teaser et étirement bras arrière.", equipment: "mat", category: "core" },
  { name: "The Seal (L'Otarie)", description: "Mains sous les chevilles, roulade dorsale avec battements de pieds synchronisés.", equipment: "mat", category: "core" },
  { name: "Control Balance", description: "Renversement complet sur les épaules avec maintien de cheville et étirement.", equipment: "mat", category: "posture" }
];

export const YOGA_POOL: ExerciseItem[] = [
  { name: "Salutation au Soleil (Surya Namaskar)", description: "Enchaînement fluide synchronisant le souffle, la flexion avant et l'extension du dos.", equipment: "mat", category: "posture" },
  { name: "Posture du Guerrier I (Virabhadrasana I)", description: "Fente avant haute avec hanches orientées de face et bras tendus vers le ciel.", equipment: "mat", category: "legs" },
  { name: "Posture du Guerrier II (Virabhadrasana II)", description: "Ancrage des pieds au sol, regard au-dessus du majeur avant et ouverture des hanches.", equipment: "mat", category: "legs" },
  { name: "Posture du Guerrier III (Virabhadrasana III)", description: "Équilibre unipodal en T horizontal parfait de la tête au talon arrière.", equipment: "mat", category: "legs" },
  { name: "Chien Tête en Bas (Adho Mukha Svanasana)", description: "Poussée des paumes au sol, ischions pointés vers le ciel et allongement de la colonne.", equipment: "mat", category: "posture" },
  { name: "Chien Tête en Haut (Urdhva Mukha Svanasana)", description: "Extension du thorax, cuisses décollées du sol et appui sur le dessus des pieds.", equipment: "mat", category: "posture" },
  { name: "Posture du Triangle (Trikonasana)", description: "Jambes écartées tendues, inclinaison latérale avec ouverture de la cage thoracique.", equipment: "mat", category: "posture" },
  { name: "Angle Latéral Étiré (Parsvakonasana)", description: "Fente latérale profonde avec étirement oblique continu du talon au bout des doigts.", equipment: "mat", category: "legs" },
  { name: "Posture de l'Arbre (Vrksasana)", description: "Ancrage d'un pied au sol, plante opposée contre la cuisse et mains en prière.", equipment: "mat", category: "posture" },
  { name: "Posture de la Demi-Lune (Ardha Chandrasana)", description: "Équilibre sur une main et un pied avec bassin et épaules ouverts latéralement.", equipment: "mat", category: "posture" },
  { name: "Posture de l'Aigle (Garudasana)", description: "Enroulement des jambes et des bras l'un autour de l'autre en flexion profonde.", equipment: "mat", category: "legs" },
  { name: "Posture du Danseur (Natarajasana)", description: "Prise du pied arrière avec cambrure gracieuse et bascule vers l'avant.", equipment: "mat", category: "posture" },
  { name: "Posture de la Chaise (Utkatasana)", description: "Flexion des genoux avec poids dans les talons et bras étirés dans l'axe du dos.", equipment: "mat", category: "legs" },
  { name: "Posture du Corbeau (Bakasana)", description: "Équilibre sur les mains avec genoux posés sur les triceps et pieds décollés du sol.", equipment: "mat", category: "power" },
  { name: "Posture du Cobra (Bhujangasana)", description: "Extension douce du thorax avec paumes à plat au sol sans comprimer les lombaires.", equipment: "mat", category: "posture" },
  { name: "Posture de l'Arc (Dhanurasana)", description: "Prise des chevilles à plat ventre avec élévation simultanée du buste et des cuisses.", equipment: "mat", category: "posture" },
  { name: "Posture du Chameau (Ustrasana)", description: "À genoux, ouverture de la cage thoracique vers le ciel avec mains touchant les talons.", equipment: "mat", category: "posture" },
  { name: "Posture de la Roue (Urdhva Dhanurasana)", description: "Extension complète du corps en pont arrière en poussant sur les pieds et les mains.", equipment: "mat", category: "posture" },
  { name: "Posture du Poisson (Matsyasana)", description: "Cambrure du haut du dos avec sommet de la tête effleurant le sol et poitrine ouverte.", equipment: "mat", category: "posture" },
  { name: "Demi-Torsion Assise (Ardha Matsyendrasana)", description: "Torsion axiale de la colonne vertébrale stimulant les organes abdominaux.", equipment: "mat", category: "posture" },
  { name: "Posture de la Pince Assise (Paschimottanasana)", description: "Flexion avant complète buste contre cuisses avec allongement du bas du dos.", equipment: "mat", category: "posture" },
  { name: "Posture du Pigeon (Eka Pada Rajakapotasana)", description: "Ouverture profonde du fessier et du psoas avec hanches au carré.", equipment: "mat", category: "posture" },
  { name: "Posture de la Chandelle (Sarvangasana)", description: "Inversion verticale stable reposant sur les épaules avec colonne allongée.", equipment: "mat", category: "posture" },
  { name: "Posture de la Charrue (Halasana)", description: "Bascule des jambes tendues par-dessus la tête jusqu'à poser les orteils au sol.", equipment: "mat", category: "posture" }
];

export const POWERLIFTING_POOL: ExerciseItem[] = [
  { name: "Squat Arrière Barre Olympique", description: "Descente contrôlée sous la parallèle avec barre sur les trapèzes et poussée talon.", equipment: "barbell", category: "legs" },
  { name: "Squat avec Pause 2s au Point Mort", description: "Arrêt complet en bas du squat éliminant l'élasticité pour recruter la force pure.", equipment: "barbell", category: "legs" },
  { name: "Box Squat Barre Libre", description: "Assise contrôlée sur caisson avec relâchement partiel des fléchisseurs avant impulsion.", equipment: "barbell", category: "legs" },
  { name: "Front Squat Barre Olympique", description: "Barre sur les clavicules, coudes hauts et buste droit ciblant massivement les quadriceps.", equipment: "barbell", category: "legs" },
  { name: "Développé Couché Prise Compétition", description: "Arche dorsale, omoplates verrouillées et descente contrôlée jusqu'au contact sternal.", equipment: "barbell", category: "push" },
  { name: "Développé Couché Prise Serrée", description: "Mains écartées de la largeur des épaules pour une poussée maximale des triceps.", equipment: "barbell", category: "push" },
  { name: "Développé Couché Spoto Press", description: "Arrêt net de la barre à 2cm de la poitrine sans contact avant remontée explosive.", equipment: "barbell", category: "push" },
  { name: "Développé au Sol (Floor Press)", description: "Couché au sol, arrêt des coudes à plat coupant l'élan pour renforcer le verrouillage haut.", equipment: "barbell", category: "push" },
  { name: "Soulevé de Terre Conventionnel", description: "Pieds sous la barre, dos rigide et poussée des jambes combinée à l'ouverture des hanches.", equipment: "barbell", category: "power" },
  { name: "Soulevé de Terre Sumo", description: "Pieds très écartés vers les disques, torse vertical et activation forte des fessiers/adducteurs.", equipment: "barbell", category: "power" },
  { name: "Soulevé de Terre en Déficit 5cm", description: "Pieds surélevés sur disque augmentant l'amplitude pour travailler le décollage du sol.", equipment: "barbell", category: "power" },
  { name: "Soulevé de Terre Départ Blocs (Block Pull)", description: "Barre surélevée au niveau des tibias permettant de surcharger le verrouillage des hanches.", equipment: "barbell", category: "power" },
  { name: "Soulevé de Terre Roumain Lourd", description: "Charnière de hanche stricte avec genoux semi-fléchis étirant les ischio-jambiers.", equipment: "barbell", category: "power" },
  { name: "Développé Militaire Debout Strict", description: "Poussée verticale sans aide des genoux avec trajectoire de barre au ras du visage.", equipment: "barbell", category: "push" },
  { name: "Push Press Barre Olympique", description: "Légère flexion-extension des genoux transférant l'énergie des jambes vers la barre.", equipment: "barbell", category: "push" },
  { name: "Rowing Pendlay Strict Départ Sol", description: "Torse strictement parallèle au sol, tirage explosif sans tricherie du bas du dos.", equipment: "barbell", category: "pull" },
  { name: "Rowing Barre Buste Penché (Yates)", description: "Tirage vers le nombril avec prise supination pour densifier le grand dorsal.", equipment: "barbell", category: "pull" },
  { name: "Good Mornings Barre Nuque", description: "Flexion avant de hanche dos droit renforçant les érecteurs du rachis et fessiers.", equipment: "barbell", category: "power" },
  { name: "Hip Thrust Barre Olympique", description: "Élévation du bassin avec haut du dos calé sur banc et contraction fessière maximale.", equipment: "barbell", category: "legs" }
];

export const HYPERTROPHY_POOL: ExerciseItem[] = [
  { name: "Développé Incliné aux Haltères", description: "Banc à 30°, tension continue sur le faisceau claviculaire des pectoraux.", equipment: "dumbbells", category: "push" },
  { name: "Écartés Couché Haltères Contrôlés", description: "Ouverture large des bras avec coudes fléchis pour un étirement profond du grand pectoral.", equipment: "dumbbells", category: "push" },
  { name: "Rowing Bûcheron Unilatéral Haltère", description: "Un genou sur banc, tirage coude vers la hanche pour isoler le grand dorsal.", equipment: "dumbbells", category: "pull" },
  { name: "Pullover Haltère Cage Thoracique", description: "Couché en travers d'un banc, descente de l'haltère bras tendus derrière la tête.", equipment: "dumbbells", category: "pull" },
  { name: "Développé Épaules Arnold avec Rotation", description: "Départ paumes vers soi et rotation vers l'extérieur pendant la poussée.", equipment: "dumbbells", category: "push" },
  { name: "Élévations Latérales Haltères", description: "Montée des coudes à hauteur d'épaules avec petit doigt légèrement surélevé.", equipment: "dumbbells", category: "push" },
  { name: "Oiseau Buste Penché Deltoïde Arrière", description: "Écartement des bras buste incliné pour cibler le faisceau postérieur des deltoïdes.", equipment: "dumbbells", category: "pull" },
  { name: "Fentes Bulgares Haltères en Mains", description: "Pied arrière sur banc, charge lourde dans les mains ciblant fessier et vaste externe.", equipment: "dumbbells", category: "legs" },
  { name: "Fentes Marchées avec Haltères", description: "Pas avant réguliers avec genou frôlant le sol et buste gainé.", equipment: "dumbbells", category: "legs" },
  { name: "Soulevé de Terre Jambes Tendues Haltères", description: "Descente lente des haltères le long des tibias avec étirement des ischios.", equipment: "dumbbells", category: "legs" },
  { name: "Curl Biceps Incliné sur Banc", description: "Banc incliné à 45° plaçant le chef long du biceps dans un étirement biomécanique maximal.", equipment: "dumbbells", category: "pull" },
  { name: "Curl Marteau Brachial Haltères", description: "Prise neutre renforçant le muscle brachial antérieur et le brachio-radial.", equipment: "dumbbells", category: "pull" },
  { name: "Barre au Front / Extension Triceps", description: "Couché sur banc, flexion des coudes amenant la charge au ras du front.", equipment: "dumbbells", category: "push" }
];

export const FITNESS_HIIT_POOL: ExerciseItem[] = [
  { name: "Squats Biomécaniques Tempo 3-0-1", description: "Descente en 3 secondes et remontée explosive avec talons cloués au sol.", equipment: "bodyweight", category: "legs" },
  { name: "Pompes Strictes avec Pause Poitrine", description: "Poitrine au sol avec pause d'une seconde éliminant tout rebond élastique.", equipment: "bodyweight", category: "push" },
  { name: "Fentes Alternées Arrière", description: "Pas arrière contrôlé préservant l'axe rotulien du genou avant.", equipment: "bodyweight", category: "legs" },
  { name: "Mountain Climbers Cardio", description: "Course horizontale en appui sur les mains avec genoux montant vers le plexus.", equipment: "bodyweight", category: "cardio" },
  { name: "Gainage Planche Jumping Jacks", description: "Maintien de la planche tout en écartant et resserrant les pieds en rythme.", equipment: "bodyweight", category: "core" },
  { name: "Burpees Complets Poitrine Sol", description: "Descente au sol, pompe complète et saut vertical avec extension des bras.", equipment: "bodyweight", category: "cardio" },
  { name: "Skater Jumps Latéraux", description: "Bonds latéraux d'un pied sur l'autre avec réception stable sur genou fléchi.", equipment: "bodyweight", category: "cardio" },
  { name: "Squats Sautés Explosifs", description: "Flexion complète suivie d'une détente verticale maximale avec atterrissage amorti.", equipment: "bodyweight", category: "legs" },
  { name: "Marche de l'Ours Dynamique (Bear Crawl)", description: "Déplacement au ras du sol à quatre pattes renforçant la coordination croisée.", equipment: "bodyweight", category: "cardio" }
];

/**
 * Intelligent Shuffler & Selector
 * Picks 5 diverse, non-repetitive exercises across complementary kinetic categories.
 */
export function generateSmartWorkout(
  workoutType: string,
  targetSets: number,
  targetReps: number,
  restBetweenSets: number,
  language: string = 'fr',
  equipment: string = 'bodyweight'
): { title: string; description: string; exercises: any[] } {
  const norm = (workoutType || '').toLowerCase();
  let pool: ExerciseItem[];
  let baseTitleFr = 'Programme Personnalisé';
  let baseTitleEn = 'Personalized Routine';

  if (norm.includes('yoga') || norm.includes('йог') || norm.includes('瑜伽') || norm.includes('يوغا')) {
    pool = YOGA_POOL;
    baseTitleFr = 'Vinyasa & Mobilité Posturale';
    baseTitleEn = 'Vinyasa & Postural Mobility';
  } else if (norm.includes('calisthenic') || norm.includes('calisthénie') || norm.includes('كاليست') || norm.includes('自重')) {
    pool = CALISTHENICS_POOL;
    baseTitleFr = 'Calisthénie & Maîtrise Corporelle';
    baseTitleEn = 'Calisthenics & Body Mastery';
  } else if (norm.includes('pilate') || norm.includes('بيلاتس') || norm.includes('ピラティス') || norm.includes('普拉提')) {
    pool = PILATES_POOL;
    baseTitleFr = 'Pilates & Centre Profond';
    baseTitleEn = 'Pilates Core & Alignment';
  } else if (norm.includes('power') || norm.includes('force') || norm.includes('fuerza') || norm.includes('قوة')) {
    pool = POWERLIFTING_POOL;
    baseTitleFr = 'Force Athlétique & Barres Lourdes';
    baseTitleEn = 'Powerlifting & Absolute Strength';
  } else if (norm.includes('mass') || norm.includes('hypertrophi') || norm.includes('muscu') || norm.includes('dumbbell')) {
    pool = HYPERTROPHY_POOL;
    baseTitleFr = 'Volume Musculaire & Isolation';
    baseTitleEn = 'Hypertrophy & Muscle Sculpt';
  } else if (norm.includes('abdo') || norm.includes('gainage') || norm.includes('plank') || norm.includes('core')) {
    pool = CORE_PLANK_POOL;
    baseTitleFr = 'Ceinture Abdominale & Gainage';
    baseTitleEn = 'Core Fortification & Planks';
  } else {
    pool = FITNESS_HIIT_POOL;
    baseTitleFr = 'Conditioning & Métabolisme';
    baseTitleEn = 'Conditioning & Metabolism';
  }

  // Shuffle pool to ensure unique variety every time
  const shuffled = [...pool].sort(() => 0.5 - Math.random());
  
  // Pick up to 5 distinct exercises with diverse categories
  const selected: ExerciseItem[] = [];
  const usedCategories = new Set<string>();

  // Pass 1: pick from different categories if possible
  for (const item of shuffled) {
    if (!usedCategories.has(item.category) && selected.length < 5) {
      selected.push(item);
      usedCategories.add(item.category);
    }
  }

  // Pass 2: fill remaining slots up to 5
  for (const item of shuffled) {
    if (selected.length >= 5) break;
    if (!selected.some(s => s.name === item.name)) {
      selected.push(item);
    }
  }

  const isFr = (language || 'fr').startsWith('fr');

  return {
    title: `Fit-4rce X • ${isFr ? baseTitleFr : baseTitleEn}`,
    description: isFr 
      ? `Protocole calibré de 5 mouvements haute précision (${targetSets} séries × ${targetReps} reps • ${restBetweenSets}s de pause).`
      : `High-precision 5-movement protocol (${targetSets} sets × ${targetReps} reps • ${restBetweenSets}s rest).`,
    exercises: selected.map(ex => ({
      name: ex.name,
      description: ex.description,
      equipment: ex.equipment,
      canonicalId: ex.canonicalId || getCanonicalIdForExercise(ex.name, ex.category),
      sets: targetSets,
      reps: targetReps,
      restSeconds: restBetweenSets
    }))
  };
}
