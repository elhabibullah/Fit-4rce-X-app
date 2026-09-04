import * as THREE from 'three';
import { HumanoidBoneName } from './humanoidBones.ts';

export interface AnatomicalBonePose {
  pitch: number; // Sagittal flexion (+) / extension (-)
  yaw: number;   // Transverse rotation (turn left/right)
  roll: number;  // Coronal tilt / abduction
}

export interface HumanoidFramePose {
  hipsOffset: [number, number, number]; // [x, y, z] in meters
  // Prone body tilt for pushups / planks (0 for upright, Math.PI/2 for prone facing ground)
  proneAngle?: number;
  proneY?: number;
  bones: Partial<Record<HumanoidBoneName, AnatomicalBonePose>>;
}

export interface HumanoidClip {
  name: string;
  duration: number;
  isLoop: boolean;
  sample: (progress: number) => HumanoidFramePose;
}

// Smooth human easing helpers
const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t);
const humanStep = (phase: number) => (Math.sin(phase) + 1) * 0.5;

/**
 * Biomechanically Correct Humanoid Motion Library
 * Coordinate Standards:
 * - Pitch > 0: Forward flexion for Spine, Thighs, Shoulders/Arms. Backward flexion for Knees.
 * - Pitch < 0: Backward extension for Spine, Thighs, Arms.
 * - Roll > 0: Outward lateral abduction away from midline (LeftArm to left, RightArm to right, LeftLeg to left, RightLeg to right).
 * - Yaw: Transverse axial rotation (+ turn right, - turn left).
 */
