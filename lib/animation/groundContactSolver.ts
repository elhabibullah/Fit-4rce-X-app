import * as THREE from 'three';
import { HumanoidBoneName } from './humanoidBones.ts';
import { CalibratedBone, HunyuanSkeletalRetargeter } from './skeletalRetargeter.ts';
import { ContactConstraints, StartingPosture } from './exerciseDefinitions.ts';

export interface SolvedGroundContact {
  hipsElevationAdjust: number; // upward/downward translation needed to keep feet/hands grounded on podium
  leftFootGrounded: boolean;
  rightFootGrounded: boolean;
  leftHandFlat: boolean;
  rightHandFlat: boolean;
}

/**
 * GroundContactSolver: Enforces physical ground constraints and ensures
 * the character stays firmly anchored to the floor podium across all exercises
 * (Squats, Lunges, Pushups, Planks, Martial Arts).
 */
export class GroundContactSolver {
  private tmpVec = new THREE.Vector3();
  private tmpPalmDown = new THREE.Vector3(0, -1, 0);
  private tmpInvParentWQ = new THREE.Quaternion();
  private tmpParentWQ = new THREE.Quaternion();

  /**
   * Evaluates the skeleton in character space and computes the elevation
   * compensation so the character is firmly anchored to the floor/podium
   * and palms are completely flat on the floor for floor exercises.
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

    // 1. IN PRONE / FLOOR EXERCISES (Pushups, Planks, Floor Core):
    // Align hands completely FLAT on the floor (palms facing down)
    if (posture === 'prone' || Math.abs(bodyProneAngle) > 0.3) {
      if (constraints.handOrientation === 'flat_floor' || true) {
        this.orientHandFlatToFloor(retargeter, true);
        this.orientHandFlatToFloor(retargeter, false);
        result.leftHandFlat = true;
        result.rightHandFlat = true;
      }

      // Orient toes to contact floor naturally
      if (leftToe) this.orientFootForFloorContact(retargeter, leftToe);
      if (rightToe) this.orientFootForFloorContact(retargeter, rightToe);

      // Target podium surface in studio space is Y = -0.889
      const podiumSurfaceY = -0.889;
      let lowestY = Infinity;
      const handThickness = 0.035;
      const toeThickness = 0.040;
      if (leftHand) {
        leftHand.bone.getWorldPosition(this.tmpVec);
        lowestY = Math.min(lowestY, this.tmpVec.y - handThickness);
      }
      if (rightHand) {
        rightHand.bone.getWorldPosition(this.tmpVec);
        lowestY = Math.min(lowestY, this.tmpVec.y - handThickness);
      }
      const contactToes = [leftToe || leftFoot, rightToe || rightFoot];
      contactToes.forEach((t) => {
        if (t) {
          t.bone.getWorldPosition(this.tmpVec);
          lowestY = Math.min(lowestY, this.tmpVec.y - toeThickness);
        }
      });

      if (lowestY !== Infinity) {
        const deltaWorldY = podiumSurfaceY - lowestY;
        if (Math.abs(deltaWorldY) > 0.001) {
          result.hipsElevationAdjust = deltaWorldY;
        }
      }

      return result;
    }

    // 2. IN STANDING / SQUATTING / LUNGING EXERCISES:
    // Ensure feet do NOT float in the air during knee flexions (Squats, Lunges, Horse stance)
    let lowestFootY = Infinity;
    const feetBones = [leftFoot, rightFoot, leftToe, rightToe];
    feetBones.forEach((fb) => {
      if (fb) {
        fb.bone.getWorldPosition(this.tmpVec);
        if (this.tmpVec.y < lowestFootY) lowestFootY = this.tmpVec.y;
      }
    });

    const podiumSurfaceY = -0.889;
    if (lowestFootY !== Infinity) {
      // Offset from ankle/toe to bottom of sole
      const footSoleY = lowestFootY - retargeter.anklePodiumClearance;
      const deltaWorldY = podiumSurfaceY - footSoleY;
      if (Math.abs(deltaWorldY) > 0.001) {
        result.hipsElevationAdjust = deltaWorldY;
      }
    }

    return result;
  }

  /**
   * Sets the hand bone so the PALM is 100% FLAT on the floor (palms facing down).
   *
   * Kinematic derivation for android_rigged.glb:
   * - Local +Z is dorsal normal -> points UP (0, 1, 0)
   * - Local -Z is palmar surface -> points DOWN (0, -1, 0) into floor
   * - Local +Y is fingers -> points forward (inwardX, 0, forwardZ)
   * - Local +X is orthogonal side -> (fingers x normal)
   */
  public orientHandFlatToFloor(retargeter: HunyuanSkeletalRetargeter, isLeft: boolean): void {
    const boneName: HumanoidBoneName = isLeft ? 'LeftHand' : 'RightHand';
    const calibrated = retargeter.bones.get(boneName);
    if (!calibrated) return;

    // Dorsal normal points UP to ceiling (0, 1, 0) so PALMAR surface points DOWN into floor
    const dorsalUp = this.tmpPalmDown.set(0, 1, 0);
    // Fingers point forward with natural anatomical slight inward rotation (~8.5 degrees)
    const inward = isLeft ? 0.15 : -0.15;
    const fingersForward = new THREE.Vector3(inward, 0, 1).normalize();

    // Build orthonormal basis:
    // local Y -> fingersForward
    // local Z -> dorsalUp (so palm faces down!)
    // local X -> cross(Y, Z)
    const handY = fingersForward.clone();
    const handZ = dorsalUp.clone();
    const handX = new THREE.Vector3().crossVectors(handY, handZ).normalize();
    handY.crossVectors(handZ, handX).normalize();

    const rotMatrix = new THREE.Matrix4().makeBasis(handX, handY, handZ);
    const targetWorldQ = new THREE.Quaternion().setFromRotationMatrix(rotMatrix);

    // Convert target world orientation to local quaternion relative to parent forearm
    const parentObj = calibrated.bone.parent;
    if (parentObj) {
      parentObj.getWorldQuaternion(this.tmpParentWQ);
      this.tmpInvParentWQ.copy(this.tmpParentWQ).invert();
      calibrated.bone.quaternion.copy(this.tmpInvParentWQ.multiply(targetWorldQ));
    } else {
      calibrated.bone.quaternion.copy(targetWorldQ);
    }

    calibrated.bone.updateMatrixWorld(true);
  }

  /**
   * Sets the toe bone so the foot contacts the floor naturally in prone positions
   */
  private orientFootForFloorContact(retargeter: HunyuanSkeletalRetargeter, toe: CalibratedBone | undefined): void {
    if (!toe) return;
    retargeter.setAnatomicalRotation(toe.name, 0.65, 0, 0);
  }
}
