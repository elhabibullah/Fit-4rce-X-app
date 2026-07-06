export interface SprintExercise {
  id: string;
  nameEn: string;
  nameFr: string;
  distance?: string;
  intensityEn?: string;
  intensityFr?: string;
  targetTimeEn?: string;
  targetTimeFr?: string;
  recoveryEn?: string;
  recoveryFr?: string;
  notesEn: string;
  notesFr: string;
  setsRepsEn: string;
  setsRepsFr: string;
  isHillWork?: boolean;
}

export interface SprintWorkoutPlan {
  titleEn: string;
  titleFr: string;
  descriptionEn: string;
  descriptionFr: string;
  warmupEn: string[];
  warmupFr: string[];
  drillsEn: string[];
  drillsFr: string[];
  mainExercises: SprintExercise[];
  cooldownEn: string[];
  cooldownFr: string[];
}

export const SPRINT_PLANS: Record<string, Record<string, Record<string, SprintWorkoutPlan>>> = {
  '100m': {
    'beginner': {
      'combination': {
        titleEn: "100m Foundation & Acceleration Combo",
        titleFr: "Combinaison Accélération & Fondations 100m",
        descriptionEn: "A foundational track routine designed to build explosive push mechanics, technical stride coordination, and basic speed durability.",
        descriptionFr: "Un protocole de piste fondamental conçu pour développer la mécanique de poussée, la coordination technique et la vitesse de base.",
        warmupEn: [
          "2 laps very easy jogging (800m) around the track",
          "Dynamic joint mobility (hip rotations, ankle rolls, leg swings)",
          "3x 30m light progressive acceleration runs (60%, 70%, 80% speed)"
        ],
        warmupFr: [
          "2 tours de piste footing lent (800m)",
          "Mobilisations articulaires dynamiques (hanches, chevilles, genoux)",
          "3x 30m accélérations progressives (65%, 75%, 85% vitesse)"
        ],
        drillsEn: [
          "2x 20m High Knees (Montées de genoux) - focus on upright posture",
          "2x 20m A-Skips - emphasize ground-strike with forefoot",
          "2x 20m Butt Kicks (Talons-fesses) - rapid turnover"
        ],
        drillsFr: [
          "2x 20m Montées de genoux - buste droit et aligné",
          "2x 20m Griffés de sol (A-skips) - contact avant-pied actif",
          "2x 20m Talons-fesses - cadence rapide"
        ],
        mainExercises: [
          {
            id: 'power_hill',
            nameEn: "Uphill Power Drive Sprints",
            nameFr: "Sprint de Puissance en Côte Courte",
            distance: "30m (uphill)",
            intensityEn: "90% Max Effort",
            intensityFr: "90% d'effort max",
            targetTimeEn: "Power Focus (approx. 5.5s - 6.5s)",
            targetTimeFr: "Focus Puissance (env. 5.5s - 6.5s)",
            recoveryEn: "Slow walk back to bottom, rest 90 seconds",
            recoveryFr: "Descente en marchant lentement, 90s de repos",
            notesEn: "Find a gentle 5-8% incline. Focus on driving knees high and pumping arms aggressively.",
            notesFr: "Sur une pente douce de 5 à 8%. Poussez fort sur le sol avec vos appuis, bras à 90°.",
            setsRepsEn: "1 Set x 3 Reps",
            setsRepsFr: "1 Série x 3 Reps",
            isHillWork: true
          },
          {
            id: 'sprint_100m_1',
            nameEn: "Main Sprint - Build Up",
            nameFr: "Série Principale - Vitesse 1",
            distance: "100m",
            intensityEn: "85% Target Intensity",
            intensityFr: "85% d'intensité cible",
            targetTimeEn: "16.0s - 17.0s",
            targetTimeFr: "16.0s - 17.0s",
            recoveryEn: "Walk back 100m (approx. 3 mins complete rest)",
            recoveryFr: "Retour marche lente 100m (env. 3 min repos)",
            notesEn: "Focus on staying relaxed. Do not tense your shoulders or clench your jaw.",
            notesFr: "Restez relâché. Épaules basses, mâchoire détendue, foulée fluide.",
            setsRepsEn: "1 Set x 2 Reps",
            setsRepsFr: "1 Série x 2 Reps"
          },
          {
            id: 'sprint_100m_2',
            nameEn: "Main Sprint - Peak Velocity",
            nameFr: "Série Principale - Vitesse Maximale",
            distance: "100m",
            intensityEn: "95% Max Effort",
            intensityFr: "95% d'effort max",
            targetTimeEn: "15.0s - 15.8s",
            targetTimeFr: "15.0s - 15.8s",
            recoveryEn: "Walk back 100m, wait 4 minutes for full ATP replenishment",
            recoveryFr: "Retour marche lente 100m, 4 min repos complet (recharge ATP)",
            notesEn: "Explosive acceleration for the first 30m, then float and maintain speed.",
            notesFr: "Accélération explosive sur les 30 premiers mètres, puis maintenez la vitesse.",
            setsRepsEn: "1 Set x 2 Reps",
            setsRepsFr: "1 Série x 2 Reps"
          }
        ],
        cooldownEn: [
          "400m slow walking to flush lactic acid",
          "Light static stretching (calves, hamstrings, hip flexors)",
          "Diaphragmatic box breathing (4s inhale, 4s hold, 4s exhale, 4s hold)"
        ],
        cooldownFr: [
          "400m de marche très lente pour éliminer l'acide lactique",
          "Étirements statiques légers (mollets, ischio-jambiers, psoas)",
          "Respiration diaphragmatique carrée (4s inspi, 4s apnée, 4s expi, 4s apnée)"
        ]
      },
      'running': {
        titleEn: "100m Technical Sprint Protocol",
        titleFr: "Protocole Technique Pur Sprint 100m",
        descriptionEn: "Focused purely on starting block acceleration mechanics and maximal velocity mechanics.",
        descriptionFr: "Concentré purement sur la phase de mise en action et la vitesse maximale sur 100m.",
        warmupEn: ["2 laps jog", "Joint mobilization"],
        warmupFr: ["2 tours de piste footing lent", "Mobilisations articulaires"],
        drillsEn: ["Montées de genoux 2x30m", "Foulées rasantes 2x30m"],
        drillsFr: ["Montées de genoux 2x30m", "Foulées rasantes 2x30m"],
        mainExercises: [
          {
            id: 'sprint_start',
            nameEn: "Acceleration Phase Starts",
            nameFr: "Mise en action / Départ debout",
            distance: "40m",
            intensityEn: "95% Effort",
            intensityFr: "95% d'effort",
            targetTimeEn: "Power acceleration focus (approx. 6.5s - 7.2s)",
            targetTimeFr: "Accélération pure (env. 6.5s - 7.2s)",
            recoveryEn: "Walk back slowly + 90s rest",
            recoveryFr: "Retour en marchant + 90s de repos",
            notesEn: "Focus on explosive initial pushing steps (low heel recovery).",
            notesFr: "Poussez fort vers l'avant, restez penché sur les 15 premiers mètres.",
            setsRepsEn: "1 Set x 4 Reps",
            setsRepsFr: "1 Série x 4 Reps"
          },
          {
            id: 'sprint_100m_max',
            nameEn: "Core Sprint Reps",
            nameFr: "Sprint de Référence 100m",
            distance: "100m",
            intensityEn: "95% Max Effort",
            intensityFr: "95% d'effort max",
            targetTimeEn: "15.0s - 16.0s",
            targetTimeFr: "15.0s - 16.0s",
            recoveryEn: "Walk back 100m, rest 4 minutes",
            recoveryFr: "Retour marche lente 100m, 4 min repos complet",
            notesEn: "Focus on running tall and driving elbows back.",
            notesFr: "Grandissez-vous, tirez les coudes bien vers l'arrière.",
            setsRepsEn: "1 Set x 4 Reps",
            setsRepsFr: "1 Série x 4 Reps"
          }
        ],
        cooldownEn: ["400m walk", "Light stretching"],
        cooldownFr: ["400m de marche", "Étirements légers"]
      },
      'plyo': {
        titleEn: "100m Track Plyometrics & Elasticity",
        titleFr: "Pliométrie Piste & Élasticité 100m",
        descriptionEn: "Designed to improve reactive ground-contact times and elastic energy return.",
        descriptionFr: "Conçu pour réduire le temps de contact au sol et améliorer le renvoi élastique.",
        warmupEn: ["1 lap jog", "High skips (Skips verticaux) 3x20m"],
        warmupFr: ["1 tour footing lent", "Sauts verticaux alternés (skips) 3x20m"],
        drillsEn: ["Ankle hops 3x10m", "Bounds 3x15m"],
        drillsFr: ["Sauts de chevilles (cheville réactive) 3x10m", "Foulées bondissantes 3x15m"],
        mainExercises: [
          {
            id: 'bounds_max',
            nameEn: "Continuous Track Bounding",
            nameFr: "Foulées Bondissantes Actives",
            distance: "30m",
            intensityEn: "Elastic Max",
            intensityFr: "Élastique Max",
            targetTimeEn: "High reactivity focus",
            targetTimeFr: "Focus réactivité d'appui",
            recoveryEn: "Walk back to start + 2 mins rest",
            recoveryFr: "Retour marche + 2 min de repos",
            notesEn: "Focus on active clawing action of the feet and hanging in the air.",
            notesFr: "Cherchez la suspension aérienne et un griffé de sol agressif.",
            setsRepsEn: "3 Sets x 1 Rep",
            setsRepsFr: "3 Séries x 1 Rep"
          },
          {
            id: 'vertical_tuck',
            nameEn: "Explosive Tuck Jumps",
            nameFr: "Sauts Groupés Verticaux",
            distance: "N/A",
            intensityEn: "100% Power",
            intensityFr: "100% de puissance",
            targetTimeEn: "Max power output",
            targetTimeFr: "Puissance explosive maximale",
            recoveryEn: "Rest 90 seconds between sets",
            recoveryFr: "Repos 90 secondes entre chaque série",
            notesEn: "Minimize ground contact time. Pull knees to chest instantly upon landing.",
            notesFr: "Temps de contact au sol minimal. Remontez les genoux à la poitrine immédiatement.",
            setsRepsEn: "4 Sets x 6 Reps",
            setsRepsFr: "4 Séries x 6 Reps"
          }
        ],
        cooldownEn: ["400m easy walk", "Static stretching"],
        cooldownFr: ["400m marche", "Étirements statiques"]
      },
      'power': {
        titleEn: "100m Explosive Power & Hill Drive",
        titleFr: "Force Explosive & Sprints en Côte 100m",
        descriptionEn: "Heavy resistance and incline sprint power designed to build deep starting acceleration.",
        descriptionFr: "Travail en pente et résistance conçu pour développer une force de démarrage puissante.",
        warmupEn: ["2 laps jog", "Sprint progressions 3x40m"],
        warmupFr: ["2 tours footing lent", "Sprints progressifs 3x40m"],
        drillsEn: ["Hips mobilization", "Calf walks"],
        drillsFr: ["Mobilisations hanches", "Marche active sur pointes de pieds"],
        mainExercises: [
          {
            id: 'hill_power_60m',
            nameEn: "Incline Power Repetitions",
            nameFr: "Répétitions explosives en côte",
            distance: "50m (uphill)",
            intensityEn: "95% Intensity",
            intensityFr: "95% d'intensité",
            targetTimeEn: "Uphill Power Focus",
            targetTimeFr: "Puissance Poussée Côte",
            recoveryEn: "Slow walk back to start + 2 mins rest",
            recoveryFr: "Descente en marche lente + 2 min de repos",
            notesEn: "Power out of a 3-point start. Drive uphill, pumping arms.",
            notesFr: "Départ 3 appuis. Poussez vers l'avant en résistant à la gravité, regard vers l'avant.",
            setsRepsEn: "1 Set x 5 Reps",
            setsRepsFr: "1 Série x 5 Reps",
            isHillWork: true
          }
        ],
        cooldownEn: ["500m slow walking", "Deep tissue stretching"],
        cooldownFr: ["500m marche lente", "Étirements profonds"]
      }
    },
    'intermediate': {
      'combination': {
        titleEn: "100m Athletic Power & Velocity",
        titleFr: "Puissance Athlétique & Vitesse 100m",
        descriptionEn: "An intense combinations of explosive plyo bounding, block acceleration drills, and peak speed intervals.",
        descriptionFr: "Une combinaison de pliométrie réactive, d'accélérations de départ, et d'intervalles de vitesse de pointe.",
        warmupEn: [
          "2 laps progressive track jog (first lap easy, second faster)",
          "Dynamic sports stretching (lunges, leg kicks, A-skip walks)",
          "3x 50m progressive starts (70%, 80%, 90% velocity)"
        ],
        warmupFr: [
          "2 tours de piste progressifs (1er tour lent, 2e plus rapide)",
          "Échauffement dynamique (fentes marchées, battements, montées de genoux actives)",
          "3x 50m accélérations de départ (75%, 85%, 95% vitesse)"
        ],
        drillsEn: [
          "2x 30m A-Skips (highly active forefoot drive)",
          "2x 30m B-Skips (clawing extension and pull-through)",
          "2x 20m High knees with rapid transition to float"
        ],
        drillsFr: [
          "2x 30m Griffés de sol (A-skips actifs)",
          "2x 30m Griffés avec extension (B-skips)",
          "2x 20m Montées de genoux rapides en transition"
        ],
        mainExercises: [
          {
            id: 'plyo_bounding',
            nameEn: "Reactive Double-Leg Bounds",
            nameFr: "Foulées Bondissantes d'Élasticité",
            distance: "40m",
            intensityEn: "Max Elastic Effort",
            intensityFr: "Effort élastique maximal",
            targetTimeEn: "High reactive springiness",
            targetTimeFr: "Dynamisme d'appui maximal",
            recoveryEn: "Walk back to start, rest 2 minutes",
            recoveryFr: "Retour marche lente, 2 min de repos",
            notesEn: "Maximize jump height and horizontal distance with each stride.",
            notesFr: "Cherchez la projection vers l'avant et la rigidité de la cheville au sol.",
            setsRepsEn: "3 Sets x 1 Rep",
            setsRepsFr: "3 Séries x 1 Rep"
          },
          {
            id: 'hill_drive_50m',
            nameEn: "Up-Hill Sprint Acceleration",
            nameFr: "Sprint en Côte de Force Démarrage",
            distance: "40m (uphill)",
            intensityEn: "95% Max Effort",
            intensityFr: "95% d'effort max",
            targetTimeEn: "Uphill Power Drive",
            targetTimeFr: "Force de poussée en côte",
            recoveryEn: "Walk down slowly + 2 mins rest",
            recoveryFr: "Descente lente en marchant + 2 min de repos",
            notesEn: "Tackle a 6-10% slope. Explode from a standing sprint stance.",
            notesFr: "Sur pente de 6 à 10%. Départ debout explosif, corps aligné.",
            setsRepsEn: "1 Set x 4 Reps",
            setsRepsFr: "1 Série x 4 Reps",
            isHillWork: true
          },
          {
            id: 'sprint_100m_inter_1',
            nameEn: "Main Sprint - Submaximal",
            nameFr: "Série Principale - Vitesse Submax",
            distance: "100m",
            intensityEn: "90% Intensity",
            intensityFr: "90% d'intensité",
            targetTimeEn: "13.6s - 14.2s",
            targetTimeFr: "13.6s - 14.2s",
            recoveryEn: "Walk back 100m, wait 3.5 minutes",
            recoveryFr: "Retour marche lente 100m, 3.5 min repos",
            notesEn: "Maintain high knee posture and active ground strike during the fly phase.",
            notesFr: "Maintenez le bassin haut, griffez le sol activement pendant le sprint.",
            setsRepsEn: "1 Set x 2 Reps",
            setsRepsFr: "1 Série x 2 Reps"
          },
          {
            id: 'sprint_100m_inter_2',
            nameEn: "Main Sprint - Full Stride Velocity",
            nameFr: "Série Principale - Vitesse Pure Max",
            distance: "100m",
            intensityEn: "100% Max Effort",
            intensityFr: "100% d'effort max",
            targetTimeEn: "12.8s - 13.5s",
            targetTimeFr: "12.8s - 13.5s",
            recoveryEn: "Walk back 100m, wait 4.5 minutes (essential for full neural recharge)",
            recoveryFr: "Retour marche lente 100m, 4.5 min repos (recharge nerveuse)",
            notesEn: "Deliver absolute peak acceleration. Stay fluid, don't force or lock up.",
            notesFr: "Délivrez une accélération maximale. Restez fluide, ne forcez pas le geste.",
            setsRepsEn: "1 Set x 2 Reps",
            setsRepsFr: "1 Série x 2 Reps"
          }
        ],
        cooldownEn: [
          "600m very slow walking, arms relaxed",
          "Hamstring and quadriceps static stretches",
          "Rehydration and controlled deep belly breathing"
        ],
        cooldownFr: [
          "600m de marche lente de récupération, bras ballants",
          "Étirements ischio-jambiers et quadriceps",
          "Réhydratation et respiration diaphragmatique contrôlée"
        ]
      },
      'running': {
        titleEn: "100m Speed Acceleration Routine",
        titleFr: "Séance Accélération & Vitesse Max 100m",
        descriptionEn: "Highly technical speed workout targeting starting-block acceleration and maximal speed.",
        descriptionFr: "Séance de vitesse pure ciblant la mise en action de départ et le maintien de vitesse de pointe.",
        warmupEn: ["2 laps jog", "3x 40m accelerations"],
        warmupFr: ["2 tours footing lent", "3x 40m accélérations progressives"],
        drillsEn: ["A-skips 2x30m", "B-skips 2x30m", "Cycle drills 2x20m"],
        drillsFr: ["A-skips 2x30m", "B-skips 2x30m", "Ciseaux rapides 2x20m"],
        mainExercises: [
          {
            id: 'sprint_acc_starts',
            nameEn: "Blocks / 3-Point Acceleration",
            nameFr: "Départ 3 appuis / Accélération",
            distance: "40m",
            intensityEn: "98% Max Effort",
            intensityFr: "98% d'effort max",
            targetTimeEn: "Speed acceleration (approx. 5.6s - 6.0s)",
            targetTimeFr: "Accélération explosive (env. 5.6s - 6.0s)",
            recoveryEn: "Walk back + 2 mins rest",
            recoveryFr: "Retour marche + 2 min de repos",
            notesEn: "Focus on driving out long and low, not rising up too early.",
            notesFr: "Poussez horizontalement, gardez le regard vers le bas sur 15 mètres.",
            setsRepsEn: "1 Set x 5 Reps",
            setsRepsFr: "1 Série x 5 Reps"
          },
          {
            id: 'sprint_100m_inter_pure',
            nameEn: "Full Sprint Reps",
            nameFr: "Séance Sprints 100m",
            distance: "100m",
            intensityEn: "100% Max Velocity",
            intensityFr: "100% vitesse maximale",
            targetTimeEn: "12.8s - 13.5s",
            targetTimeFr: "12.8s - 13.5s",
            recoveryEn: "Walk back, rest 4.5 minutes",
            recoveryFr: "Retour marche lente, 4.5 min repos complet",
            notesEn: "Unleash maximum velocity. Maintain high-hips running form.",
            notesFr: "Maintenez les hanches hautes, attaquez le sol par l'avant-pied.",
            setsRepsEn: "1 Set x 4 Reps",
            setsRepsFr: "1 Série x 4 Reps"
          }
        ],
        cooldownEn: ["600m walk", "Static stretching"],
        cooldownFr: ["600m de marche", "Étirements complets"]
      },
      'plyo': {
        titleEn: "100m Power Bounding & Depth Jumps",
        titleFr: "Renforcement Pliométrique & Élastique 100m",
        descriptionEn: "Advanced plyos to increase the rate of force development and reactive strength.",
        descriptionFr: "Pliométrie avancée pour augmenter la vitesse de production de force et la force réactive.",
        warmupEn: ["1 lap jog", "Skips verticaux 3x20m"],
        warmupFr: ["1 tour footing lent", "Montées explosives alternées 3x20m"],
        drillsEn: ["Continuous bounding 4x30m", "Single-leg jumps 2x15m"],
        drillsFr: ["Foulées bondissantes 4x30m", "Cloche-pieds alternés 2x15m"],
        mainExercises: [
          {
            id: 'bounds_power',
            nameEn: "Max Effort Bounds",
            nameFr: "Foulées Bondissantes Amplitude",
            distance: "40m",
            intensityEn: "Max Power",
            intensityFr: "Puissance maximale",
            targetTimeEn: "Reactive Elastic Focus",
            targetTimeFr: "Focus Puissance Élastique",
            recoveryEn: "Walk back, rest 2.5 minutes",
            recoveryFr: "Retour marche lente, 2.5 min de repos",
            notesEn: "Focus on minimal ground contact time with maximum horizontal projection.",
            notesFr: "Moins de temps au sol, amplitude maximale de projection horizontale.",
            setsRepsEn: "4 Sets x 1 Rep",
            setsRepsFr: "4 Séries x 1 Rep"
          },
          {
            id: 'depth_jumps',
            nameEn: "Depth Jumps to Vertical Jump",
            nameFr: "Sauts de Plinthe à Extension",
            distance: "N/A",
            intensityEn: "100% Elasticity",
            intensityFr: "100% élasticité",
            targetTimeEn: "Max reactivity output",
            targetTimeFr: "Explosivité d'appui maximum",
            recoveryEn: "Rest 2 minutes between sets",
            recoveryFr: "Repos 2 minutes entre chaque série",
            notesEn: "Step off a 40cm box, land with stiff ankles, explode upward immediately.",
            notesFr: "Chute depuis une plinthe de 40cm, rigidité cheville, détente verticale immédiate.",
            setsRepsEn: "4 Sets x 6 Reps",
            setsRepsFr: "4 Séries x 6 Reps"
          }
        ],
        cooldownEn: ["400m easy walk", "Hamstring stretching"],
        cooldownFr: ["400m de marche", "Étirements ischio-jambiers"]
      },
      'power': {
        titleEn: "100m Strength Power & Resisted Drive",
        titleFr: "Sprints en Résistance & Pente 100m",
        descriptionEn: "Hill sprint repeats and heavy startup power training for raw speed strength.",
        descriptionFr: "Sprints en côtes courtes inclinées et force explosive de démarrage.",
        warmupEn: ["2 laps jog", "Joint mobility"],
        warmupFr: ["2 tours footing lent", "Mobilisations dynamiques"],
        drillsEn: ["Harness pulls or downhill starts 3x20m", "Progressive accelerations 3x50m"],
        drillsFr: ["Accélérations en survitesse/descente 3x20m", "Sprints progressifs 3x50m"],
        mainExercises: [
          {
            id: 'hill_power_inter_60m',
            nameEn: "Up-Hill Speed Pushes",
            nameFr: "Répétitions explosives en pente raide",
            distance: "60m (uphill)",
            intensityEn: "95% Max Effort",
            intensityFr: "95% d'effort max",
            targetTimeEn: "Force drive focus",
            targetTimeFr: "Développement force de démarrage",
            recoveryEn: "Slow walk back down, wait 2.5 minutes",
            recoveryFr: "Descente en marchant lentement, 2.5 min de repos",
            notesEn: "Find a 6-10% steep incline. Drive legs powerfully like pistons.",
            notesFr: "Travaillez sur côte inclinée à 8-10%. Action piston des jambes explosive.",
            setsRepsEn: "1 Set x 6 Reps",
            setsRepsFr: "1 Série x 6 Reps",
            isHillWork: true
          }
        ],
        cooldownEn: ["600m walking", "Deep static stretching"],
        cooldownFr: ["600m de marche", "Étirements complets"]
      }
    },
    'advanced': {
      'combination': {
        titleEn: "100m Elite Sprint Speed & Power",
        titleFr: "Vitesse Pure & Puissance Elite 100m",
        descriptionEn: "High-caliber session combining heavy-load elastic plyometrics, incline starting force, and full block starts at absolute maximum speed.",
        descriptionFr: "Session de haut niveau combinant pliométrie à haut impact, sprints courts en côte et vitesse maximale de départ en bloc.",
        warmupEn: [
          "2.5 laps track warming (1000m) with progressive speeds",
          "Full athletic mobility routine (spidermans, hurdle walks, hip openers)",
          "4x 40m starts from a standing 3-point stance (80%, 85%, 90%, 95% speed)"
        ],
        warmupFr: [
          "2.5 tours de piste footing d'échauffement progressif (1000m)",
          "Routine complète de mobilité (pas de haies, fentes d'araignée, ouvertures de hanche)",
          "4x 40m départs debout 3 appuis progressifs (85%, 90%, 95%, 98% vitesse)"
        ],
        drillsEn: [
          "3x 30m Speed A-Skips (highly aggressive floor-strike)",
          "3x 30m Fast-leg cyclic runs (double-leg turnover)",
          "3x 20m Acceleration-to-float transition bounds"
        ],
        drillsFr: [
          "3x 30m Griffés de sol ultra-dynamiques (A-skips vitesse)",
          "3x 30m Cycles de jambes rapides (double-jambe active)",
          "3x 20m Transition accélération-relâchement"
        ],
        mainExercises: [
          {
            id: 'bounds_adv',
            nameEn: "Continuous Single-Leg Bounds (Alternate)",
            nameFr: "Foulées Bondissantes Alternées explosives",
            distance: "50m",
            intensityEn: "Max Elastic Force",
            intensityFr: "Force élastique maximale",
            targetTimeEn: "Elastic Max Power",
            targetTimeFr: "Rigidité au sol - Puissance Max",
            recoveryEn: "Walk back to start slowly, rest 2.5 minutes",
            recoveryFr: "Retour marche lente, repos 2.5 min",
            notesEn: "Focus on continuous bounding with explosive knee drive and rigid ground contacts.",
            notesFr: "Cherchez la propulsion maximale vers l'avant. Les bras accompagnent puissamment.",
            setsRepsEn: "4 Sets x 1 Rep",
            setsRepsFr: "4 Séries x 1 Rep"
          },
          {
            id: 'uphill_adv',
            nameEn: "Incline Power Start Drive",
            nameFr: "Sprint de Puissance Explosive en Côte",
            distance: "50m (uphill)",
            intensityEn: "98% Max Intensity",
            intensityFr: "98% d'intensité maximale",
            targetTimeEn: "Explosive Push Power",
            targetTimeFr: "Poussée de bloc en côte",
            recoveryEn: "Walk down slowly, rest 3 minutes",
            recoveryFr: "Descente lente en marchant, repos 3 min",
            notesEn: "Perform a 3-point start on an incline (6-8%). Explode out. Maintain a low drive angle.",
            notesFr: "Départ 3 appuis en montée. Restez bas les 20 premiers mètres, pistonnez les genoux.",
            setsRepsEn: "1 Set x 5 Reps",
            setsRepsFr: "1 Série x 5 Reps",
            isHillWork: true
          },
          {
            id: 'sprint_100m_adv_1',
            nameEn: "Main Sprint - Neural Wakeup",
            nameFr: "Série Principale - Vitesse Submax Elite",
            distance: "100m",
            intensityEn: "92% Intensity",
            intensityFr: "92% d'intensité",
            targetTimeEn: "12.2s - 12.8s",
            targetTimeFr: "12.2s - 12.8s",
            recoveryEn: "Walk back 100m, wait 4 minutes",
            recoveryFr: "Retour marche lente 100m, repos 4 min",
            notesEn: "Focus on vertical hip alignment, high knees, and active foot strike.",
            notesFr: "Grandissez-vous au maximum, posez le pied d'un coup sec sous votre centre de gravité.",
            setsRepsEn: "1 Set x 2 Reps",
            setsRepsFr: "1 Série x 2 Reps"
          },
          {
            id: 'sprint_100m_adv_2',
            nameEn: "Main Sprint - Peak Competitive Speed",
            nameFr: "Série Principale - Vitesse Absolue",
            distance: "100m",
            intensityEn: "100% Maximum Effort",
            intensityFr: "100% d'effort maximal",
            targetTimeEn: "11.5s - 12.1s",
            targetTimeFr: "11.5s - 12.1s",
            recoveryEn: "Walk back 100m, wait 5 minutes (absolute neural rest)",
            recoveryFr: "Retour marche lente 100m, repos 5 min (recharge nerveuse totale)",
            notesEn: "Unleash maximum starting blocks acceleration. Maintain structural alignment throughout the fly phase.",
            notesFr: "Délivrez l'accélération maximale d'un départ en bloc virtuel. Flottez à vitesse max.",
            setsRepsEn: "1 Set x 2 Reps",
            setsRepsFr: "1 Série x 2 Reps"
          }
        ],
        cooldownEn: [
          "800m ultra-slow barefoot walk on grass if possible",
          "Deep static stretching (hamstrings, glutes, quads, calves)",
          "Deep box breathing and immediate protein-carb hydration"
        ],
        cooldownFr: [
          "800m de marche lente pieds nus sur l'herbe si possible",
          "Étirements statiques longs (ischios, fessiers, mollets, psoas)",
          "Respiration carrée et prise immédiate d'acides aminés/électrolytes"
        ]
      },
      'running': {
        titleEn: "100m High-Velocity Speed Session",
        titleFr: "Vitesse pure de Compétition 100m",
        descriptionEn: "Elite level track sprints focusing on block starts, maximum velocity, and acceleration mechanics.",
        descriptionFr: "Entraînement de piste de compétition axé sur l'accélération en bloc et la vitesse maximale.",
        warmupEn: ["3 laps progressive warming", "4x 30m block starts"],
        warmupFr: ["3 tours d'échauffement progressif", "4x 30m départs en bloc"],
        drillsEn: ["A-skips 3x30m", "B-skips 3x30m", "Cycle drills 3x30m"],
        drillsFr: ["A-skips 3x30m", "B-skips 3x30m", "Griffés rapides jambes tendues 3x30m"],
        mainExercises: [
          {
            id: 'sprint_acc_starts_adv',
            nameEn: "Block Starts Acceleration",
            nameFr: "Départs en Blocs de Vitesse",
            distance: "40m",
            intensityEn: "100% Max Effort",
            intensityFr: "100% d'effort maximal",
            targetTimeEn: "Max block speed (approx. 4.9s - 5.3s)",
            targetTimeFr: "Vitesse de départ max (env. 4.9s - 5.3s)",
            recoveryEn: "Walk back, rest 2.5 minutes",
            recoveryFr: "Retour marche, repos 2.5 min",
            notesEn: "Explosive triple extension of the hips, knees, and ankles from the blocks.",
            notesFr: "Triple extension explosive (chevilles-genoux-hanches) en sortie de bloc.",
            setsRepsEn: "1 Set x 6 Reps",
            setsRepsFr: "1 Série x 6 Reps"
          },
          {
            id: 'sprint_100m_adv_pure',
            nameEn: "Max Velocity Sprints",
            nameFr: "Sprints d'Intensité Maximale 100m",
            distance: "100m",
            intensityEn: "100% Absolute Speed",
            intensityFr: "100% vitesse absolue",
            targetTimeEn: "11.5s - 12.1s",
            targetTimeFr: "11.5s - 12.1s",
            recoveryEn: "Walk back, rest 5 minutes",
            recoveryFr: "Retour marche lente, repos 5 minutes complet",
            notesEn: "Run tall, shoulders relaxed, aggressive ground striking.",
            notesFr: "Courez haut, hanches projetées vers l'avant, attaque sol griffée sèche.",
            setsRepsEn: "1 Set x 4 Reps",
            setsRepsFr: "1 Série x 4 Reps"
          }
        ],
        cooldownEn: ["800m slow walk", "Full body stretching"],
        cooldownFr: ["800m de marche lente", "Étirements complets"]
      },
      'plyo': {
        titleEn: "100m Shock Plyometrics & Reactive Jump",
        titleFr: "Entraînement de Choc Pliométrique 100m",
        descriptionEn: "High impact shock jumps and continuous bounds for maximum athletic springiness.",
        descriptionFr: "Travail de choc (pliométrie lourde) pour recruter le système nerveux et augmenter la raideur.",
        warmupEn: ["2 laps jog", "Dynamic mobility", "4x 20m high skips"],
        warmupFr: ["2 tours footing lent", "Mobilité dynamique", "4x 20m skipping haut"],
        drillsEn: ["Hurdle jumps 4x 5 hurdles", "Continuous alternate bounding 4x40m"],
        drillsFr: ["Sauts de haies 4x 5 haies", "Foulées bondissantes explosives 4x40m"],
        mainExercises: [
          {
            id: 'bounds_adv_elastic',
            nameEn: "Continuous Alternate Bounds",
            nameFr: "Foulées Bondissantes Élastiques Max",
            distance: "50m",
            intensityEn: "100% Reactive Power",
            intensityFr: "100% de puissance réactive",
            targetTimeEn: "Max rebound rate",
            targetTimeFr: "Vitesse de rebond maximale",
            recoveryEn: "Walk back, rest 3 minutes",
            recoveryFr: "Retour marche lente, repos 3 minutes",
            notesEn: "Bound aggressively, driving knee parallel to ground, minimal heel collapse.",
            notesFr: "Propulsion horizontale féroce, genou parallèle au sol, cheville gainée.",
            setsRepsEn: "4 Sets x 1 Rep",
            setsRepsFr: "4 Séries x 1 Rep"
          },
          {
            id: 'depth_shock_jumps',
            nameEn: "Depth Box Shock Jumps",
            nameFr: "Sauts de Choc Elite (Depth Jumps)",
            distance: "N/A",
            intensityEn: "100% Elastic Shock",
            intensityFr: "100% choc élastique",
            targetTimeEn: "Neuromuscular reactivity focus",
            targetTimeFr: "Focus réactivité neuromusculaire",
            recoveryEn: "Rest 2.5 minutes between sets",
            recoveryFr: "Repos 2.5 minutes entre chaque série",
            notesEn: "Step off a 50cm high platform, spring instantly upward upon landing.",
            notesFr: "Chute d'une plateforme de 50cm de haut, rebond réflexe instantané vertical.",
            setsRepsEn: "5 Sets x 5 Reps",
            setsRepsFr: "5 Séries x 5 Reps"
          }
        ],
        cooldownEn: ["600m easy walk", "Deep stretching"],
        cooldownFr: ["600m marche", "Étirements profonds"]
      },
      'power': {
        titleEn: "100m Heavy Acceleration Drive",
        titleFr: "Sprints Résistés de Surcharge 100m",
        descriptionEn: "Heavy uphill running and resisted sprints for maximum acceleration drive power.",
        descriptionFr: "Sprints inclinés à forte résistance et surcharge pour une puissance de poussée maximale.",
        warmupEn: ["2 laps jog", "Block starts warmup"],
        warmupFr: ["2 tours footing lent", "Mise en action de départ progressive"],
        drillsEn: ["Sled pulls or heavy band runs 4x30m", "Explosive hops"],
        drillsFr: ["Tractage de chariot lourd / bande élastique 4x30m", "Bondissements explosifs"],
        mainExercises: [
          {
            id: 'hill_drive_adv_60m',
            nameEn: "Heavy Hill Acceleration Runs",
            nameFr: "Répétitions explosives de force en côte",
            distance: "60m (uphill)",
            intensityEn: "100% Maximum Effort",
            intensityFr: "100% d'effort maximal",
            targetTimeEn: "Uphill absolute power drive",
            targetTimeFr: "Poussée de côte maximale",
            recoveryEn: "Walk back down slowly, wait 3 minutes",
            recoveryFr: "Descente en marche lente, repos de 3 min complet",
            notesEn: "Steep slope (8-12%). Perform full acceleration drive, pumping arms vigorously.",
            notesFr: "Forte inclinaison (8 à 12%). Poussée à plat, bras amples et féroces, amplitude max.",
            setsRepsEn: "1 Set x 7 Reps",
            setsRepsFr: "1 Série x 7 Reps",
            isHillWork: true
          }
        ],
        cooldownEn: ["800m easy jogging", "Full leg stretching"],
        cooldownFr: ["800m footing décrassage lent", "Étirements complets"]
      }
    },
    'elite': {
      'combination': {
        titleEn: "100m Olympic Caliber Neuromuscular Workout",
        titleFr: "Entraînement Neuromusculaire Calibre Olympique 100m",
        descriptionEn: "Olympic level sprint preparation targeting absolute motor unit recruitment. High-impact reactive pliometrics, explosive incline drives, and competitive block starts.",
        descriptionFr: "Préparation de sprint de niveau olympique ciblant le recrutement maximal des unités motrices. Pliométrie lourde de choc, poussée en côte de surcharge, et départs en starting-blocks à vitesse absolue.",
        warmupEn: [
          "3 laps track jog (1200m) with progressive accelerations on straights",
          "Comprehensive mobility routine (hurdle drills, Scorpion stretch, dynamic leg drives)",
          "5x 40m starts (2 debout, 3 blocks - progressing from 85% to 100% effort)"
        ],
        warmupFr: [
          "3 tours de piste progressifs (1200m), accélérations sur les lignes droites",
          "Mobilité articulaire et musculaire avancée (haies, étirements du scorpion, lancés de jambe)",
          "5x 40m départs (2 debout, 3 en blocs - intensité progressive de 85% à 100% d'effort)"
        ],
        drillsEn: [
          "3x 30m Elite Speed A-Skips (ultra-aggressive clawing strike)",
          "3x 30m Cyclic fast-leg drive runs (continuous ankle heel cycle)",
          "3x 30m Acceleration-to-float block starts transition runs"
        ],
        drillsFr: [
          "3x 30m Élite A-Skips (contact sol violent, hanches hautes)",
          "3x 30m Cycles de jambes rapides élite (retour de talon ras-fesses ultra-rapide)",
          "3x 30m Transition départ en blocs vers la phase de relâchement"
        ],
        mainExercises: [
          {
            id: 'bounds_elite',
            nameEn: "Single-Leg Continuous Alternate Bounding",
            nameFr: "Foulées Bondissantes Elite Amplitude",
            distance: "60m",
            intensityEn: "100% Absolute Elastic Force",
            intensityFr: "100% force élastique absolue",
            targetTimeEn: "Max vertical & horizontal power projection",
            targetTimeFr: "Projection de force élastique maximale",
            recoveryEn: "Walk back to start slowly, rest 3 minutes",
            recoveryFr: "Retour marche lente, repos de 3 min complet",
            notesEn: "Bound with absolute power, focus on stiffness in the ankle joint.",
            notesFr: "Bondissements féroces, genou tracté vers le haut, cheville d'acier.",
            setsRepsEn: "4 Sets x 1 Rep",
            setsRepsFr: "4 Séries x 1 Rep"
          },
          {
            id: 'uphill_elite',
            nameEn: "Olympic Incline Speed Drive Sprints",
            nameFr: "Sprints de Poussée Olympique en Côte",
            distance: "60m (uphill)",
            intensityEn: "100% Maximum Effort",
            intensityFr: "100% d'effort maximal",
            targetTimeEn: "Explosive Push Power",
            targetTimeFr: "Poussée explosive côte raide",
            recoveryEn: "Walk back down slowly, wait 3 minutes",
            recoveryFr: "Descente en marche lente, repos 3 min complet",
            notesEn: "Perform block/3-point start. Explode out. Maximum arm cycle frequency, full drive angle.",
            notesFr: "Départ 3 appuis ou bloc. Fréquence de bras maximale, extension complète de la jambe arrière.",
            setsRepsEn: "1 Set x 5 Reps",
            setsRepsFr: "1 Série x 5 Reps",
            isHillWork: true
          },
          {
            id: 'sprint_100m_elite_1',
            nameEn: "Main Sprint - Submaximal Elite",
            nameFr: "Série Principale - Vitesse Submax Olympique",
            distance: "100m",
            intensityEn: "95% Intensity",
            intensityFr: "95% d'intensité",
            targetTimeEn: "10.8s - 11.4s",
            targetTimeFr: "10.8s - 11.4s",
            recoveryEn: "Walk back 100m, wait 5 minutes",
            recoveryFr: "Retour marche lente 100m, repos complet 5 min",
            notesEn: "Run tall. Focus on relaxed posture, keeping head neutral and jaw loose.",
            notesFr: "Courez relâché. Tête droite, bras relâchés sur le retour, foulée d'amplitude.",
            setsRepsEn: "1 Set x 2 Reps",
            setsRepsFr: "1 Série x 2 Reps"
          },
          {
            id: 'sprint_100m_elite_2',
            nameEn: "Main Sprint - Peak Competitive Velocity",
            nameFr: "Série Principale - Vitesse Pure Olympique",
            distance: "100m",
            intensityEn: "100% Max Effort",
            intensityFr: "100% d'effort maximal",
            targetTimeEn: "10.1s - 10.7s",
            targetTimeFr: "10.1s - 10.7s",
            recoveryEn: "Walk back 100m, wait 6 minutes (absolute neural replenishment)",
            recoveryFr: "Retour marche lente 100m, repos de 6 min complet (recharge nerveuse)",
            notesEn: "Absolute starting block power. Stay relaxed during maximum speed float phase. Focus on clawing mechanics.",
            notesFr: "Départ bloc dévastateur. Flottez à vitesse maximale en restant relâché, bras amples.",
            setsRepsEn: "1 Set x 2 Reps",
            setsRepsFr: "1 Série x 2 Reps"
          }
        ],
        cooldownEn: [
          "800m ultra-slow walk barefoot on turf",
          "Deep static stretches for glutes, hip flexors, quadriceps, and hamstrings",
          "Electrolytes replenishment and focused breathing"
        ],
        cooldownFr: [
          "800m de marche lente pieds nus sur l'herbe",
          "Étirements statiques complets (mollets, ischios, fessiers, psoas)",
          "Réhydratation immédiate avec électrolytes et acides aminés"
        ]
      },
      'running': {
        titleEn: "100m Olympic Pure Speed Session",
        titleFr: "Session Sprints Vitesse Pure Olympique 100m",
        descriptionEn: "Ultimate track sprint program focused on blocks starts, reactive speed endurance, and absolute maximal velocity.",
        descriptionFr: "Le programme de piste ultime axé sur l'accélération départ-bloc et la vitesse maximale de pointe absolue.",
        warmupEn: ["3 laps progressive jog", "4x 40m block starts (95%)"],
        warmupFr: ["3 tours d'échauffement progressif", "4x 40m départs en blocs (95%)"],
        drillsEn: ["A-skips 3x30m", "B-skips 3x30m", "Cycle drills 3x30m"],
        drillsFr: ["A-skips 3x30m", "B-skips 3x30m", "Ciseaux rapides 3x30m"],
        mainExercises: [
          {
            id: 'sprint_starts_elite',
            nameEn: "Block Starts Acceleration Drive",
            nameFr: "Départs Starting-Blocks Accélération",
            distance: "40m",
            intensityEn: "100% Max Effort",
            intensityFr: "100% d'effort maximal",
            targetTimeEn: "Max block speed (approx. 4.4s - 4.8s)",
            targetTimeFr: "Vitesse de poussée départ (env. 4.4s - 4.8s)",
            recoveryEn: "Walk back slowly, rest 3 minutes",
            recoveryFr: "Retour marche lente, repos de 3 min",
            notesEn: "Deliver absolute explosive drive from the starting blocks.",
            notesFr: "Poussez de toutes vos forces sur les cales, restez bas.",
            setsRepsEn: "1 Set x 6 Reps",
            setsRepsFr: "1 Série x 6 Reps"
          },
          {
            id: 'sprint_100m_elite_pure',
            nameEn: "Peak Absolute Speed",
            nameFr: "Vitesse Absolue Olympique 100m",
            distance: "100m",
            intensityEn: "100% Speed Max",
            intensityFr: "100% vitesse max absolue",
            targetTimeEn: "10.1s - 10.7s",
            targetTimeFr: "10.1s - 10.7s",
            recoveryEn: "Walk back slowly, rest 6 minutes",
            recoveryFr: "Retour marche lente, repos complet de 6 minutes",
            notesEn: "Unleash absolute speed. Maintain relaxed facial muscles.",
            notesFr: "Dégagez une puissance maximale en restant parfaitement fluide et détendu du visage.",
            setsRepsEn: "1 Set x 4 Reps",
            setsRepsFr: "1 Série x 4 Reps"
          }
        ],
        cooldownEn: ["800m walk", "Full static stretches"],
        cooldownFr: ["800m de marche de décrassage", "Étirements complets"]
      },
      'plyo': {
        titleEn: "100m Olympic Reactive Shock Training",
        titleFr: "Pliométrie de Choc Olympique 100m",
        descriptionEn: "Highest-intensity reactive elastic shock exercises for absolute starting power.",
        descriptionFr: "Exercices de pliométrie lourde à impact extrême pour une explosivité départ-bloc ultime.",
        warmupEn: ["2 laps jog", "Dynamic mobility", "4x 20m jumps"],
        warmupFr: ["2 tours footing lent", "Mobilité articulaire", "4x 20m bondissements"],
        drillsEn: ["Hurdle jumps 5x 6 hurdles", "Depth shock jumps from 60cm box 4x5"],
        drillsFr: ["Sauts de haies 5x 6 haies", "Sauts de choc de plinthe 60cm 4x5"],
        mainExercises: [
          {
            id: 'bounds_elite_elastic',
            nameEn: "Continuous Single-Leg Bounds",
            nameFr: "Foulées Bondissantes Unilatérales explosives",
            distance: "60m",
            intensityEn: "100% Power Elastic",
            intensityFr: "100% puissance élastique",
            targetTimeEn: "Elastic Max",
            targetTimeFr: "Rebond élastique max",
            recoveryEn: "Walk back slowly, rest 3.5 minutes",
            recoveryFr: "Retour marche lente, repos de 3.5 min",
            notesEn: "Elite level reactive single leg bounding. High stiffness, knee high drive.",
            notesFr: "Bondissements agressifs à haut impact. Travaillez la raideur cheville.",
            setsRepsEn: "4 Sets x 1 Rep",
            setsRepsFr: "4 Séries x 1 Rep"
          }
        ],
        cooldownEn: ["800m barefoot walk", "Deep stretching"],
        cooldownFr: ["800m marche pieds nus", "Étirements profonds"]
      },
      'power': {
        titleEn: "100m Resisted Pushes & Heavy Hill Starts",
        titleFr: "Puissance en Côte de Surcharge Olympique 100m",
        descriptionEn: "Incline sprints at heavy velocity and sled pulling for raw power acceleration.",
        descriptionFr: "Répétitions explosives en forte pente raide et tractages lourds de puissance de démarrage.",
        warmupEn: ["2 laps jog", "Joint mobilization"],
        warmupFr: ["2 tours footing", "Mobilisations dynamiques"],
        drillsEn: ["Block starts progressive 4x40m"],
        drillsFr: ["Départs starts progressifs 4x40m"],
        mainExercises: [
          {
            id: 'hill_power_elite_60m',
            nameEn: "Olympic Incline Speed Drive",
            nameFr: "Répétitions force de poussée en côte",
            distance: "60m (uphill)",
            intensityEn: "100% Absolute Intensity",
            intensityFr: "100% d'intensité absolue",
            targetTimeEn: "Peak power drive uphill",
            targetTimeFr: "Poussée de côte maximale élite",
            recoveryEn: "Walk back down slowly, wait 3.5 minutes",
            recoveryFr: "Descente en marche lente, repos de 3.5 min complet",
            notesEn: "Slope (10-12%). Absolute drive phase mechanics. Piston-like action of the legs.",
            notesFr: "Côte raide (10 à 12%). Départ puissant bas. Action piston des jambes violente.",
            setsRepsEn: "1 Set x 8 Reps",
            setsRepsFr: "1 Série x 8 Reps",
            isHillWork: true
          }
        ],
        cooldownEn: ["1000m slow walking", "Full stretching"],
        cooldownFr: ["1000m marche de décrassage", "Étirements longs"]
      }
    }
  }
};

