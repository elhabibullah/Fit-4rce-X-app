import * as THREE from 'three';
import { HumanoidBoneName } from './humanoidBones.ts';
import { HumanoidFramePose } from './skeletalRetargeter.ts';
import { resolveExerciseDefinition } from './exerciseDefinitions.ts';
import { getGithubJsonClip, loadGithubExercisesJson } from './githubExercisesLoader.ts';
import { HumanoidMotionClip, MotionKeyframe } from './humanoidMotionClip.ts';

export { HumanoidMotionClip, type MotionKeyframe };

// Kick off eager preload of the 35 GitHub exercises in background
if (typeof window !== 'undefined') {
  loadGithubExercisesJson().catch(() => {});
}

// --------------------------------------------------------------------------
// MASTER BIOMECHANICAL MOTION LIBRARY
// --------------------------------------------------------------------------

// 1. SQUAT: Biomechanical human trajectory
const SQUAT_CLIP = new HumanoidMotionClip('squat', 'Squat', 2.8, [
  {
    time: 0.0,
    hipsOffset: [0, 0, 0],
    bones: {
      Spine: { pitch: 0.05, yaw: 0, roll: 0 },
      LeftArm: { pitch: 0.15, yaw: 0, roll: -0.10 },
      RightArm: { pitch: 0.15, yaw: 0, roll: 0.10 },
      LeftUpLeg: { pitch: 0, yaw: 0, roll: 0.05 },
      RightUpLeg: { pitch: 0, yaw: 0, roll: -0.05 },
    },
  },
  {
    time: 0.25,
    hipsOffset: [0, -0.18, -0.10],
    bones: {
      Spine: { pitch: 0.18, yaw: 0, roll: 0 },
      LeftArm: { pitch: 0.65, yaw: 0, roll: -0.05 },
      RightArm: { pitch: 0.65, yaw: 0, roll: 0.05 },
      LeftForeArm: { pitch: 0.20, yaw: 0, roll: 0 },
      RightForeArm: { pitch: 0.20, yaw: 0, roll: 0 },
      LeftUpLeg: { pitch: 0.50, yaw: 0.05, roll: 0.10 },
      RightUpLeg: { pitch: 0.50, yaw: -0.05, roll: -0.10 },
      LeftLeg: { pitch: 0.65, yaw: 0, roll: 0 },
      RightLeg: { pitch: 0.65, yaw: 0, roll: 0 },
      LeftFoot: { pitch: 0.15, yaw: 0, roll: 0 },
      RightFoot: { pitch: 0.15, yaw: 0, roll: 0 },
    },
  },
  {
    time: 0.50,
    hipsOffset: [0, -0.36, -0.18],
    bones: {
      Spine: { pitch: 0.28, yaw: 0, roll: 0 },
      Spine1: { pitch: 0.10, yaw: 0, roll: 0 },
      LeftArm: { pitch: 0.95, yaw: 0, roll: -0.05 },
      RightArm: { pitch: 0.95, yaw: 0, roll: 0.05 },
      LeftForeArm: { pitch: 0.35, yaw: 0, roll: 0 },
      RightForeArm: { pitch: 0.35, yaw: 0, roll: 0 },
      LeftUpLeg: { pitch: 0.95, yaw: 0.08, roll: 0.15 },
      RightUpLeg: { pitch: 0.95, yaw: -0.08, roll: -0.15 },
      LeftLeg: { pitch: 1.25, yaw: 0, roll: 0 },
      RightLeg: { pitch: 1.25, yaw: 0, roll: 0 },
      LeftFoot: { pitch: 0.30, yaw: 0, roll: 0 },
      RightFoot: { pitch: 0.30, yaw: 0, roll: 0 },
    },
  },
  {
    time: 0.75,
    hipsOffset: [0, -0.18, -0.10],
    bones: {
      Spine: { pitch: 0.18, yaw: 0, roll: 0 },
      LeftArm: { pitch: 0.65, yaw: 0, roll: -0.05 },
      RightArm: { pitch: 0.65, yaw: 0, roll: 0.05 },
      LeftForeArm: { pitch: 0.20, yaw: 0, roll: 0 },
      RightForeArm: { pitch: 0.20, yaw: 0, roll: 0 },
      LeftUpLeg: { pitch: 0.50, yaw: 0.05, roll: 0.10 },
      RightUpLeg: { pitch: 0.50, yaw: -0.05, roll: -0.10 },
      LeftLeg: { pitch: 0.65, yaw: 0, roll: 0 },
      RightLeg: { pitch: 0.65, yaw: 0, roll: 0 },
      LeftFoot: { pitch: 0.15, yaw: 0, roll: 0 },
      RightFoot: { pitch: 0.15, yaw: 0, roll: 0 },
    },
  },
  {
    time: 1.0,
    hipsOffset: [0, 0, 0],
    bones: {
      Spine: { pitch: 0.05, yaw: 0, roll: 0 },
      LeftArm: { pitch: 0.15, yaw: 0, roll: -0.10 },
      RightArm: { pitch: 0.15, yaw: 0, roll: 0.10 },
      LeftUpLeg: { pitch: 0, yaw: 0, roll: 0.05 },
      RightUpLeg: { pitch: 0, yaw: 0, roll: -0.05 },
    },
  },
]);

