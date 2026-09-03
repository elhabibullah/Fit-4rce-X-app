import React, { Suspense, useMemo, useEffect, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, useFBX, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';
import { Sun, Moon } from 'lucide-react';
import { COACH_MODEL_URL } from '../../lib/constants.ts';

// Multi-language exercise name resolver for Hunyuan biomechanical animations
export type ExerciseCategory = 'squat' | 'pushup' | 'jack' | 'lunge' | 'boxing' | 'plank' | 'idle';

export const getExerciseType = (name?: string): ExerciseCategory => {
  if (!name) return 'idle';
  const ex = name.toLowerCase();

  // 1. Jumping Jacks / Cardio / Sauts / Corde
  if (
    ex.includes('jack') || ex.includes('saut') || ex.includes('jump') ||
    ex.includes('skipping') || ex.includes('rope') || ex.includes('corde') ||
    ex.includes('burpee') || ex.includes('hiit') || ex.includes('hop') ||
    ex.includes('climb') || ex.includes('mountain') || ex.includes('course') ||
    ex.includes('foulée') || ex.includes('sprint')
  ) {
    return 'jack';
  }

  // 2. Push-ups / Pompes / Bench Press / Développé
  if (
    ex.includes('push') || ex.includes('pump') || ex.includes('pompe') ||
    ex.includes('press-up') || ex.includes('pressup') || ex.includes('appui') ||
    ex.includes('bench') || ex.includes('développé') || ex.includes('developpe')
  ) {
    return 'pushup';
  }

  // 3. Lunges / Fentes
  if (
    ex.includes('lunge') || ex.includes('fente') || ex.includes('split squat') ||
    ex.includes('zancada') || ex.includes('afundo')
  ) {
    return 'lunge';
  }

  // 4. Squats / Cuisses / Jambes
  if (
    ex.includes('squat') || ex.includes('cuisse') || ex.includes('jambe') ||
    ex.includes('flexion') || ex.includes('quad') || ex.includes('glute') ||
    ex.includes('fessier') || ex.includes('chaise') || ex.includes('chair') ||
    ex.includes('sentadilla') || ex.includes('agachamento') || ex.includes('leg')
  ) {
    return 'squat';
  }

  // 5. Boxing / Cardio Combat / Punches
  if (
    ex.includes('punch') || ex.includes('boxe') || ex.includes('jab') ||
    ex.includes('cross') || ex.includes('crochet') || ex.includes('uppercut') ||
    ex.includes('combat') || ex.includes('frappe') || ex.includes('tricep') ||
    ex.includes('bicep') || ex.includes('bras')
  ) {
    return 'boxing';
  }

  // 6. Plank / Gainage / Core
  if (
    ex.includes('plank') || ex.includes('gainage') || ex.includes('planche') ||
    ex.includes('abdo') || ex.includes('core') || ex.includes('crunch') ||
    ex.includes('ventre') || ex.includes('hollow') || ex.includes('sit-up')
  ) {
    return 'plank';
  }

  return 'idle';
};

// World Axes for Hunyuan 3D Rig
const WORLD_X = new THREE.Vector3(1, 0, 0); // Sagittal axis (pitch: lean forward/back, knee bend, elbow flex)
const WORLD_Y = new THREE.Vector3(0, 1, 0); // Vertical axis (yaw: head turn, torso twist)
const WORLD_Z = new THREE.Vector3(0, 0, 1); // Coronal axis (roll: arm abduction, leg abduction)

// Loading Holographic Ring
const MatrixStudioLoader: React.FC<{ isDark?: boolean }> = ({ isDark }) => {
  const ringRef = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (ringRef.current) {
      ringRef.current.rotation.z = state.clock.getElapsedTime() * 1.5;
    }
  });

  return (
    <group position={[0, -0.92, 0]}>
      <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.5, 0.55, 48]} />
        <meshBasicMaterial color={isDark ? '#c084fc' : '#a855f7'} transparent opacity={0.7} side={THREE.DoubleSide} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.48, 32]} />
        <meshBasicMaterial color="#ec4899" transparent opacity={0.15} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
};

