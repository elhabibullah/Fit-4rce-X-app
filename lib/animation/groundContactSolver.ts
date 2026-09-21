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
    // Align hands completely FLAT on the floor (palms facing down, wrist extended, not inverted)
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
      const handThickness = 0.025;
      const toeThickness = retargeter.toePodiumClearance;

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
        if (Math.abs(deltaWorldY) > 0.002) {
          result.hipsElevationAdjust = deltaWorldY;
        }
      }

      return result;
    }

    // 2. IN STANDING / SQUATTING / LUNGING / JUMPING EXERCISES:
    // Accurately compute sole world elevation from both ankles and toes
    let lowestSoleY = Infinity;
    if (leftFoot) {
      leftFoot.bone.getWorldPosition(this.tmpVec);
      lowestSoleY = Math.min(lowestSoleY, this.tmpVec.y - retargeter.anklePodiumClearance);
    }
    if (rightFoot) {
      rightFoot.bone.getWorldPosition(this.tmpVec);
      lowestSoleY = Math.min(lowestSoleY, this.tmpVec.y - retargeter.anklePodiumClearance);
    }
    if (leftToe) {
      leftToe.bone.getWorldPosition(this.tmpVec);
      lowestSoleY = Math.min(lowestSoleY, this.tmpVec.y - retargeter.toePodiumClearance);
    }
    if (rightToe) {
      rightToe.bone.getWorldPosition(this.tmpVec);
      lowestSoleY = Math.min(lowestSoleY, this.tmpVec.y - retargeter.toePodiumClearance);
    }

    const podiumSurfaceY = -0.889;
    if (lowestSoleY !== Infinity) {
      const feetGrounded = constraints.leftFootGround || constraints.rightFootGround;

      if (feetGrounded) {
        // Grounded exercise (Squats, Lunges, Stances, Deadlifts): anchor lowest foot to podium
        const deltaWorldY = podiumSurfaceY - lowestSoleY;
        if (Math.abs(deltaWorldY) > 0.002) {
          result.hipsElevationAdjust = deltaWorldY;
        }
      } else if (constraints.preventFloorPenetration) {
        // Airborne exercise (Jumps, burpee jump phase): only clamp if foot penetrates below podium
        if (lowestSoleY < podiumSurfaceY) {
          result.hipsElevationAdjust = podiumSurfaceY - lowestSoleY;
        }
      }
    }

    return result;
  }

  /**
   * Sets the hand bone so the PALM is 100% FLAT on the floor (palms facing down).
   * Uses anatomical wrist dorsiflexion without discarding bone roll, preventing reversed/inverted palms.
   */
  public orientHandFlatToFloor(retargeter: HunyuanSkeletalRetargeter, isLeft: boolean): void {
    const boneName: HumanoidBoneName = isLeft ? 'LeftHand' : 'RightHand';
    const calibrated = retargeter.bones.get(boneName);
    if (!calibrated) return;

    // Wrist extension / dorsiflexion: pitch 1.35 rad (approx 77 deg), fingers pointing forward with natural slight inward angle
    retargeter.setAnatomicalRotation(boneName, 1.35, isLeft ? 0.08 : -0.08, isLeft ? -0.08 : 0.08);
  }

  /**
   * Sets the toe bone so the foot contacts the floor naturally in prone positions
   */
  private orientFootForFloorContact(retargeter: HunyuanSkeletalRetargeter, toe: CalibratedBone | undefined): void {
    if (!toe) return;
    retargeter.setAnatomicalRotation(toe.name, 0.65, 0, 0);
  }
}
