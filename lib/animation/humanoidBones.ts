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
 * Ordered list of bones so parent bones are guaranteed to be transformed before children
 */
export const TOPOLOGICAL_BONE_ORDER: HumanoidBoneName[] = [
  'Hips',
  'Spine',
  'Spine1',
  'Spine2',
  'Neck',
  'Head',
  'LeftShoulder',
  'LeftArm',
  'LeftForeArm',
  'LeftHand',
  'RightShoulder',
  'RightArm',
  'RightForeArm',
  'RightHand',
  'LeftUpLeg',
  'LeftLeg',
  'LeftFoot',
  'LeftToeBase',
  'RightUpLeg',
  'RightLeg',
  'RightFoot',
  'RightToeBase',
];

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
  // Knee: Anatomical hinge joint flexion (up to 160 deg).
  LeftLeg: {
    minPitch: THREE.MathUtils.degToRad(-5),
    maxPitch: THREE.MathUtils.degToRad(160),
    minYaw: THREE.MathUtils.degToRad(-10),
    maxYaw: THREE.MathUtils.degToRad(10),
    minRoll: THREE.MathUtils.degToRad(-10),
    maxRoll: THREE.MathUtils.degToRad(10),
  },
  RightLeg: {
    minPitch: THREE.MathUtils.degToRad(-5),
    maxPitch: THREE.MathUtils.degToRad(160),
    minYaw: THREE.MathUtils.degToRad(-10),
    maxYaw: THREE.MathUtils.degToRad(10),
    minRoll: THREE.MathUtils.degToRad(-10),
    maxRoll: THREE.MathUtils.degToRad(10),
  },
  // Elbow: 1-DOF hinge joint flexion (up to 160 deg) with natural pronation/supination.
  LeftForeArm: {
    minPitch: THREE.MathUtils.degToRad(-10),
    maxPitch: THREE.MathUtils.degToRad(160),
    minYaw: THREE.MathUtils.degToRad(-45),
    maxYaw: THREE.MathUtils.degToRad(45),
    minRoll: THREE.MathUtils.degToRad(-60),
    maxRoll: THREE.MathUtils.degToRad(60),
  },
  RightForeArm: {
    minPitch: THREE.MathUtils.degToRad(-10),
    maxPitch: THREE.MathUtils.degToRad(160),
    minYaw: THREE.MathUtils.degToRad(-45),
    maxYaw: THREE.MathUtils.degToRad(45),
    minRoll: THREE.MathUtils.degToRad(-60),
    maxRoll: THREE.MathUtils.degToRad(60),
  },
  // Spine & Spine1 & Spine2: Distributed anatomical curvature for deep hinges (deadlifts, good mornings, crunches)
  Spine: {
    minPitch: THREE.MathUtils.degToRad(-45),
    maxPitch: THREE.MathUtils.degToRad(75),
    minYaw: THREE.MathUtils.degToRad(-35),
    maxYaw: THREE.MathUtils.degToRad(35),
    minRoll: THREE.MathUtils.degToRad(-30),
    maxRoll: THREE.MathUtils.degToRad(30),
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
  // Ankle / Foot: Natural dorsiflexion (up towards shin, max 30 deg) and plantarflexion (down towards floor, max 45 deg)
  LeftFoot: {
    minPitch: THREE.MathUtils.degToRad(-45),
    maxPitch: THREE.MathUtils.degToRad(30),
    minYaw: THREE.MathUtils.degToRad(-15),
    maxYaw: THREE.MathUtils.degToRad(15),
    minRoll: THREE.MathUtils.degToRad(-15),
    maxRoll: THREE.MathUtils.degToRad(15),
  },
  RightFoot: {
    minPitch: THREE.MathUtils.degToRad(-45),
    maxPitch: THREE.MathUtils.degToRad(30),
    minYaw: THREE.MathUtils.degToRad(-15),
    maxYaw: THREE.MathUtils.degToRad(15),
    minRoll: THREE.MathUtils.degToRad(-15),
    maxRoll: THREE.MathUtils.degToRad(15),
  },
  // Wrist / Hand: Normal range of motion (flexion / extension / deviation)
  LeftHand: {
    minPitch: THREE.MathUtils.degToRad(-60),
    maxPitch: THREE.MathUtils.degToRad(60),
    minYaw: THREE.MathUtils.degToRad(-20),
    maxYaw: THREE.MathUtils.degToRad(20),
    minRoll: THREE.MathUtils.degToRad(-30),
    maxRoll: THREE.MathUtils.degToRad(30),
  },
  RightHand: {
    minPitch: THREE.MathUtils.degToRad(-60),
    maxPitch: THREE.MathUtils.degToRad(60),
    minYaw: THREE.MathUtils.degToRad(-20),
    maxYaw: THREE.MathUtils.degToRad(20),
    minRoll: THREE.MathUtils.degToRad(-30),
    maxRoll: THREE.MathUtils.degToRad(30),
  },
};