// High-End 3D Fitness Studio Stage / Podium
// Prevents the coach from floating in "open air" ("en plein air") by anchoring him on a high-tech training circular stage
const StudioStage: React.FC<{ isDark: boolean }> = ({ isDark }) => {
  const shadowTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    const grad = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
    grad.addColorStop(0, isDark ? 'rgba(0, 0, 0, 0.70)' : 'rgba(0, 0, 0, 0.25)');
    grad.addColorStop(0.38, isDark ? 'rgba(0, 0, 0, 0.40)' : 'rgba(0, 0, 0, 0.10)');
    grad.addColorStop(0.75, isDark ? 'rgba(0, 0, 0, 0.12)' : 'rgba(0, 0, 0, 0.02)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 256);
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }, [isDark]);

  return (
    <group position={[0, -0.92, 0]}>
      {/* 1. Feathered soft contact shadow beneath the training platform */}
      {shadowTexture && (
        <mesh position={[0, -0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[3.8, 3.8]} />
          <meshBasicMaterial map={shadowTexture} transparent opacity={0.9} depthWrite={false} />
        </mesh>
      )}

      {/* 2. Elevated Training Podium */}
      <mesh position={[0, 0.015, 0]}>
        <cylinderGeometry args={[1.45, 1.48, 0.03, 64]} />
        <meshStandardMaterial
          color={isDark ? '#141419' : '#f8fafc'}
          roughness={isDark ? 0.35 : 0.25}
          metalness={isDark ? 0.4 : 0.1}
        />
      </mesh>

      {/* 3. Satin Architectural Rim */}
      <mesh position={[0, 0.0302, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.40, 1.45, 64]} />
        <meshStandardMaterial
          color={isDark ? '#272732' : '#e2e8f0'}
          roughness={0.2}
          metalness={isDark ? 0.8 : 0.4}
        />
      </mesh>

      {/* 4. Illuminated Energy Halo Ring */}
      <mesh position={[0, 0.031, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.34, 1.37, 64]} />
        <meshBasicMaterial
          color={isDark ? '#a855f7' : '#9333ea'}
          transparent
          opacity={isDark ? 0.85 : 0.55}
          toneMapped={false}
        />
      </mesh>

      {/* 5. Inner Mat Center */}
      <mesh position={[0, 0.0305, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.33, 64]} />
        <meshStandardMaterial
          color={isDark ? '#0b0b10' : '#ffffff'}
          roughness={0.5}
          metalness={0.05}
        />
      </mesh>
    </group>
  );
};

