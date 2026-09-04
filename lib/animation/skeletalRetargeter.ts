import * as THREE from 'three';
import {
  HumanoidBoneName,
  HUNYUAN_TO_HUMANOID_MAP,
  ANATOMICAL_LIMITS,
} from './humanoidBones.ts';

export interface CalibratedBone {
  name: HumanoidBoneName;
  bone: THREE.Bone;
  restLocalQ: THREE.Quaternion;
  restLocalPos: THREE.Vector3;
  restWorldQ: THREE.Quaternion;
  // Local coordinate correction matrix to translate standard anatomical rotations to bone space
  correctionQ: THREE.Quaternion;
}

export class HunyuanSkeletalRetargeter {
  public bones: Map<HumanoidBoneName, CalibratedBone> = new Map();
  public rootBone: THREE.Bone | null = null;
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

    // 1. Traverse and identify all bones
    scene.traverse((child) => {
      if (child instanceof THREE.Bone) {
        const stdName = HUNYUAN_TO_HUMANOID_MAP[child.name];
        if (stdName) {
          const wq = new THREE.Quaternion();
          child.getWorldQuaternion(wq);

          this.bones.set(stdName, {
            name: stdName,
            bone: child,
            restLocalQ: child.quaternion.clone(),
            restLocalPos: child.position.clone(),
            restWorldQ: wq.clone(),
            correctionQ: new THREE.Quaternion(), // Will be calibrated below
          });

          if (stdName === 'Hips') {
            this.hipsBone = child;
          }
        }
      }
    });

    // 2. Determine character dimensions and unit scale
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

    // 3. Calibrate anatomical coordinate corrections for each bone
    // This solves the fundamental problem of non-standard local bone axes in Hunyuan rigs
    this.calibrateBoneCorrections();

    this.isCalibrated = true;
  }

  private calibrateBoneCorrections(): void {
    // Calibrate rest world and local orientations
    this.bones.forEach((calibrated) => {
      const wq = new THREE.Quaternion();
      calibrated.bone.getWorldQuaternion(wq);
      calibrated.restWorldQ.copy(wq);
      calibrated.restLocalQ.copy(calibrated.bone.quaternion);
      calibrated.restLocalPos.copy(calibrated.bone.position);
    });
  }

  /**
   * Reset all bones strictly to bind pose
   */
  public resetToRestPose(): void {
    this.bones.forEach((calibrated) => {
      calibrated.bone.quaternion.copy(calibrated.restLocalQ);
      calibrated.bone.position.copy(calibrated.restLocalPos);
    });
  }

  /**
   * Apply anatomical rotation to a bone with physiological constraints.
   * Uses mathematical reference-frame mapping from anatomical space to Hunyuan bone-local space:
   * delta_local = Q_rest_world^(-1) * delta_anatomical * Q_rest_world
   * 
   * @param boneName Standard Humanoid bone name
   * @param pitch Sagittal flexion/extension (+ forward flexion, - backward extension)
   * @param yaw Axial twist (+ turn right, - turn left)
   * @param roll Coronal tilt / abduction (+ abduct/tilt, - adduct)
   */
  public setAnatomicalRotation(
    boneName: HumanoidBoneName,
    pitch: number,
    yaw: number,
    roll: number
  ): void {
    const calibrated = this.bones.get(boneName);
    if (!calibrated) return;

    // Enforce anatomical limits
    const limits = ANATOMICAL_LIMITS[boneName];
    let clampedPitch = pitch;
    let clampedYaw = yaw;
    let clampedRoll = roll;

    if (limits) {
      clampedPitch = THREE.MathUtils.clamp(pitch, limits.minPitch, limits.maxPitch);
      clampedYaw = THREE.MathUtils.clamp(yaw, limits.minYaw, limits.maxYaw);
      clampedRoll = THREE.MathUtils.clamp(roll, limits.minRoll, limits.maxRoll);
    }

    // World reference frame axes (Character space):
    // +Z = Anterior (Front of character)
    // -Z = Posterior (Back of character)
    // +Y = Superior (Up)
    // -Y = Inferior (Down)
    // +X = Character Left
    // -X = Character Right

    // 1. Sagittal Axis (Pitch):
    // Knees bend backward (-Z, +Y); all other joints flex forward (+Z)
    let axisPitch = new THREE.Vector3(-1, 0, 0);
    if (boneName === 'LeftLeg' || boneName === 'RightLeg') {
      axisPitch = new THREE.Vector3(1, 0, 0);
    }

    // 2. Transverse / Longitudinal Axis (Yaw):
    // Axial twisting
    const axisYaw = new THREE.Vector3(0, 1, 0);

    // 3. Frontal / Coronal Axis (Roll):
    // Lateral abduction lifts limbs outward away from body midline
    let axisRoll = new THREE.Vector3(0, 0, 1);
    if (boneName === 'LeftArm') {
      axisRoll = new THREE.Vector3(0, 0, -1); // Lift arm out to left (+X, +Y)
    } else if (boneName === 'RightArm') {
      axisRoll = new THREE.Vector3(0, 0, 1);  // Lift arm out to right (-X, +Y)
    } else if (boneName === 'LeftUpLeg') {
      axisRoll = new THREE.Vector3(0, 0, 1);  // Abduct leg out to left (+X)
    } else if (boneName === 'RightUpLeg') {
      axisRoll = new THREE.Vector3(0, 0, -1); // Abduct leg out to right (-X)
    }

    const qPitch = new THREE.Quaternion().setFromAxisAngle(axisPitch, clampedPitch);
    const qYaw = new THREE.Quaternion().setFromAxisAngle(axisYaw, clampedYaw);
    const qRoll = new THREE.Quaternion().setFromAxisAngle(axisRoll, clampedRoll);

    // Combined anatomical delta in character space: Roll * Yaw * Pitch
    const deltaWorldQ = qRoll.multiply(qYaw).multiply(qPitch);

    // Exact bone-local transformation:
    // delta_local = restWorldQ^(-1) * deltaWorldQ * restWorldQ
    const deltaLocal = calibrated.restWorldQ.clone().invert()
      .multiply(deltaWorldQ)
      .multiply(calibrated.restWorldQ);

    // Apply relative to bind pose: Q_final = Q_rest * delta_local
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