// 2. LUNGE: Authentic grounded split lunges (fentes sur place) - both feet anchored, pure vertical motion
const LUNGE_CLIP = new HumanoidMotionClip('lunge', 'Lunge', 3.6, [
  // 0.00: Split stance ready (Right foot forward, Left foot back on ball of foot)
  {
    time: 0.0,
    hipsOffset: [0, 0, 0],
    bones: {
      Spine: { pitch: 0.02, yaw: 0, roll: 0 },
      LeftArm: { pitch: 0.20, yaw: 0, roll: -0.10 },
      RightArm: { pitch: -0.20, yaw: 0, roll: 0.10 },
      RightUpLeg: { pitch: 0.35, yaw: 0, roll: -0.02 }, // Front leg slightly forward
      RightLeg: { pitch: 0.15, yaw: 0, roll: 0 },
      RightFoot: { pitch: 0.05, yaw: 0, roll: 0 }, // Planted flat
      LeftUpLeg: { pitch: -0.25, yaw: 0, roll: 0.04 }, // Rear leg back
      LeftLeg: { pitch: 0.20, yaw: 0, roll: 0 },
      LeftFoot: { pitch: -0.25, yaw: 0, roll: 0 }, // Ball of foot anchored on floor
    },
  },
  // 0.25: Deep vertical descent (both knees bend to ~90 deg, rear knee hovers above floor)
  {
    time: 0.25,
    hipsOffset: [0, -0.28, 0], // Pure vertical descent, zero horizontal skating
    bones: {
      Spine: { pitch: 0.04, yaw: 0, roll: 0 }, // Upright torso
      RightUpLeg: { pitch: 0.85, yaw: 0, roll: -0.02 }, // 90 deg front hip
      RightLeg: { pitch: 1.15, yaw: 0, roll: 0 }, // 90 deg front knee
      RightFoot: { pitch: 0.15, yaw: 0, roll: 0 }, // Front foot flat on floor
      LeftUpLeg: { pitch: -0.20, yaw: 0, roll: 0.04 }, // Rear hip extension
      LeftLeg: { pitch: 1.15, yaw: 0, roll: 0 }, // Rear knee bent down hovering above floor
      LeftFoot: { pitch: -0.40, yaw: 0, roll: 0 }, // Ball of rear foot firmly on floor
      LeftArm: { pitch: 0.45, yaw: 0, roll: -0.08 },
      RightArm: { pitch: -0.25, yaw: 0, roll: 0.08 },
    },
  },
  // 0.45: Drive back up vertically to split stance
  {
    time: 0.45,
    hipsOffset: [0, 0, 0],
    bones: {
      Spine: { pitch: 0.02, yaw: 0, roll: 0 },
      RightUpLeg: { pitch: 0.35, yaw: 0, roll: -0.02 },
      RightLeg: { pitch: 0.15, yaw: 0, roll: 0 },
      RightFoot: { pitch: 0.05, yaw: 0, roll: 0 },
      LeftUpLeg: { pitch: -0.25, yaw: 0, roll: 0.04 },
      LeftLeg: { pitch: 0.20, yaw: 0, roll: 0 },
      LeftFoot: { pitch: -0.25, yaw: 0, roll: 0 },
      LeftArm: { pitch: 0.20, yaw: 0, roll: -0.10 },
      RightArm: { pitch: -0.20, yaw: 0, roll: 0.10 },
    },
  },
  // 0.50: Switch leg transition (Left foot forward, Right foot back)
  {
    time: 0.50,
    hipsOffset: [0, 0, 0],
    bones: {
      Spine: { pitch: 0.02, yaw: 0, roll: 0 },
      LeftUpLeg: { pitch: 0.35, yaw: 0, roll: 0.02 }, // Left leg forward
      LeftLeg: { pitch: 0.15, yaw: 0, roll: 0 },
      LeftFoot: { pitch: 0.05, yaw: 0, roll: 0 }, // Planted flat
      RightUpLeg: { pitch: -0.25, yaw: 0, roll: -0.04 }, // Right leg back
      RightLeg: { pitch: 0.20, yaw: 0, roll: 0 },
      RightFoot: { pitch: -0.25, yaw: 0, roll: 0 }, // Ball of foot anchored
      RightArm: { pitch: 0.20, yaw: 0, roll: 0.10 },
      LeftArm: { pitch: -0.20, yaw: 0, roll: -0.10 },
    },
  },
  // 0.75: Deep vertical descent on opposite side
  {
    time: 0.75,
    hipsOffset: [0, -0.28, 0], // Pure vertical descent
    bones: {
      Spine: { pitch: 0.04, yaw: 0, roll: 0 },
      LeftUpLeg: { pitch: 0.85, yaw: 0, roll: 0.02 }, // 90 deg left hip
      LeftLeg: { pitch: 1.15, yaw: 0, roll: 0 }, // 90 deg left knee
      LeftFoot: { pitch: 0.15, yaw: 0, roll: 0 }, // Left foot flat
      RightUpLeg: { pitch: -0.20, yaw: 0, roll: -0.04 },
      RightLeg: { pitch: 1.15, yaw: 0, roll: 0 }, // Right knee hovering above floor
      RightFoot: { pitch: -0.40, yaw: 0, roll: 0 }, // Ball of right foot on floor
      RightArm: { pitch: 0.45, yaw: 0, roll: 0.08 },
      LeftArm: { pitch: -0.25, yaw: 0, roll: -0.08 },
    },
  },
  // 0.95: Drive back up vertically to left split stance
  {
    time: 0.95,
    hipsOffset: [0, 0, 0],
    bones: {
      Spine: { pitch: 0.02, yaw: 0, roll: 0 },
      LeftUpLeg: { pitch: 0.35, yaw: 0, roll: 0.02 },
      LeftLeg: { pitch: 0.15, yaw: 0, roll: 0 },
      LeftFoot: { pitch: 0.05, yaw: 0, roll: 0 },
      RightUpLeg: { pitch: -0.25, yaw: 0, roll: -0.04 },
      RightLeg: { pitch: 0.20, yaw: 0, roll: 0 },
      RightFoot: { pitch: -0.25, yaw: 0, roll: 0 },
      RightArm: { pitch: 0.20, yaw: 0, roll: 0.10 },
      LeftArm: { pitch: -0.20, yaw: 0, roll: -0.10 },
    },
  },
  // 1.00: Return to start
  {
    time: 1.0,
    hipsOffset: [0, 0, 0],
    bones: {
      Spine: { pitch: 0.02, yaw: 0, roll: 0 },
      RightUpLeg: { pitch: 0.35, yaw: 0, roll: -0.02 },
      RightLeg: { pitch: 0.15, yaw: 0, roll: 0 },
      RightFoot: { pitch: 0.05, yaw: 0, roll: 0 },
      LeftUpLeg: { pitch: -0.25, yaw: 0, roll: 0.04 },
      LeftLeg: { pitch: 0.20, yaw: 0, roll: 0 },
      LeftFoot: { pitch: -0.25, yaw: 0, roll: 0 },
      LeftArm: { pitch: 0.20, yaw: 0, roll: -0.10 },
      RightArm: { pitch: -0.20, yaw: 0, roll: 0.10 },
    },
  },
]);

