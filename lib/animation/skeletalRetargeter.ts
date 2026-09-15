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

    const calibratedHips = this.bones.get('Hips');
    const isFloor = Boolean(pose.proneAngle && Math.abs(pose.proneAngle) > 0.5);

    // 2. Apply root/hips translation
    if (this.hipsBone && calibratedHips) {
      if (isFloor) {
        // Floor exercises (Push-up, Plank, Superman, Glute Bridge, Crunch):
        // Lower hips to floor level and center horizontally on podium
        const floorDrop = 2.05 * this.unitScale;
        const forwardShift = 0.35 * this.unitScale;
        this.hipsBone.position.x = calibratedHips.restLocalPos.x + (pose.hipsOffset[0] || 0) * this.unitScale;
        this.hipsBone.position.y = calibratedHips.restLocalPos.y - floorDrop + (pose.hipsOffset[1] || 0) * this.unitScale;
        this.hipsBone.position.z = calibratedHips.restLocalPos.z + forwardShift + (pose.hipsOffset[2] || 0) * this.unitScale;
      } else {
        // Standing / squatting / jumping / lunging / walking:
        this.hipsBone.position.x = calibratedHips.restLocalPos.x + (pose.hipsOffset[0] || 0) * this.unitScale;
        this.hipsBone.position.y = calibratedHips.restLocalPos.y + (pose.hipsOffset[1] || 0) * this.unitScale;
        this.hipsBone.position.z = calibratedHips.restLocalPos.z + (pose.hipsOffset[2] || 0) * this.unitScale;
      }
      this.hipsBone.updateMatrixWorld(true);
    }

    // 3. Process every bone in strict topological order (parents before children)
    for (const boneName of TOPOLOGICAL_BONE_ORDER) {
      const rot = pose.bones[boneName];
      let pitch = rot ? rot.pitch : 0;
      let yaw = rot ? rot.yaw : 0;
      let roll = rot ? rot.roll : 0;

      // In floor position, tilt hips/pelvis by proneAngle
      if (boneName === 'Hips' && isFloor) {
        pitch += pose.proneAngle!;
      }

      if (pitch === 0 && yaw === 0 && roll === 0 && (!isFloor || boneName !== 'Hips')) {
        const calibrated = this.bones.get(boneName);
        if (calibrated) {
          calibrated.bone.updateMatrixWorld(true);
        }
        continue;
      }

      this.setAnatomicalRotation(boneName, pitch, yaw, roll);
      const calibrated = this.bones.get(boneName);
      if (calibrated) {
        calibrated.bone.updateMatrixWorld(true);
      }
    }
  }

  /**
   * Apply anatomical rotation to a bone with physiological constraints.
   * Calculates local anatomical rotation axes directly from the bone's rest world orientation,
   * preserving natural human joint biomechanics and hierarchical parent-child transforms.
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

    // Determine the anatomical flexion/extension, abduction/adduction, and twist axes in the bone's local rest frame.
    // In standard character world space:
    // +X is Character Left (Pitch/Sagittal flexion axis)
    // +Y is Character Up (Yaw/Transverse axis)
    // +Z is Character Forward (Roll/Coronal axis)
    const invRestWorldQ = calibrated.restWorldQ.clone().invert();

    // Transform anatomical cardinal axes into this bone's rest local coordinate system:
    const localPitchAxis = new THREE.Vector3(1, 0, 0).applyQuaternion(invRestWorldQ).normalize();
    const localYawAxis   = new THREE.Vector3(0, 1, 0).applyQuaternion(invRestWorldQ).normalize();
    const localRollAxis  = new THREE.Vector3(0, 0, 1).applyQuaternion(invRestWorldQ).normalize();

    // Anatomical direction adjustments:
    // Left & Right limbs mirror laterally:
    const isRightLimb = boneName.startsWith('Right');
    const rollSign = isRightLimb ? -1 : 1;

    // For thighs (UpLeg) and upper arms (Arm):
    // Positive pitch = forward flexion; knees (Leg) flex backward:
    const pitchSign = (boneName === 'LeftLeg' || boneName === 'RightLeg') ? 1 : 1;

    const qPitch = new THREE.Quaternion().setFromAxisAngle(localPitchAxis, clampedPitch * pitchSign);
    const qYaw   = new THREE.Quaternion().setFromAxisAngle(localYawAxis, clampedYaw);
    const qRoll  = new THREE.Quaternion().setFromAxisAngle(localRollAxis, clampedRoll * rollSign);

    // Combine into local delta rotation (intrinsic Yaw -> Roll -> Pitch)
    const deltaLocalQ = new THREE.Quaternion()
      .multiply(qYaw)
      .multiply(qRoll)
      .multiply(qPitch);

    // Apply delta rotation directly relative to rest local orientation
    calibrated.bone.quaternion.copy(calibrated.restLocalQ.clone().multiply(deltaLocalQ));
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
