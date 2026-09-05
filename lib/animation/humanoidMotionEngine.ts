import * as THREE from 'three';
import { HunyuanSkeletalRetargeter, HumanoidFramePose } from './skeletalRetargeter.ts';
import {
  HumanoidMotionClip,
  resolveHumanoidClip,
  CLIPS_REGISTRY,
} from './animationClips.ts';
import { HumanoidBoneName } from './humanoidBones.ts';
import {
  ExerciseDefinition,
  resolveExerciseDefinition,
} from './exerciseDefinitions.ts';
import { GroundContactSolver, SolvedGroundContact } from './groundContactSolver.ts';

export class HumanoidMotionEngine {
  private retargeter: HunyuanSkeletalRetargeter;
  private contactSolver: GroundContactSolver;
  private currentExerciseDef: ExerciseDefinition;
  private currentClip: HumanoidMotionClip;
  private targetClip: HumanoidMotionClip | null = null;
  private targetExerciseDef: ExerciseDefinition | null = null;

  private time: number = 0;
  private blendTime: number = 0;
  private blendDuration: number = 0.35; // 350ms smooth transition
  private previousPose: HumanoidFramePose | null = null;

  public currentProneAngle: number = 0;
  public currentGroundOffsetY: number = 0;
  public currentGroundOffsetZ: number = 0;
  public lastSolveResult: SolvedGroundContact | null = null;

  constructor(scene: THREE.Object3D) {
    this.retargeter = new HunyuanSkeletalRetargeter(scene);
    this.contactSolver = new GroundContactSolver();
    this.currentExerciseDef = resolveExerciseDefinition('idle');
    this.currentClip = CLIPS_REGISTRY.idle;
  }

  public getRetargeter(): HunyuanSkeletalRetargeter {
    return this.retargeter;
  }

  public getContactSolver(): GroundContactSolver {
    return this.contactSolver;
  }

  public getUnitScale(): number {
    return this.retargeter.unitScale;
  }

  public getCharacterHeight(): number {
    return this.retargeter.characterHeight;
  }

  public getCurrentExerciseDef(): ExerciseDefinition {
    return this.currentExerciseDef;
  }

  /**
   * Set or transition to a new exercise using the unified ExerciseDefinition pipeline
   */
  public setExercise(
    exerciseNameOrQuery: string,
    blendDuration: number = 0.35,
    resetTime: boolean = false
  ): void {
    const nextDef = resolveExerciseDefinition(exerciseNameOrQuery);
    const nextClip = resolveHumanoidClip(exerciseNameOrQuery);

    if (this.currentExerciseDef.id === nextDef.id && !this.targetClip) {
      if (resetTime) this.time = 0;
      return;
    }

    if (this.targetExerciseDef?.id === nextDef.id) {
      if (resetTime) this.time = 0;
      return;
    }

    const currentPosture = this.currentExerciseDef.startingPosture;
    const nextPosture = nextDef.startingPosture;
    const isPostureChange = currentPosture !== nextPosture;

    // Instant switch if requested or if fundamental posture changed (e.g. prone <-> standing)
    // Prevents model from tipping over like a board / turning page during posture changes
    if (blendDuration <= 0 || isPostureChange) {
      this.currentExerciseDef = nextDef;
      this.currentClip = nextClip;
      this.targetClip = null;
      this.targetExerciseDef = null;
      this.previousPose = null;
      this.time = 0;
      const initialPose = nextClip.sample(0);
      this.currentProneAngle = initialPose.proneAngle || 0;
      this.currentGroundOffsetY = initialPose.groundOffsetY || 0;
      this.currentGroundOffsetZ = initialPose.groundOffsetZ || 0;
      return;
    }

    // Sample current pose snapshot for cross-fade blending
    const currentProgress = (this.time % this.currentClip.duration) / this.currentClip.duration;
    this.previousPose = this.currentClip.sample(currentProgress);

    this.targetExerciseDef = nextDef;
    this.targetClip = nextClip;
    this.blendTime = 0;
    this.blendDuration = Math.max(0.08, blendDuration);
    if (resetTime) {
      this.time = 0;
    }
  }