// 3. PUSH-UP: Full floor prone push-up with chest down and press to top lockout
const PUSHUP_CLIP = new HumanoidMotionClip('pushup', 'Pushup', 2.4, [
  // 0.00: Top lockout - prone horizontal, arms straight supporting upper body, spine aligned
  {
    time: 0.0,
    hipsOffset: [0, 0, 0],
    proneAngle: 1.48,
    bones: {
      Spine: { pitch: -0.04, yaw: 0, roll: 0 },
      LeftArm: { pitch: 1.45, yaw: 0, roll: 0.15 },
      RightArm: { pitch: 1.45, yaw: 0, roll: 0.15 },
      LeftForeArm: { pitch: 0.05, yaw: 0, roll: 0 },
      RightForeArm: { pitch: 0.05, yaw: 0, roll: 0 },
      LeftHand: { pitch: 1.35, yaw: 0, roll: -0.10 },
      RightHand: { pitch: 1.35, yaw: 0, roll: 0.10 },
      LeftUpLeg: { pitch: 0, yaw: 0, roll: 0.05 },
      RightUpLeg: { pitch: 0, yaw: 0, roll: -0.05 },
      LeftFoot: { pitch: 0.40, yaw: 0, roll: 0 },
      RightFoot: { pitch: 0.40, yaw: 0, roll: 0 },
    },
  },
  // 0.25: Controlled descent - elbows bending at 45 degrees, chest approaching floor
  {
    time: 0.25,
    hipsOffset: [0, -0.10, 0],
    proneAngle: 1.48,
    bones: {
      Spine: { pitch: -0.03, yaw: 0, roll: 0 },
      LeftArm: { pitch: 1.35, yaw: 0, roll: 0.25 },
      RightArm: { pitch: 1.35, yaw: 0, roll: 0.25 },
      LeftForeArm: { pitch: 0.85, yaw: 0, roll: 0 },
      RightForeArm: { pitch: 0.85, yaw: 0, roll: 0 },
      LeftHand: { pitch: 1.35, yaw: 0, roll: -0.10 },
      RightHand: { pitch: 1.35, yaw: 0, roll: 0.10 },
      LeftUpLeg: { pitch: 0, yaw: 0, roll: 0.05 },
      RightUpLeg: { pitch: 0, yaw: 0, roll: -0.05 },
      LeftFoot: { pitch: 0.40, yaw: 0, roll: 0 },
      RightFoot: { pitch: 0.40, yaw: 0, roll: 0 },
    },
  },
  // 0.50: Bottom chest stretch - elbows fully bent 90 deg, chest hovering above floor
  {
    time: 0.50,
    hipsOffset: [0, -0.20, 0],
    proneAngle: 1.48,
    bones: {
      Spine: { pitch: -0.02, yaw: 0, roll: 0 },
      LeftArm: { pitch: 1.25, yaw: 0, roll: 0.38 },
      RightArm: { pitch: 1.25, yaw: 0, roll: 0.38 },
      LeftForeArm: { pitch: 1.55, yaw: 0, roll: 0 },
      RightForeArm: { pitch: 1.55, yaw: 0, roll: 0 },
      LeftHand: { pitch: 1.35, yaw: 0, roll: -0.10 },
      RightHand: { pitch: 1.35, yaw: 0, roll: 0.10 },
      LeftUpLeg: { pitch: 0, yaw: 0, roll: 0.05 },
      RightUpLeg: { pitch: 0, yaw: 0, roll: -0.05 },
      LeftFoot: { pitch: 0.40, yaw: 0, roll: 0 },
      RightFoot: { pitch: 0.40, yaw: 0, roll: 0 },
    },
  },
  // 0.75: Concentric push - pressing palms against floor driving torso back up
  {
    time: 0.75,
    hipsOffset: [0, -0.10, 0],
    proneAngle: 1.48,
    bones: {
      Spine: { pitch: -0.03, yaw: 0, roll: 0 },
      LeftArm: { pitch: 1.35, yaw: 0, roll: 0.25 },
      RightArm: { pitch: 1.35, yaw: 0, roll: 0.25 },
      LeftForeArm: { pitch: 0.85, yaw: 0, roll: 0 },
      RightForeArm: { pitch: 0.85, yaw: 0, roll: 0 },
      LeftHand: { pitch: 1.35, yaw: 0, roll: -0.10 },
      RightHand: { pitch: 1.35, yaw: 0, roll: 0.10 },
      LeftUpLeg: { pitch: 0, yaw: 0, roll: 0.05 },
      RightUpLeg: { pitch: 0, yaw: 0, roll: -0.05 },
      LeftFoot: { pitch: 0.40, yaw: 0, roll: 0 },
      RightFoot: { pitch: 0.40, yaw: 0, roll: 0 },
    },
  },
  // 1.00: Full lockout at top of pushup
  {
    time: 1.0,
    hipsOffset: [0, 0, 0],
    proneAngle: 1.48,
    bones: {
      Spine: { pitch: -0.04, yaw: 0, roll: 0 },
      LeftArm: { pitch: 1.45, yaw: 0, roll: 0.15 },
      RightArm: { pitch: 1.45, yaw: 0, roll: 0.15 },
      LeftForeArm: { pitch: 0.05, yaw: 0, roll: 0 },
      RightForeArm: { pitch: 0.05, yaw: 0, roll: 0 },
      LeftHand: { pitch: 1.35, yaw: 0, roll: -0.10 },
      RightHand: { pitch: 1.35, yaw: 0, roll: 0.10 },
      LeftUpLeg: { pitch: 0, yaw: 0, roll: 0.05 },
      RightUpLeg: { pitch: 0, yaw: 0, roll: -0.05 },
      LeftFoot: { pitch: 0.40, yaw: 0, roll: 0 },
      RightFoot: { pitch: 0.40, yaw: 0, roll: 0 },
    },
  },
]);

// 4. INVERTED ROW: Upright rowing pull demonstration facing front
const INVERTED_ROW_CLIP = new HumanoidMotionClip('inverted_row', 'Inverted Row', 2.8, [
  // 0.00: Arms extended forward
  {
    time: 0.0,
    hipsOffset: [0, 0, 0],
    bones: {
      Spine: { pitch: 0.03, yaw: 0, roll: 0 },
      LeftArm: { pitch: -0.80, yaw: 0, roll: -0.12 },
      RightArm: { pitch: -0.80, yaw: 0, roll: 0.12 },
      LeftForeArm: { pitch: 0.15, yaw: 0, roll: 0 },
      RightForeArm: { pitch: 0.15, yaw: 0, roll: 0 },
      LeftUpLeg: { pitch: 0.06, yaw: 0, roll: 0.08 },
      RightUpLeg: { pitch: 0.06, yaw: 0, roll: -0.08 },
    },
  },
  // 0.50: Scapulae squeezed, elbows driven back past ribs
  {
    time: 0.50,
    hipsOffset: [0, -0.03, 0],
    bones: {
      Spine: { pitch: -0.05, yaw: 0, roll: 0 },
      LeftArm: { pitch: 0.20, yaw: 0, roll: -0.35 },
      RightArm: { pitch: 0.20, yaw: 0, roll: 0.35 },
      LeftForeArm: { pitch: 1.30, yaw: 0, roll: 0 },
      RightForeArm: { pitch: 1.30, yaw: 0, roll: 0 },
      LeftUpLeg: { pitch: 0.08, yaw: 0, roll: 0.08 },
      RightUpLeg: { pitch: 0.08, yaw: 0, roll: -0.08 },
    },
  },
  // 1.00: Return to extended reach
  {
    time: 1.0,
    hipsOffset: [0, 0, 0],
    bones: {
      Spine: { pitch: 0.03, yaw: 0, roll: 0 },
      LeftArm: { pitch: -0.80, yaw: 0, roll: -0.12 },
      RightArm: { pitch: -0.80, yaw: 0, roll: 0.12 },
      LeftForeArm: { pitch: 0.15, yaw: 0, roll: 0 },
      RightForeArm: { pitch: 0.15, yaw: 0, roll: 0 },
      LeftUpLeg: { pitch: 0.06, yaw: 0, roll: 0.08 },
      RightUpLeg: { pitch: 0.06, yaw: 0, roll: -0.08 },
    },
  },
]);

// 5. PLANK: Ground floor prone rock-solid core isometric hold
const PLANK_CLIP = new HumanoidMotionClip('plank', 'Plank', 3.0, [
  {
    time: 0.0,
    hipsOffset: [0, -0.05, 0],
    proneAngle: 1.48,
    bones: {
      Spine: { pitch: -0.03, yaw: 0, roll: 0 },
      LeftArm: { pitch: 1.40, yaw: 0, roll: 0.12 },
      RightArm: { pitch: 1.40, yaw: 0, roll: 0.12 },
      LeftForeArm: { pitch: 1.50, yaw: 0, roll: 0 },
      RightForeArm: { pitch: 1.50, yaw: 0, roll: 0 },
      LeftUpLeg: { pitch: 0, yaw: 0, roll: 0.06 },
      RightUpLeg: { pitch: 0, yaw: 0, roll: -0.06 },
      LeftFoot: { pitch: 0.40, yaw: 0, roll: 0 },
      RightFoot: { pitch: 0.40, yaw: 0, roll: 0 },
    },
  },
  {
    time: 0.5,
    hipsOffset: [0, -0.045, 0],
    proneAngle: 1.48,
    bones: {
      Spine: { pitch: -0.02, yaw: 0, roll: 0 },
      LeftArm: { pitch: 1.40, yaw: 0, roll: 0.12 },
      RightArm: { pitch: 1.40, yaw: 0, roll: 0.12 },
      LeftForeArm: { pitch: 1.50, yaw: 0, roll: 0 },
      RightForeArm: { pitch: 1.50, yaw: 0, roll: 0 },
      LeftUpLeg: { pitch: 0, yaw: 0, roll: 0.06 },
      RightUpLeg: { pitch: 0, yaw: 0, roll: -0.06 },
      LeftFoot: { pitch: 0.40, yaw: 0, roll: 0 },
      RightFoot: { pitch: 0.40, yaw: 0, roll: 0 },
    },
  },
  {
    time: 1.0,
    hipsOffset: [0, -0.05, 0],
    proneAngle: 1.48,
    bones: {
      Spine: { pitch: -0.03, yaw: 0, roll: 0 },
      LeftArm: { pitch: 1.40, yaw: 0, roll: 0.12 },
      RightArm: { pitch: 1.40, yaw: 0, roll: 0.12 },
      LeftForeArm: { pitch: 1.50, yaw: 0, roll: 0 },
      RightForeArm: { pitch: 1.50, yaw: 0, roll: 0 },
      LeftUpLeg: { pitch: 0, yaw: 0, roll: 0.06 },
      RightUpLeg: { pitch: 0, yaw: 0, roll: -0.06 },
      LeftFoot: { pitch: 0.40, yaw: 0, roll: 0 },
      RightFoot: { pitch: 0.40, yaw: 0, roll: 0 },
    },
  },
]);