export const HUMANOID_CLIPS: Record<string, HumanoidClip> = {
  // 1. IDLE: Natural breathing and micro-sway
  idle: {
    name: 'idle',
    duration: 3.2,
    isLoop: true,
    sample: (p: number) => {
      const angle = p * Math.PI * 2;
      const breath = Math.sin(angle) * 0.035;
      const sway = Math.sin(angle * 0.5) * 0.015;

      return {
        hipsOffset: [sway * 0.03, breath * 0.012, 0],
        bones: {
          Spine: { pitch: breath * 0.25, yaw: sway * 0.15, roll: sway * 0.15 },
          Spine1: { pitch: breath * 0.20, yaw: sway * 0.10, roll: sway * 0.10 },
          Spine2: { pitch: breath * 0.15, yaw: 0, roll: 0 },
          Neck: { pitch: -breath * 0.12, yaw: -sway * 0.15, roll: 0 },
          Head: { pitch: -breath * 0.08, yaw: -sway * 0.10, roll: 0 },

          // Natural relaxed arms at sides with soft elbow
          LeftArm: { pitch: 0.05 + breath * 0.05, yaw: 0, roll: 0.12 },
          RightArm: { pitch: 0.05 + breath * 0.05, yaw: 0, roll: -0.12 },
          LeftForeArm: { pitch: 0.20 - breath * 0.03, yaw: 0, roll: 0 },
          RightForeArm: { pitch: 0.20 - breath * 0.03, yaw: 0, roll: 0 },

          // Grounded feet
          LeftUpLeg: { pitch: 0.01, yaw: 0.02, roll: 0.02 },
          RightUpLeg: { pitch: 0.01, yaw: -0.02, roll: -0.02 },
          LeftLeg: { pitch: 0.03, yaw: 0, roll: 0 },
          RightLeg: { pitch: 0.03, yaw: 0, roll: 0 },
          LeftFoot: { pitch: -0.01, yaw: 0, roll: 0 },
          RightFoot: { pitch: -0.01, yaw: 0, roll: 0 },
        },
      };
    },
  },

  // 2. WALK: Antiphase human gait cycle
  walk: {
    name: 'walk',
    duration: 1.1,
    isLoop: true,
    sample: (p: number) => {
      const angle = p * Math.PI * 2;
      const legPhase = Math.sin(angle);
      const legCos = Math.cos(angle);
      const pelvicTilt = Math.sin(angle) * 0.04;
      const pelvicDrop = Math.abs(Math.sin(angle * 2)) * 0.03;

      return {
        hipsOffset: [Math.sin(angle) * 0.03, -pelvicDrop, 0],
        bones: {
          Hips: { pitch: 0.03, yaw: -legPhase * 0.10, roll: pelvicTilt },
          Spine: { pitch: 0.04, yaw: legPhase * 0.08, roll: -pelvicTilt * 0.5 },
          Spine1: { pitch: 0.02, yaw: legPhase * 0.05, roll: 0 },
          Spine2: { pitch: 0.02, yaw: legPhase * 0.04, roll: 0 },
          Neck: { pitch: -0.02, yaw: -legPhase * 0.04, roll: 0 },

          // Left/Right Leg alternation (pitch > 0 is forward stride)
          LeftUpLeg: { pitch: legPhase * 0.45, yaw: 0, roll: 0.02 },
          RightUpLeg: { pitch: -legPhase * 0.45, yaw: 0, roll: -0.02 },
          LeftLeg: { pitch: Math.max(0, legCos * 0.60), yaw: 0, roll: 0 },
          RightLeg: { pitch: Math.max(0, -legCos * 0.60), yaw: 0, roll: 0 },
          LeftFoot: { pitch: -legPhase * 0.20, yaw: 0, roll: 0 },
          RightFoot: { pitch: legPhase * 0.20, yaw: 0, roll: 0 },

          // Counterbalancing arm swing (opposite to leg)
          LeftArm: { pitch: -legPhase * 0.40, yaw: 0, roll: 0.08 },
          RightArm: { pitch: legPhase * 0.40, yaw: 0, roll: -0.08 },
          LeftForeArm: { pitch: Math.max(0.12, -legPhase * 0.30 + 0.22), yaw: 0, roll: 0 },
          RightForeArm: { pitch: Math.max(0.12, legPhase * 0.30 + 0.22), yaw: 0, roll: 0 },
        },
      };
    },
  },

  // 3. RUN: Dynamic sprint mechanics with high knee drive
  run: {
    name: 'run',
    duration: 0.72,
    isLoop: true,
    sample: (p: number) => {
      const angle = p * Math.PI * 2;
      const stride = Math.sin(angle);
      const strideCos = Math.cos(angle);
      const bounce = Math.abs(Math.sin(angle)) * 0.07;

      return {
        hipsOffset: [0, bounce - 0.03, 0],
        bones: {
          Spine: { pitch: 0.14, yaw: stride * 0.14, roll: 0 },
          Spine1: { pitch: 0.06, yaw: stride * 0.08, roll: 0 },
          Neck: { pitch: -0.10, yaw: 0, roll: 0 },

          // High knee lift and trailing leg drive
          LeftUpLeg: { pitch: stride * 0.85, yaw: 0, roll: 0.04 },
          RightUpLeg: { pitch: -stride * 0.85, yaw: 0, roll: -0.04 },
          LeftLeg: { pitch: Math.max(0, -strideCos * 1.15 + 0.15), yaw: 0, roll: 0 },
          RightLeg: { pitch: Math.max(0, strideCos * 1.15 + 0.15), yaw: 0, roll: 0 },
          LeftFoot: { pitch: stride * 0.30, yaw: 0, roll: 0 },
          RightFoot: { pitch: -stride * 0.30, yaw: 0, roll: 0 },

          // Athletic 90-degree arm pump
          LeftArm: { pitch: -stride * 0.70, yaw: 0, roll: 0.12 },
          RightArm: { pitch: stride * 0.70, yaw: 0, roll: -0.12 },
          LeftForeArm: { pitch: 1.45, yaw: 0, roll: 0 },
          RightForeArm: { pitch: 1.45, yaw: 0, roll: 0 },
        },
      };
    },
  },

  // 4. SQUAT: Biomechanical deep squat with forward arm counterbalance
  squat: {
    name: 'squat',
    duration: 2.8,
    isLoop: true,
    sample: (p: number) => {
      let depth = 0;
      if (p < 0.44) {
        depth = easeInOut(p / 0.44);
      } else if (p < 0.54) {
        depth = 1.0;
      } else if (p < 0.94) {
        depth = 1.0 - easeInOut((p - 0.54) / 0.40);
      } else {
        depth = 0.0;
      }

      return {
        hipsOffset: [0, -0.42 * depth, -0.15 * depth],
        bones: {
          // Torso leans slightly forward to balance center of mass
          Spine: { pitch: 0.32 * depth, yaw: 0, roll: 0 },
          Spine1: { pitch: 0.08 * depth, yaw: 0, roll: 0 },
          Neck: { pitch: -0.20 * depth, yaw: 0, roll: 0 },

          // Thighs flex forward +0.95 and abduct slightly, knees flex backward
          LeftUpLeg: { pitch: 0.95 * depth, yaw: 0.14 * depth, roll: 0.18 * depth },
          RightUpLeg: { pitch: 0.95 * depth, yaw: -0.14 * depth, roll: -0.18 * depth },
          LeftLeg: { pitch: 1.35 * depth, yaw: 0, roll: 0 },
          RightLeg: { pitch: 1.35 * depth, yaw: 0, roll: 0 },
          LeftFoot: { pitch: -0.35 * depth, yaw: 0, roll: 0 },
          RightFoot: { pitch: -0.35 * depth, yaw: 0, roll: 0 },

          // Arms raise forward horizontally (+0.95 rad) for counterbalance
          LeftArm: { pitch: 0.95 * depth, yaw: 0, roll: 0.10 },
          RightArm: { pitch: 0.95 * depth, yaw: 0, roll: -0.10 },
          LeftForeArm: { pitch: 0.20 * depth, yaw: 0, roll: 0 },
          RightForeArm: { pitch: 0.20 * depth, yaw: 0, roll: 0 },
        },
      };
    },
  },

  // 5. LUNGE: Alternating forward lunges with upright posture
  lunge: {
    name: 'lunge',
    duration: 3.4,
    isLoop: true,
    sample: (p: number) => {
      const isLeft = p < 0.5;
      const subProg = (isLeft ? p : p - 0.5) * 2.0;
      const depth = humanStep(subProg * Math.PI * 2);

      return {
        hipsOffset: [0, -0.38 * depth, 0.10 * depth],
        bones: {
          Spine: { pitch: 0.06 * depth, yaw: 0, roll: 0 },
          Neck: { pitch: -0.04 * depth, yaw: 0, roll: 0 },

          ...(isLeft
            ? {
                // Left lead leg (forward +0.90, knee 90°)
                LeftUpLeg: { pitch: 0.90 * depth, yaw: 0.04, roll: 0.02 },
                LeftLeg: { pitch: 1.40 * depth, yaw: 0, roll: 0 },
                LeftFoot: { pitch: -0.45 * depth, yaw: 0, roll: 0 },
                // Right trailing leg (backward, heel up)
                RightUpLeg: { pitch: -0.30 * depth, yaw: -0.04, roll: -0.02 },
                RightLeg: { pitch: 1.35 * depth, yaw: 0, roll: 0 },
                RightFoot: { pitch: 0.50 * depth, yaw: 0, roll: 0 },

                LeftArm: { pitch: -0.40 * depth, yaw: 0, roll: 0.10 },
                LeftForeArm: { pitch: 0.85, yaw: 0, roll: 0 },
                RightArm: { pitch: 0.70 * depth, yaw: 0, roll: -0.10 },
                RightForeArm: { pitch: 0.85, yaw: 0, roll: 0 },
              }
            : {
                // Right lead leg
                RightUpLeg: { pitch: 0.90 * depth, yaw: -0.04, roll: -0.02 },
                RightLeg: { pitch: 1.40 * depth, yaw: 0, roll: 0 },
                RightFoot: { pitch: -0.45 * depth, yaw: 0, roll: 0 },
                // Left trailing leg
                LeftUpLeg: { pitch: -0.30 * depth, yaw: 0.04, roll: 0.02 },
                LeftLeg: { pitch: 1.35 * depth, yaw: 0, roll: 0 },
                LeftFoot: { pitch: 0.50 * depth, yaw: 0, roll: 0 },

                LeftArm: { pitch: 0.70 * depth, yaw: 0, roll: 0.10 },
                LeftForeArm: { pitch: 0.85, yaw: 0, roll: 0 },
                RightArm: { pitch: -0.40 * depth, yaw: 0, roll: -0.10 },
                RightForeArm: { pitch: 0.85, yaw: 0, roll: 0 },
              }),
        },
      };
    },
  },

  // 6. PUSHUP: Anatomically true prone pushup
  // - Body is in horizontal prone alignment (pivoted 90° to floor)
  // - Hands anchored directly under shoulders
  // - At top: arms extended supporting chest
  // - At bottom: chest lowers to floor, elbows flare backward/outward at 45°
  pushup: {
    name: 'pushup',
    duration: 2.2,
    isLoop: true,
    sample: (p: number) => {
      // 0 = top plank, 1 = bottom chest at floor
      const depth = humanStep(p * Math.PI * 2);

      // Arm kinematics interpolated smoothly between top plank and bottom chest press:
      const armPitch = THREE.MathUtils.lerp(1.35, 0.68, depth);
      const armRoll = THREE.MathUtils.lerp(0.18, 0.45, depth);
      const armYaw = THREE.MathUtils.lerp(0.0, -0.22, depth);
      const elbowPitch = THREE.MathUtils.lerp(0.10, 1.45, depth);

      return {
        proneAngle: Math.PI * 0.5,
        // Height above podium: 0.42m at top plank, 0.18m at chest-to-floor bottom
        proneY: 0.42 - 0.22 * depth,
        hipsOffset: [0, 0, 0],
        bones: {
          // Rigid plank spine
          Spine: { pitch: 0.0, yaw: 0, roll: 0 },
          Spine1: { pitch: 0.0, yaw: 0, roll: 0 },
          Neck: { pitch: 0.05, yaw: 0, roll: 0 }, // Looking at floor between hands

          // Legs locked straight with dorsiflexed toes
          LeftUpLeg: { pitch: 0.0, yaw: 0, roll: 0.02 },
          RightUpLeg: { pitch: 0.0, yaw: 0, roll: -0.02 },
          LeftLeg: { pitch: 0.02, yaw: 0, roll: 0 },
          RightLeg: { pitch: 0.02, yaw: 0, roll: 0 },
          LeftFoot: { pitch: 1.25, yaw: 0, roll: 0 },
          RightFoot: { pitch: 1.25, yaw: 0, roll: 0 },

          // Arms: Support chest directly under shoulders, bending back 45° at bottom
          LeftArm: { pitch: armPitch, yaw: armYaw, roll: armRoll },
          RightArm: { pitch: armPitch, yaw: -armYaw, roll: -armRoll },
          LeftForeArm: { pitch: elbowPitch, yaw: 0, roll: 0 },
          RightForeArm: { pitch: elbowPitch, yaw: 0, roll: 0 },
          LeftHand: { pitch: -1.25, yaw: 0, roll: 0 }, // Palms flat on floor
          RightHand: { pitch: -1.25, yaw: 0, roll: 0 },
        },
      };
    },
  },

  // 7. PLANK: Isometric prone bridge on forearms
  plank: {
    name: 'plank',
    duration: 3.0,
    isLoop: true,
    sample: (p: number) => {
      const breath = Math.sin(p * Math.PI * 2) * 0.008;

      return {
        proneAngle: Math.PI * 0.5,
        proneY: 0.28 + breath,
        hipsOffset: [0, 0, 0],
        bones: {
          Spine: { pitch: 0.0, yaw: 0, roll: 0 },
          Spine1: { pitch: 0.0, yaw: 0, roll: 0 },
          Neck: { pitch: 0.05, yaw: 0, roll: 0 },

          LeftUpLeg: { pitch: 0.0, yaw: 0, roll: 0.02 },
          RightUpLeg: { pitch: 0.0, yaw: 0, roll: -0.02 },
          LeftLeg: { pitch: 0.02, yaw: 0, roll: 0 },
          RightLeg: { pitch: 0.02, yaw: 0, roll: 0 },
          LeftFoot: { pitch: 1.25, yaw: 0, roll: 0 },
          RightFoot: { pitch: 1.25, yaw: 0, roll: 0 },

          // Forearms resting flat on floor under shoulders
          LeftArm: { pitch: 1.35, yaw: 0, roll: 0.16 },
          RightArm: { pitch: 1.35, yaw: 0, roll: -0.16 },
          LeftForeArm: { pitch: 1.48, yaw: 0, roll: 0 },
          RightForeArm: { pitch: 1.48, yaw: 0, roll: 0 },
        },
      };
    },
  },

  // 8. MARTIAL MA BU (Horse Stance): Deep, stable Kung Fu stance
  martial_mabu: {
    name: 'martial_mabu',
    duration: 3.0,
    isLoop: true,
    sample: (p: number) => {
      const breath = Math.sin(p * Math.PI * 2) * 0.015;

      return {
        hipsOffset: [0, -0.38 + breath, 0],
        bones: {
          Spine: { pitch: 0.04, yaw: 0, roll: 0 },
          Spine1: { pitch: 0.02, yaw: 0, roll: 0 },
          Neck: { pitch: -0.03, yaw: 0, roll: 0 },

          // Wide stance, horizontal thighs (+0.95), knees out, feet gripped
          LeftUpLeg: { pitch: 0.95, yaw: 0.18, roll: 0.35 },
          RightUpLeg: { pitch: 0.95, yaw: -0.18, roll: -0.35 },
          LeftLeg: { pitch: 1.25, yaw: 0, roll: 0 },
          RightLeg: { pitch: 1.25, yaw: 0, roll: 0 },
          LeftFoot: { pitch: -0.30, yaw: 0, roll: 0 },
          RightFoot: { pitch: -0.30, yaw: 0, roll: 0 },

          // Chambered fists at waist with elbows back
          LeftArm: { pitch: -0.22, yaw: 0, roll: 0.12 },
          RightArm: { pitch: -0.22, yaw: 0, roll: -0.12 },
          LeftForeArm: { pitch: 1.55, yaw: 0, roll: 0 },
          RightForeArm: { pitch: 1.55, yaw: 0, roll: 0 },
        },
      };
    },
  },

  // 9. MARTIAL PUNCH: Alternating straight strikes with hip and torso rotation
  martial_punch: {
    name: 'martial_punch',
    duration: 1.1,
    isLoop: true,
    sample: (p: number) => {
      const isRight = p < 0.5;
      const subProg = (isRight ? p : p - 0.5) * 2.0;
      const strike = Math.sin(subProg * Math.PI); // 0 -> 1 -> 0

      return {
        hipsOffset: [0, -0.04, 0],
        bones: {
          // Hip and torso rotation drives the strike
          Hips: { pitch: 0.04, yaw: (isRight ? 0.20 : -0.20) * strike, roll: 0 },
          Spine: { pitch: 0.06, yaw: (isRight ? 0.25 : -0.25) * strike, roll: 0 },
          Spine1: { pitch: 0.04, yaw: (isRight ? 0.20 : -0.20) * strike, roll: 0 },
          Neck: { pitch: -0.04, yaw: (isRight ? -0.15 : 0.15) * strike, roll: 0 },

          // Solid fighting stance
          LeftUpLeg: { pitch: 0.20, yaw: 0.10, roll: 0.08 },
          RightUpLeg: { pitch: -0.15, yaw: -0.10, roll: -0.08 },
          LeftLeg: { pitch: 0.35, yaw: 0, roll: 0 },
          RightLeg: { pitch: 0.30, yaw: 0, roll: 0 },

          ...(isRight
            ? {
                // Right punch extends forward along Z (+1.45 rad)
                RightArm: { pitch: 1.45 * strike, yaw: -0.12 * strike, roll: -0.06 },
                RightForeArm: { pitch: 0.08 * (1 - strike) + 0.02, yaw: 0, roll: 0 },
                // Left guard hand at chin
                LeftArm: { pitch: 0.25, yaw: 0, roll: 0.15 },
                LeftForeArm: { pitch: 1.40, yaw: 0, roll: 0 },
              }
            : {
                // Left punch extends forward along Z (+1.45 rad)
                LeftArm: { pitch: 1.45 * strike, yaw: 0.12 * strike, roll: 0.06 },
                LeftForeArm: { pitch: 0.08 * (1 - strike) + 0.02, yaw: 0, roll: 0 },
                // Right guard hand at chin
                RightArm: { pitch: 0.25, yaw: 0, roll: -0.15 },
                RightForeArm: { pitch: 1.40, yaw: 0, roll: 0 },
              }),
        },
      };
    },
  },

  // 10. MARTIAL KICK: Chamber -> Snap -> Recoil
  martial_kick: {
    name: 'martial_kick',
    duration: 1.5,
    isLoop: true,
    sample: (p: number) => {
      let chamber = 0;
      let snap = 0;
      if (p < 0.32) {
        chamber = p / 0.32;
      } else if (p < 0.52) {
        chamber = 1.0;
        snap = (p - 0.32) / 0.20;
      } else if (p < 0.78) {
        chamber = 1.0 - (p - 0.52) / 0.26;
        snap = 1.0 - (p - 0.52) / 0.26;
      }

      return {
        hipsOffset: [0, -0.04, 0],
        bones: {
          Spine: { pitch: -0.16 * chamber, yaw: -0.12 * chamber, roll: 0 }, // Counterbalance
          Neck: { pitch: 0.10 * chamber, yaw: 0.12 * chamber, roll: 0 },

          // Left support leg firmly rooted
          LeftUpLeg: { pitch: -0.08, yaw: 0.08, roll: 0.04 },
          LeftLeg: { pitch: 0.22, yaw: 0, roll: 0 },

          // Right kicking leg: thigh lifts forward (+1.32), knee snaps straight
          RightUpLeg: { pitch: 1.32 * chamber, yaw: -0.08, roll: -0.04 },
          RightLeg: { pitch: (1.25 * chamber) * (1 - snap) + 0.08 * snap, yaw: 0, roll: 0 },
          RightFoot: { pitch: -0.35 * snap, yaw: 0, roll: 0 },

          // Guard hands
          LeftArm: { pitch: 0.30, yaw: 0, roll: 0.18 },
          LeftForeArm: { pitch: 1.25, yaw: 0, roll: 0 },
          RightArm: { pitch: 0.20, yaw: 0, roll: -0.18 },
          RightForeArm: { pitch: 1.20, yaw: 0, roll: 0 },
        },
      };
    },
  },

  // 11. MARTIAL TAI CHI: Silk Reeling & Cloud Hands flowing posture
  martial_taichi: {
    name: 'martial_taichi',
    duration: 4.8,
    isLoop: true,
    sample: (p: number) => {
      const angle = p * Math.PI * 2;
      const weightShift = Math.sin(angle);
      const wave = Math.cos(angle);

      return {
        hipsOffset: [weightShift * 0.10, -0.08, 0],
        bones: {
          Hips: { pitch: 0.03, yaw: weightShift * 0.22, roll: weightShift * 0.04 },
          Spine: { pitch: 0.04, yaw: weightShift * 0.30, roll: 0 },
          Spine1: { pitch: 0.02, yaw: weightShift * 0.20, roll: 0 },
          Neck: { pitch: -0.03, yaw: -weightShift * 0.18, roll: 0 },

          // Smooth shifting knees
          LeftUpLeg: { pitch: 0.25 + weightShift * 0.12, yaw: 0.10, roll: 0.14 },
          RightUpLeg: { pitch: 0.25 - weightShift * 0.12, yaw: -0.10, roll: -0.14 },
          LeftLeg: { pitch: 0.40 + weightShift * 0.15, yaw: 0, roll: 0 },
          RightLeg: { pitch: 0.40 - weightShift * 0.15, yaw: 0, roll: 0 },

          // Graceful cloud hands flowing across chest
          LeftArm: { pitch: 0.65 + wave * 0.25, yaw: weightShift * 0.35, roll: 0.38 + wave * 0.15 },
          LeftForeArm: { pitch: 0.85 + wave * 0.20, yaw: 0, roll: 0 },
          RightArm: { pitch: 0.65 - wave * 0.25, yaw: weightShift * 0.35, roll: -0.38 - wave * 0.15 },
          RightForeArm: { pitch: 0.85 - wave * 0.20, yaw: 0, roll: 0 },
        },
      };
    },
  },

  // 12. JUMP: Jumping Jacks with synchronized arm and leg abduction
  jump: {
    name: 'jump',
    duration: 1.1,
    isLoop: true,
    sample: (p: number) => {
      const angle = p * Math.PI * 2;
      const spread = (Math.sin(angle) + 1) * 0.5; // 0 (feet together) to 1 (feet wide, arms up)
      const bounce = Math.abs(Math.sin(angle * 2)) * 0.05;

      return {
        hipsOffset: [0, bounce - 0.02, 0],
        bones: {
          Spine: { pitch: 0.04, yaw: 0, roll: 0 },

          // Legs abduct outward symmetrically
          LeftUpLeg: { pitch: 0.02, yaw: 0, roll: 0.40 * spread },
          RightUpLeg: { pitch: 0.02, yaw: 0, roll: -0.40 * spread },
          LeftLeg: { pitch: 0.12 * (1 - spread), yaw: 0, roll: 0 },
          RightLeg: { pitch: 0.12 * (1 - spread), yaw: 0, roll: 0 },

          // Arms raise outward and overhead (roll up to 1.85 rad)
          LeftArm: { pitch: 0.10, yaw: 0, roll: 0.15 + 1.70 * spread },
          RightArm: { pitch: 0.10, yaw: 0, roll: -0.15 - 1.70 * spread },
          LeftForeArm: { pitch: 0.20 * (1 - spread) + 0.10, yaw: 0, roll: 0 },
          RightForeArm: { pitch: 0.20 * (1 - spread) + 0.10, yaw: 0, roll: 0 },
        },
      };
    },
  },
};

