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
    podiumSurfaceY: number = -0.889
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

      // Orient toes for natural ground contact
      if (leftToe) this.orientFootForFloorContact(retargeter, leftToe);
      if (rightToe) this.orientFootForFloorContact(retargeter, rightToe);

      const handThickness = 0.022; // Thickness from wrist/palm center to floor surface
      const toeClearance = retargeter.toePodiumClearance;

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
    // Anchors back, head, hips, and soles firmly on the podium floor without inversion
    if (posture === 'supine' || bodyProneAngle < -0.3) {
      let lowestContactY = Infinity;
      const spine = retargeter.bones.get('Spine') || retargeter.bones.get('Hips');
      const head = retargeter.bones.get('Head');

      // Back surface of torso
      if (spine) {
        spine.bone.getWorldPosition(this.tmpVec);
        lowestContactY = Math.min(lowestContactY, this.tmpVec.y - 0.10);
      }
      // Back of head
      if (head) {
        head.bone.getWorldPosition(this.tmpVec);
        lowestContactY = Math.min(lowestContactY, this.tmpVec.y - 0.08);
      }
      // Hips / Pelvis
      if (retargeter.hipsBone) {
        retargeter.hipsBone.getWorldPosition(this.tmpVec);
        lowestContactY = Math.min(lowestContactY, this.tmpVec.y - 0.11);
      }
      // Planted feet soles
      if (leftFoot) {
        leftFoot.bone.getWorldPosition(this.tmpVec);
        lowestContactY = Math.min(lowestContactY, this.tmpVec.y - retargeter.anklePodiumClearance);
      }
      if (rightFoot) {
        rightFoot.bone.getWorldPosition(this.tmpVec);
        lowestContactY = Math.min(lowestContactY, this.tmpVec.y - retargeter.anklePodiumClearance);
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

    if (Number.isFinite(lowestSoleY)) {
      const feetGrounded = constraints.leftFootGround || constraints.rightFootGround;

      if (feetGrounded) {
        // Grounded exercise (Squats, Lunges, Stances, Deadlifts): anchor lowest foot to podium
        const deltaWorldY = podiumSurfaceY - lowestSoleY;
        if (Math.abs(deltaWorldY) > 0.001) {
          result.hipsElevationAdjust = deltaWorldY;
        }
        result.leftFootGrounded = Boolean(constraints.leftFootGround);
        result.rightFootGrounded = Boolean(constraints.rightFootGround);
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
   * Sets the hand bone so the PALM is 100% FLAT on the floor (palms facing down, fingers forward).
   * Constructs direct world-space basis: +Y fingers forward, +Z palm facing DOWN into floor.
   */
  public orientHandFlatToFloor(retargeter: HunyuanSkeletalRetargeter, isLeft: boolean): void {
    const boneName: HumanoidBoneName = isLeft ? 'LeftHand' : 'RightHand';
    const calibrated = retargeter.bones.get(boneName);
    if (!calibrated) return;

    // Fingers point forward along floor (+Z) with natural ergonomic slight inward angle
    const inward = isLeft ? -0.10 : 0.10;
    const yDir = new THREE.Vector3(inward, 0, 0.995).normalize(); // Local +Y in world
    const zDir = new THREE.Vector3(0, -1, 0);                      // Local +Z (palm normal) points directly DOWN to floor
    const xDir = new THREE.Vector3().crossVectors(yDir, zDir).normalize();

    const basisMat = new THREE.Matrix4().makeBasis(xDir, yDir, zDir);
    const targetWorldQ = new THREE.Quaternion().setFromRotationMatrix(basisMat);

    const parent = calibrated.bone.parent;
    if (parent) {
      const pWQ = new THREE.Quaternion();
      parent.getWorldQuaternion(pWQ);
      calibrated.bone.quaternion.copy(pWQ.invert().multiply(targetWorldQ));
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