// 6. MARTIAL MA BU (Horse Stance: Wide grounded feet, hips deep, vertical spine, chambered fists)
const MARTIAL_MABU_CLIP = new HumanoidMotionClip('martial_mabu', 'Ma Bu', 3.2, [
  {
    time: 0.0,
    hipsOffset: [0, -0.32, 0],
    bones: {
      Spine: { pitch: 0.05, yaw: 0, roll: 0 },
      LeftUpLeg: { pitch: 0.65, yaw: 0.10, roll: 0.38 },
      RightUpLeg: { pitch: 0.65, yaw: -0.10, roll: -0.38 },
      LeftLeg: { pitch: 0.90, yaw: 0, roll: 0 },
      RightLeg: { pitch: 0.90, yaw: 0, roll: 0 },
      LeftFoot: { pitch: -0.28, yaw: 0.10, roll: -0.10 },
      RightFoot: { pitch: -0.28, yaw: -0.10, roll: 0.10 },
      LeftArm: { pitch: -0.25, yaw: 0, roll: -0.12 },
      RightArm: { pitch: -0.25, yaw: 0, roll: 0.12 },
      LeftForeArm: { pitch: 1.35, yaw: 0, roll: 0 },
      RightForeArm: { pitch: 1.35, yaw: 0, roll: 0 },
    },
  },
  {
    time: 0.5,
    hipsOffset: [0, -0.35, 0],
    bones: {
      Spine: { pitch: 0.06, yaw: 0, roll: 0 },
      LeftUpLeg: { pitch: 0.70, yaw: 0.10, roll: 0.38 },
      RightUpLeg: { pitch: 0.70, yaw: -0.10, roll: -0.38 },
      LeftLeg: { pitch: 0.95, yaw: 0, roll: 0 },
      RightLeg: { pitch: 0.95, yaw: 0, roll: 0 },
      LeftFoot: { pitch: -0.30, yaw: 0.10, roll: -0.10 },
      RightFoot: { pitch: -0.30, yaw: -0.10, roll: 0.10 },
      LeftArm: { pitch: -0.25, yaw: 0, roll: -0.12 },
      RightArm: { pitch: -0.25, yaw: 0, roll: 0.12 },
      LeftForeArm: { pitch: 1.35, yaw: 0, roll: 0 },
      RightForeArm: { pitch: 1.35, yaw: 0, roll: 0 },
    },
  },
  {
    time: 1.0,
    hipsOffset: [0, -0.32, 0],
    bones: {
      Spine: { pitch: 0.05, yaw: 0, roll: 0 },
      LeftUpLeg: { pitch: 0.65, yaw: 0.10, roll: 0.38 },
      RightUpLeg: { pitch: 0.65, yaw: -0.10, roll: -0.38 },
      LeftLeg: { pitch: 0.90, yaw: 0, roll: 0 },
      RightLeg: { pitch: 0.90, yaw: 0, roll: 0 },
      LeftFoot: { pitch: -0.28, yaw: 0.10, roll: -0.10 },
      RightFoot: { pitch: -0.28, yaw: -0.10, roll: 0.10 },
      LeftArm: { pitch: -0.25, yaw: 0, roll: -0.12 },
      RightArm: { pitch: -0.25, yaw: 0, roll: 0.12 },
      LeftForeArm: { pitch: 1.35, yaw: 0, roll: 0 },
      RightForeArm: { pitch: 1.35, yaw: 0, roll: 0 },
    },
  },
]);

// 7. MARTIAL PUNCH (Kung Fu Fist: Kinetic chain from ground -> hips -> spine -> arm)
const MARTIAL_PUNCH_CLIP = new HumanoidMotionClip('martial_punch', 'Kung Fu Fist', 1.4, [
  // 0.00: Guard stance
  {
    time: 0.0,
    hipsOffset: [0, -0.05, 0],
    bones: {
      Spine: { pitch: 0.05, yaw: -0.15, roll: 0 },
      LeftUpLeg: { pitch: 0.20, yaw: 0, roll: 0.08 },
      RightUpLeg: { pitch: -0.10, yaw: 0, roll: -0.08 },
      LeftArm: { pitch: 0.40, yaw: 0, roll: -0.15 },
      RightArm: { pitch: -0.15, yaw: 0, roll: 0.15 },
      LeftForeArm: { pitch: 1.20, yaw: 0, roll: 0 },
      RightForeArm: { pitch: 1.35, yaw: 0, roll: 0 },
    },
  },
  // 0.35: Kinetic wind-up
  {
    time: 0.35,
    hipsOffset: [0, -0.06, -0.04],
    bones: {
      Hips: { pitch: 0, yaw: -0.35, roll: 0 },
      Spine: { pitch: 0.05, yaw: -0.35, roll: 0 },
      RightArm: { pitch: -0.30, yaw: 0, roll: 0.20 },
      RightForeArm: { pitch: 1.40, yaw: 0, roll: 0 },
    },
  },
  // 0.55: Explosive punch extension
  {
    time: 0.55,
    hipsOffset: [0, -0.06, 0.08],
    bones: {
      Hips: { pitch: 0, yaw: 0.35, roll: 0 },
      Spine: { pitch: 0.10, yaw: 0.45, roll: 0 },
      RightArm: { pitch: 0.95, yaw: 0, roll: 0.05 },
      RightForeArm: { pitch: 0.08, yaw: 0, roll: 0 }, // Full extension
      LeftArm: { pitch: -0.20, yaw: 0, roll: -0.15 }, // Chambered
      LeftForeArm: { pitch: 1.45, yaw: 0, roll: 0 },
    },
  },
  // 0.78: Clean snap recoil
  {
    time: 0.78,
    hipsOffset: [0, -0.05, 0.02],
    bones: {
      Spine: { pitch: 0.05, yaw: 0.10, roll: 0 },
      RightArm: { pitch: 0.40, yaw: 0, roll: 0.15 },
      RightForeArm: { pitch: 0.95, yaw: 0, roll: 0 },
    },
  },
  // 1.00: Reset
  {
    time: 1.0,
    hipsOffset: [0, -0.05, 0],
    bones: {
      Spine: { pitch: 0.05, yaw: -0.15, roll: 0 },
      LeftUpLeg: { pitch: 0.20, yaw: 0, roll: 0.08 },
      RightUpLeg: { pitch: -0.10, yaw: 0, roll: -0.08 },
      LeftArm: { pitch: 0.40, yaw: 0, roll: -0.15 },
      RightArm: { pitch: -0.15, yaw: 0, roll: 0.15 },
      LeftForeArm: { pitch: 1.20, yaw: 0, roll: 0 },
      RightForeArm: { pitch: 1.35, yaw: 0, roll: 0 },
    },
  },
]);

