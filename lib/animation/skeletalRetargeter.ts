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

export class HunyuanSkeletalRetargeter {
  public bones: Map<HumanoidBoneName, CalibratedBone> = new Map();
  public hipsBone: THREE.Bone | null = null;
  public isCalibrated: boolean = false;
  public characterHeight: number = 1.70;
  public unitScale: number = 1.0;

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
   * Applies a complete humanoid pose to the Hunyuan skeleton in topological order
   */
  public applyPose(pose: HumanoidFramePose): void {
    if (!this.isCalibrated) return;

    // 1. Reset all bones to rest pose first
    this.resetToRestPose();

    // 2. Apply root/hips translation
    if (this.hipsBone && pose.hipsOffset) {
      const calibratedHips = this.bones.get('Hips');
      if (calibratedHips) {
        this.hipsBone.position.x = calibratedHips.restLocalPos.x + pose.hipsOffset[0] * this.unitScale;
        this.hipsBone.position.y = calibratedHips.restLocalPos.y + pose.hipsOffset[1] * this.unitScale;
        this.hipsBone.position.z = calibratedHips.restLocalPos.z + pose.hipsOffset[2] * this.unitScale;
      }
    }

    // 3. Process every bone in strict topological order (parents before children)
    for (const boneName of TOPOLOGICAL_BONE_ORDER) {
      const rot = pose.bones[boneName];
      if (!rot) continue;

      this.setAnatomicalRotation(boneName, rot.pitch, rot.yaw, rot.roll);
      const calibrated = this.bones.get(boneName);
      if (calibrated) {
        calibrated.bone.updateMatrixWorld(true);
      }
    }
  }

  /**
   * Apply anatomical rotation to a bone with physiological constraints.
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

    // Joint rotation axes in character anatomical space
    // 1. Sagittal (Pitch)
    // Knee flexes backwards (+1); other joints flex forward (-1)
    let axisPitch = new THREE.Vector3(-1, 0, 0);
    if (boneName === 'LeftLeg' || boneName === 'RightLeg') {
      axisPitch = new THREE.Vector3(1, 0, 0);
    }

    // 2. Transverse (Yaw)
    const axisYaw = new THREE.Vector3(0, 1, 0);

    // 3. Coronal (Roll) - lateral abduction
    let axisRoll = new THREE.Vector3(0, 0, 1);
    if (boneName === 'LeftArm') {
      axisRoll = new THREE.Vector3(0, 0, -1);
    } else if (boneName === 'RightArm') {
      axisRoll = new THREE.Vector3(0, 0, 1);
    } else if (boneName === 'LeftUpLeg') {
      axisRoll = new THREE.Vector3(0, 0, 1);
    } else if (boneName === 'RightUpLeg') {
      axisRoll = new THREE.Vector3(0, 0, -1);
    }

    const qPitch = new THREE.Quaternion().setFromAxisAngle(axisPitch, clampedPitch);
    const qYaw = new THREE.Quaternion().setFromAxisAngle(axisYaw, clampedYaw);
    const qRoll = new THREE.Quaternion().setFromAxisAngle(axisRoll, clampedRoll);

    // Combined delta in character space
    const deltaWorldQ = qRoll.multiply(qYaw).multiply(qPitch);

    // Transform delta into bone-local space relative to rest world orientation:
    // delta_local = restWorldQ^(-1) * deltaWorldQ * restWorldQ
    const deltaLocal = calibrated.restWorldQ.clone().invert()
      .multiply(deltaWorldQ)
      .multiply(calibrated.restWorldQ);

    calibrated.bone.quaternion.copy(calibrated.restLocalQ.clone().multiply(deltaLocal));
  }

  /**
   * Set relative hip position offset
   */
  public setHipsOffset(offsetX: number, offsetY: number, offsetZ: number): void {
    const hips = this.bones.get('Hips');
    if (!hips) return;

    hips.bone.position.x = hips.restLocalPos.x + offsetX * this.unitScale;
    hips.bone.position.y = hips.restLocalPos.y + offsetY * this.unitScale;
    hips.bone.position.z = hips.restLocalPos.z + offsetZ * this.unitScale;
  }
}