// Simple helper to fill other sprint distances (200m, 400m, 800m) to ensure they never crash and always return highly structured, detailed coaching plans
export const getSprintWorkout = (event: string, level: string, option: string, lang: string): SprintWorkoutPlan => {
  const normEvent = ['100m', '200m', '400m', '800m'].includes(event) ? event : '100m';
  const normLevel = ['beginner', 'intermediate', 'advanced', 'elite'].includes(level) ? level : 'intermediate';
  const normOption = ['combination', 'running', 'plyo', 'power'].includes(option) ? option : 'combination';

  // Fallback to 100m if we don't have the exact event, adjusting the distances and times dynamically to perfectly fit the requested sprint event (200m, 400m, 800m)!
  let basePlan = SPRINT_PLANS[normEvent]?.[normLevel]?.[normOption];
  
  if (!basePlan) {
    // If we don't have the 100m plan, we use the 100m intermediate combo as absolute fallback
    basePlan = SPRINT_PLANS['100m']['intermediate']['combination'];
  }

  // If the event is 100m, return directly
  if (normEvent === '100m') {
    return basePlan;
  }

  // Dynamically adapt the 100m plan to 200m, 400m, or 800m to provide incredibly realistic, expert schedules!
  const titleEn = basePlan.titleEn.replace('100m', normEvent);
  const titleFr = basePlan.titleFr.replace('100m', normEvent);
  const descriptionEn = basePlan.descriptionEn.replace('100m', normEvent);
  const descriptionFr = basePlan.descriptionFr.replace('100m', normEvent);

  const mainExercises = basePlan.mainExercises.map(ex => {
    let d = ex.distance;
    let targetTimeEn = ex.targetTimeEn;
    let targetTimeFr = ex.targetTimeFr;
    let setsRepsEn = ex.setsRepsEn;
    let setsRepsFr = ex.setsRepsFr;
    let notesEn = ex.notesEn;
    let notesFr = ex.notesFr;
    let recoveryEn = ex.recoveryEn;
    let recoveryFr = ex.recoveryFr;

    if (ex.distance && ex.distance.includes('100m')) {
      if (normEvent === '200m') {
        d = "200m";
        notesEn = "Focus on the acceleration curve phase (first 50m) and maintaining relaxation into the home straight.";
        notesFr = "Mise en action explosive dans le virage (premiers 50m), puis relâché dans la ligne droite d'arrivée.";
        recoveryEn = "Walk back slowly, rest 5-6 minutes (essential for lactic system)";
        recoveryFr = "Retour marche très lente, 5 à 6 min de repos complet (système lactique)";
        if (normLevel === 'elite') {
          targetTimeEn = "20.8s - 21.8s";
          targetTimeFr = "20.8s - 21.8s";
        } else if (normLevel === 'advanced') {
          targetTimeEn = "23.5s - 24.5s";
          targetTimeFr = "23.5s - 24.5s";
        } else if (normLevel === 'intermediate') {
          targetTimeEn = "26.2s - 27.5s";
          targetTimeFr = "26.2s - 27.5s";
        } else {
          targetTimeEn = "31.0s - 33.0s";
          targetTimeFr = "31.0s - 33.0s";
        }
      } else if (normEvent === '400m') {
        d = "400m";
        notesEn = "First 50m fast, then float at high submaximal velocity. Explode again at the 250m mark.";
        notesFr = "50m de mise en action rapide, puis relâchez le buste à vitesse submax. Relancez aux 250m.";
        recoveryEn = "Walk and sit, rest 7-8 minutes (extremely high lactic load)";
        recoveryFr = "Marche très lente, repos 7 à 8 min (charge lactique extrêmement élevée)";
        if (normLevel === 'elite') {
          targetTimeEn = "46.5s - 48.5s";
          targetTimeFr = "46.5s - 48.5s";
        } else if (normLevel === 'advanced') {
          targetTimeEn = "52.0s - 54.5s";
          targetTimeFr = "52.0s - 54.5s";
        } else if (normLevel === 'intermediate') {
          targetTimeEn = "58.0s - 61.0s";
          targetTimeFr = "58.0s - 61.0s";
        } else {
          targetTimeEn = "68.0s - 72.0s";
          targetTimeFr = "68.0s - 72.0s";
        }
      } else if (normEvent === '800m') {
        d = "800m";
        notesEn = "Aerobic-anaerobic threshold drive. Focus on holding a consistent high-pace running posture.";
        notesFr = "Seuil aérobie-anaérobie. Maintenez une foulée d'amplitude et de rythme régulier.";
        recoveryEn = "Walk/jog back, rest 6 minutes";
        recoveryFr = "Marche lente ou trot lent, repos 6 min";
        if (normLevel === 'elite') {
          targetTimeEn = "1m48s - 1m54s";
          targetTimeFr = "1m48s - 1m54s";
        } else if (normLevel === 'advanced') {
          targetTimeEn = "2m02s - 2m08s";
          targetTimeFr = "2m02s - 2m08s";
        } else if (normLevel === 'intermediate') {
          targetTimeEn = "2m18s - 2m25s";
          targetTimeFr = "2m18s - 2m25s";
        } else {
          targetTimeEn = "2m40s - 2m50s";
          targetTimeFr = "2m40s - 2m50s";
        }
      }
    }

    return {
      ...ex,
      distance: d,
      notesEn,
      notesFr,
      recoveryEn,
      recoveryFr,
      targetTimeEn,
      targetTimeFr,
      setsRepsEn,
      setsRepsFr
    };
  });

  return {
    titleEn,
    titleFr,
    descriptionEn,
    descriptionFr,
    warmupEn: basePlan.warmupEn.map(w => w.replace('100m', normEvent)),
    warmupFr: basePlan.warmupFr.map(w => w.replace('100m', normEvent)),
    drillsEn: basePlan.drillsEn,
    drillsFr: basePlan.drillsFr,
    mainExercises,
    cooldownEn: basePlan.cooldownEn,
    cooldownFr: basePlan.cooldownFr
  };
};