// 8. MARTIAL KICK (Front snap kick: Rooted support foot, chamber, strike, clean recoil)
const MARTIAL_KICK_CLIP = new HumanoidMotionClip('martial_kick', 'Kung Fu Kick', 2.2, [
  // 0.00: Ready guard
  {
    time: 0.0,
    hipsOffset: [0, 0, 0],
    bones: {
      Spine: { pitch: 0.04, yaw: 0, roll: 0 },
      LeftArm: { pitch: 0.45, yaw: 0, roll: -0.15 },
      RightArm: { pitch: 0.45, yaw: 0, roll: 0.15 },
      LeftForeArm: { pitch: 1.25, yaw: 0, roll: 0 },
      RightForeArm: { pitch: 1.25, yaw: 0, roll: 0 },
      LeftUpLeg: { pitch: 0, yaw: 0, roll: 0.06 },
      RightUpLeg: { pitch: 0, yaw: 0, roll: -0.06 },
    },
  },
  // 0.22: Chamber knee up to chest
  {
    time: 0.22,
    hipsOffset: [0, 0.02, -0.05],
    bones: {
      Spine: { pitch: -0.08, yaw: 0, roll: 0 },
      LeftUpLeg: { pitch: 0.05, yaw: 0, roll: 0.06 }, // Support leg
      LeftLeg: { pitch: 0.10, yaw: 0, roll: 0 },
      RightUpLeg: { pitch: 1.25, yaw: 0, roll: -0.05 }, // High chamber
      RightLeg: { pitch: 1.65, yaw: 0, roll: 0 },
      RightFoot: { pitch: 0.35, yaw: 0, roll: 0 },
    },
  },
  // 0.45: Full kick extension (toes pulled back)
  {
    time: 0.45,
    hipsOffset: [0, 0.02, 0.02],
    bones: {
      Spine: { pitch: -0.15, yaw: 0, roll: 0 },
      LeftUpLeg: { pitch: 0.05, yaw: 0, roll: 0.06 },
      LeftLeg: { pitch: 0.12, yaw: 0, roll: 0 },
      RightUpLeg: { pitch: 1.25, yaw: 0, roll: -0.02 },
      RightLeg: { pitch: 0.10, yaw: 0, roll: 0 }, // Full snap extension
      RightFoot: { pitch: -0.40, yaw: 0, roll: 0 },
    },
  },
  // 0.68: Recoil to chamber
  {
    time: 0.68,
    hipsOffset: [0, 0.02, -0.05],
    bones: {
      Spine: { pitch: -0.08, yaw: 0, roll: 0 },
      RightUpLeg: { pitch: 1.10, yaw: 0, roll: -0.05 },
      RightLeg: { pitch: 1.50, yaw: 0, roll: 0 },
    },
  },
  // 1.00: Return to ground
  {
    time: 1.0,
    hipsOffset: [0, 0, 0],
    bones: {
      Spine: { pitch: 0.04, yaw: 0, roll: 0 },
      LeftArm: { pitch: 0.45, yaw: 0, roll: -0.15 },
      RightArm: { pitch: 0.45, yaw: 0, roll: 0.15 },
      LeftForeArm: { pitch: 1.25, yaw: 0, roll: 0 },
      RightForeArm: { pitch: 1.25, yaw: 0, roll: 0 },
      LeftUpLeg: { pitch: 0, yaw: 0, roll: 0.06 },
      RightUpLeg: { pitch: 0, yaw: 0, roll: -0.06 },
    },
  },
]);

// 9. MARTIAL PALM / DEFLECTION
const MARTIAL_PALM_CLIP = new HumanoidMotionClip('martial_palm', 'Palm Deflection', 2.2, [
  {
    time: 0.0,
    hipsOffset: [0, -0.08, 0],
    bones: {
      Spine: { pitch: 0.05, yaw: -0.15, roll: 0 },
      LeftArm: { pitch: 0.45, yaw: 0, roll: -0.20 },
      RightArm: { pitch: 0.20, yaw: 0, roll: 0.20 },
      LeftForeArm: { pitch: 1.15, yaw: 0, roll: 0 },
      RightForeArm: { pitch: 1.25, yaw: 0, roll: 0 },
    },
  },
  {
    time: 0.50,
    hipsOffset: [0, -0.10, 0.05],
    bones: {
      Spine: { pitch: 0.08, yaw: 0.25, roll: 0 },
      LeftArm: { pitch: -0.10, yaw: 0, roll: -0.25 },
      RightArm: { pitch: 0.85, yaw: 0, roll: 0.05 },
      RightForeArm: { pitch: 0.35, yaw: 0, roll: 0 },
      RightHand: { pitch: 1.25, yaw: 0, roll: 0 }, // Pushing palm
    },
  },
  {
    time: 1.0,
    hipsOffset: [0, -0.08, 0],
    bones: {
      Spine: { pitch: 0.05, yaw: -0.15, roll: 0 },
      LeftArm: { pitch: 0.45, yaw: 0, roll: -0.20 },
      RightArm: { pitch: 0.20, yaw: 0, roll: 0.20 },
      LeftForeArm: { pitch: 1.15, yaw: 0, roll: 0 },
      RightForeArm: { pitch: 1.25, yaw: 0, roll: 0 },
    },
  },
]);

// 10. MARTIAL TAI CHI (Neo Tai Chi / Cloud Hands & Flow)
const MARTIAL_TAICHI_CLIP = new HumanoidMotionClip('martial_taichi', 'Tai Chi Flow', 4.5, [
  // 0.00: Wuji alignment
  {
    time: 0.0,
    hipsOffset: [0, -0.05, 0],
    bones: {
      Spine: { pitch: 0.03, yaw: 0, roll: 0 },
      LeftUpLeg: { pitch: 0.08, yaw: 0, roll: 0.08 },
      RightUpLeg: { pitch: 0.08, yaw: 0, roll: -0.08 },
      LeftLeg: { pitch: 0.12, yaw: 0, roll: 0 },
      RightLeg: { pitch: 0.12, yaw: 0, roll: 0 },
      LeftArm: { pitch: 0.30, yaw: 0, roll: -0.15 },
      RightArm: { pitch: 0.30, yaw: 0, roll: 0.15 },
      LeftForeArm: { pitch: 0.45, yaw: 0, roll: 0 },
      RightForeArm: { pitch: 0.45, yaw: 0, roll: 0 },
    },
  },
  // 0.25: Qi Shi (Raising arms softly with breath)
  {
    time: 0.25,
    hipsOffset: [0, -0.04, 0],
    bones: {
      Spine: { pitch: 0.02, yaw: 0, roll: 0 },
      LeftArm: { pitch: 0.85, yaw: 0, roll: -0.10 },
      RightArm: { pitch: 0.85, yaw: 0, roll: 0.10 },
      LeftForeArm: { pitch: 0.30, yaw: 0, roll: 0 },
      RightForeArm: { pitch: 0.30, yaw: 0, roll: 0 },
    },
  },
  // 0.50: Weight shift to right, cloud hands right
  {
    time: 0.50,
    hipsOffset: [-0.08, -0.08, 0],
    bones: {
      Spine: { pitch: 0.04, yaw: 0.25, roll: 0 },
      RightArm: { pitch: 0.70, yaw: 0, roll: 0.15 },
      LeftArm: { pitch: 0.30, yaw: 0, roll: -0.20 },
      RightForeArm: { pitch: 0.85, yaw: 0, roll: 0 },
      LeftForeArm: { pitch: 0.65, yaw: 0, roll: 0 },
    },
  },
  // 0.75: Weight shift to left, cloud hands left
  {
    time: 0.75,
    hipsOffset: [0.08, -0.08, 0],
    bones: {
      Spine: { pitch: 0.04, yaw: -0.25, roll: 0 },
      LeftArm: { pitch: 0.70, yaw: 0, roll: -0.15 },
      RightArm: { pitch: 0.30, yaw: 0, roll: 0.20 },
      LeftForeArm: { pitch: 0.85, yaw: 0, roll: 0 },
      RightForeArm: { pitch: 0.65, yaw: 0, roll: 0 },
    },
  },
  // 1.00: Return to Wuji
  {
    time: 1.0,
    hipsOffset: [0, -0.05, 0],
    bones: {
      Spine: { pitch: 0.03, yaw: 0, roll: 0 },
      LeftUpLeg: { pitch: 0.08, yaw: 0, roll: 0.08 },
      RightUpLeg: { pitch: 0.08, yaw: 0, roll: -0.08 },
      LeftLeg: { pitch: 0.12, yaw: 0, roll: 0 },
      RightLeg: { pitch: 0.12, yaw: 0, roll: 0 },
      LeftArm: { pitch: 0.30, yaw: 0, roll: -0.15 },
      RightArm: { pitch: 0.30, yaw: 0, roll: 0.15 },
      LeftForeArm: { pitch: 0.45, yaw: 0, roll: 0 },
      RightForeArm: { pitch: 0.45, yaw: 0, roll: 0 },
    },
  },
]);

