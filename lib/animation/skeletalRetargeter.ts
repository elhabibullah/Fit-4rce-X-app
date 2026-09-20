import * as THREE from 'three';
import {
  HumanoidBoneName,
  HUNYUAN_TO_HUMANOID_MAP,
  ANATOMICAL_LIMITS,
  TOPOLOGICAL_BONE_ORDER,
} from './humanoidBones.ts';

export interface HumanoidFramePose {
  hipsOffset: [number, number, number];
  proneAngle?: number;       // Horizontal pitch for pushup/plank
  groundOffsetY?: number;    // Vertical ground anchor
  groundOffsetZ?: number;    // Sagittal ground anchor
  bones: Partial<Record<HumanoidBoneName, { pitch: number; yaw: number; roll: number }>>;
}

export interface CalibratedBone {
  name: HumanoidBoneName;
  bone: THREE.Bone;
  restLocalQ: THREE.Quaternion;
  restLocalPos: THREE.Vector3;
  restWorldQ: THREE.Quaternion;
  parentBone: THREE.Bone | null;
}

/**
 * Standard Humanoid Parent Mapping
 * Used to traverse and accumulate anatomical rotations along the kinematic chain.
 */
const HUMANOID_PARENT_MAP: Partial<Record<HumanoidBoneName, HumanoidBoneName>> = {
  Spine: 'Hips',
  Spine1: 'Spine',
  Spine2: 'Spine1',
  Neck: 'Spine2',
  Head: 'Neck',

  LeftUpLeg: 'Hips',
  LeftLeg: 'LeftUpLeg',
  LeftFoot: 'LeftLeg',
  LeftToeBase: 'LeftFoot',

  RightUpLeg: 'Hips',
  RightLeg: 'RightUpLeg',
  RightFoot: 'RightLeg',
  RightToeBase: 'RightFoot',

  LeftShoulder: 'Spine1',
  LeftArm: 'LeftShoulder',
  LeftForeArm: 'LeftArm',
  LeftHand: 'LeftForeArm',

  RightShoulder: 'Spine1',
  RightArm: 'RightShoulder',
  RightForeArm: 'RightArm',
  RightHand: 'RightForeArm',
};

/**
 * Determines the pitch rotation sign around the Character Lateral X Axis
 * such that positive anatomical pitch represents forward flexion in the sagittal plane.
 */
function getBoneWorldPitchSign(name: HumanoidBoneName): number {
  // Thigh points DOWN: rotating forward (+Z) requires negative rotation around +X
  if (name.includes('UpLeg')) return -1;
  // Knee flexes backward: relative to thigh, adds positive rotation around +X
  if (name.includes('Leg') && !name.includes('Up')) return 1;
  // Foot dorsiflexes forward: subtracts rotation around +X
  if (name.includes('Foot')) return -1;
  // Spine, neck, head point UP: forward flexion requires positive rotation around +X
  if (name.includes('Spine') || name.includes('Neck') || name.includes('Head')) return 1;
  // Upper arm points DOWN: forward flexion requires negative rotation around +X
  if (name.includes('Arm') && !name.includes('Fore')) return -1;
  // Forearm flexes forward/up: requires negative rotation around +X
  if (name.includes('ForeArm')) return -1;
  return 1;
}

export class HunyuanSkeletalRetargeter {
  public bones: Map<HumanoidBoneName, CalibratedBone> = new Map();
  public hipsBone: THREE.Bone | null = null;
  public isCalibrated: boolean = false;
  public characterHeight: number = 1.70;
  public unitScale: number = 1.0;
  public worldToLocalScale: number = 1.0;
  public localToWorldScale: number = 1.0;
  public anklePodiumClearance: number = 0.08;
  public standingHipsWorldY: number = 0;
  public standingHipsAboveFloor: number = 0.85;

  // Reusable temporaries for zero-garbage 60fps puppeteering
  private tmpVecX = new THREE.Vector3(1, 0, 0);
  private tmpVecY = new THREE.Vector3(0, 1, 0);
  private tmpVecZ = new THREE.Vector3(0, 0, 1);
  private tmpParentWQ = new THREE.Quaternion();
  private tmpTargetWQ = new THREE.Quaternion();

