import * as THREE from 'three';
import { HumanoidBoneName } from './humanoidBones.ts';
import { CalibratedBone, HunyuanSkeletalRetargeter } from './skeletalRetargeter.ts';
import { ContactConstraints, StartingPosture } from './exerciseDefinitions.ts';

export interface SolvedGroundContact {
  hipsElevationAdjust: number; // upward/downward translation needed to keep feet/hands grounded on podium
  pronePitchAdjust?: number;   // sagittal pitch rotation applied to align feet and hands to the floor plane
  leftFootGrounded: boolean;
  rightFootGrounded: boolean;
  leftHandFlat: boolean;
  rightHandFlat: boolean;
}

/**
 * GroundContactSolver: Enforces physical ground constraints and ensures
 * the character stays firmly anchored to the floor podium across all exercises
 * (Pushups, Planks, Squats, Lunges, Burpees, Martial Arts).
 */
export class GroundContactSolver {
  private tmpVec = new THREE.Vector3();
  private tmpVecHandL = new THREE.Vector3();
  private tmpVecHandR = new THREE.Vector3();
  private tmpVecToe = new THREE.Vector3();
  private tmpVecX = new THREE.Vector3(1, 0, 0);

  /**
   * Evaluates the skeleton in character space and computes the elevation
   * compensation and pitch alignment so the character is firmly anchored to the floor/podium
   * and palms/toes are completely flat and grounded on the floor plane.
   */
  public solveContacts(
    retargeter: HunyuanSkeletalRetargeter,
    posture: StartingPosture,
    constraints: ContactConstraints,
    bodyProneAngle: number,
    podiumSurfaceY: number = -0.889,
    hipsOffsetY: number = 0
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

    // 1. IN PRONE / CHEST-DOWN FLOOR EXERCISES (Pushups, Planks, Burpee floor phase):
    // Two-point sagittal alignment: level both hands (front) and toes (rear) to the horizontal floor plane
    if (posture === 'prone' || bodyProneAngle > 0.3) {
      if (constraints.handOrientation === 'flat_floor' || true) {
        this.orientHandFlatToFloor(retargeter, true);
        this.orientHandFlatToFloor(retargeter, false);
        result.leftHandFlat = true;
        result.rightHandFlat = true;
      }

      // Orient toes forward for natural ground contact (under foot, never bent backwards)
      if (leftToe) this.orientFootForFloorContact(retargeter, leftToe);
      if (rightToe) this.orientFootForFloorContact(retargeter, rightToe);

      const handThickness = 0.035; // Palm clearance from wrist to solid floor
      const toeClearance = 0.030;  // Ball of foot / toe clearance to solid floor

      // 1A. Evaluate current front contact (hands) and rear contact (toes)
      let handY = 0;
      let handZ = 0;
      let handCount = 0;
      if (leftHand) {
        leftHand.bone.getWorldPosition(this.tmpVecHandL);
        handY += this.tmpVecHandL.y;
        handZ += this.tmpVecHandL.z;
        handCount++;
      }
      if (rightHand) {
        rightHand.bone.getWorldPosition(this.tmpVecHandR);
        handY += this.tmpVecHandR.y;
        handZ += this.tmpVecHandR.z;
        handCount++;
      }
      if (handCount > 0) {
        handY = handY / handCount - handThickness;
        handZ = handZ / handCount;
      }

      let toeY = 0;
      let toeZ = 0;
      let toeCount = 0;
      const contactToes = [leftToe || leftFoot, rightToe || rightFoot];
      contactToes.forEach((t) => {
        if (t) {
          t.bone.getWorldPosition(this.tmpVecToe);
          toeY += this.tmpVecToe.y;
          toeZ += this.tmpVecToe.z;
          toeCount++;
        }
      });
      if (toeCount > 0) {
        toeY = toeY / toeCount - toeClearance;
        toeZ = toeZ / toeCount;
      }

      // 1B. Two-Point Sagittal Alignment: Pitch rotation around Hips (center of gravity)
      // Eliminates tilt discrepancy so both hands and feet touch the floor plane simultaneously
      if (handCount > 0 && toeCount > 0) {
        const dZ = handZ - toeZ;
        const dY = handY - toeY;
        if (Math.abs(dZ) > 0.20) {
          const pitchAdjust = Math.atan2(dY, dZ);
          // Apply pitch rotation to align sagittal plane with horizontal floor
          if (Math.abs(pitchAdjust) > 0.002) {
            const qPitch = new THREE.Quaternion().setFromAxisAngle(this.tmpVecX, pitchAdjust);
            retargeter.hipsBone?.quaternion.premultiply(qPitch);
            retargeter.hipsBone?.updateMatrixWorld(true);
            result.pronePitchAdjust = pitchAdjust;
          }
        }
      }

      // 1C. Re-evaluate lowest contact surface and snap exactly to podium surface
      // Guarantees zero penetration: neither fingertips nor toes ever penetrate below podium
      let lowestContactY = Infinity;
      if (leftHand) {
        leftHand.bone.getWorldPosition(this.tmpVec);
        lowestContactY = Math.min(lowestContactY, this.tmpVec.y - handThickness);
      }
      if (rightHand) {
        rightHand.bone.getWorldPosition(this.tmpVec);
        lowestContactY = Math.min(lowestContactY, this.tmpVec.y - handThickness);
      }
      contactToes.forEach((t) => {
        if (t) {
          t.bone.getWorldPosition(this.tmpVec);
          lowestContactY = Math.min(lowestContactY, this.tmpVec.y - toeClearance);
        }
      });

      if (Number.isFinite(lowestContactY)) {
        const deltaWorldY = podiumSurfaceY - lowestContactY;
        if (Math.abs(deltaWorldY) > 0.001) {
          result.hipsElevationAdjust = deltaWorldY;
        }
      }

      result.leftFootGrounded = true;
      result.rightFootGrounded = true;
      return result;
    }

    // 2. IN SUPINE / FACE-UP FLOOR EXERCISES (Crunch, Abdos, Glute Bridge - DOS AU SOL):
    // Anchors pelvis and sacrum stably on the podium floor without dropping hips as the upper body curls up
    if (posture === 'supine' || bodyProneAngle < -0.3) {
      const hips = retargeter.bones.get('Hips');
      if (hips) {
        hips.bone.getWorldPosition(this.tmpVec);
        // Hips / pelvis lower surface rests stably on podium mat (~0.08m radius from hip center)
        const pelvisBottomY = this.tmpVec.y - 0.08;
        const deltaWorldY = podiumSurfaceY - pelvisBottomY;
        if (Math.abs(deltaWorldY) > 0.002) {
          result.hipsElevationAdjust = deltaWorldY;
        }
      }

      result.leftFootGrounded = true;
      result.rightFootGrounded = true;
      return result;
    }

    // 3. IN STANDING / SQUATTING / LUNGING / JUMPING EXERCISES:
    // Accurately compute sole world elevation from heels and toes
    let lowestHeelY = Infinity;
    if (leftFoot) {
      leftFoot.bone.getWorldPosition(this.tmpVec);
      lowestHeelY = Math.min(lowestHeelY, this.tmpVec.y - retargeter.anklePodiumClearance);
    }
    if (rightFoot) {
      rightFoot.bone.getWorldPosition(this.tmpVec);
      lowestHeelY = Math.min(lowestHeelY, this.tmpVec.y - retargeter.anklePodiumClearance);
    }

    let lowestToeY = Infinity;
    if (leftToe) {
      leftToe.bone.getWorldPosition(this.tmpVec);
      lowestToeY = Math.min(lowestToeY, this.tmpVec.y - retargeter.toePodiumClearance);
    }
    if (rightToe) {
      rightToe.bone.getWorldPosition(this.tmpVec);
      lowestToeY = Math.min(lowestToeY, this.tmpVec.y - retargeter.toePodiumClearance);
    }

    // In grounded exercises (Squats, Stances), weight is firmly on the HEELS:
    // Anchor heels solid to the floor plane so heels NEVER lift off the ground!
    let lowestSoleY = Number.isFinite(lowestHeelY) ? lowestHeelY : lowestToeY;
    if (Number.isFinite(lowestToeY)) {
      lowestSoleY = Math.min(lowestSoleY, lowestToeY);
    }

    if (Number.isFinite(lowestSoleY)) {
      const isAirborneJump = hipsOffsetY > 0.08;
      const feetGrounded = !isAirborneJump && (constraints.leftFootGround || constraints.rightFootGround);

      if (feetGrounded) {
        // Grounded exercise (Squats, Lunges, Stances): anchor to podium with weight on heels
        const targetSole = Number.isFinite(lowestHeelY) ? lowestHeelY : lowestSoleY;
        const deltaWorldY = podiumSurfaceY - targetSole;
        if (Math.abs(deltaWorldY) > 0.001) {
          result.hipsElevationAdjust = deltaWorldY;
        }
        result.leftFootGrounded = Boolean(constraints.leftFootGround);
        result.rightFootGrounded = Boolean(constraints.rightFootGround);
      } else if (constraints.preventFloorPenetration || isAirborneJump) {
        // Airborne exercise (Jumping jacks peak, burpee vertical jump phase):
        // Allow the coach to leap into the air freely! Only clamp if foot penetrates below podium surface.
        if (lowestSoleY < podiumSurfaceY) {
          result.hipsElevationAdjust = podiumSurfaceY - lowestSoleY;
        }
      }
    }

    return result;
  }

  /**
   * Sets the hand bone so the PALM is 100% FLAT on the floor (palms facing down, fingers forward).
   */
  public orientHandFlatToFloor(retargeter: HunyuanSkeletalRetargeter, isLeft: boolean): void {
    const boneName: HumanoidBoneName = isLeft ? 'LeftHand' : 'RightHand';
    // Anatomical wrist extension puts palm flush on floor with zero joint twisting
    retargeter.setAnatomicalRotation(boneName, 1.35, 0, 0);
  }

  /**
   * Sets the toe bone so the foot contacts the floor naturally in prone positions without backward curling
   */
  private orientFootForFloorContact(retargeter: HunyuanSkeletalRetargeter, toe: CalibratedBone | undefined): void {
    if (!toe) return;
    // Set toe pitch to -0.25 so the ball of the foot and toes lay naturally flat on the floor (tucked under, never curled backwards)
    retargeter.setAnatomicalRotation(toe.name, -0.25, 0, 0);
  }
}
