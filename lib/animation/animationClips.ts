import * as THREE from 'three';
import { HumanoidBoneName } from './humanoidBones.ts';
import { HumanoidFramePose } from './skeletalRetargeter.ts';
import { resolveExerciseDefinition } from './exerciseDefinitions.ts';

export interface MotionKeyframe {
  time: number; // 0.0 to 1.0 (normalized progress along timeline)
  hipsOffset: [number, number, number];
  proneAngle?: number;
  groundOffsetY?: number;
  groundOffsetZ?: number;
  bones: Partial<Record<HumanoidBoneName, { pitch: number; yaw: number; roll: number }>>;
}

/**
 * HumanoidMotionClip: Represents a continuous, keyframed human motion cycle.
 * Samples exact biomechanical joint positions using cubic Hermite interpolation.
 */
export class HumanoidMotionClip {
  public id: string;
  public name: string;
  public duration: number; // in seconds
  public keyframes: MotionKeyframe[];

  constructor(id: string, name: string, duration: number, keyframes: MotionKeyframe[]) {
    this.id = id;
    this.name = name;
    this.duration = duration;
    this.keyframes = keyframes.sort((a, b) => a.time - b.time);
  }

  /**
   * Samples the motion at a normalized progress t in [0, 1]
   */
  public sample(t: number): HumanoidFramePose {
    const kfs = this.keyframes;
    if (kfs.length === 0) {
      return { hipsOffset: [0, 0, 0], bones: {} };
    }
    if (kfs.length === 1) {
      return this.clonePose(kfs[0]);
    }

    // Wrap t into [0, 1]
    const normT = ((t % 1.0) + 1.0) % 1.0;

    // Find bounding keyframes
    let k0 = kfs[kfs.length - 1];
    let k1 = kfs[0];

    for (let i = 0; i < kfs.length - 1; i++) {
      if (normT >= kfs[i].time && normT <= kfs[i + 1].time) {
        k0 = kfs[i];
        k1 = kfs[i + 1];
        break;
      }
    }

    // Normalized segment fraction with smooth hermite curve: 3x^2 - 2x^3
    const span = k1.time - k0.time;
    let alpha = span > 0 ? (normT - k0.time) / span : 0;
    alpha = THREE.MathUtils.clamp(alpha, 0, 1);
    const smoothAlpha = alpha * alpha * (3 - 2 * alpha);

    // Interpolate hips translation
    const hipsX = THREE.MathUtils.lerp(k0.hipsOffset[0], k1.hipsOffset[0], smoothAlpha);
    const hipsY = THREE.MathUtils.lerp(k0.hipsOffset[1], k1.hipsOffset[1], smoothAlpha);
    const hipsZ = THREE.MathUtils.lerp(k0.hipsOffset[2], k1.hipsOffset[2], smoothAlpha);

    const proneAngle = THREE.MathUtils.lerp(k0.proneAngle ?? 0, k1.proneAngle ?? 0, smoothAlpha);
    const groundOffsetY = THREE.MathUtils.lerp(k0.groundOffsetY ?? 0, k1.groundOffsetY ?? 0, smoothAlpha);
    const groundOffsetZ = THREE.MathUtils.lerp(k0.groundOffsetZ ?? 0, k1.groundOffsetZ ?? 0, smoothAlpha);

    // Interpolate all active bones
    const bones: Partial<Record<HumanoidBoneName, { pitch: number; yaw: number; roll: number }>> = {};

    // Collect all bones present in either keyframe
    const allBoneNames = new Set([
      ...Object.keys(k0.bones),
      ...Object.keys(k1.bones),
    ]) as Set<HumanoidBoneName>;

    for (const bName of allBoneNames) {
      const b0 = k0.bones[bName] || { pitch: 0, yaw: 0, roll: 0 };
      const b1 = k1.bones[bName] || { pitch: 0, yaw: 0, roll: 0 };

      bones[bName] = {
        pitch: THREE.MathUtils.lerp(b0.pitch, b1.pitch, smoothAlpha),
        yaw: THREE.MathUtils.lerp(b0.yaw, b1.yaw, smoothAlpha),
        roll: THREE.MathUtils.lerp(b0.roll, b1.roll, smoothAlpha),
      };
    }

    return {
      hipsOffset: [hipsX, hipsY, hipsZ],
      proneAngle,
      groundOffsetY,
      groundOffsetZ,
      bones,
    };
  }