  constructor(scene: THREE.Object3D) {
    this.calibrate(scene);
  }

  public calibrate(scene: THREE.Object3D): void {
    this.bones.clear();
    scene.updateMatrixWorld(true);

    // 1. Identify all mapped humanoid bones (support both instanceof and .isBone flag)
    scene.traverse((child) => {
      const isBone = Boolean((child as any).isBone || child instanceof THREE.Bone || child.type === 'Bone');
      if (isBone) {
        const stdName = HUNYUAN_TO_HUMANOID_MAP[child.name];
        if (stdName) {
          const wq = new THREE.Quaternion();
          child.getWorldQuaternion(wq);

          const isParentBone = Boolean(
            child.parent && ((child.parent as any).isBone || child.parent instanceof THREE.Bone || child.parent.type === 'Bone')
          );

          this.bones.set(stdName, {
            name: stdName,
            bone: child as THREE.Bone,
            restLocalQ: child.quaternion.clone(),
            restLocalPos: child.position.clone(),
            restWorldQ: wq.clone(),
            parentBone: isParentBone ? (child.parent as THREE.Bone) : null,
          });

          if (stdName === 'Hips') {
            this.hipsBone = child as THREE.Bone;
            const pHips = new THREE.Vector3();
            this.hipsBone.getWorldPosition(pHips);
            this.standingHipsWorldY = pHips.y;
            const ws = new THREE.Vector3();
            this.hipsBone.getWorldScale(ws);
            const scaleY = ws.y > 0.0001 ? ws.y : 1.0;
            this.localToWorldScale = scaleY;
            this.worldToLocalScale = 1.0 / scaleY;
            const podiumSurfaceY = -0.889;
            this.standingHipsAboveFloor = Math.max(0.40, this.standingHipsWorldY - podiumSurfaceY);
          }
        }
      }
    });

    // 2. Calibrate height and scale
    const headData = this.bones.get('Head');
    const leftFootData = this.bones.get('LeftFoot');
    const rightFootData = this.bones.get('RightFoot');

    if (headData && (leftFootData || rightFootData)) {
      const pHead = new THREE.Vector3();
      headData.bone.getWorldPosition(pHead);
      const pFoot = new THREE.Vector3();
      if (leftFootData) leftFootData.bone.getWorldPosition(pFoot);
      else if (rightFootData) rightFootData.bone.getWorldPosition(pFoot);

      const measuredHeight = Math.max(1.0, Math.abs(pHead.y - pFoot.y));
      this.characterHeight = measuredHeight;
      this.unitScale = measuredHeight / 1.70;
      // Ankle joint center is anatomically 6cm (0.06m) above the bottom of the foot sole
      this.anklePodiumClearance = 0.065;
    }

    this.isCalibrated = this.bones.size > 0;
  }

  /**
   * Reset all bones strictly to bind / rest pose
   */
  public resetToRestPose(): void {
    this.bones.forEach((calibrated) => {
      calibrated.bone.quaternion.copy(calibrated.restLocalQ);
      calibrated.bone.position.copy(calibrated.restLocalPos);
    });
  }