// Rigged Hunyuan 3D Puppet Player
// Real human biomechanical animation engine for squats, push-ups, lunges, jacks, and boxing
const HunyuanRiggedCoach: React.FC<{
  scene: THREE.Object3D;
  isPaused?: boolean;
  exerciseName?: string;
  isPrep?: boolean;
}> = ({ scene, isPaused, exerciseName, isPrep }) => {
  const isPausedRef = useRef(isPaused);
  const exerciseNameRef = useRef(exerciseName);
  const isPrepRef = useRef(isPrep);

  const timeRef = useRef(0);
  const restWorldQ = useRef<Map<string, THREE.Quaternion>>(new Map());
  const restLocalQ = useRef<Map<string, THREE.Quaternion>>(new Map());
  const restLocalPos = useRef<Map<string, THREE.Vector3>>(new Map());
  const boneMap = useRef<Map<string, THREE.Bone>>(new Map());

  useEffect(() => {
    isPausedRef.current = isPaused;
    exerciseNameRef.current = exerciseName;
    isPrepRef.current = isPrep;
  }, [isPaused, exerciseName, isPrep]);

  // Capture bind pose in rest state
  useEffect(() => {
    if (!scene) return;
    restWorldQ.current.clear();
    restLocalQ.current.clear();
    restLocalPos.current.clear();
    boneMap.current.clear();

    scene.updateMatrixWorld(true);

    scene.traverse((child) => {
      if (child instanceof THREE.Bone) {
        boneMap.current.set(child.name, child);
        const wq = new THREE.Quaternion();
        child.getWorldQuaternion(wq);
        restWorldQ.current.set(child.name, wq.clone());
        restLocalQ.current.set(child.name, child.quaternion.clone());
        restLocalPos.current.set(child.name, child.position.clone());
      }
    });
  }, [scene]);

  useFrame((_, delta) => {
    if (!scene) return;
    if (isPausedRef.current) return;

    timeRef.current += Math.min(delta, 0.05);
    const t = timeRef.current;

    // 1. Reset all bones to bind pose to eliminate distortion and drift
    scene.traverse((child) => {
      if (child instanceof THREE.Bone) {
        const lq = restLocalQ.current.get(child.name);
        const lp = restLocalPos.current.get(child.name);
        if (lq) child.quaternion.copy(lq);
        if (lp) child.position.copy(lp);
      }
    });
    scene.updateMatrixWorld(true);

    // 2. Exact world rotation applier with parent compensation
    const applyWorldRot = (boneName: string, worldAxis: THREE.Vector3, angle: number) => {
      const bone = boneMap.current.get(boneName);
      const wRest = restWorldQ.current.get(boneName);
      if (!bone || !wRest) return;

      const deltaQ = new THREE.Quaternion().setFromAxisAngle(worldAxis, angle);
      const targetWorldQ = deltaQ.multiply(wRest.clone());

      if (bone.parent) {
        const parentWorldQ = new THREE.Quaternion();
        bone.parent.getWorldQuaternion(parentWorldQ);
        const localQ = parentWorldQ.clone().invert().multiply(targetWorldQ);
        bone.quaternion.copy(localQ);
      } else {
        bone.quaternion.copy(targetWorldQ);
      }
      bone.updateMatrixWorld(true);
    };

    const hips = boneMap.current.get('Hips');
    const hipsRestPos = restLocalPos.current.get('Hips');
    const hipsRestQ = restLocalQ.current.get('Hips');

    const exCategory = isPrepRef.current ? 'idle' : getExerciseType(exerciseNameRef.current);

    // 3. Natural Kinematics Engine
    switch (exCategory) {
      case 'squat': {
        // Biomechanical Squat: Smooth concentric/eccentric cycle with hip hinge & arm counter-balance
        const speed = 2.4;
        const rawCycle = (Math.sin(t * speed) + 1) * 0.5; // 0 (top) to 1 (bottom)
        const p = rawCycle * rawCycle * (3 - 2 * rawCycle); // Smoothstep easing

        if (hips && hipsRestPos) {
          hips.position.y = hipsRestPos.y - 0.52 * p;
          hips.position.z = hipsRestPos.z - 0.18 * p;
          hips.updateMatrixWorld(true);
        }

        // Torso hinges forward at hips to balance center of gravity
        applyWorldRot('Spine', WORLD_X, 0.28 * p);
        applyWorldRot('Spine1', WORLD_X, 0.14 * p);
        applyWorldRot('Head', WORLD_X, -0.16 * p); // Keep eyes focused forward

        // Thighs bend forward at hip
        applyWorldRot('LeftUpLeg', WORLD_X, 0.72 * p);
        applyWorldRot('RightUpLeg', WORLD_X, 0.72 * p);
        // Athletic knee abduction tracking toes
        applyWorldRot('LeftUpLeg', WORLD_Z, 0.08 * p);
        applyWorldRot('RightUpLeg', WORLD_Z, -0.08 * p);

        // Knees bend backward
        applyWorldRot('LeftLeg', WORLD_X, -0.85 * p);
        applyWorldRot('RightLeg', WORLD_X, -0.85 * p);

        // Feet dorsiflexion to remain firmly planted
        applyWorldRot('LeftFoot', WORLD_X, 0.15 * p);
        applyWorldRot('RightFoot', WORLD_X, 0.15 * p);

        // Arms reach forward horizontally for balance
        applyWorldRot('LeftArm', WORLD_X, 0.68 * p);
        applyWorldRot('RightArm', WORLD_X, 0.68 * p);
        applyWorldRot('LeftForeArm', WORLD_X, 0.35 * p);
        applyWorldRot('RightForeArm', WORLD_X, 0.35 * p);
        break;
      }

      case 'jack': {
        // High-Energy Jumping Jacks: Dynamic arm swing overhead & lateral leg spring
        const speed = 5.2;
        const rawCycle = (Math.sin(t * speed) + 1) * 0.5;
        const p = rawCycle * rawCycle * (3 - 2 * rawCycle);
        const bounce = Math.abs(Math.sin(t * speed));

        if (hips && hipsRestPos) {
          hips.position.y = hipsRestPos.y + bounce * 0.10;
          hips.updateMatrixWorld(true);
        }

        // Arms swing wide out and up into high V
        applyWorldRot('LeftArm', WORLD_Z, 1.85 * p);
        applyWorldRot('RightArm', WORLD_Z, -1.85 * p);
        applyWorldRot('LeftArm', WORLD_X, 0.15 * p);
        applyWorldRot('RightArm', WORLD_X, 0.15 * p);
        applyWorldRot('LeftForeArm', WORLD_X, 0.22 * p);
        applyWorldRot('RightForeArm', WORLD_X, 0.22 * p);

        // Legs jump outward laterally
        applyWorldRot('LeftUpLeg', WORLD_Z, 0.32 * p);
        applyWorldRot('RightUpLeg', WORLD_Z, -0.32 * p);

        // Cushioning knee flex on each landing
        const landingFlex = (1 - bounce) * 0.18;
        applyWorldRot('LeftLeg', WORLD_X, -landingFlex);
        applyWorldRot('RightLeg', WORLD_X, -landingFlex);
        break;
      }

      case 'pushup': {
        // Floor Push-ups: Coach assumes horizontal plank on the stage, lowering chest & driving up
        const speed = 2.4;
        const rawCycle = (Math.sin(t * speed) + 1) * 0.5;
        const p = rawCycle * rawCycle * (3 - 2 * rawCycle);

        if (hips && hipsRestPos && hipsRestQ) {
          hips.position.y = 0.55 - 0.22 * p;
          hips.position.z = -1.2;
          const plankQ = new THREE.Quaternion().setFromAxisAngle(WORLD_X, Math.PI * 0.44);
          hips.quaternion.copy(hipsRestQ).premultiply(plankQ);
          hips.updateMatrixWorld(true);
        }

        applyWorldRot('Spine', WORLD_X, 0.05);
        applyWorldRot('Head', WORLD_X, -0.35); // Head looks down towards the mat

        applyWorldRot('LeftUpLeg', WORLD_X, -0.05);
        applyWorldRot('RightUpLeg', WORLD_X, -0.05);
        applyWorldRot('LeftLeg', WORLD_X, 0.05);
        applyWorldRot('RightLeg', WORLD_X, 0.05);

        // Arms bend outwards 90 degrees as chest lowers to mat
        applyWorldRot('LeftArm', WORLD_X, 0.35 + 0.30 * p);
        applyWorldRot('RightArm', WORLD_X, 0.35 + 0.30 * p);
        applyWorldRot('LeftArm', WORLD_Z, 0.25 * p);
        applyWorldRot('RightArm', WORLD_Z, -0.25 * p);
        applyWorldRot('LeftForeArm', WORLD_X, 0.50 + 0.75 * p);
        applyWorldRot('RightForeArm', WORLD_X, 0.50 + 0.75 * p);
        break;
      }

      case 'lunge': {
        // Alternating Front Lunges with 90-degree knee bend & athletic balance
        const speed = 2.0;
        const phase = Math.sin(t * speed);
        const isLeft = phase >= 0;
        const p = Math.abs(phase);
        const smoothP = p * p * (3 - 2 * p);

        if (hips && hipsRestPos) {
          hips.position.y = hipsRestPos.y - 0.38 * smoothP;
          hips.updateMatrixWorld(true);
        }

        applyWorldRot('Spine', WORLD_X, 0.08 * smoothP);

        if (isLeft) {
          applyWorldRot('LeftUpLeg', WORLD_X, 0.65 * smoothP);
          applyWorldRot('LeftLeg', WORLD_X, -0.75 * smoothP);
          applyWorldRot('LeftFoot', WORLD_X, 0.15 * smoothP);

          applyWorldRot('RightUpLeg', WORLD_X, -0.35 * smoothP);
          applyWorldRot('RightLeg', WORLD_X, -0.55 * smoothP);
        } else {
          applyWorldRot('RightUpLeg', WORLD_X, 0.65 * smoothP);
          applyWorldRot('RightLeg', WORLD_X, -0.75 * smoothP);
          applyWorldRot('RightFoot', WORLD_X, 0.15 * smoothP);

          applyWorldRot('LeftUpLeg', WORLD_X, -0.35 * smoothP);
          applyWorldRot('LeftLeg', WORLD_X, -0.55 * smoothP);
        }

        applyWorldRot('LeftArm', WORLD_X, isLeft ? -0.35 * smoothP : 0.45 * smoothP);
        applyWorldRot('RightArm', WORLD_X, isLeft ? 0.45 * smoothP : -0.35 * smoothP);
        applyWorldRot('LeftForeArm', WORLD_X, 0.60);
        applyWorldRot('RightForeArm', WORLD_X, 0.60);
        break;
      }

      case 'boxing': {
        // Cardio Shadow Boxing: Rhythmic Jabs, Crosses, and Combat Stance
        const speed = 4.0;
        const jab = Math.max(0, Math.sin(t * speed));
        const cross = Math.max(0, Math.sin(t * speed + Math.PI));

        applyWorldRot('Spine', WORLD_Y, 0.20 * jab - 0.25 * cross);
        applyWorldRot('Spine1', WORLD_X, 0.08);

        // Left Jab
        applyWorldRot('LeftArm', WORLD_X, 0.75 * jab + 0.30 * (1 - jab));
        applyWorldRot('LeftForeArm', WORLD_X, 0.20 * jab + 0.85 * (1 - jab));

        // Right Cross
        applyWorldRot('RightArm', WORLD_X, 0.85 * cross + 0.30 * (1 - cross));
        applyWorldRot('RightForeArm', WORLD_X, 0.15 * cross + 0.85 * (1 - cross));

        // Athletic boxing leg stance
        applyWorldRot('LeftUpLeg', WORLD_X, 0.12);
        applyWorldRot('RightUpLeg', WORLD_X, -0.10);
        applyWorldRot('LeftLeg', WORLD_X, -0.15);
        applyWorldRot('RightLeg', WORLD_X, -0.12);
        break;
      }

      case 'plank': {
        // Isometric Plank Hold with controlled breathing
        const breath = Math.sin(t * 1.5) * 0.03;
        if (hips && hipsRestPos && hipsRestQ) {
          hips.position.y = 0.45 + breath * 0.02;
          hips.position.z = -1.2;
          const plankQ = new THREE.Quaternion().setFromAxisAngle(WORLD_X, Math.PI * 0.44);
          hips.quaternion.copy(hipsRestQ).premultiply(plankQ);
          hips.updateMatrixWorld(true);
        }

        applyWorldRot('Spine', WORLD_X, 0.04);
        applyWorldRot('Head', WORLD_X, -0.35);
        applyWorldRot('LeftArm', WORLD_X, 0.65);
        applyWorldRot('RightArm', WORLD_X, 0.65);
        applyWorldRot('LeftForeArm', WORLD_X, 0.85);
        applyWorldRot('RightForeArm', WORLD_X, 0.85);
        break;
      }

      case 'idle':
      default: {
        // Heroic Athletic Stance with Natural Diaphragmatic Breathing
        const breath = Math.sin(t * 1.5);
        if (hips && hipsRestPos) {
          hips.position.y = hipsRestPos.y + breath * 0.012;
          hips.updateMatrixWorld(true);
        }

        applyWorldRot('Spine', WORLD_X, breath * 0.035);
        applyWorldRot('Spine1', WORLD_X, breath * 0.045);
        applyWorldRot('Head', WORLD_Y, Math.sin(t * 0.7) * 0.07);
        applyWorldRot('Head', WORLD_X, -0.05 + breath * 0.02);

        applyWorldRot('LeftArm', WORLD_Z, 0.06 + breath * 0.02);
        applyWorldRot('RightArm', WORLD_Z, -0.06 - breath * 0.02);
        applyWorldRot('LeftForeArm', WORLD_X, 0.15);
        applyWorldRot('RightForeArm', WORLD_X, 0.15);
        break;
      }
    }
  });

  // Scale 0.34 scales the 5.5m raw mesh to a commanding, heroic 1.87m athletic height
  // Grounded at y = -0.92 so feet rest perfectly on top of the workout platform
  return (
    <group scale={[0.34, 0.34, 0.34]} position={[0, -0.92, 0]}>
      <primitive object={scene} />
    </group>
  );
};

