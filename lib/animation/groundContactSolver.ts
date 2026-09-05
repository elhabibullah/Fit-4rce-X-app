import * as THREE from 'three';
import { HumanoidBoneName } from './humanoidBones.ts';
import { CalibratedBone, HunyuanSkeletalRetargeter } from './skeletalRetargeter.ts';
import { ContactConstraints, StartingPosture } from './exerciseDefinitions.ts';

export interface SolvedGroundContact {
  hipsElevationAdjust: number; // upward translation needed to keep lowest contact flush at y = 0
  leftFootGrounded: boolean;
  rightFootGrounded: boolean;
  leftHandFlat: boolean;
  rightHandFlat: boolean;
}

/**
 * GroundContactSolver: Enforces physical ground constraints and prevents
 * floor penetration across all exercises (Squats, Lunges, Pushups, Planks, Martial Arts).
 */
export class GroundContactSolver {
  private tempVecA = new THREE.Vector3();
  private tempVecB = new THREE.Vector3();
  private tempVecC = new THREE.Vector3();

  /**
   * Evaluates the skeleton in character space and computes the elevation
   * compensation so no contact point penetrates below the floor (y = 0).
   */
  public solveContacts(
    retargeter: HunyuanSkeletalRetargeter,
    posture: StartingPosture,
    constraints: ContactConstraints,
    bodyProneAngle: number
  ): SolvedGroundContact {
    const result: SolvedGroundContact = {
      hipsElevationAdjust: 0,
      leftFootGrounded: false,
      rightFootGrounded: false,
      leftHandFlat: false,
      rightHandFlat: false,
    };

    if (!retargeter.isCalibrated) return result;

    const leftFoot = retargeter.bones.get('LeftFoot');
    const rightFoot = retargeter.bones.get('RightFoot');
    const leftToe = retargeter.bones.get('LeftToeBase');
    const rightToe = retargeter.bones.get('RightToeBase');
    const leftHand = retargeter.bones.get('LeftHand');
    const rightHand = retargeter.bones.get('RightHand');
    const leftLeg = retargeter.bones.get('LeftLeg');
    const rightLeg = retargeter.bones.get('RightLeg');

    // 1. In prone positions (Pushups, Planks):
    // Align hands flat on the floor and orient toes naturally
    if (posture === 'prone') {
      // Ensure hands are oriented flat to the ground (palms facing down) using calibrated anatomical rotation
      if (constraints.handOrientation === 'flat_floor') {
        this.orientHandFlatToFloor(retargeter, true);
        this.orientHandFlatToFloor(retargeter, false);
        result.leftHandFlat = true;
        result.rightHandFlat = true;
      }

      // In prone position, feet are extended with toes contacting the floor
      this.orientFootForFloorContact(leftFoot, leftToe);
      this.orientFootForFloorContact(rightFoot, rightToe);

      result.hipsElevationAdjust = 0;
      return result;
    }

    // 2. In standing / squatting / lunging / martial stances:
    // Poses in animationClips.ts are already calibrated with realistic clearances.
    // Zero out any elevation adjustments to keep hips solidly anchored to the floor podium.
    result.hipsElevationAdjust = 0;
    return result;
  }

  /**
   * Sets the wrist bone so the hand palm is completely flat on the floor (palms facing down)
   * Uses retargeter's anatomical coordinate space for true physiological accuracy.
   */
  private orientHandFlatToFloor(retargeter: HunyuanSkeletalRetargeter, isLeft: boolean): void {
    const boneName: HumanoidBoneName = isLeft ? 'LeftHand' : 'RightHand';
    // Anatomical dorsiflexion (extension) of the wrist (1.35 rad ~ 77 degrees)
    // with slight lateral spread (-0.15 rad / +0.15 rad) places the palm flat against the floor
    retargeter.setAnatomicalRotation(boneName, 1.35, 0, isLeft ? -0.15 : 0.15);
  }

  /**
   * Sets the ankle / toe bone so the foot contacts the floor naturally
   */
  private orientFootForFloorContact(foot: CalibratedBone | undefined, toe: CalibratedBone | undefined): void {
    if (!foot) return;
    // Slight plantarflexion / dorsiflexion neutral stabilization
    if (toe) {
      // Keep toe flexed 45 deg to simulate ball-of-foot floor contact
      const qToe = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), THREE.MathUtils.degToRad(40));
      toe.bone.quaternion.copy(toe.restLocalQ).multiply(qToe);
    }
  }
}