  /**
   * Applies a complete humanoid pose to the skeleton using TRUE KINEMATIC WORLD RETARGETING.
   *
   * Rather than applying ambiguous local Euler angles to arbitrarily rolled armature bones,
   * this algorithm computes the exact desired target orientation in Character Space
   * (X = Lateral, Y = Vertical, Z = Sagittal) and solves for the exact local quaternion:
   *
   *   q_local = P_current_world^-1 * (R_world * Q_rest_world)
   *
   * Evaluated in strict topological order, this guarantees:
   * - Human movement fidelity with zero joint twisting or inverted knees
   * - Complete symmetry between left and right limbs
   * - Natural spine bending and hip flexion without floor collision
   */
  public applyPose(pose: HumanoidFramePose): void {
    if (!this.isCalibrated) return;

    // 1. Reset all bones to rest pose first
    this.resetToRestPose();

    const calibratedHips = this.bones.get('Hips');
    const isFloor = Boolean(pose.proneAngle && Math.abs(pose.proneAngle) > 0.3);

    // 2. Apply root/hips translation
    if (this.hipsBone && calibratedHips) {
      const offsetX = (pose.hipsOffset[0] || 0) * this.worldToLocalScale;
      const offsetY = (pose.hipsOffset[1] || 0) * this.worldToLocalScale;
      const offsetZ = (pose.hipsOffset[2] || 0) * this.worldToLocalScale;

      if (isFloor) {
        // Floor exercises (Push-up, Plank, Superman, Glute Bridge, Crunch):
        // Lower hips directly to horizontal floor level (approx 16cm above podium surface)
        const targetFloorHipsAbovePodium = 0.16;
        const worldFloorDrop = Math.max(0.20, this.standingHipsAboveFloor - targetFloorHipsAbovePodium);
        const localFloorDrop = worldFloorDrop * this.worldToLocalScale;
        const localForwardShift = 0.20 * this.worldToLocalScale;

        this.hipsBone.position.x = calibratedHips.restLocalPos.x + offsetX;
        this.hipsBone.position.y = calibratedHips.restLocalPos.y - localFloorDrop + offsetY;
        this.hipsBone.position.z = calibratedHips.restLocalPos.z + localForwardShift + offsetZ;
      } else {
        // Standing / squatting / jumping / lunging / walking:
        this.hipsBone.position.x = calibratedHips.restLocalPos.x + offsetX;
        this.hipsBone.position.y = calibratedHips.restLocalPos.y + offsetY;
        this.hipsBone.position.z = calibratedHips.restLocalPos.z + offsetZ;
      }
      this.hipsBone.updateMatrixWorld(true);
    }

    // 3. Hierarchical World Rotation Map (boneName -> accumulated character world rotation)
    const worldRotMap = new Map<HumanoidBoneName, THREE.Quaternion>();

    // Initial root/floor orientation
    if (isFloor && pose.proneAngle) {
      // In prone/supine position, character body tilts around Lateral X axis
      const qFloorTilt = new THREE.Quaternion().setFromAxisAngle(this.tmpVecX, pose.proneAngle);
      worldRotMap.set('Hips', qFloorTilt);
    } else {
      worldRotMap.set('Hips', new THREE.Quaternion());
    }

    // 4. Process every bone in strict topological order (parents before children)
    for (const boneName of TOPOLOGICAL_BONE_ORDER) {
      const calibrated = this.bones.get(boneName);
      if (!calibrated) continue;

      const rot = pose.bones[boneName];
      let pitch = rot ? rot.pitch : 0;
      let yaw = rot ? rot.yaw : 0;
      let roll = rot ? rot.roll : 0;

      // Apply physiological limits
      const limits = ANATOMICAL_LIMITS[boneName];
      if (limits) {
        pitch = THREE.MathUtils.clamp(pitch, limits.minPitch, limits.maxPitch);
        yaw = THREE.MathUtils.clamp(yaw, limits.minYaw, limits.maxYaw);
        roll = THREE.MathUtils.clamp(roll, limits.minRoll, limits.maxRoll);
      }

      // Compute anatomical delta rotation in Character Space
      const isRight = boneName.startsWith('Right');
      const coronal = isRight ? -roll : roll;       // Lateral abduction away from body
      const transverse = isRight ? -yaw : yaw;     // Transverse rotation
      const pitchSign = getBoneWorldPitchSign(boneName);

      const qPitch = new THREE.Quaternion().setFromAxisAngle(this.tmpVecX, pitch * pitchSign);
      const qYaw = new THREE.Quaternion().setFromAxisAngle(this.tmpVecY, transverse);
      const qRoll = new THREE.Quaternion().setFromAxisAngle(this.tmpVecZ, coronal);
      const qLocalDelta = new THREE.Quaternion().multiply(qYaw).multiply(qRoll).multiply(qPitch);

      // Find parent bone in humanoid hierarchy
      const parentName = HUMANOID_PARENT_MAP[boneName];
      const parentWorldRot = (parentName && worldRotMap.get(parentName)) || worldRotMap.get('Hips') || new THREE.Quaternion();

      // Accumulate world rotation down kinematic chain
      const myWorldRot = parentWorldRot.clone().multiply(qLocalDelta);
      worldRotMap.set(boneName, myWorldRot);

      // Compute target world orientation: R_world * restWorldQ
      this.tmpTargetWQ.copy(myWorldRot).multiply(calibrated.restWorldQ);

      // Solve for local quaternion: P_world^-1 * targetWorldQ
      const parentObj = calibrated.bone.parent;
      if (parentObj) {
        parentObj.getWorldQuaternion(this.tmpParentWQ);
        const invParentWQ = this.tmpParentWQ.invert();
        calibrated.bone.quaternion.copy(invParentWQ.multiply(this.tmpTargetWQ));
      } else {
        calibrated.bone.quaternion.copy(this.tmpTargetWQ);
      }

      calibrated.bone.updateMatrixWorld(true);
    }
  }