// Universal Model Loader (GLTF & FBX with SkeletonUtils)
const UniversalModel: React.FC<{
  url: string;
  isPaused?: boolean;
  exerciseName?: string;
  isPrep?: boolean;
}> = ({ url, isPaused, exerciseName, isPrep }) => {
  const isFBX = url.toLowerCase().includes('.fbx') || url.includes('format=fbx');

  if (isFBX) {
    const fbx = useFBX(url);
    const cloned = useMemo(() => (fbx ? SkeletonUtils.clone(fbx) : null), [fbx]);
    if (!cloned) return null;
    return <HunyuanRiggedCoach scene={cloned} isPaused={isPaused} exerciseName={exerciseName} isPrep={isPrep} />;
  }

  const gltf = useGLTF(url, '/draco/');
  const cloned = useMemo(() => (gltf?.scene ? SkeletonUtils.clone(gltf.scene) : null), [gltf]);
  if (!cloned) return null;
  return <HunyuanRiggedCoach scene={cloned} isPaused={isPaused} exerciseName={exerciseName} isPrep={isPrep} />;
};

// 3D Canvas Studio Viewport
const CoachCanvas: React.FC<{
  finalUrl: string;
  isPaused?: boolean;
  exerciseName?: string;
  isPrep?: boolean;
  isDark: boolean;
  isTransparent?: boolean;
}> = ({ finalUrl, isPaused, exerciseName, isPrep, isDark, isTransparent }) => {
  return (
    <Canvas
      gl={{ antialias: true, alpha: isTransparent, powerPreference: 'high-performance' }}
      camera={{ position: [0, 0.25, 3.1], fov: 38 }}
      dpr={[1, 2]}
    >
      {/* Background color */}
      {!isTransparent && (
        <color attach="background" args={[isDark ? '#08080c' : '#ffffff']} />
      )}

      {/* High-End Studio Lighting */}
      <ambientLight intensity={isDark ? 0.55 : 1.35} color={isDark ? '#e2e8f0' : '#ffffff'} />
      <directionalLight position={[3.0, 6.0, 4.0]} intensity={isDark ? 1.6 : 1.7} color="#ffffff" />
      <directionalLight position={[-3.0, 4.0, 2.5]} intensity={isDark ? 0.7 : 0.9} color={isDark ? '#818cf8' : '#f1f5f9'} />
      
      {/* Rim / Silhouette Backlight: Sculpts shoulders and head for true 3D separation */}
      <directionalLight position={[0, 3.5, -3.5]} intensity={isDark ? 2.2 : 1.5} color={isDark ? '#c084fc' : '#cbd5e1'} />

      {/* Cyberpunk accent in Dark Mode */}
      {isDark && (
        <>
          <pointLight position={[0, 0.5, 1.8]} intensity={1.2} color="#ec4899" />
          <pointLight position={[0, -0.6, -1.0]} intensity={1.0} color="#8a2be2" />
        </>
      )}

      {/* Architectural Workout Podium */}
      {!isTransparent && <StudioStage isDark={isDark} />}

      {/* 3D Cyborg Coach Model */}
      <Suspense fallback={<MatrixStudioLoader isDark={isDark} />}>
        <UniversalModel
          url={finalUrl}
          isPaused={isPaused}
          exerciseName={exerciseName}
          isPrep={isPrep}
        />
      </Suspense>

      {/* Fluid 360-degree Orbit Controls */}
      <OrbitControls
        enableZoom={true}
        enablePan={false}
        makeDefault
        target={[0, 0.0, 0]}
        minDistance={1.8}
        maxDistance={4.5}
        minPolarAngle={Math.PI / 4}
        maxPolarAngle={Math.PI / 1.75}
      />
    </Canvas>
  );
};