/**
 * Universal Humanoid Clip Resolver
 * Maps exercise names, workout types, and multilingual techniques into the correct biomechanical clip.
 */
export function resolveHumanoidClip(exerciseName?: string): HumanoidClip {
  if (!exerciseName) return HUMANOID_CLIPS.idle;

  // Normalize: lower case, strip accents, remove punctuation/hyphens
  const raw = exerciseName.toLowerCase();
  const normalized = raw
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[-_'/]/g, ' ')
    .trim();

  // Direct clip key match
  if (HUMANOID_CLIPS[raw]) return HUMANOID_CLIPS[raw];
  if (HUMANOID_CLIPS[normalized]) return HUMANOID_CLIPS[normalized];

  // 1. PUSH-UP / POMPES
  if (
    normalized.includes('pompe') ||
    normalized.includes('push') ||
    normalized.includes('appui') ||
    normalized.includes('developpe') ||
    normalized.includes('chest press') ||
    normalized.includes('отжимания')
  ) {
    return HUMANOID_CLIPS.pushup;
  }

  // 2. PLANK / GAINAGE
  if (
    normalized.includes('gainage') ||
    normalized.includes('planche') ||
    normalized.includes('plank') ||
    normalized.includes('abdo') ||
    normalized.includes('crunch') ||
    normalized.includes('core') ||
    normalized.includes('планка')
  ) {
    return HUMANOID_CLIPS.plank;
  }

  // 3. SQUAT
  if (
    normalized.includes('squat') ||
    normalized.includes('accroupi') ||
    normalized.includes('sentadilla') ||
    normalized.includes('souleve') ||
    normalized.includes('terre') ||
    normalized.includes('cuisse') ||
    normalized.includes('приседания')
  ) {
    return HUMANOID_CLIPS.squat;
  }

  // 4. LUNGE / FENTES
  if (
    normalized.includes('fente') ||
    normalized.includes('lunge') ||
    normalized.includes('zancada') ||
    normalized.includes('выпады')
  ) {
    return HUMANOID_CLIPS.lunge;
  }

  // 5. RUN / SPRINT
  if (
    normalized.includes('course') ||
    normalized.includes('courir') ||
    normalized.includes('sprint') ||
    normalized.includes('footing') ||
    normalized.includes('run') ||
    normalized.includes('jog') ||
    normalized.includes('бег')
  ) {
    return HUMANOID_CLIPS.run;
  }

  // 6. WALK / MARCHE
  if (
    normalized.includes('marche') ||
    normalized.includes('marcher') ||
    normalized.includes('walk') ||
    normalized.includes('pas') ||
    normalized.includes('deplacement') ||
    normalized.includes('hodba') ||
    normalized.includes('ходьба')
  ) {
    return HUMANOID_CLIPS.walk;
  }

  // 7. JUMP / JUMPING JACKS / BURPEES
  if (
    normalized.includes('jump') ||
    normalized.includes('saut') ||
    normalized.includes('jack') ||
    normalized.includes('burpee') ||
    normalized.includes('corde') ||
    normalized.includes('прыжки')
  ) {
    return HUMANOID_CLIPS.jump;
  }

  // 8. MARTIAL MA BU / HORSE STANCE / ENRACINEMENT
  if (
    normalized.includes('cavalier') ||
    normalized.includes('cheval') ||
    normalized.includes('mabu') ||
    normalized.includes('ma bu') ||
    normalized.includes('enracinement') ||
    normalized.includes('wuji') ||
    normalized.includes('originelle') ||
    normalized.includes('posture')
  ) {
    return HUMANOID_CLIPS.martial_mabu;
  }

  // 9. MARTIAL PUNCH / FRAPPES / POING / BOXING
  if (
    normalized.includes('punch') ||
    normalized.includes('poing') ||
    normalized.includes('box') ||
    normalized.includes('frappe') ||
    normalized.includes('direct') ||
    normalized.includes('jab') ||
    normalized.includes('cross') ||
    normalized.includes('buffle') ||
    normalized.includes('combat') ||
    normalized.includes('удар')
  ) {
    return HUMANOID_CLIPS.martial_punch;
  }

  // 10. MARTIAL KICK / COUPS DE PIED
  if (
    normalized.includes('kick') ||
    normalized.includes('pied') ||
    normalized.includes('balayage') ||
    normalized.includes('fouette') ||
    normalized.includes('chasse') ||
    normalized.includes('пинок')
  ) {
    return HUMANOID_CLIPS.martial_kick;
  }

  // 11. MARTIAL TAI CHI / PALM / CLOUD HANDS / QI GONG
  if (
    normalized.includes('tai chi') ||
    normalized.includes('taichi') ||
    normalized.includes('paume') ||
    normalized.includes('onde') ||
    normalized.includes('nuage') ||
    normalized.includes('qi') ||
    normalized.includes('singe') ||
    normalized.includes('moineau') ||
    normalized.includes('respiration') ||
    normalized.includes('flux') ||
    normalized.includes('fluide') ||
    normalized.includes('spirale') ||
    normalized.includes('redirection') ||
    normalized.includes('defense') ||
    normalized.includes('тайчи')
  ) {
    return HUMANOID_CLIPS.martial_taichi;
  }

  // Default living breathing presence
  return HUMANOID_CLIPS.idle;
}
