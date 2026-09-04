import * as THREE from 'three';
import { HunyuanSkeletalRetargeter } from './skeletalRetargeter.ts';
import {
  HUMANOID_CLIPS,
  HumanoidClip,
  HumanoidFramePose,
  resolveHumanoidClip,
} from './animationClips.ts';
import { HumanoidBoneName } from './humanoidBones.ts';

export class HumanoidMotionEngine {
  private retargeter: HunyuanSkeletalRetargeter;
  private currentClip: HumanoidClip = HUMANOID_CLIPS.idle;
  private targetClip: HumanoidClip | null = null;

  private time: number = 0;
  private blendTime: number = 0;
  private blendDuration: number = 0.35; // 350ms smooth transition
  private previousPose: HumanoidFramePose | null = null;

  public currentProneAngle: number = 0;
  public currentProneY: number = 0;

  constructor(scene: THREE.Object3D) {
    this.retargeter = new HunyuanSkeletalRetargeter(scene);
  }

  public getUnitScale(): number {
    return this.retargeter.unitScale;
  }

  public getCharacterHeight(): number {
    return this.retargeter.characterHeight;
  }

  /**
   * Request an animation state change with smooth cross-fading
   */
  public setAnimation(clipOrName: string | HumanoidClip, blendDuration: number = 0.35): void {
    const nextClip = typeof clipOrName === 'string' ? resolveHumanoidClip(clipOrName) : clipOrName;

    if (this.currentClip.name === nextClip.name && !this.targetClip) {
      return;
    }

    if (this.targetClip?.name === nextClip.name) {
      return;
    }

    // Instant switch if requested or if already in default initial state
    if (blendDuration <= 0) {
      this.currentClip = nextClip;
      this.targetClip = null;
      this.previousPose = null;
      this.time = 0;
      return;
    }

    // Capture current pose snapshot for seamless cross-fade
    const currentProgress = (this.time % this.currentClip.duration) / this.currentClip.duration;
    this.previousPose = this.currentClip.sample(currentProgress);

    this.targetClip = nextClip;
    this.blendTime = 0;
    this.blendDuration = Math.max(0.08, blendDuration);
  }

  /**
   * Update the skeletal pose each frame
   */
  public update(delta: number, speed: number = 1.0, timelineProgress?: number): void {
    if (!this.retargeter.isCalibrated) return;

    // Advance time or lock to timeline progress
    if (timelineProgress !== undefined && timelineProgress !== null) {
      this.time = timelineProgress * this.currentClip.duration;
    } else {
      this.time += delta * speed;
    }

    // If switching clips while paused, complete transition immediately
    if (this.targetClip && delta === 0) {
      this.currentClip = this.targetClip;
      this.targetClip = null;
      this.previousPose = null;
    }

    // Handle cross-fading transitions
    let activeClip = this.currentClip;
    let blendWeight = 1.0;

    if (this.targetClip) {
      this.blendTime += delta * speed;
      blendWeight = Math.min(1.0, this.blendTime / this.blendDuration);

      if (blendWeight >= 1.0) {
        this.currentClip = this.targetClip;
        this.targetClip = null;
        this.previousPose = null;
        activeClip = this.currentClip;
      }
    }

    // Sample the active target pose
    const normTime = (this.time % activeClip.duration) / activeClip.duration;
    const targetPose = activeClip.sample(normTime);

    // Blend between previous pose and target pose if transitioning
    let finalPose = targetPose;
    if (this.previousPose && blendWeight < 1.0) {
      finalPose = this.blendPoses(this.previousPose, targetPose, blendWeight);
    }

    // Apply prone tilt and height adjustments smoothly
    const targetProneAngle = targetPose.proneAngle || 0;
    const targetProneY = targetPose.proneY || 0;
    this.currentProneAngle = THREE.MathUtils.lerp(this.currentProneAngle, targetProneAngle, Math.min(1.0, delta * 8.0));
    this.currentProneY = THREE.MathUtils.lerp(this.currentProneY, targetProneY, Math.min(1.0, delta * 8.0));

    // Apply to Hunyuan Skeleton through calibrated retargeter
    this.applyPoseToSkeleton(finalPose);
  }

  private blendPoses(poseA: HumanoidFramePose, poseB: HumanoidFramePose, t: number): HumanoidFramePose {
    const smoothT = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

    const hipsOffset: [number, number, number] = [
      THREE.MathUtils.lerp(poseA.hipsOffset[0], poseB.hipsOffset[0], smoothT),
      THREE.MathUtils.lerp(poseA.hipsOffset[1], poseB.hipsOffset[1], smoothT),
      THREE.MathUtils.lerp(poseA.hipsOffset[2], poseB.hipsOffset[2], smoothT),
    ];

    const blendedBones: Partial<Record<HumanoidBoneName, { pitch: number; yaw: number; roll: number }>> = {};

    // Blend all bones present in either pose
    const allBoneKeys = new Set([
      ...Object.keys(poseA.bones),
      ...Object.keys(poseB.bones),
    ]) as Set<HumanoidBoneName>;

    allBoneKeys.forEach((key) => {
      const bA = poseA.bones[key] || { pitch: 0, yaw: 0, roll: 0 };
      const bB = poseB.bones[key] || { pitch: 0, yaw: 0, roll: 0 };

      blendedBones[key] = {
        pitch: THREE.MathUtils.lerp(bA.pitch, bB.pitch, smoothT),
        yaw: THREE.MathUtils.lerp(bA.yaw, bB.yaw, smoothT),
        roll: THREE.MathUtils.lerp(bA.roll, bB.roll, smoothT),
      };
    });

    return {
      hipsOffset,
      proneAngle: THREE.MathUtils.lerp(poseA.proneAngle || 0, poseB.proneAngle || 0, smoothT),
      proneY: THREE.MathUtils.lerp(poseA.proneY || 0, poseB.proneY || 0, smoothT),
      bones: blendedBones,
    };
  }

  private applyPoseToSkeleton(pose: HumanoidFramePose): void {
    // 1. Reset all bones to calibrated bind pose
    this.retargeter.resetToRestPose();

    // 2. Apply Pelvic offset
    this.retargeter.setHipsOffset(
      pose.hipsOffset[0],
      pose.hipsOffset[1],
      pose.hipsOffset[2]
    );

    // 3. Apply anatomical rotations to all bones through the retargeter
    for (const [boneKey, rot] of Object.entries(pose.bones)) {
      if (rot) {
        this.retargeter.setAnatomicalRotation(
          boneKey as HumanoidBoneName,
          rot.pitch,
          rot.yaw,
          rot.roll
        );
      }
    }
  }
}
