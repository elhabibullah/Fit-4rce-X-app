import * as THREE from 'three';
import {
  FilesetResolver,
  PoseLandmarker,
  HandLandmarker,
  DrawingUtils,
  PoseLandmarkerResult,
  HandLandmarkerResult,
} from '@mediapipe/tasks-vision';

/**
 * Universal BoneMap for Hunyuan 3D Models (Sifu Abdelwahid & Cyborg F4X)
 * Exactly maps the hierarchical bones of the Hunyuan rig.
 */
export interface HunyuanBoneMap {
  faceMesh?: string;
  head: string;
  hips: string;
  neck: string;
  torso: string;
  spine1?: string;
  spine2?: string;
  shoulderL?: string;
  armL: string;
  forearmL: string;
  handL: string;
  shoulderR?: string;
  armR: string;
  forearmR: string;
  handR: string;
  thighL: string;
  shinL: string;
  footL: string;
  toesL: string;
  thighR: string;
  shinR: string;
  footR: string;
  toesR: string;
}

export const DEFAULT_HUNYUAN_BONE_MAP: HunyuanBoneMap = {
  hips: 'Hips',
  torso: 'Spine',
  spine1: 'Spine1',
  spine2: 'Spine2',
  neck: 'Neck',
  head: 'Head',
  shoulderL: 'LeftShoulder',
  armL: 'LeftArm',
  forearmL: 'LeftForeArm',
  handL: 'LeftHand',
  shoulderR: 'RightShoulder',
  armR: 'RightArm',
  forearmR: 'RightForeArm',
  handR: 'RightHand',
  thighL: 'LeftUpLeg',
  shinL: 'LeftLeg',
  footL: 'LeftFoot',
  toesL: 'LeftToeBase',
  thighR: 'RightUpLeg',
  shinR: 'RightLeg',
  footR: 'RightFoot',
  toesR: 'RightToeBase',
};

export interface PuppeteerTrackingStats {
  fps: number;
  latencyMs: number;
  isPoseDetected: boolean;
  isHandsDetected: boolean;
  detectedJointsCount: number;
  hipsHeightDelta: number;
  detectedPosture: 'standing' | 'squat' | 'pushup' | 'lunge' | 'ground';
  bodyPitchDeg: number;
}

/**
 * Robust bone lookup supporting namespace prefixes, case-insensitivity, and dots/colons
 */
function findBoneByName(root: THREE.Object3D, name: string): THREE.Bone | null {
  if (!name) return null;
  const clean = name.replace(/[.:_]/g, '').toLowerCase();
  let result: THREE.Bone | null = null;

  root.traverse((child) => {
    if (result) return;
    const isBone =
      Boolean((child as any).isBone) ||
      child instanceof THREE.Bone ||
      child.type === 'Bone';
    if (isBone) {
      const cName = child.name.replace(/[.:_]/g, '').toLowerCase();
      if (cName === clean || cName.endsWith(clean)) {
        result = child as THREE.Bone;
      }
    }
  });

  return result;
}

/**
 * Core mathematical retargeting solver:
 * Given a bone's resting direction and lateral pole in world space,
 * computes the exact world rotation taking the rest segment into the live tracking segment,
 * with twist alignment around the tracking segment.
 */
