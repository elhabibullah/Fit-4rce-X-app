import { TranslatedConstants, Language, KungFuProgram, NeoTaiChiProgram } from '../types.ts';
import { 
    TRAINER_STRUCTURE, 
    LANGUAGE_STRUCTURE, 
    TECHNIQUE_MODEL_URL 
} from './constants.ts';

// --- TRANSLATION GENERATOR ---

export const getTranslatedConstants = (lang: Language, t: (key: string) => string): TranslatedConstants => {
  
  const KUNG_FU_DATA: KungFuProgram = {
    program_name: t('kf.name'), 
    description: t('kf.intro'),
    levels: [
        {
            level_name: t('kf.l1.title'),
            description: t('kf.l1.goal'),
            sections: [
                { 
                    section_name: 'Techniques', 
                    movements: [
                        { id: "kf-l1-m1", name: t('kf.tech.l1.mabu'), description: t('kf.tech.l1.mabu.desc'), application: t('kf.app.l1.root'), modelUrl: TECHNIQUE_MODEL_URL },
                        { id: "kf-l1-m2", name: t('kf.tech.l1.fist'), description: t('kf.tech.l1.fist.desc'), application: t('kf.app.l1.defense'), modelUrl: TECHNIQUE_MODEL_URL },
                        { id: "kf-l1-m3", name: t('kf.tech.l1.palm'), description: t('kf.tech.l1.palm.desc'), application: t('kf.app.l1.defense'), modelUrl: TECHNIQUE_MODEL_URL },
                        { id: "kf-l1-m4", name: t('kf.tech.l1.step'), description: t('kf.tech.l1.step.desc'), application: t('kf.app.l1.balance'), modelUrl: TECHNIQUE_MODEL_URL },
                        { id: "kf-l1-m5", name: t('kf.tech.l1.form'), description: t('kf.tech.l1.form.desc'), application: t('kf.app.l1.root'), modelUrl: TECHNIQUE_MODEL_URL },
                    ] 
                }
            ]
        },
        {
            level_name: t('kf.l2.title'),
            description: t('kf.l2.goal'),
            sections: [
                {
                    section_name: 'Techniques',
                    movements: [
                        { id: "kf-l2-m1", name: t('kf.tech.l2.chain'), description: t('kf.tech.l2.chain.desc'), application: t('kf.app.l2.control'), modelUrl: TECHNIQUE_MODEL_URL },
                        { id: "kf-l2-m2", name: t('kf.tech.l2.redir'), description: t('kf.tech.l2.redir.desc'), application: t('kf.app.l2.redirect'), modelUrl: TECHNIQUE_MODEL_URL },
                        { id: "kf-l2-m3", name: t('kf.tech.l2.kicks'), description: t('kf.tech.l2.kicks.desc'), application: t('kf.app.l2.control'), modelUrl: TECHNIQUE_MODEL_URL },
                        { id: "kf-l2-m4", name: t('kf.tech.l2.flow'), description: t('kf.tech.l2.flow.desc'), application: t('kf.app.l2.transition'), modelUrl: TECHNIQUE_MODEL_URL },
                        { id: "kf-l2-m5", name: t('kf.tech.l2.form'), description: t('kf.tech.l2.form.desc'), application: t('kf.app.l2.transition'), modelUrl: TECHNIQUE_MODEL_URL },
                    ]
                }
            ]
        },
        {
            level_name: t('kf.l3.title'),
            description: t('kf.l3.goal'),
            sections: [
                {
                    section_name: 'Techniques',
                    movements: [
                        { id: "kf-l3-m1", name: t('kf.tech.l3.explosive'), description: t('kf.tech.l3.explosive.desc'), application: t('kf.app.l3.neutralize'), modelUrl: TECHNIQUE_MODEL_URL },
                        { id: "kf-l3-m2", name: t('kf.tech.l3.spiral'), description: t('kf.tech.l3.spiral.desc'), application: t('kf.app.l3.neutralize'), modelUrl: TECHNIQUE_MODEL_URL },
                        { id: "kf-l3-m3", name: t('kf.tech.l3.advkicks'), description: t('kf.tech.l3.advkicks.desc'), application: t('kf.app.l3.multi'), modelUrl: TECHNIQUE_MODEL_URL },
                        { id: "kf-l3-m4", name: t('kf.tech.l3.flow'), description: t('kf.tech.l3.flow.desc'), application: t('kf.app.l3.multi'), modelUrl: TECHNIQUE_MODEL_URL },
                        { id: "kf-l3-m5", name: t('kf.tech.l3.form'), description: t('kf.tech.l3.form.desc'), application: t('kf.app.l3.stability'), modelUrl: TECHNIQUE_MODEL_URL },
                    ]
                }
            ]
        }
    ]
  };

  const NEO_TAI_CHI_DATA: NeoTaiChiProgram = {
    program_name: t('ntc.name'),
    description: t('ntc.intro'),
    levels: [
        {
            level: "1",
            title: t('ntc.l1.title'),
            objective: t('ntc.l1.goal'),
            duration: "4-6 Weeks",
            techniques: [
                { id: "ntc-l1-t1", name: t('ntc.tech.l1.stance'), description: t('ntc.tech.l1.stance.desc'), application: t('ntc.app.l1.stability'), modelUrl: TECHNIQUE_MODEL_URL },
                { id: "ntc-l1-t2", name: t('ntc.tech.l1.slow'), description: t('ntc.tech.l1.slow.desc'), application: t('ntc.app.l1.balance'), modelUrl: TECHNIQUE_MODEL_URL },
                { id: "ntc-l1-t3", name: t('ntc.tech.l1.shift'), description: t('ntc.tech.l1.shift.desc'), application: t('ntc.app.l1.stability'), modelUrl: TECHNIQUE_MODEL_URL },
                { id: "ntc-l1-t4", name: t('ntc.tech.l1.breath'), description: t('ntc.tech.l1.breath.desc'), application: t('ntc.app.l1.calm'), modelUrl: TECHNIQUE_MODEL_URL },
                { id: "ntc-l1-t5", name: t('ntc.tech.l1.form'), description: t('ntc.tech.l1.form.desc'), application: t('ntc.app.l1.balance'), modelUrl: TECHNIQUE_MODEL_URL },
            ]
        },
        {
            level: "2",
            title: t('ntc.l2.title'),
            objective: t('ntc.l2.goal'),
            duration: "8-12 Weeks",
            techniques: [
                { id: "ntc-l2-t1", name: t('ntc.tech.l2.flow'), description: t('ntc.tech.l2.flow.desc'), application: t('ntc.app.l2.connect'), modelUrl: TECHNIQUE_MODEL_URL },
                { id: "ntc-l2-t2", name: t('ntc.tech.l2.spiral'), description: t('ntc.tech.l2.spiral.desc'), application: t('ntc.app.l2.redirect'), modelUrl: TECHNIQUE_MODEL_URL },
                { id: "ntc-l2-t3", name: t('ntc.tech.l2.smooth'), description: t('ntc.tech.l2.smooth.desc'), application: t('ntc.app.l2.connect'), modelUrl: TECHNIQUE_MODEL_URL },
                { id: "ntc-l2-t4", name: t('ntc.tech.l2.medium'), description: t('ntc.tech.l2.medium.desc'), application: t('ntc.app.l2.redirect'), modelUrl: TECHNIQUE_MODEL_URL },
                { id: "ntc-l2-t5", name: t('ntc.tech.l2.form'), description: t('ntc.tech.l2.form.desc'), application: t('ntc.app.l2.sync'), modelUrl: TECHNIQUE_MODEL_URL },
            ]
        },
        {
            level: "3",
            title: t('ntc.l3.title'),
            objective: t('ntc.l3.goal'),
            duration: "Ongoing",
            techniques: [
                { id: "ntc-l3-t1", name: t('ntc.tech.l3.intent'), description: t('ntc.tech.l3.intent.desc'), application: t('ntc.app.l3.efficient'), modelUrl: TECHNIQUE_MODEL_URL },
                { id: "ntc-l3-t2", name: t('ntc.tech.l3.fajin'), description: t('ntc.tech.l3.fajin.desc'), application: t('ntc.app.l3.power'), modelUrl: TECHNIQUE_MODEL_URL },
                { id: "ntc-l3-t3", name: t('ntc.tech.l3.offbalance'), description: t('ntc.tech.l3.offbalance.desc'), application: t('ntc.app.l3.multi'), modelUrl: TECHNIQUE_MODEL_URL },
                { id: "ntc-l3-t4", name: t('ntc.tech.l3.control'), description: t('ntc.tech.l3.control.desc'), application: t('ntc.app.l3.efficient'), modelUrl: TECHNIQUE_MODEL_URL },
                { id: "ntc-l3-t5", name: t('ntc.tech.l3.form'), description: t('ntc.tech.l3.form.desc'), application: t('ntc.app.l3.power'), modelUrl: TECHNIQUE_MODEL_URL },
            ]
        }
    ]
  };

  return {
    SUBSCRIPTION_PLANS: [
      {
        id: 'silver',
        name: 'SILVER PASS',
        monthlyPrice: 19.00,
        features: [
          'AI Personalized Workouts',
          '3D Exercise Library',
          'Standard Store Access'
        ]
      },
      {
        id: 'premium',
        name: 'GOLD ELITE',
        monthlyPrice: 25.00,
        specialHighlight: 'Includes Direct Human Trainer Link',
        features: [
          'All Silver Features',
          'DietAl™ Nutrition AI',
          'Holographic Cardio Sessions',
          'Combat Defense Curriculum'
        ]
      }
    ],
    TRAINER_PROFILES: TRAINER_STRUCTURE.map(tData => ({
        ...tData,
        name: tData.id.charAt(0).toUpperCase() + tData.id.slice(1), 
        titles: ['Elite Personal Trainer'],
        languages: ['English', 'French', 'Arabic'],
        bio: 'Dedicated to helping you reach your peak performance through personalized coaching and motivation.',
        specializations: ['Functional Training', 'Strength']
    })),
    KUNG_FU_PROGRAM: KUNG_FU_DATA,
    NEO_TAI_CHI_PROGRAM: NEO_TAI_CHI_DATA,
    LANGUAGES: LANGUAGE_STRUCTURE.map(l => ({ ...l, name: l.code.toUpperCase() }))
  };
};