// 11. IDLE: Natural breathing posture
const IDLE_CLIP = new HumanoidMotionClip('idle', 'Idle', 3.2, [
  {
    time: 0.0,
    hipsOffset: [0, 0, 0],
    bones: {
      Spine: { pitch: 0.03, yaw: 0, roll: 0 },
      LeftArm: { pitch: 0.08, yaw: 0, roll: -0.10 },
      RightArm: { pitch: 0.08, yaw: 0, roll: 0.10 },
      LeftForeArm: { pitch: 0.12, yaw: 0, roll: 0 },
      RightForeArm: { pitch: 0.12, yaw: 0, roll: 0 },
      LeftUpLeg: { pitch: 0, yaw: 0, roll: 0.04 },
      RightUpLeg: { pitch: 0, yaw: 0, roll: -0.04 },
    },
  },
  {
    time: 0.5,
    hipsOffset: [0, 0.005, 0],
    bones: {
      Spine: { pitch: 0.05, yaw: 0, roll: 0 },
      Spine1: { pitch: 0.03, yaw: 0, roll: 0 },
      LeftArm: { pitch: 0.10, yaw: 0, roll: -0.12 },
      RightArm: { pitch: 0.10, yaw: 0, roll: 0.12 },
      LeftForeArm: { pitch: 0.15, yaw: 0, roll: 0 },
      RightForeArm: { pitch: 0.15, yaw: 0, roll: 0 },
      LeftUpLeg: { pitch: 0, yaw: 0, roll: 0.04 },
      RightUpLeg: { pitch: 0, yaw: 0, roll: -0.04 },
    },
  },
  {
    time: 1.0,
    hipsOffset: [0, 0, 0],
    bones: {
      Spine: { pitch: 0.03, yaw: 0, roll: 0 },
      LeftArm: { pitch: 0.08, yaw: 0, roll: -0.10 },
      RightArm: { pitch: 0.08, yaw: 0, roll: 0.10 },
      LeftForeArm: { pitch: 0.12, yaw: 0, roll: 0 },
      RightForeArm: { pitch: 0.12, yaw: 0, roll: 0 },
      LeftUpLeg: { pitch: 0, yaw: 0, roll: 0.04 },
      RightUpLeg: { pitch: 0, yaw: 0, roll: -0.04 },
    },
  },
]);

// 12. RUN
const RUN_CLIP = new HumanoidMotionClip('run', 'Run', 0.72, [
  {
    time: 0.0,
    hipsOffset: [0, 0.04, 0],
    bones: {
      Spine: { pitch: 0.15, yaw: -0.10, roll: 0 },
      LeftUpLeg: { pitch: 0.75, yaw: 0, roll: 0.04 },
      LeftLeg: { pitch: 1.10, yaw: 0, roll: 0 },
      RightUpLeg: { pitch: -0.35, yaw: 0, roll: -0.04 },
      RightLeg: { pitch: 0.25, yaw: 0, roll: 0 },
      LeftArm: { pitch: -0.45, yaw: 0, roll: -0.10 },
      LeftForeArm: { pitch: 1.45, yaw: 0, roll: 0 },
      RightArm: { pitch: 0.75, yaw: 0, roll: 0.10 },
      RightForeArm: { pitch: 1.35, yaw: 0, roll: 0 },
    },
  },
  {
    time: 0.50,
    hipsOffset: [0, 0.04, 0],
    bones: {
      Spine: { pitch: 0.15, yaw: 0.10, roll: 0 },
      RightUpLeg: { pitch: 0.75, yaw: 0, roll: -0.04 },
      RightLeg: { pitch: 1.10, yaw: 0, roll: 0 },
      LeftUpLeg: { pitch: -0.35, yaw: 0, roll: 0.04 },
      LeftLeg: { pitch: 0.25, yaw: 0, roll: 0 },
      RightArm: { pitch: -0.45, yaw: 0, roll: 0.10 },
      RightForeArm: { pitch: 1.45, yaw: 0, roll: 0 },
      LeftArm: { pitch: 0.75, yaw: 0, roll: -0.10 },
      LeftForeArm: { pitch: 1.35, yaw: 0, roll: 0 },
    },
  },
  {
    time: 1.0,
    hipsOffset: [0, 0.04, 0],
    bones: {
      Spine: { pitch: 0.15, yaw: -0.10, roll: 0 },
      LeftUpLeg: { pitch: 0.75, yaw: 0, roll: 0.04 },
      LeftLeg: { pitch: 1.10, yaw: 0, roll: 0 },
      RightUpLeg: { pitch: -0.35, yaw: 0, roll: -0.04 },
      RightLeg: { pitch: 0.25, yaw: 0, roll: 0 },
      LeftArm: { pitch: -0.45, yaw: 0, roll: -0.10 },
      LeftForeArm: { pitch: 1.45, yaw: 0, roll: 0 },
      RightArm: { pitch: 0.75, yaw: 0, roll: 0.10 },
      RightForeArm: { pitch: 1.35, yaw: 0, roll: 0 },
    },
  },
]);