function solveBoneWorldQ(
  bindDir: THREE.Vector3,
  bindPole: THREE.Vector3,
  liveDir: THREE.Vector3,
  livePole: THREE.Vector3,
  bindWorldQ: THREE.Quaternion
): THREE.Quaternion {
  const normLiveDir = liveDir.clone().normalize();
  const normBindDir = bindDir.clone().normalize();

  if (normLiveDir.lengthSq() < 0.001 || normBindDir.lengthSq() < 0.001) {
    return bindWorldQ.clone();
  }

  // 1. Aim: primary rotation aligning bind direction with live direction
  const qAim = new THREE.Quaternion().setFromUnitVectors(normBindDir, normLiveDir);

  // 2. Project transformed bind pole and live pole onto plane orthogonal to live direction
  const pTrans = bindPole.clone().applyQuaternion(qAim);
  const dotTrans = pTrans.dot(normLiveDir);
  const pTransProj = pTrans.addScaledVector(normLiveDir, -dotTrans).normalize();

  const normLivePole = livePole.clone().normalize();
  const dotLive = normLivePole.dot(normLiveDir);
  const pLiveProj = normLivePole.addScaledVector(normLiveDir, -dotLive).normalize();

  // If poles are degenerate, return aim rotation applied to bind world rotation
  if (pTransProj.lengthSq() < 0.001 || pLiveProj.lengthSq() < 0.001) {
    return new THREE.Quaternion().multiplyQuaternions(qAim, bindWorldQ);
  }

  // 3. Twist: compute angle around live direction to align roll/pole
  const cross = new THREE.Vector3().crossVectors(pTransProj, pLiveProj);
  const dot = Math.max(-1, Math.min(1, pTransProj.dot(pLiveProj)));
  const twistAngle = Math.atan2(cross.dot(normLiveDir), dot);
  const qTwist = new THREE.Quaternion().setFromAxisAngle(normLiveDir, twistAngle);

  // 4. Combined delta: twist * aim
  const deltaQ = new THREE.Quaternion().multiplyQuaternions(qTwist, qAim);

  // 5. Final world rotation = delta * bindWorld
  return new THREE.Quaternion().multiplyQuaternions(deltaQ, bindWorldQ);
}

/**
 * Structure storing rest bind transforms and references for a bone
 */
interface BoneBindData {
  bone: THREE.Bone;
  bindWorldQuat: THREE.Quaternion;
  bindWorldPos: THREE.Vector3;
  bindLocalQuat: THREE.Quaternion;
  bindLocalPos: THREE.Vector3;
  bindDir: THREE.Vector3;
  bindPole: THREE.Vector3;
}

export class HunyuanPuppeteerEngine {
  private static instance: HunyuanPuppeteerEngine | null = null;

  public poseLandmarker: PoseLandmarker | null = null;
  public handLandmarker: HandLandmarker | null = null;
  public isInitialized: boolean = false;
  public isInitializing: boolean = false;
  public initError: string | null = null;

  // Active bound rig
  private boundRig: THREE.Object3D | null = null;
  private boundBones: Partial<Record<keyof HunyuanBoneMap, THREE.Bone>> = {};
  private boneData: Map<THREE.Bone, BoneBindData> = new Map();

  // Root local rest position of Hips
  private restHipsLocalPos: THREE.Vector3 = new THREE.Vector3(0, 4.99, -0.06);

  // Calibration & Baselines
  private baselineStandingHipY: number | null = null;
  private baselineSpineLength: number | null = null;
  private userPushupBaseHipsY: number | null = null;
  public isCalibrated: boolean = false;

  // Smoothing & Tuning
  public smoothingSpeed: number = 14.0; // Responsive real-time tracking
  public mirrorMode: boolean = true;
  public enableVerticalDrive: boolean = true;

  // Live video element & drawing utils
  private drawingCanvas: HTMLCanvasElement | null = null;
  private drawingUtils: DrawingUtils | null = null;

  // Smoothed metric joints extracted from MediaPipe
  private smoothedJoints: Record<string, THREE.Vector3> = {};

  // Telemetry & stats
  public stats: PuppeteerTrackingStats = {
    fps: 0,
    latencyMs: 0,
    isPoseDetected: false,
    isHandsDetected: false,
    detectedJointsCount: 0,
    hipsHeightDelta: 0,
    detectedPosture: 'standing',
    bodyPitchDeg: 0,
  };

  private lastFpsCalcTime: number = performance.now();
  private frameCount: number = 0;

  private constructor() {}

  public static getInstance(): HunyuanPuppeteerEngine {
    if (!HunyuanPuppeteerEngine.instance) {
      HunyuanPuppeteerEngine.instance = new HunyuanPuppeteerEngine();
    }
    return HunyuanPuppeteerEngine.instance;
  }