  /**
   * Update the skeletal pose each frame.
   * Full Game Engine Pipeline:
   * Clip Sample -> Cross-fade -> Retargeting -> Skeletons & Constraints -> GroundContactSolver -> Final Pose
   */
  public update(
    delta: number,
    speed: number = 1.0,
    timelineProgress?: number,
    isPrep: boolean = false
  ): void {
    if (!this.retargeter.isCalibrated) return;

    // During prep/countdown: maintain starting posture, zero timeline advance
    if (isPrep) {
      this.time = 0;
    } else if (timelineProgress !== undefined && timelineProgress !== null) {
      this.time = timelineProgress * this.currentClip.duration;
    } else {
      this.time += delta * speed;
    }

    // Finish any transition if paused
    if (this.targetClip && delta === 0 && !isPrep) {
      this.currentClip = this.targetClip;
      this.currentExerciseDef = this.targetExerciseDef || this.currentExerciseDef;
      this.targetClip = null;
      this.targetExerciseDef = null;
      this.previousPose = null;
    }

    // Cross-fade handling
    let activeClip = this.currentClip;
    let blendWeight = 1.0;

    if (this.targetClip) {
      this.blendTime += (isPrep ? delta : delta * speed);
      blendWeight = Math.min(1.0, this.blendTime / this.blendDuration);

      if (blendWeight >= 1.0) {
        this.currentClip = this.targetClip;
        this.currentExerciseDef = this.targetExerciseDef || this.currentExerciseDef;
        this.targetClip = null;
        this.targetExerciseDef = null;
        this.previousPose = null;
        activeClip = this.currentClip;
      }
    }

    // Sample target pose along the single humanoid timeline
    const normTime = (this.time % activeClip.duration) / activeClip.duration;
    const targetPose = activeClip.sample(normTime);

    // Cross-fade blend
    let finalPose = targetPose;
    if (this.previousPose && blendWeight < 1.0) {
      finalPose = this.blendPoses(this.previousPose, targetPose, blendWeight);
    }

    // Smooth prone angle and ground offsets
    const targetProne = finalPose.proneAngle || 0;
    const targetGroundY = finalPose.groundOffsetY || 0;
    const targetGroundZ = finalPose.groundOffsetZ || 0;

    const lerpRate = Math.min(1.0, (delta > 0 ? delta : 0.016) * 10.0);
    this.currentProneAngle = THREE.MathUtils.lerp(this.currentProneAngle, targetProne, lerpRate);
    this.currentGroundOffsetY = THREE.MathUtils.lerp(this.currentGroundOffsetY, targetGroundY, lerpRate);
    this.currentGroundOffsetZ = THREE.MathUtils.lerp(this.currentGroundOffsetZ, targetGroundZ, lerpRate);

    // 1. Apply Pose to Hunyuan Skeleton via Retargeter
    this.retargeter.applyPose(finalPose);

    // 2. Execute Ground & Contact Solver
    // Enforces ground contact, flat palms for pushups, clearance for lunges, and zero floor intersection
    const solveResult = this.contactSolver.solveContacts(
      this.retargeter,
      this.currentExerciseDef.startingPosture,
      this.currentExerciseDef.contacts,
      this.currentProneAngle
    );
    this.lastSolveResult = solveResult;

    // 3. Keep hips solidly anchored to calibrated pose height
    // Avoid accumulating arbitrary offsets that cause character to float into air
    if (solveResult.hipsElevationAdjust !== 0) {
      const currentHips = this.retargeter.hipsBone;
      const calibratedHips = this.retargeter.bones.get('Hips');
      if (currentHips && calibratedHips) {
        currentHips.position.y = calibratedHips.restLocalPos.y + (finalPose.hipsOffset[1] + solveResult.hipsElevationAdjust) * this.retargeter.unitScale;
        currentHips.updateMatrixWorld(true);
      }
    }
  }

  private blendPoses(poseA: HumanoidFramePose, poseB: HumanoidFramePose, t: number): HumanoidFramePose {
    const smoothT = t * t * (3 - 2 * t);

    const hipsOffset: [number, number, number] = [
      THREE.MathUtils.lerp(poseA.hipsOffset[0], poseB.hipsOffset[0], smoothT),
      THREE.MathUtils.lerp(poseA.hipsOffset[1], poseB.hipsOffset[1], smoothT),
      THREE.MathUtils.lerp(poseA.hipsOffset[2], poseB.hipsOffset[2], smoothT),
    ];

    const proneAngle = THREE.MathUtils.lerp(poseA.proneAngle || 0, poseB.proneAngle || 0, smoothT);
    const groundOffsetY = THREE.MathUtils.lerp(poseA.groundOffsetY || 0, poseB.groundOffsetY || 0, smoothT);
    const groundOffsetZ = THREE.MathUtils.lerp(poseA.groundOffsetZ || 0, poseB.groundOffsetZ || 0, smoothT);

    const blendedBones: Partial<Record<HumanoidBoneName, { pitch: number; yaw: number; roll: number }>> = {};

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
      proneAngle,
      groundOffsetY,
      groundOffsetZ,
      bones: blendedBones,
    };
  }
}