  private clonePose(kf: MotionKeyframe): HumanoidFramePose {
    const bonesCopy: Partial<Record<HumanoidBoneName, { pitch: number; yaw: number; roll: number }>> = {};
    for (const [k, v] of Object.entries(kf.bones)) {
      bonesCopy[k as HumanoidBoneName] = { ...v };
    }
    return {
      hipsOffset: [...kf.hipsOffset],
      proneAngle: kf.proneAngle,
      groundOffsetY: kf.groundOffsetY,
      groundOffsetZ: kf.groundOffsetZ,
      bones: bonesCopy,
    };
  }
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
      LeftFoot: { pitch: -0.20, yaw: 0, roll: 0 },
      RightFoot: { pitch: -0.20, yaw: 0, roll: 0 },
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
      LeftFoot: { pitch: -0.32, yaw: 0, roll: 0 },
      RightFoot: { pitch: -0.32, yaw: 0, roll: 0 },
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
      LeftFoot: { pitch: -0.20, yaw: 0, roll: 0 },
      RightFoot: { pitch: -0.20, yaw: 0, roll: 0 },
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

// 2. LUNGE: Authentic forward stepping alternating lunges
const LUNGE_CLIP = new HumanoidMotionClip('lunge', 'Lunge', 3.6, [
  // 0.00: Standing neutral
  {
    time: 0.0,
    hipsOffset: [0, 0, 0],
    bones: {
      Spine: { pitch: 0.02, yaw: 0, roll: 0 },
      LeftArm: { pitch: 0.10, yaw: 0, roll: -0.08 },
      RightArm: { pitch: 0.10, yaw: 0, roll: 0.08 },
      LeftUpLeg: { pitch: 0, yaw: 0, roll: 0.04 },
      RightUpLeg: { pitch: 0, yaw: 0, roll: -0.04 },
    },
  },
  // 0.12: Right leg initiates forward step
  {
    time: 0.12,
    hipsOffset: [0, -0.08, 0.15],
    bones: {
      Spine: { pitch: 0.05, yaw: -0.04, roll: 0 },
      RightUpLeg: { pitch: 0.45, yaw: 0, roll: -0.02 },
      RightLeg: { pitch: 0.35, yaw: 0, roll: 0 },
      LeftUpLeg: { pitch: -0.10, yaw: 0, roll: 0.04 },
      LeftFoot: { pitch: 0.15, yaw: 0, roll: 0 }, // Ball of rear foot
      LeftArm: { pitch: 0.45, yaw: 0, roll: -0.05 },
      RightArm: { pitch: -0.20, yaw: 0, roll: 0.05 },
    },
  },
  // 0.25: Deep right forward lunge (90 deg front knee, rear knee hovering 8cm above floor)
  {
    time: 0.25,
    hipsOffset: [0, -0.32, 0.18],
    bones: {
      Spine: { pitch: 0.04, yaw: -0.02, roll: 0 },
      RightUpLeg: { pitch: 0.85, yaw: 0, roll: -0.02 },
      RightLeg: { pitch: 1.15, yaw: 0, roll: 0 },
      RightFoot: { pitch: -0.25, yaw: 0, roll: 0 }, // Front foot flat
      LeftUpLeg: { pitch: -0.22, yaw: 0, roll: 0.04 },
      LeftLeg: { pitch: 1.05, yaw: 0, roll: 0 }, // Rear knee bent down hovering
      LeftFoot: { pitch: 0.35, yaw: 0, roll: 0 }, // Rear foot on toes
      LeftArm: { pitch: 0.65, yaw: 0, roll: -0.08 },
      RightArm: { pitch: -0.25, yaw: 0, roll: 0.08 },
    },
  },
  // 0.38: Push back through front heel
  {
    time: 0.38,
    hipsOffset: [0, -0.10, 0.08],
    bones: {
      Spine: { pitch: 0.03, yaw: 0, roll: 0 },
      RightUpLeg: { pitch: 0.25, yaw: 0, roll: -0.02 },
      RightLeg: { pitch: 0.30, yaw: 0, roll: 0 },
      LeftUpLeg: { pitch: 0, yaw: 0, roll: 0.04 },
      LeftLeg: { pitch: 0.10, yaw: 0, roll: 0 },
    },
  },
  // 0.50: Center standing transition
  {
    time: 0.50,
    hipsOffset: [0, 0, 0],
    bones: {
      Spine: { pitch: 0.02, yaw: 0, roll: 0 },
      LeftArm: { pitch: 0.10, yaw: 0, roll: -0.08 },
      RightArm: { pitch: 0.10, yaw: 0, roll: 0.08 },
      LeftUpLeg: { pitch: 0, yaw: 0, roll: 0.04 },
      RightUpLeg: { pitch: 0, yaw: 0, roll: -0.04 },
    },
  },
  // 0.62: Left leg initiates forward step
  {
    time: 0.62,
    hipsOffset: [0, -0.08, 0.15],
    bones: {
      Spine: { pitch: 0.05, yaw: 0.04, roll: 0 },
      LeftUpLeg: { pitch: 0.45, yaw: 0, roll: 0.02 },
      LeftLeg: { pitch: 0.35, yaw: 0, roll: 0 },
      RightUpLeg: { pitch: -0.10, yaw: 0, roll: -0.04 },
      RightFoot: { pitch: 0.15, yaw: 0, roll: 0 },
      RightArm: { pitch: 0.45, yaw: 0, roll: 0.05 },
      LeftArm: { pitch: -0.20, yaw: 0, roll: -0.05 },
    },
  },
  // 0.75: Deep left forward lunge
  {
    time: 0.75,
    hipsOffset: [0, -0.32, 0.18],
    bones: {
      Spine: { pitch: 0.04, yaw: 0.02, roll: 0 },
      LeftUpLeg: { pitch: 0.85, yaw: 0, roll: 0.02 },
      LeftLeg: { pitch: 1.15, yaw: 0, roll: 0 },
      LeftFoot: { pitch: -0.25, yaw: 0, roll: 0 }, // Front foot flat
      RightUpLeg: { pitch: -0.22, yaw: 0, roll: -0.04 },
      RightLeg: { pitch: 1.05, yaw: 0, roll: 0 }, // Rear knee hovering
      RightFoot: { pitch: 0.35, yaw: 0, roll: 0 },
      RightArm: { pitch: 0.65, yaw: 0, roll: 0.08 },
      LeftArm: { pitch: -0.25, yaw: 0, roll: -0.08 },
    },
  },
  // 0.88: Push back through left front heel
  {
    time: 0.88,
    hipsOffset: [0, -0.10, 0.08],
    bones: {
      Spine: { pitch: 0.03, yaw: 0, roll: 0 },
      LeftUpLeg: { pitch: 0.25, yaw: 0, roll: 0.02 },
      LeftLeg: { pitch: 0.30, yaw: 0, roll: 0 },
      RightUpLeg: { pitch: 0, yaw: 0, roll: -0.04 },
      RightLeg: { pitch: 0.10, yaw: 0, roll: 0 },
    },
  },
  // 1.00: Return to neutral standing
  {
    time: 1.0,
    hipsOffset: [0, 0, 0],
    bones: {
      Spine: { pitch: 0.02, yaw: 0, roll: 0 },
      LeftArm: { pitch: 0.10, yaw: 0, roll: -0.08 },
      RightArm: { pitch: 0.10, yaw: 0, roll: 0.08 },
      LeftUpLeg: { pitch: 0, yaw: 0, roll: 0.04 },
      RightUpLeg: { pitch: 0, yaw: 0, roll: -0.04 },
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

// 14. JUMPING JACKS
const JUMP_CLIP = new HumanoidMotionClip('jump', 'Jumping Jacks', 1.1, [
  {
    time: 0.0,
    hipsOffset: [0, 0, 0],
    bones: {
      LeftArm: { pitch: 0.05, yaw: 0, roll: -0.10 },
      RightArm: { pitch: 0.05, yaw: 0, roll: 0.10 },
      LeftUpLeg: { pitch: 0, yaw: 0, roll: 0.04 },
      RightUpLeg: { pitch: 0, yaw: 0, roll: -0.04 },
    },
  },
  {
    time: 0.50,
    hipsOffset: [0, 0.08, 0],
    bones: {
      LeftArm: { pitch: 0.15, yaw: 0, roll: -1.75 }, // Overhead clap
      RightArm: { pitch: 0.15, yaw: 0, roll: 1.75 },
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
      LeftArm: { pitch: 0.05, yaw: 0, roll: -0.10 },
      RightArm: { pitch: 0.05, yaw: 0, roll: 0.10 },
      LeftUpLeg: { pitch: 0, yaw: 0, roll: 0.04 },
      RightUpLeg: { pitch: 0, yaw: 0, roll: -0.04 },
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
  box: BOX_CLIP,
};

/**
 * Universal Clip Resolver: Uses ExerciseDefinition to select the exact clip
 */
export function resolveHumanoidClip(query?: string | null): HumanoidMotionClip {
  const def = resolveExerciseDefinition(query);
  return CLIPS_REGISTRY[def.clipId] || CLIPS_REGISTRY.idle;
}