  /**
   * Asynchronously initialize MediaPipe vision models
   */
  public async initModels(): Promise<void> {
    if (this.isInitialized || this.isInitializing) return;
    this.isInitializing = true;
    this.initError = null;

    try {
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.17/wasm'
      );

      this.poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        numPoses: 1,
        minPoseDetectionConfidence: 0.5,
        minPosePresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      try {
        this.handLandmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          numHands: 2,
          minHandDetectionConfidence: 0.5,
          minHandPresenceConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });
      } catch (handErr) {
        console.warn('HandLandmarker fallback (body tracking remains active):', handErr);
      }

      this.isInitialized = true;
    } catch (err: any) {
      console.error('MediaPipe initialization failed:', err);
      this.initError = err.message || 'MediaPipe initialization failed';
      throw err;
    } finally {
      this.isInitializing = false;
    }
  }

  /**
   * Bind the Hunyuan 3D Character Rig (Sifu Abdelwahid or Cyborg F4X)
   * Captures rest world poses, bind directions, and local offsets.
   */
  public bindHunyuanRig(rig: THREE.Object3D, boneMap: HunyuanBoneMap = DEFAULT_HUNYUAN_BONE_MAP): void {
    this.boundRig = rig;
    this.boundBones = {};
    this.boneData.clear();

    // Ensure rig transforms are up to date
    rig.updateMatrixWorld(true);

    for (const key in boneMap) {
      const slot = key as keyof HunyuanBoneMap;
      const boneName = boneMap[slot];
      if (boneName) {
        const bone = findBoneByName(rig, boneName);
        if (bone) {
          this.boundBones[slot] = bone;
        }
      }
    }

    const b = this.boundBones;
    if (b.hips) {
      this.restHipsLocalPos.copy(b.hips.position);
    }

    // Helper to capture bone bind data
    const bindBoneSegment = (
      bone: THREE.Bone | undefined,
      refChild: THREE.Object3D | undefined,
      defaultDir: THREE.Vector3,
      defaultPole: THREE.Vector3
    ) => {
      if (!bone) return;

      const bindWorldQuat = bone.getWorldQuaternion(new THREE.Quaternion());
      const bindWorldPos = bone.getWorldPosition(new THREE.Vector3());
      const bindLocalQuat = bone.quaternion.clone();
      const bindLocalPos = bone.position.clone();

      let bindDir = defaultDir.clone().normalize();
      if (refChild) {
        const childPos = refChild.getWorldPosition(new THREE.Vector3());
        const d = childPos.sub(bindWorldPos);
        if (d.lengthSq() > 0.0001) {
          bindDir = d.normalize();
        }
      }

      const bindPole = defaultPole.clone().normalize();

      this.boneData.set(bone, {
        bone,
        bindWorldQuat,
        bindWorldPos,
        bindLocalQuat,
        bindLocalPos,
        bindDir,
        bindPole,
      });
    };

    // Up directions & lateral poles in standard Hunyuan bind space
    const UP = new THREE.Vector3(0, 1, 0);
    const RIGHT = new THREE.Vector3(1, 0, 0);
    const DOWN = new THREE.Vector3(0, -1, 0);
    const FORWARD = new THREE.Vector3(0, 0, 1);

    // Torso chain: Hips -> Spine -> Spine1 -> Spine2 -> Neck -> Head
    bindBoneSegment(b.hips, b.torso, UP, RIGHT);
    bindBoneSegment(b.torso, b.spine1 || b.spine2 || b.neck, UP, RIGHT);
    if (b.spine1) bindBoneSegment(b.spine1, b.spine2 || b.neck, UP, RIGHT);
    if (b.spine2) bindBoneSegment(b.spine2, b.neck, UP, RIGHT);
    bindBoneSegment(b.neck, b.head, UP, RIGHT);
    bindBoneSegment(b.head, undefined, UP, RIGHT);

    // Left arm chain: LeftShoulder -> LeftArm -> LeftForeArm -> LeftHand
    if (b.shoulderL) bindBoneSegment(b.shoulderL, b.armL, RIGHT, UP);
    bindBoneSegment(b.armL, b.forearmL, new THREE.Vector3(0.3, -0.9, 0.1), UP);
    bindBoneSegment(b.forearmL, b.handL, new THREE.Vector3(0.2, -0.9, 0.3), UP);
    bindBoneSegment(b.handL, undefined, new THREE.Vector3(0.1, -0.9, 0.4), FORWARD);

    // Right arm chain: RightShoulder -> RightArm -> RightForeArm -> RightHand
    if (b.shoulderR) bindBoneSegment(b.shoulderR, b.armR, new THREE.Vector3(-1, 0, 0), UP);
    bindBoneSegment(b.armR, b.forearmR, new THREE.Vector3(-0.3, -0.9, 0.1), UP);
    bindBoneSegment(b.forearmR, b.handR, new THREE.Vector3(-0.2, -0.9, 0.3), UP);
    bindBoneSegment(b.handR, undefined, new THREE.Vector3(-0.1, -0.9, 0.4), FORWARD);

    // Left leg chain: LeftUpLeg -> LeftLeg -> LeftFoot -> LeftToeBase
    bindBoneSegment(b.thighL, b.shinL, DOWN, RIGHT);
    bindBoneSegment(b.shinL, b.footL, DOWN, RIGHT);
    bindBoneSegment(b.footL, b.toesL, FORWARD, UP);
    bindBoneSegment(b.toesL, undefined, FORWARD, UP);

    // Right leg chain: RightUpLeg -> RightLeg -> RightFoot -> RightToeBase
    bindBoneSegment(b.thighR, b.shinR, DOWN, RIGHT);
    bindBoneSegment(b.shinR, b.footR, DOWN, RIGHT);
    bindBoneSegment(b.footR, b.toesR, FORWARD, UP);
    bindBoneSegment(b.toesR, undefined, FORWARD, UP);

    this.baselineStandingHipY = null;
    this.userPushupBaseHipsY = null;
    this.isCalibrated = false;
  }

  /**
   * Reset calibration so next standing frame sets baseline height
   */
  public calibrateStandingPose(): void {
    this.baselineStandingHipY = null;
    this.userPushupBaseHipsY = null;
    this.isCalibrated = true;
  }

  /**
   * Process one webcam video frame and extract 3D metric joints
   */
  public predictAndSolve(
    video: HTMLVideoElement,
    timestamp: number = performance.now(),
    canvas?: HTMLCanvasElement | null
  ): void {
    if (!this.poseLandmarker || !video || video.readyState < 2) return;

    const startTime = performance.now();

    if (canvas && (!this.drawingCanvas || this.drawingCanvas !== canvas)) {
      this.drawingCanvas = canvas;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        this.drawingUtils = new DrawingUtils(ctx);
      }
    }

    try {
      this.poseLandmarker.detectForVideo(video, timestamp, (result: PoseLandmarkerResult) => {
        if (!result.landmarks || result.landmarks.length === 0) {
          this.stats.isPoseDetected = false;
          this.stats.detectedJointsCount = 0;
          return;
        }

        this.stats.isPoseDetected = true;
        const normLandmarks = result.landmarks[0];
        const worldLandmarks = result.worldLandmarks?.[0] || normLandmarks;
        this.stats.detectedJointsCount = normLandmarks.length;

        // Extract 3D metric coordinates into Three.js space (+Y up, +X right, +Z towards camera)
        this.extractMetricJoints(worldLandmarks);

        // 2D Skeleton Debug Canvas Overlay
        if (this.drawingCanvas && this.drawingUtils) {
          const ctx = this.drawingCanvas.getContext('2d');
          if (ctx) {
            ctx.clearRect(0, 0, this.drawingCanvas.width, this.drawingCanvas.height);
            this.drawingUtils.drawConnectors(normLandmarks, PoseLandmarker.POSE_CONNECTIONS, {
              color: '#00FFCC',
              lineWidth: 2,
            });
            this.drawingUtils.drawLandmarks(normLandmarks, {
              color: '#FF007F',
              lineWidth: 1,
              radius: 3,
            });
          }
        }
      });
    } catch {
      // Ignore rapid frame skip errors
    }

    // Telemetry latency & FPS
    this.stats.latencyMs = Math.round(performance.now() - startTime);
    this.frameCount++;
    const now = performance.now();
    if (now - this.lastFpsCalcTime >= 500) {
      this.stats.fps = Math.round((this.frameCount * 1000) / (now - this.lastFpsCalcTime));
      this.frameCount = 0;
      this.lastFpsCalcTime = now;
    }
  }

  /**
   * Convert MediaPipe world landmarks to Three.js coordinates with temporal smoothing
   */
  private extractMetricJoints(landmarks: any[]): void {
    const mirror = this.mirrorMode ? -1 : 1;

    const getCoord = (idx: number): THREE.Vector3 => {
      const l = landmarks[idx];
      if (!l) return new THREE.Vector3();
      // MediaPipe: -Y is up, +Z is forward/away from camera
      // Three.js: +Y is up, +Z is forward towards camera
      return new THREE.Vector3(mirror * l.x, -l.y, -l.z);
    };

    const raw: Record<string, THREE.Vector3> = {
      nose: getCoord(0),
      leftEar: getCoord(7),
      rightEar: getCoord(8),
      leftShoulder: getCoord(11),
      rightShoulder: getCoord(12),
      leftElbow: getCoord(13),
      rightElbow: getCoord(14),
      leftWrist: getCoord(15),
      rightWrist: getCoord(16),
      leftHip: getCoord(23),
      rightHip: getCoord(24),
      leftKnee: getCoord(25),
      rightKnee: getCoord(26),
      leftAnkle: getCoord(27),
      rightAnkle: getCoord(28),
      leftToes: getCoord(31),
      rightToes: getCoord(32),
    };

    // Derived anatomical centers
    raw.hips = raw.leftHip.clone().add(raw.rightHip).multiplyScalar(0.5);
    raw.shoulders = raw.leftShoulder.clone().add(raw.rightShoulder).multiplyScalar(0.5);
    raw.neck = raw.shoulders.clone().addScaledVector(raw.nose.clone().sub(raw.shoulders), 0.35);
    raw.head = raw.nose.clone();

    // Exponential Moving Average filter (alpha = 0.65) to suppress video jitter
    const alpha = 0.65;
    for (const key in raw) {
      if (!this.smoothedJoints[key]) {
        this.smoothedJoints[key] = raw[key].clone();
      } else {
        this.smoothedJoints[key].lerp(raw[key], alpha);
      }
    }
  }

  /**
   * Biomechanical Retargeting Layer:
   * Maps 3D human pose to the Hunyuan skeleton using parent-relative quaternion deltas.
   * Accurately supports push-ups, squats, lunges, and standing exercises.
   */
  public updateHunyuanBones(delta: number): void {
    if (!this.boundRig || !this.stats.isPoseDetected) return;

    const b = this.boundBones;
    const j = this.smoothedJoints;
    if (!j.hips || !j.shoulders) return;

    // 1. Biomechanical Analysis & Posture Classification
    const torsoVec = j.shoulders.clone().sub(j.hips);
    const torsoDir = torsoVec.clone().normalize();
    const chestLateral = j.leftShoulder.clone().sub(j.rightShoulder).normalize();
    const hipsLateral = j.leftHip.clone().sub(j.rightHip).normalize();
    const bodyNormal = new THREE.Vector3().crossVectors(torsoDir, chestLateral).normalize();

    // Body pitch angle relative to vertical (0 deg = standing upright, 90 deg = horizontal push-up)
    const UP = new THREE.Vector3(0, 1, 0);
    const torsoDotUp = Math.max(-1, Math.min(1, torsoDir.dot(UP)));
    const bodyPitchDeg = Math.acos(torsoDotUp) * (180 / Math.PI);
    this.stats.bodyPitchDeg = Math.round(bodyPitchDeg);

    // Prone / Push-up detection: body is horizontal (pitch > 55 deg) and chest faces ground
    const chestFacingFloor = bodyNormal.dot(UP) < 0;
    const isPushupOrProne = bodyPitchDeg > 55 && (chestFacingFloor || Math.abs(torsoDotUp) < 0.35);

    // Squat detection: torso is mostly upright (pitch < 45 deg), knee angles flexed, hips drop
    const leftKneeAngle = this.calculateJointAngle(j.leftHip, j.leftKnee, j.leftAnkle);
    const rightKneeAngle = this.calculateJointAngle(j.rightHip, j.rightKnee, j.rightAnkle);
    const avgKneeAngle = (leftKneeAngle + rightKneeAngle) * 0.5;

    if (isPushupOrProne) {
      this.stats.detectedPosture = 'pushup';
    } else if (avgKneeAngle < 125) {
      this.stats.detectedPosture = 'squat';
    } else {
      this.stats.detectedPosture = 'standing';
    }

    // 2. Compute Desired World Quaternions for every segment
    const worldWanted: Map<THREE.Bone, THREE.Quaternion> = new Map();

    const solveBone = (
      bone: THREE.Bone | undefined,
      liveDir: THREE.Vector3,
      livePole: THREE.Vector3
    ) => {
      if (!bone) return;
      const data = this.boneData.get(bone);
      if (!data) return;
      const qWanted = solveBoneWorldQ(
        data.bindDir,
        data.bindPole,
        liveDir,
        livePole,
        data.bindWorldQuat
      );
      worldWanted.set(bone, qWanted);
    };

    // A. Pelvis & Torso Chain
    // Hips aligns with live torso orientation and chest lateral pole
    solveBone(b.hips, torsoDir, chestLateral);

    // Spine distributed flexion
    solveBone(b.torso, torsoDir, chestLateral);
    if (b.spine1) solveBone(b.spine1, torsoDir, chestLateral);
    if (b.spine2) solveBone(b.spine2, torsoDir, chestLateral);

    // Neck & Head: follow gaze / neck vector
    const neckDir = j.head.clone().sub(j.neck).normalize();
    const earPole = j.leftEar.clone().sub(j.rightEar).normalize();
    solveBone(b.neck, neckDir, earPole);
    solveBone(b.head, neckDir, earPole);

    // B. Left Arm Chain
    const leftUpperArmDir = j.leftElbow.clone().sub(j.leftShoulder).normalize();
    const leftForearmDir = j.leftWrist.clone().sub(j.leftElbow).normalize();
    // Arm bend normal (elbow flex pole)
    const leftArmPole = new THREE.Vector3()
      .crossVectors(leftUpperArmDir, leftForearmDir)
      .normalize();
    const leftElbowPole = leftArmPole.lengthSq() > 0.01 ? leftArmPole : chestLateral;

    if (b.shoulderL) solveBone(b.shoulderL, chestLateral, UP);
    solveBone(b.armL, leftUpperArmDir, leftElbowPole);
    solveBone(b.forearmL, leftForearmDir, leftElbowPole);
    solveBone(b.handL, leftForearmDir, UP);

    // C. Right Arm Chain
    const rightUpperArmDir = j.rightElbow.clone().sub(j.rightShoulder).normalize();
    const rightForearmDir = j.rightWrist.clone().sub(j.rightElbow).normalize();
    const rightArmPole = new THREE.Vector3()
      .crossVectors(rightUpperArmDir, rightForearmDir)
      .normalize();
    const rightElbowPole = rightArmPole.lengthSq() > 0.01 ? rightArmPole : chestLateral;

    if (b.shoulderR) solveBone(b.shoulderR, chestLateral.clone().negate(), UP);
    solveBone(b.armR, rightUpperArmDir, rightElbowPole);
    solveBone(b.forearmR, rightForearmDir, rightElbowPole);
    solveBone(b.handR, rightForearmDir, UP);

    // D. Left Leg Chain
    const leftThighDir = j.leftKnee.clone().sub(j.leftHip).normalize();
    const leftShinDir = j.leftAnkle.clone().sub(j.leftKnee).normalize();
    const leftToesDir = j.leftToes.clone().sub(j.leftAnkle).normalize();
    const leftKneePole = hipsLateral;

    solveBone(b.thighL, leftThighDir, leftKneePole);
    solveBone(b.shinL, leftShinDir, leftKneePole);
    solveBone(b.footL, isPushupOrProne ? leftShinDir : leftToesDir, UP);
    solveBone(b.toesL, isPushupOrProne ? leftShinDir : leftToesDir, UP);

    // E. Right Leg Chain
    const rightThighDir = j.rightKnee.clone().sub(j.rightHip).normalize();
    const rightShinDir = j.rightAnkle.clone().sub(j.rightKnee).normalize();
    const rightToesDir = j.rightToes.clone().sub(j.rightAnkle).normalize();
    const rightKneePole = hipsLateral;

    solveBone(b.thighR, rightThighDir, rightKneePole);
    solveBone(b.shinR, rightShinDir, rightKneePole);
    solveBone(b.footR, isPushupOrProne ? rightShinDir : rightToesDir, UP);
    solveBone(b.toesR, isPushupOrProne ? rightShinDir : rightToesDir, UP);

    // 3. Single-Pass Hierarchical Retargeting via Parent Inverse (vmc_mixamo architecture)
    // local = inv(parentEffectiveWorld) * worldWanted
    const slerpFactor = Math.min(1.0, delta * this.smoothingSpeed);

    // Traversal list in topological parent-before-child order
    const hierarchyOrder: (THREE.Bone | undefined)[] = [
      b.hips,
      b.torso,
      b.spine1,
      b.spine2,
      b.neck,
      b.head,
      b.shoulderL,
      b.armL,
      b.forearmL,
      b.handL,
      b.shoulderR,
      b.armR,
      b.forearmR,
      b.handR,
      b.thighL,
      b.shinL,
      b.footL,
      b.toesL,
      b.thighR,
      b.shinR,
      b.footR,
      b.toesR,
    ];

    for (const bone of hierarchyOrder) {
      if (!bone) continue;
      const qWanted = worldWanted.get(bone);
      if (!qWanted) continue;

      let qTargetLocal: THREE.Quaternion;

      if (bone.parent && (bone.parent as any).isBone) {
        // Parent is a bone: compute inv(parentWorld) * wantedWorld
        const parentWorldQ = bone.parent.getWorldQuaternion(new THREE.Quaternion());
        const invParentWorldQ = parentWorldQ.clone().invert();
        qTargetLocal = new THREE.Quaternion().multiplyQuaternions(invParentWorldQ, qWanted);
      } else {
        // Root bone (Hips): relative to rig container
        const rigWorldQ = this.boundRig.getWorldQuaternion(new THREE.Quaternion());
        const invRigWorldQ = rigWorldQ.clone().invert();
        qTargetLocal = new THREE.Quaternion().multiplyQuaternions(invRigWorldQ, qWanted);
      }

      // Smooth local slerp interpolation
      bone.quaternion.slerp(qTargetLocal, slerpFactor);
      bone.updateMatrixWorld(true);
    }

    // 4. Pelvic 3D Translation (Height Modulation & Ground Alignment)
    if (this.enableVerticalDrive && b.hips) {
      const currentHipY = j.hips.y;

      if (isPushupOrProne) {
        // User is doing push-ups: character lies horizontally near floor level
        if (this.userPushupBaseHipsY === null) {
          this.userPushupBaseHipsY = currentHipY;
        }

        // Horizontal push-up floor height in model units (around 1.95)
        const pushupBaseModelY = this.restHipsLocalPos.y * 0.39;
        // User's push-up rep vertical displacement (descente / remontée)
        const repDisplacement = (currentHipY - this.userPushupBaseHipsY) * 2.2;
        const targetLocalY = Math.max(0.6, pushupBaseModelY + repDisplacement);

        b.hips.position.y = THREE.MathUtils.lerp(b.hips.position.y, targetLocalY, slerpFactor);
        this.stats.hipsHeightDelta = repDisplacement;
      } else {
        // User is standing, squatting, or lunging
        this.userPushupBaseHipsY = null;

        if (this.baselineStandingHipY === null) {
          this.baselineStandingHipY = currentHipY;
          this.baselineSpineLength = torsoVec.length();
        }

        const deltaY = currentHipY - this.baselineStandingHipY;
        this.stats.hipsHeightDelta = deltaY;

        // Model height delta scaled proportionally
        const scaleFactor = this.restHipsLocalPos.y / (this.baselineStandingHipY || 0.9);
        const targetLocalY = Math.max(
          this.restHipsLocalPos.y * 0.25,
          this.restHipsLocalPos.y + deltaY * scaleFactor * 0.85
        );

        b.hips.position.y = THREE.MathUtils.lerp(b.hips.position.y, targetLocalY, slerpFactor);
      }
    }
  }

  /**
   * Compute 3D angle at joint B given points A, B, C
   */
  private calculateJointAngle(a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3): number {
    const vBA = a.clone().sub(b).normalize();
    const vBC = c.clone().sub(b).normalize();
    const dot = Math.max(-1, Math.min(1, vBA.dot(vBC)));
    return Math.acos(dot) * (180 / Math.PI);
  }

  /**
   * Reset rig to rest pose when puppeteer mode stops
   */
  public resetRigPose(): void {
    if (!this.boundRig) return;

    for (const [bone, data] of this.boneData.entries()) {
      bone.quaternion.copy(data.bindLocalQuat);
      bone.position.copy(data.bindLocalPos);
    }

    if (this.boundBones.hips) {
      this.boundBones.hips.position.copy(this.restHipsLocalPos);
    }

    this.boundRig.updateMatrixWorld(true);
  }
}