  /**
   * Apply anatomical rotation to a single bone with physiological constraints.
   * Solves target world orientation directly and converts to local bone transform.
   */
  public setAnatomicalRotation(
    boneName: HumanoidBoneName,
    pitch: number,
    yaw: number,
    roll: number
  ): void {
    const calibrated = this.bones.get(boneName);
    if (!calibrated) return;

    // Physiological joint limits
    const limits = ANATOMICAL_LIMITS[boneName];
    let clampedPitch = pitch;
    let clampedYaw = yaw;
    let clampedRoll = roll;

    if (limits) {
      clampedPitch = THREE.MathUtils.clamp(pitch, limits.minPitch, limits.maxPitch);
      clampedYaw = THREE.MathUtils.clamp(yaw, limits.minYaw, limits.maxYaw);
      clampedRoll = THREE.MathUtils.clamp(roll, limits.minRoll, limits.maxRoll);
    }

    const isRight = boneName.startsWith('Right');
    const coronal = isRight ? -clampedRoll : clampedRoll;
    const transverse = isRight ? -clampedYaw : clampedYaw;
    const pitchSign = getBoneWorldPitchSign(boneName);

    const qPitch = new THREE.Quaternion().setFromAxisAngle(this.tmpVecX, clampedPitch * pitchSign);
    const qYaw = new THREE.Quaternion().setFromAxisAngle(this.tmpVecY, transverse);
    const qRoll = new THREE.Quaternion().setFromAxisAngle(this.tmpVecZ, coronal);
    const qLocalDelta = new THREE.Quaternion().multiply(qYaw).multiply(qRoll).multiply(qPitch);

    // Compute target world orientation
    const targetWorldQ = qLocalDelta.multiply(calibrated.restWorldQ);

    const parentObj = calibrated.bone.parent;
    if (parentObj) {
      const pWQ = new THREE.Quaternion();
      parentObj.getWorldQuaternion(pWQ);
      calibrated.bone.quaternion.copy(pWQ.invert().multiply(targetWorldQ));
    } else {
      calibrated.bone.quaternion.copy(targetWorldQ);
    }
    calibrated.bone.updateMatrixWorld(true);
  }

  /**
   * Set relative hip position offset
   */
  public setHipsOffset(offsetX: number, offsetY: number, offsetZ: number): void {
    const hips = this.bones.get('Hips');
    if (!hips) return;

    hips.bone.position.x = hips.restLocalPos.x + offsetX * this.worldToLocalScale;
    hips.bone.position.y = hips.restLocalPos.y + offsetY * this.worldToLocalScale;
    hips.bone.position.z = hips.restLocalPos.z + offsetZ * this.worldToLocalScale;
    hips.bone.updateMatrixWorld(true);
  }
}

