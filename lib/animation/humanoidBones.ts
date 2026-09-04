import * as THREE from 'three';

/**
 * Universal Humanoid Bone Standard Names (Mixamo / glTF Humanoid compatible)
 */
export type HumanoidBoneName =
  | 'Hips'
  | 'Spine'
  | 'Spine1'
  | 'Spine2'
  | 'Neck'
  | 'Head'
  | 'LeftShoulder'
  | 'LeftArm'
  | 'LeftForeArm'
  | 'LeftHand'
  | 'RightShoulder'
  | 'RightArm'
  | 'RightForeArm'
  | 'RightHand'
  | 'LeftUpLeg'
  | 'LeftLeg'
  | 'LeftFoot'
  | 'LeftToeBase'
  | 'RightUpLeg'
  | 'RightLeg'
  | 'RightFoot'
  | 'RightToeBase';

/**
 * Mapping table from Hunyuan 3D character bone names to Humanoid Standard
 */
export const HUNYUAN_TO_HUMANOID_MAP: Record<string, HumanoidBoneName> = {
  Hips: 'Hips',
  Spine: 'Spine',
  Spine1: 'Spine1',
  Spine2: 'Spine2',
  Neck: 'Neck',
  Head: 'Head',
  LeftShoulder: 'LeftShoulder',
  LeftArm: 'LeftArm',
  LeftForeArm: 'LeftForeArm',
  LeftHand: 'LeftHand',
  RightShoulder: 'RightShoulder',
  RightArm: 'RightArm',
  RightForeArm: 'RightForeArm',
  RightHand: 'RightHand',
  LeftUpLeg: 'LeftUpLeg',
  LeftLeg: 'LeftLeg',
  LeftFoot: 'LeftFoot',
  LeftToeBase: 'LeftToeBase',
  RightUpLeg: 'RightUpLeg',
  RightLeg: 'RightLeg',
  RightFoot: 'RightFoot',
  RightToeBase: 'RightToeBase',
};

/**
 * Skeletal hierarchy child-to-parent relationships
 */
export const HUMANOID_HIERARCHY: Record<HumanoidBoneName, HumanoidBoneName | null> = {
  Hips: null,
  Spine: 'Hips',
  Spine1: 'Spine',
  Spine2: 'Spine1',
  Neck: 'Spine2',
  Head: 'Neck',
  LeftShoulder: 'Spine2',
  LeftArm: 'LeftShoulder',
  LeftForeArm: 'LeftArm',
  LeftHand: 'LeftForeArm',
  RightShoulder: 'Spine2',
  RightArm: 'RightShoulder',
  RightForeArm: 'RightArm',
  RightHand: 'RightForeArm',
  LeftUpLeg: 'Hips',
  LeftLeg: 'LeftUpLeg',
  LeftFoot: 'LeftLeg',
  LeftToeBase: 'LeftFoot',
  RightUpLeg: 'Hips',
  RightLeg: 'RightUpLeg',
  RightFoot: 'RightLeg',
  RightToeBase: 'RightFoot',
};

/**
 * Strict anatomical physiological ranges (in radians)
 */
export interface JointLimit {
  minPitch: number; // Sagittal flexion / extension (X)
  maxPitch: number;
  minYaw: number;   // Transverse rotation / twist (Y)
  maxYaw: number;
  minRoll: number;  // Coronal abduction / adduction (Z)
  maxRoll: number;
}

export const ANATOMICAL_LIMITS: Partial<Record<HumanoidBoneName, JointLimit>> = {
  // Knee: Strict 1-degree of freedom hinge joint.
  // Can only bend backwards (flexion: 0 to 145 deg). Absolutely NO hyperextension (< 0) and minimal axial twist.
  LeftLeg: {
    minPitch: 0.0,
    maxPitch: THREE.MathUtils.degToRad(145),
    minYaw: THREE.MathUtils.degToRad(-5),
    maxYaw: THREE.MathUtils.degToRad(5),
    minRoll: THREE.MathUtils.degToRad(-5),
    maxRoll: THREE.MathUtils.degToRad(5),
  },
  RightLeg: {
    minPitch: 0.0,
    maxPitch: THREE.MathUtils.degToRad(145),
    minYaw: THREE.MathUtils.degToRad(-5),
    maxYaw: THREE.MathUtils.degToRad(5),
    minRoll: THREE.MathUtils.degToRad(-5),
    maxRoll: THREE.MathUtils.degToRad(5),
  },
  // Elbow: Strict 1-DOF hinge joint. Flexion 0 to 140 deg.
  LeftForeArm: {
    minPitch: 0.0,
    maxPitch: THREE.MathUtils.degToRad(140),
    minYaw: THREE.MathUtils.degToRad(-20),
    maxYaw: THREE.MathUtils.degToRad(20),
    minRoll: THREE.MathUtils.degToRad(-10),
    maxRoll: THREE.MathUtils.degToRad(10),
  },
  RightForeArm: {
    minPitch: 0.0,
    maxPitch: THREE.MathUtils.degToRad(140),
    minYaw: THREE.MathUtils.degToRad(-20),
    maxYaw: THREE.MathUtils.degToRad(20),
    minRoll: THREE.MathUtils.degToRad(-10),
    maxRoll: THREE.MathUtils.degToRad(10),
  },
  // Spine & Spine1 & Spine2: Distributed anatomical curvature
  Spine: {
    minPitch: THREE.MathUtils.degToRad(-30),
    maxPitch: THREE.MathUtils.degToRad(45),
    minYaw: THREE.MathUtils.degToRad(-25),
    maxYaw: THREE.MathUtils.degToRad(25),
    minRoll: THREE.MathUtils.degToRad(-20),
    maxRoll: THREE.MathUtils.degToRad(20),
  },
  Spine1: {
    minPitch: THREE.MathUtils.degToRad(-20),
    maxPitch: THREE.MathUtils.degToRad(35),
    minYaw: THREE.MathUtils.degToRad(-20),
    maxYaw: THREE.MathUtils.degToRad(20),
    minRoll: THREE.MathUtils.degToRad(-15),
    maxRoll: THREE.MathUtils.degToRad(15),
  },
  Spine2: {
    minPitch: THREE.MathUtils.degToRad(-20),
    maxPitch: THREE.MathUtils.degToRad(30),
    minYaw: THREE.MathUtils.degToRad(-20),
    maxYaw: THREE.MathUtils.degToRad(20),
    minRoll: THREE.MathUtils.degToRad(-15),
    maxRoll: THREE.MathUtils.degToRad(15),
  },
};
