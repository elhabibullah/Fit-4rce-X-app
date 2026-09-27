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
    // Align front contact (hands) and rear contact (toes) flat on the horizontal floor plane
    if (posture === 'prone' || bodyProneAngle > 0.3) {
      result.leftHandFlat = true;
      result.rightHandFlat = true;

      const handThickness = 0.035; // Palm clearance from wrist to solid floor
      const toeClearance = 0.025;  // Ball of foot / toe clearance to solid floor

      // 1A. Evaluate current front contact (hands) and rear contact (toes)
      let handY = 0;
      let handCount = 0;
      if (leftHand) {
        leftHand.bone.getWorldPosition(this.tmpVecHandL);
        handY += this.tmpVecHandL.y;
        handCount++;
      }
      if (rightHand) {
        rightHand.bone.getWorldPosition(this.tmpVecHandR);
        handY += this.tmpVecHandR.y;
        handCount++;
      }
      if (handCount > 0) {
        handY = handY / handCount - handThickness;
      }

      let toeY = 0;
      let toeCount = 0;
      const contactToes = [leftToe || leftFoot, rightToe || rightFoot];
      contactToes.forEach((t) => {
        if (t) {
          t.bone.getWorldPosition(this.tmpVecToe);
          toeY += this.tmpVecToe.y;
          toeCount++;
        }
      });
      if (toeCount > 0) {
        toeY = toeY / toeCount - toeClearance;
      }

      // 1B. Re-evaluate lowest contact surface and snap exactly to podium surface
      // Guarantees zero penetration: neither fingertips nor toes ever penetrate below podium
      let lowestContactY = Infinity;
      if (handCount > 0) {
        lowestContactY = Math.min(lowestContactY, handY);
      }
      if (toeCount > 0) {
        lowestContactY = Math.min(lowestContactY, toeY);
      }

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
    // Smoothly prevents sinking below the floor while letting glute bridge hips lift freely!
    if (posture === 'supine' || bodyProneAngle < -0.3) {
      let lowestPointY = Infinity;
      const hips = retargeter.bones.get('Hips');
      const spine = retargeter.bones.get('Spine');
      const spine2 = retargeter.bones.get('Spine2');

      const supineBones = [hips, spine, spine2, leftFoot, rightFoot];
      supineBones.forEach((b) => {
        if (b) {
          b.bone.getWorldPosition(this.tmpVec);
          const clearance = (b === leftFoot || b === rightFoot) ? retargeter.anklePodiumClearance : 0.08;
          lowestPointY = Math.min(lowestPointY, this.tmpVec.y - clearance);
        }
      });

      if (Number.isFinite(lowestPointY)) {
        const deltaWorldY = podiumSurfaceY - lowestPointY;
        if (deltaWorldY > 0.001) {
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
   * Sets the hand bone so the PALM is natural and flat on the floor (palms facing down, fingers forward).
   */
  public orientHandFlatToFloor(retargeter: HunyuanSkeletalRetargeter, isLeft: boolean): void {
    const boneName: HumanoidBoneName = isLeft ? 'LeftHand' : 'RightHand';
    // Natural anatomical wrist alignment resting flat on floor without twisting
    retargeter.setAnatomicalRotation(boneName, 0.05, 0, 0);
  }

  /**
   * Sets the toe bone so the foot contacts the floor naturally in prone positions without backward curling
   */
  private orientFootForFloorContact(retargeter: HunyuanSkeletalRetargeter, toe: CalibratedBone | undefined): void {
    if (!toe) return;
    // Keep toes tucked forward under the ball of the foot (never curled backwards)
    retargeter.setAnatomicalRotation(toe.name, 0.0, 0, 0);
  }
}