export interface HolographicCoachProps {
  modelUrl?: string;
  isPaused?: boolean;
  exerciseName?: string;
  isPrep?: boolean;
  background?: 'transparent' | 'white' | 'dark';
  studioTheme?: 'white' | 'dark';
  onToggleStudioTheme?: (theme: 'white' | 'dark') => void;
}

// HolographicCoach Main Component
export const HolographicCoach: React.FC<HolographicCoachProps> = ({
  modelUrl,
  isPaused = false,
  exerciseName,
  isPrep = false,
  background,
  studioTheme: propStudioTheme,
  onToggleStudioTheme,
}) => {
  const [internalStudioTheme, setInternalStudioTheme] = useState<'white' | 'dark'>(() => {
    return (localStorage.getItem('f4x_studio_theme') as 'white' | 'dark') || 'white';
  });

  const currentTheme = propStudioTheme || internalStudioTheme;
  const isDark = currentTheme === 'dark';
  const isTransparent = background === 'transparent';

  const toggleStudioTheme = () => {
    const nextTheme = currentTheme === 'white' ? 'dark' : 'white';
    if (onToggleStudioTheme) {
      onToggleStudioTheme(nextTheme);
    } else {
      setInternalStudioTheme(nextTheme);
      localStorage.setItem('f4x_studio_theme', nextTheme);
    }
  };

  const finalUrl = useMemo(() => {
    return modelUrl && modelUrl.trim() !== '' ? modelUrl : COACH_MODEL_URL;
  }, [modelUrl]);

  const category = isPrep ? 'idle' : getExerciseType(exerciseName);
  const categoryLabels: Record<ExerciseCategory, string> = {
    squat: 'Squats',
    pushup: 'Pompes',
    jack: 'Jumping Jacks',
    lunge: 'Fentes',
    boxing: 'Shadow Boxing',
    plank: 'Gainage Planche',
    idle: 'Respiration & Préparation'
  };

  return (
    <div className={`w-full h-full relative overflow-hidden flex flex-col justify-between select-none ${
      isTransparent ? 'bg-transparent' : (isDark ? 'bg-[#08080c]' : 'bg-white')
    }`}>
      {/* TOP CONTROLS: Studio White vs Studio Black Toggle */}
      {!isTransparent && (
        <div className="absolute top-4 right-4 z-30 flex items-center gap-2 pointer-events-auto">
          <button
            onClick={toggleStudioTheme}
            className={`px-3.5 py-2 rounded-full border text-[10px] font-black uppercase tracking-wider backdrop-blur-md transition-all shadow-lg flex items-center gap-2 active:scale-95 ${
              isDark
                ? 'bg-neutral-900/90 text-white border-neutral-700 hover:bg-neutral-800'
                : 'bg-white/95 text-neutral-800 border-neutral-200 hover:bg-neutral-100'
            }`}
            title={isDark ? "Passer au Studio Blanc Matrix" : "Passer au Studio Noir"}
          >
            {isDark ? (
              <>
                <Sun size={13} className="text-amber-400" />
                <span>Studio Blanc</span>
              </>
            ) : (
              <>
                <Moon size={13} className="text-purple-600" />
                <span>Studio Noir</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* 3D CANVAS VIEWPORT */}
      <div className="flex-grow w-full relative z-10 flex items-center justify-center">
        <Suspense
          fallback={
            <div className={`absolute inset-0 flex flex-col items-center justify-center ${
              isDark ? 'bg-[#08080c]/80' : 'bg-white/80'
            } backdrop-blur-sm z-50`}>
              <div className="w-10 h-10 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mb-3" />
              <p className="text-[10px] font-black text-purple-700 uppercase tracking-[0.3em] animate-pulse">
                INITIALISATION DU COACH CYBORG...
              </p>
            </div>
          }
        >
          <div className="w-full h-full">
            <CoachCanvas
              finalUrl={finalUrl}
              isPaused={isPaused}
              exerciseName={exerciseName}
              isPrep={isPrep}
              isDark={isDark}
              isTransparent={isTransparent}
            />
          </div>
        </Suspense>
      </div>

      {/* BOTTOM EXERCISE BADGE */}
      {!isTransparent && (
        <div className="absolute bottom-4 left-4 z-30 pointer-events-none">
          <div className={`px-3 py-1.5 rounded-full border backdrop-blur-md text-[9px] font-black uppercase tracking-widest flex items-center gap-2 shadow-sm ${
            isDark
              ? 'bg-black/60 text-purple-300 border-purple-900/50'
              : 'bg-white/90 text-purple-700 border-purple-200 shadow-sm'
          }`}>
            <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
            <span>Mouvement : {categoryLabels[category]}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default HolographicCoach;
