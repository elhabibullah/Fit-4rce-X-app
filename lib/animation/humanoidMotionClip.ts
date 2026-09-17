import * as THREE from 'three';
import { HumanoidBoneName } from './humanoidBones.ts';
import { HumanoidFramePose } from './skeletalRetargeter.ts';

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