// 13. WALK
const WALK_CLIP = new HumanoidMotionClip('walk', 'Walk', 1.1, [
  {
    time: 0.0,
    hipsOffset: [0, 0, 0],
    bones: {
      Spine: { pitch: 0.05, yaw: -0.05, roll: 0 },
      LeftUpLeg: { pitch: 0.40, yaw: 0, roll: 0.03 },
      LeftLeg: { pitch: 0.20, yaw: 0, roll: 0 },
      RightUpLeg: { pitch: -0.25, yaw: 0, roll: -0.03 },
      RightLeg: { pitch: 0.10, yaw: 0, roll: 0 },
      LeftArm: { pitch: -0.30, yaw: 0, roll: -0.08 },
      RightArm: { pitch: 0.35, yaw: 0, roll: 0.08 },
    },
  },
  {
    time: 0.50,
    hipsOffset: [0, 0, 0],
    bones: {
      Spine: { pitch: 0.05, yaw: 0.05, roll: 0 },
      RightUpLeg: { pitch: 0.40, yaw: 0, roll: -0.03 },
      RightLeg: { pitch: 0.20, yaw: 0, roll: 0 },
      LeftUpLeg: { pitch: -0.25, yaw: 0, roll: 0.03 },
      LeftLeg: { pitch: 0.10, yaw: 0, roll: 0 },
      RightArm: { pitch: -0.30, yaw: 0, roll: 0.08 },
      LeftArm: { pitch: 0.35, yaw: 0, roll: -0.08 },
    },
  },
  {
    time: 1.0,
    hipsOffset: [0, 0, 0],
    bones: {
      Spine: { pitch: 0.05, yaw: -0.05, roll: 0 },
      LeftUpLeg: { pitch: 0.40, yaw: 0, roll: 0.03 },
      LeftLeg: { pitch: 0.20, yaw: 0, roll: 0 },
      RightUpLeg: { pitch: -0.25, yaw: 0, roll: -0.03 },
      RightLeg: { pitch: 0.10, yaw: 0, roll: 0 },
      LeftArm: { pitch: -0.30, yaw: 0, roll: -0.08 },
      RightArm: { pitch: 0.35, yaw: 0, roll: 0.08 },
    },
  },
]);

// 14. JUMPING JACKS (Fixed biomechanically: overhead arms reach without torso penetration)
const JUMP_CLIP = new HumanoidMotionClip('jump', 'Jumping Jacks', 1.1, [
  {
    time: 0.0,
    hipsOffset: [0, 0, 0],
    bones: {
      LeftArm: { pitch: 0.05, yaw: 0, roll: 0.10 },
      RightArm: { pitch: 0.05, yaw: 0, roll: 0.10 },
      LeftUpLeg: { pitch: 0, yaw: 0, roll: 0.04 },
      RightUpLeg: { pitch: 0, yaw: 0, roll: -0.04 },
    },
  },
  {
    time: 0.50,
    hipsOffset: [0, 0.12, 0],
    bones: {
      LeftArm: { pitch: 2.60, yaw: 0, roll: 0.22 }, // Arms reach cleanly overhead
      RightArm: { pitch: 2.60, yaw: 0, roll: 0.22 },
      LeftUpLeg: { pitch: 0, yaw: 0, roll: 0.38 }, // Wide legs
      RightUpLeg: { pitch: 0, yaw: 0, roll: -0.38 },
      LeftLeg: { pitch: 0.15, yaw: 0, roll: 0 },
      RightLeg: { pitch: 0.15, yaw: 0, roll: 0 },
    },
  },
  {
    time: 1.0,
    hipsOffset: [0, 0, 0],
    bones: {
      LeftArm: { pitch: 0.05, yaw: 0, roll: 0.10 },
      RightArm: { pitch: 0.05, yaw: 0, roll: 0.10 },
      LeftUpLeg: { pitch: 0, yaw: 0, roll: 0.04 },
      RightUpLeg: { pitch: 0, yaw: 0, roll: -0.04 },
    },
  },
]);

// 15. BURPEE: Full 6-phase military burpee (Drop -> Plank -> Pushup -> Crouch -> Explosive Jump -> Land)
const BURPEE_CLIP = new HumanoidMotionClip('burpee', 'Burpee', 3.2, [
  // 0.00: Ready standing posture
  {
    time: 0.0,
    hipsOffset: [0, 0, 0],
    bones: {
      Spine: { pitch: 0.04, yaw: 0, roll: 0 },
      LeftArm: { pitch: 0.10, yaw: 0, roll: 0.10 },
      RightArm: { pitch: 0.10, yaw: 0, roll: 0.10 },
      LeftUpLeg: { pitch: 0, yaw: 0, roll: 0.05 },
      RightUpLeg: { pitch: 0, yaw: 0, roll: -0.05 },
    },
  },
  // 0.18: Crouch squat drop & plant hands toward floor
  {
    time: 0.18,
    hipsOffset: [0, -0.38, 0.12],
    bones: {
      Spine: { pitch: 0.45, yaw: 0, roll: 0 },
      LeftUpLeg: { pitch: 1.25, yaw: 0, roll: 0.12 },
      RightUpLeg: { pitch: 1.25, yaw: 0, roll: -0.12 },
      LeftLeg: { pitch: 1.55, yaw: 0, roll: 0 },
      RightLeg: { pitch: 1.55, yaw: 0, roll: 0 },
      LeftArm: { pitch: 0.85, yaw: 0, roll: 0.10 },
      RightArm: { pitch: 0.85, yaw: 0, roll: 0.10 },
      LeftForeArm: { pitch: 0.15, yaw: 0, roll: 0 },
      RightForeArm: { pitch: 0.15, yaw: 0, roll: 0 },
      LeftHand: { pitch: 1.20, yaw: 0, roll: 0 },
      RightHand: { pitch: 1.20, yaw: 0, roll: 0 },
    },
  },
  // 0.36: Kick legs back into horizontal plank
  {
    time: 0.36,
    hipsOffset: [0, 0, 0],
    proneAngle: 1.48,
    bones: {
      Spine: { pitch: -0.04, yaw: 0, roll: 0 },
      LeftArm: { pitch: 1.45, yaw: 0, roll: 0.15 },
      RightArm: { pitch: 1.45, yaw: 0, roll: 0.15 },
      LeftForeArm: { pitch: 0.05, yaw: 0, roll: 0 },
      RightForeArm: { pitch: 0.05, yaw: 0, roll: 0 },
      LeftHand: { pitch: 1.35, yaw: 0, roll: 0 },
      RightHand: { pitch: 1.35, yaw: 0, roll: 0 },
      LeftUpLeg: { pitch: 0, yaw: 0, roll: 0.05 },
      RightUpLeg: { pitch: 0, yaw: 0, roll: -0.05 },
      LeftFoot: { pitch: 0.40, yaw: 0, roll: 0 },
      RightFoot: { pitch: 0.40, yaw: 0, roll: 0 },
    },
  },
  // 0.50: Chest dips down to floor (pushup dip with elbows flared 45 deg, arms never inside torso)
  {
    time: 0.50,
    hipsOffset: [0, -0.08, 0],
    proneAngle: 1.48,
    bones: {
      Spine: { pitch: -0.02, yaw: 0, roll: 0 },
      LeftArm: { pitch: 1.25, yaw: 0, roll: 0.35 },
      RightArm: { pitch: 1.25, yaw: 0, roll: 0.35 },
      LeftForeArm: { pitch: 0.85, yaw: 0, roll: 0 },
      RightForeArm: { pitch: 0.85, yaw: 0, roll: 0 },
      LeftHand: { pitch: 1.35, yaw: 0, roll: 0 },
      RightHand: { pitch: 1.35, yaw: 0, roll: 0 },
      LeftUpLeg: { pitch: 0, yaw: 0, roll: 0.05 },
      RightUpLeg: { pitch: 0, yaw: 0, roll: -0.05 },
      LeftFoot: { pitch: 0.40, yaw: 0, roll: 0 },
      RightFoot: { pitch: 0.40, yaw: 0, roll: 0 },
    },
  },
  // 0.64: Press back up to plank
  {
    time: 0.64,
    hipsOffset: [0, 0, 0],
    proneAngle: 1.48,
    bones: {
      Spine: { pitch: -0.04, yaw: 0, roll: 0 },
      LeftArm: { pitch: 1.45, yaw: 0, roll: 0.15 },
      RightArm: { pitch: 1.45, yaw: 0, roll: 0.15 },
      LeftForeArm: { pitch: 0.05, yaw: 0, roll: 0 },
      RightForeArm: { pitch: 0.05, yaw: 0, roll: 0 },
      LeftHand: { pitch: 1.35, yaw: 0, roll: 0 },
      RightHand: { pitch: 1.35, yaw: 0, roll: 0 },
      LeftUpLeg: { pitch: 0, yaw: 0, roll: 0.05 },
      RightUpLeg: { pitch: 0, yaw: 0, roll: -0.05 },
      LeftFoot: { pitch: 0.40, yaw: 0, roll: 0 },
      RightFoot: { pitch: 0.40, yaw: 0, roll: 0 },
    },
  },
  // 0.76: Snap feet forward under hips into deep crouch
  {
    time: 0.76,
    hipsOffset: [0, -0.38, 0.12],
    proneAngle: 0,
    bones: {
      Spine: { pitch: 0.45, yaw: 0, roll: 0 },
      LeftUpLeg: { pitch: 1.25, yaw: 0, roll: 0.12 },
      RightUpLeg: { pitch: 1.25, yaw: 0, roll: -0.12 },
      LeftLeg: { pitch: 1.55, yaw: 0, roll: 0 },
      RightLeg: { pitch: 1.55, yaw: 0, roll: 0 },
      LeftArm: { pitch: 0.80, yaw: 0, roll: 0.10 },
      RightArm: { pitch: 0.80, yaw: 0, roll: 0.10 },
      LeftForeArm: { pitch: 0.20, yaw: 0, roll: 0 },
      RightForeArm: { pitch: 0.20, yaw: 0, roll: 0 },
    },
  },
  // 0.88: Explosive vertical jump! Arms overhead
  {
    time: 0.88,
    hipsOffset: [0, 0.35, 0],
    bones: {
      Spine: { pitch: -0.04, yaw: 0, roll: 0 },
      LeftUpLeg: { pitch: 0, yaw: 0, roll: 0.04 },
      RightUpLeg: { pitch: 0, yaw: 0, roll: -0.04 },
      LeftLeg: { pitch: 0.05, yaw: 0, roll: 0 },
      RightLeg: { pitch: 0.05, yaw: 0, roll: 0 },
      LeftFoot: { pitch: -0.35, yaw: 0, roll: 0 },
      RightFoot: { pitch: -0.35, yaw: 0, roll: 0 },
      LeftArm: { pitch: 2.75, yaw: 0, roll: 0.18 }, // Overhead jump reach
      RightArm: { pitch: 2.75, yaw: 0, roll: 0.18 },
      LeftForeArm: { pitch: 0.05, yaw: 0, roll: 0 },
      RightForeArm: { pitch: 0.05, yaw: 0, roll: 0 },
    },
  },
  // 1.00: Soft landing & return to ready stance
  {
    time: 1.0,
    hipsOffset: [0, 0, 0],
    bones: {
      Spine: { pitch: 0.04, yaw: 0, roll: 0 },
      LeftArm: { pitch: 0.10, yaw: 0, roll: 0.10 },
      RightArm: { pitch: 0.10, yaw: 0, roll: 0.10 },
      LeftUpLeg: { pitch: 0, yaw: 0, roll: 0.05 },
      RightUpLeg: { pitch: 0, yaw: 0, roll: -0.05 },
    },
  },
]);

// 15. BOXING
const BOX_CLIP = new HumanoidMotionClip('box', 'Boxing', 1.4, [
  {
    time: 0.0,
    hipsOffset: [0, -0.04, 0],
    bones: {
      Spine: { pitch: 0.08, yaw: -0.20, roll: 0 },
      LeftArm: { pitch: 0.55, yaw: 0, roll: -0.15 },
      LeftForeArm: { pitch: 1.45, yaw: 0, roll: 0 },
      RightArm: { pitch: 0.30, yaw: 0, roll: 0.15 },
      RightForeArm: { pitch: 1.55, yaw: 0, roll: 0 },
      LeftUpLeg: { pitch: 0.20, yaw: 0, roll: 0.06 },
      RightUpLeg: { pitch: -0.10, yaw: 0, roll: -0.06 },
    },
  },
  {
    time: 0.30,
    hipsOffset: [0, -0.04, 0.06],
    bones: {
      Spine: { pitch: 0.10, yaw: 0.10, roll: 0 },
      LeftArm: { pitch: 0.95, yaw: 0, roll: -0.05 }, // Left jab
      LeftForeArm: { pitch: 0.12, yaw: 0, roll: 0 },
      RightArm: { pitch: 0.30, yaw: 0, roll: 0.15 },
      RightForeArm: { pitch: 1.55, yaw: 0, roll: 0 },
    },
  },
  {
    time: 0.65,
    hipsOffset: [0, -0.04, 0.08],
    bones: {
      Spine: { pitch: 0.12, yaw: 0.40, roll: 0 },
      LeftArm: { pitch: 0.45, yaw: 0, roll: -0.15 },
      LeftForeArm: { pitch: 1.45, yaw: 0, roll: 0 },
      RightArm: { pitch: 0.95, yaw: 0, roll: 0.05 }, // Right cross
      RightForeArm: { pitch: 0.10, yaw: 0, roll: 0 },
    },
  },
  {
    time: 1.0,
    hipsOffset: [0, -0.04, 0],
    bones: {
      Spine: { pitch: 0.08, yaw: -0.20, roll: 0 },
      LeftArm: { pitch: 0.55, yaw: 0, roll: -0.15 },
      LeftForeArm: { pitch: 1.45, yaw: 0, roll: 0 },
      RightArm: { pitch: 0.30, yaw: 0, roll: 0.15 },
      RightForeArm: { pitch: 1.55, yaw: 0, roll: 0 },
      LeftUpLeg: { pitch: 0.20, yaw: 0, roll: 0.06 },
      RightUpLeg: { pitch: -0.10, yaw: 0, roll: -0.06 },
    },
  },
]);

export const CLIPS_REGISTRY: Record<string, HumanoidMotionClip> = {
  squat: SQUAT_CLIP,
  lunge: LUNGE_CLIP,
  pushup: PUSHUP_CLIP,
  inverted_row: INVERTED_ROW_CLIP,
  plank: PLANK_CLIP,
  martial_mabu: MARTIAL_MABU_CLIP,
  martial_punch: MARTIAL_PUNCH_CLIP,
  martial_kick: MARTIAL_KICK_CLIP,
  martial_palm: MARTIAL_PALM_CLIP,
  martial_taichi: MARTIAL_TAICHI_CLIP,
  idle: IDLE_CLIP,
  run: RUN_CLIP,
  walk: WALK_CLIP,
  jump: JUMP_CLIP,
  burpee: BURPEE_CLIP,
  box: BOX_CLIP,
};

/**
 * Universal Clip Resolver: Checks GitHub JSON clips first, then fallback to built-in registry
 */
export function resolveHumanoidClip(query?: string | null): HumanoidMotionClip {
  if (!query) return CLIPS_REGISTRY.idle;

  // 1. Try to get real 3D bone keyframe clip from GitHub exercices-json
  const githubClip = getGithubJsonClip(query);
  if (githubClip) {
    return githubClip;
  }

  // 2. Fallback to built-in registry
  const def = resolveExerciseDefinition(query);
  return CLIPS_REGISTRY[def.clipId] || CLIPS_REGISTRY.idle;
}
