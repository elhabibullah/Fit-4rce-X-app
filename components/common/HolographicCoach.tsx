import React, { Suspense, useMemo, useEffect, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useGLTF, useFBX } from '@react-three/drei';
import { StudioOrbitControls } from './StudioOrbitControls.tsx';
import * as THREE from 'three';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';
import { Sun, Moon, Sparkles } from 'lucide-react';
import { COACH_MODEL_URL } from '../../lib/constants.ts';
import { HumanoidMotionEngine } from '../../lib/animation/humanoidMotionEngine.ts';
import type { HunyuanPuppeteerEngine } from '../../lib/puppeteer/hunyuanPuppeteer.ts';
import { HolographicARModal } from './HolographicARModal.tsx';
import { useApp } from '../../hooks/useApp.ts';

// Multi-language exercise name resolver for Hunyuan biomechanical animations
export type ExerciseCategory =
  | 'squat'
  | 'glute_bridge'
  | 'pushup'
  | 'dips'
  | 'inverted_row'
  | 'jack'
  | 'burpee'
  | 'lunge'
  | 'boxing'
  | 'crunch'
  | 'plank'
  | 'walk'
  | 'run'
  | 'martial_mabu'
  | 'martial_punch'
  | 'martial_palm'
  | 'martial_kick'
  | 'martial_taichi'
  | 'idle';

export const getExerciseType = (name?: string, id?: string): ExerciseCategory => {
  const raw = id || name;
  if (!raw) return 'idle';
  const ex = raw
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

  // Direct canonical IDs
  if (ex === 'dips' || ex === 'dip' || ex === 'parallel_bar_dips' || ex.includes('dip') || ex.includes('fondos') || ex.includes('mergulho')) return 'dips';
  if (ex === 'glute_bridge' || ex === 'glutes' || ex === 'glute' || ex.includes('gluten') || ex.includes('fessier') || ex.includes('bridge') || ex.includes('hip thrust')) return 'glute_bridge';
  if (ex === 'crunch' || ex === 'crunches' || ex.includes('abdo') || ex.includes('sit-up') || ex.includes('situp')) return 'crunch';
  if (ex === 'push_up' || ex === 'pushup' || ex === 'jump_push_up') return 'pushup';
  if (ex === 'squat' || ex === 'back_squat' || ex === 'sumo_squat' || ex === 'pistol_squat') return 'squat';
  if (ex === 'lunge' || ex === 'reverse_lunge') return 'lunge';
  if (ex === 'burpee') return 'burpee';
  if (ex === 'plank') return 'plank';
  if (ex === 'jumping_jack' || ex === 'jack') return 'jack';
  if (ex === 'bent_over_row' || ex === 'inverted_row') return 'inverted_row';
  if (ex === 'martial_mabu') return 'martial_mabu';
  if (ex === 'martial_punch') return 'martial_punch';
  if (ex === 'martial_palm') return 'martial_palm';
  if (ex === 'martial_kick') return 'martial_kick';
  if (ex === 'martial_taichi') return 'martial_taichi';
  if (ex === 'run' || ex === 'sprint') return 'run';
  if (ex === 'walk') return 'walk';

  // Comprehensive Martial Arts / Kung-Fu / Tai-Chi technique mappings
  // Guarantees Sifu ALWAYS executes authentic, fluid martial movements (never freezes in idle)
  if (ex.includes('mabu') || ex.includes('cavalier') || ex.includes('horse') || ex.includes('stance') || ex.includes('enracinement') || ex.includes('zhan') || ex.includes('base') || ex.includes('l1-m1') || ex.includes('l1-t1')) {
    return 'martial_mabu';
  }
  if (ex.includes('fist') || ex.includes('poing') || ex.includes('chain') || ex.includes('frappe') || ex.includes('thrust') || ex.includes('explosive') || ex.includes('l1-m2') || ex.includes('l2-m1') || ex.includes('l3-m1') || ex.includes('direct')) {
    return 'martial_punch';
  }
  if (ex.includes('palm') || ex.includes('paume') || ex.includes('deflect') || ex.includes('deviation') || ex.includes('lap') || ex.includes('pak') || ex.includes('redir') || ex.includes('spiral') || ex.includes('l1-m3') || ex.includes('l2-m2') || ex.includes('l3-m2') || ex.includes('l3-m5') || ex.includes('biu') || ex.includes('chum')) {
    return 'martial_palm';
  }
  if (ex.includes('kick') || ex.includes('pied') || ex.includes('balayage') || ex.includes('jambe') || ex.includes('fouette') || ex.includes('l2-m3') || ex.includes('l3-m3') || ex.includes('fouett')) {
    return 'martial_kick';
  }
  if (ex.includes('tai') || ex.includes('chi') || ex.includes('flow') || ex.includes('nuage') || ex.includes('onde') || ex.includes('fluid') || ex.includes('shift') || ex.includes('breath') || ex.includes('slow') || ex.includes('ntc') || ex.includes('smooth') || ex.includes('intent') || ex.includes('yin') || ex.includes('yang')) {
    return 'martial_taichi';
  }
  if (ex.startsWith('kf-') || ex.includes('kung') || ex.includes('sifu') || ex.includes('wing') || ex.includes('martial')) {
    // Rotating martial fallbacks for any level forms
    if (ex.includes('m4') || ex.includes('m5')) return 'martial_palm';
    return 'martial_punch';
  }

  // 0. Burpees: dedicated multi-phase exercise
  if (ex.includes('burpee') || ex.includes('burpe') || ex.includes('берпи')) {
    return 'burpee';
  }

  // 1. Jumping Jacks / Cardio / Sauts / Corde
  if (
    ex.includes('jack') || ex.includes('saut') || ex.includes('jump') ||
    ex.includes('skipping') || ex.includes('rope') || ex.includes('corde') ||
    ex.includes('hiit') || ex.includes('hop') ||
    ex.includes('climb') || ex.includes('mountain')
  ) {
    return 'jack';
  }

  // 2. Running / Sprint / Course
  if (ex.includes('course') || ex.includes('courir') || ex.includes('sprint') || ex.includes('run') || ex.includes('jog') || ex.includes('foulee')) {
    return 'run';
  }

  // 3. Walking / Marche
  if (ex.includes('marche') || ex.includes('marcher') || ex.includes('walk') || ex.includes('pas') || ex.includes('deplacement')) {
    return 'walk';
  }

  // 4. Push-ups / Pompes / Pompages / Bench Press / Développé
  if (
    ex.includes('push') || ex.includes('pump') || ex.includes('pompe') || ex.includes('pompage') ||
    ex.includes('press-up') || ex.includes('pressup') || ex.includes('appui') ||
    ex.includes('bench') || ex.includes('developpe') || ex.includes('flexion') ||
    ex.includes('liegestutz') || ex.includes('отжимания') || ex.includes('piegamenti')
  ) {
    return 'pushup';
  }

  // 5. Lunges / Fentes
  if (
    ex.includes('lunge') || ex.includes('fente') || ex.includes('split squat') ||
    ex.includes('zancada') || ex.includes('afundo') || ex.includes('ausfallschritt') ||
    ex.includes('выпад')
  ) {
    return 'lunge';
  }

  // 5b. Glutes / Pont Fessier
  if (
    ex.includes('glute') || ex.includes('gluten') || ex.includes('fessier') ||
    ex.includes('bridge') || ex.includes('thrust') || ex.includes('bassin')
  ) {
    return 'glute_bridge';
  }

  // 6. Squats / Cuisses / Jambes
  if (
    ex.includes('squat') || ex.includes('cuisse') ||
    ex.includes('flexion') || ex.includes('quad') ||
    ex.includes('chaise') || ex.includes('chair') ||
    ex.includes('sentadilla') || ex.includes('agachamento') || ex.includes('kniebeuge') ||
    ex.includes('присед')
  ) {
    return 'squat';
  }

  // 7. Boxing / Cardio Combat / Punches
  if (
    ex.includes('punch') || ex.includes('boxe') || ex.includes('jab') ||
    ex.includes('cross') || ex.includes('crochet') || ex.includes('uppercut') ||
    ex.includes('combat') || ex.includes('frappe') || ex.includes('tricep') ||
    ex.includes('bicep') || ex.includes('bras')
  ) {
    return 'boxing';
  }

  // 8. Crunches / Abdos
  if (
    ex.includes('crunch') || ex.includes('abdo') || ex.includes('sit-up') ||
    ex.includes('situp') || ex.includes('releve de buste')
  ) {
    return 'crunch';
  }

  // 9. Plank / Gainage / Core
  if (
    ex.includes('plank') || ex.includes('gainage') || ex.includes('planche') ||
    ex.includes('core') || ex.includes('ventre') || ex.includes('hollow') ||
    ex.includes('plancha') || ex.includes('prancha') || ex.includes('unterarmstuetz') ||
    ex.includes('планка')
  ) {
    return 'plank';
  }

  return 'idle';
};

// World Axes for Hunyuan 3D Rig
const WORLD_X = new THREE.Vector3(1, 0, 0); // Sagittal axis (pitch: lean forward/back, knee bend, elbow flex)
const WORLD_Y = new THREE.Vector3(0, 1, 0); // Vertical axis (yaw: head turn, torso twist)
const WORLD_Z = new THREE.Vector3(0, 0, 1); // Coronal axis (roll: arm abduction, leg abduction)

// Loading fallback (null - no purple/mauve circle)
const MatrixStudioLoader: React.FC<{ isDark?: boolean }> = () => null;

// Professional Gym Shock-Absorbing Rubber Floor (Sol noir mousseux amortissant pour poids & haltères)
const GymRubberFloor: React.FC<{ isDark: boolean }> = ({ isDark }) => {
  // Procedural gym rubber texture with subtle modular tile seams and fine EPDM flecks
  const gymMatTexture = useMemo(() => {
    if (typeof document === 'undefined') return null;
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Base high-density shock-absorbing rubber - dark matte charcoal
    ctx.fillStyle = isDark ? '#111116' : '#18181f';
    ctx.fillRect(0, 0, 512, 512);

    // Subtle 4-quadrant tile seams (representing 1m x 1m modular gym rubber tiles)
    ctx.strokeStyle = isDark ? '#09090c' : '#0f0f14';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(256, 0);
    ctx.lineTo(256, 512);
    ctx.moveTo(0, 256);
    ctx.lineTo(512, 256);
    ctx.stroke();

    // Subtle border seam
    ctx.strokeStyle = isDark ? '#07070a' : '#0a0a0e';
    ctx.lineWidth = 2;
    ctx.strokeRect(2, 2, 508, 508);

    // Fine subtle EPDM rubber speckles for realistic matte gym grip look
    ctx.fillStyle = 'rgba(255, 255, 255, 0.035)';
    for (let i = 0; i < 350; i++) {
      const rx = Math.random() * 512;
      const ry = Math.random() * 512;
      ctx.fillRect(rx, ry, 1.5, 1.5);
    }
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    for (let i = 0; i < 250; i++) {
      const rx = Math.random() * 512;
      const ry = Math.random() * 512;
      ctx.fillRect(rx, ry, 2, 2);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2.5, 2.5);
    texture.needsUpdate = true;
    return texture;
  }, [isDark]);

  return (
    <group position={[0, -0.890, 0]}>
      {/* 1. Main High-Density Shock-Absorbing Rubber Gym Floor (4.8m x 4.8m) */}
      <mesh position={[0, -0.015, 0]}>
        <boxGeometry args={[4.8, 0.03, 4.8]} />
        <meshStandardMaterial
          color={isDark ? '#111115' : '#18181e'}
          roughness={0.92}
          metalness={0.02}
          map={gymMatTexture || undefined}
        />
      </mesh>

      {/* 2. Beveled safety transition perimeter edge */}
      <mesh position={[0, -0.022, 0]}>
        <boxGeometry args={[5.0, 0.02, 5.0]} />
        <meshStandardMaterial
          color={isDark ? '#08080b' : '#0e0e13'}
          roughness={0.96}
          metalness={0.01}
        />
      </mesh>

      {/* 3. Expansive Studio Gym Floor (Surrounding floor so horizon never cuts off into void) */}
      <mesh position={[0, -0.035, 0]}>
        <boxGeometry args={[32, 0.02, 32]} />
        <meshStandardMaterial
          color={isDark ? '#09090d' : '#e2e8f0'}
          roughness={0.88}
          metalness={0.03}
        />
      </mesh>
    </group>
  );
};

// Realistic Soft Studio Contact Shadow beneath athlete onto gym floor
const StudioContactShadow: React.FC<{ isDark: boolean }> = ({ isDark }) => {
  const shadowTexture = useMemo(() => {
    if (typeof document === 'undefined') return null;
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const grad = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
    grad.addColorStop(0.0, isDark ? 'rgba(0, 0, 0, 0.95)' : 'rgba(15, 23, 42, 0.75)');
    grad.addColorStop(0.25, isDark ? 'rgba(0, 0, 0, 0.70)' : 'rgba(15, 23, 42, 0.50)');
    grad.addColorStop(0.55, isDark ? 'rgba(0, 0, 0, 0.35)' : 'rgba(15, 23, 42, 0.22)');
    grad.addColorStop(0.85, isDark ? 'rgba(0, 0, 0, 0.10)' : 'rgba(15, 23, 42, 0.06)');
    grad.addColorStop(1.0, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 256);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }, [isDark]);

  if (!shadowTexture) return null;

  return (
    <mesh position={[0, -0.888, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[3.6, 2.6]} />
      <meshBasicMaterial
        map={shadowTexture}
        transparent
        opacity={isDark ? 0.90 : 0.70}
        depthWrite={false}
      />
    </mesh>
  );
};

// Rigged Hunyuan 3D Puppet Player
// Powered by HumanoidMotionEngine with calibrated skeletal retargeting, 
// anatomical joint limits, and smooth cross-fading transitions
const HunyuanRiggedCoach: React.FC<{
  scene: THREE.Object3D;
  isPaused?: boolean;
  exerciseName?: string;
  exerciseId?: string;
  isPrep?: boolean;
  speed?: number;
  timelineProgress?: number;
  puppeteerEngine?: HunyuanPuppeteerEngine | null;
  isPuppeteerActive?: boolean;
}> = ({ scene, isPaused, exerciseName, exerciseId, isPrep, speed = 1.0, timelineProgress, puppeteerEngine, isPuppeteerActive }) => {
  const groupRef = useRef<THREE.Group>(null);
  const engineRef = useRef<HumanoidMotionEngine | null>(null);

  // Adaptive model scale normalization and physical grounding for both Cyborg and Sifu Abdelwahid
  const { modelScale, offsetPos } = useMemo(() => {
    scene.updateMatrixWorld(true);

    // Compute bounding box of the mesh in its rest pose
    const box = new THREE.Box3().setFromObject(scene);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());

    // Adaptive unified human height:
    // For spinning coach on bike: targetHeight = 1.35m so entire bike, wheels, and rider fit comfortably with generous headroom
    // For android cyborg & martial arts: targetHeight = 1.95m (calibrated with ample headspace and heroic full body visible)
    const isSpinning = (exerciseId && exerciseId.toLowerCase().includes('spin')) ||
                       (exerciseName && exerciseName.toLowerCase().includes('spin')) ||
                       scene.name.toLowerCase().includes('spin');
    const targetHeight = isSpinning ? 1.55 : 1.95;
    const rawH = size.y > 0.5 ? size.y : 5.7;
    const scale = targetHeight / rawH;

    // Podium surface level in studio space is Y = -0.889m
    const podiumSurfaceY = -0.889;

    // Strict dead-center horizontal alignment on anatomical midline and floor anchoring
    const posX = -center.x * scale;
    const posY = podiumSurfaceY - (box.min.y * scale);
    const posZ = -center.z * scale;

    return {
      modelScale: scale,
      offsetPos: [posX, posY, posZ] as [number, number, number],
    };
  }, [scene]);

  // Handle Puppeteer binding when live puppet mode is active
  useEffect(() => {
    if (!scene || !puppeteerEngine || !isPuppeteerActive) return;
    puppeteerEngine.bindHunyuanRig(scene);
    return () => {
      puppeteerEngine.resetRigPose();
    };
  }, [scene, puppeteerEngine, isPuppeteerActive]);

  // Initialize skeletal retargeting & humanoid motion engine on model scene for standard animations
  useEffect(() => {
    if (!scene) return;
    if (isPuppeteerActive) return;
    const query = exerciseId || exerciseName || 'idle';
    if (!engineRef.current) {
      if (groupRef.current) {
        groupRef.current.position.set(offsetPos[0], offsetPos[1], offsetPos[2]);
        groupRef.current.scale.set(modelScale, modelScale, modelScale);
        groupRef.current.updateMatrixWorld(true);
      }
      engineRef.current = new HumanoidMotionEngine(scene, modelScale, -0.889);
      engineRef.current.setExercise(query, 0.0, true);
    } else {
      engineRef.current.setExercise(query, 0.35, false);
    }
  }, [scene, exerciseId, exerciseName, isPuppeteerActive, modelScale, offsetPos]);

  useFrame((_, delta) => {
    if (!scene) return;

    // If live MediaPipe puppeteer mode is active, update directly via puppeteer solver
    if (isPuppeteerActive && puppeteerEngine) {
      puppeteerEngine.updateHunyuanBones(delta);
      return;
    }

    if (!engineRef.current) return;

    // Strict countdown / prep separation: character stays in starting posture during countdown
    const effectiveDelta = isPaused ? 0 : Math.min(delta, 0.05);
    engineRef.current.update(effectiveDelta, speed, timelineProgress, isPrep);
  });

  return (
    <group ref={groupRef} scale={[modelScale, modelScale, modelScale]} position={offsetPos}>
      <primitive object={scene} />
    </group>
  );
};

// Player for 3D Models with authentic embedded animations (e.g. user's calisthenics Android GLBs)
const EmbeddedAnimationCoach: React.FC<{
  scene: THREE.Object3D;
  animations: THREE.AnimationClip[];
  isPaused?: boolean;
  speed?: number;
  isPrep?: boolean;
  timelineProgress?: number;
  exerciseId?: string;
  exerciseName?: string;
  onLoaded?: () => void;
}> = ({ scene, animations, isPaused, speed = 1.0, isPrep, timelineProgress, exerciseId, exerciseName, onLoaded }) => {
  const groupRef = useRef<THREE.Group>(null);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const actionRef = useRef<THREE.AnimationAction | null>(null);
  const onLoadedRef = useRef(onLoaded);

  useEffect(() => {
    onLoadedRef.current = onLoaded;
  }, [onLoaded]);

  // Unified athletic scale (2.25) & calibrated physical positioning on gym rubber mat
  const { modelScale, rootY, innerRotationX, innerOffsetY, innerOffsetZ } = useMemo(() => {
    const scale = 2.25;
    const gymFloorY = -0.890;
    const query = (exerciseId || exerciseName || '').toLowerCase();

    // 1. Diamond push-ups: mixamo animation has an upward tilt on the torso/legs.
    // Calibrated -17° compensation brings both hands and toes flush to the gym floor!
    if (query.includes('diamond') || query.includes('diamant')) {
      return {
        modelScale: scale,
        rootY: gymFloorY,
        innerRotationX: -17 * (Math.PI / 180),
        innerOffsetY: -0.10,
        innerOffsetZ: -0.10,
      };
    }

    // 2. Hollow body hold: lying supine on mat with hips/sacrum grounded, arms & legs elevated
    if (query.includes('hollow') || query.includes('banan')) {
      return {
        modelScale: scale,
        rootY: gymFloorY,
        innerRotationX: 0,
        innerOffsetY: -0.02,
        innerOffsetZ: 0,
      };
    }

    // 3. Standing / Jumping Squats & All other 12 calisthenics exercises:
    // (Archer push-up, bear crawl, forearm plank, plank knee to elbow, buzzsaw, plank walk, etc.)
    // In all these GLBs, the contact extremities (toes/palms) are authored at local Y = 0.00.
    // Setting rootY = gymFloorY (-0.890) places contact flush on the gym rubber floor!
    // For jumping squats: the athlete naturally takes off 25cm into the air and lands back down on the mat!
    return {
      modelScale: scale,
      rootY: gymFloorY,
      innerRotationX: 0,
      innerOffsetY: 0,
      innerOffsetZ: 0,
    };
  }, [exerciseId, exerciseName]);

  // Initialize AnimationMixer on the model
  useEffect(() => {
    if (!scene || !animations || animations.length === 0) return;

    const mixer = new THREE.AnimationMixer(scene);
    mixerRef.current = mixer;

    const clip = animations[0];
    const action = mixer.clipAction(clip);
    actionRef.current = action;
    action.setLoop(THREE.LoopRepeat, Infinity);
    action.play();

    // Signal model ready
    if (onLoadedRef.current) {
      onLoadedRef.current();
    }

    return () => {
      mixer.stopAllAction();
      action.stop();
    };
  }, [scene, animations]);

  useFrame((_, delta) => {
    if (!mixerRef.current || !groupRef.current) return;

    if (isPrep) {
      mixerRef.current.setTime(0);
    } else if (timelineProgress !== undefined && actionRef.current) {
      const clip = animations[0];
      if (clip && clip.duration > 0) {
        mixerRef.current.setTime(timelineProgress * clip.duration);
      }
    } else if (!isPaused) {
      const effectiveDelta = Math.min(delta, 0.05);
      mixerRef.current.update(effectiveDelta * speed);
    }
  });

  return (
    <group
      ref={groupRef}
      scale={[modelScale, modelScale, modelScale]}
      position={[0, rootY, 0]}
    >
      <group
        rotation={[innerRotationX, 0, 0]}
        position={[0, innerOffsetY, innerOffsetZ]}
      >
        <primitive object={scene} />
      </group>
    </group>
  );
};

// Universal Model Loader (GLTF & FBX with SkeletonUtils)
const UniversalModel: React.FC<{
  url: string;
  isPaused?: boolean;
  exerciseName?: string;
  exerciseId?: string;
  isPrep?: boolean;
  speed?: number;
  timelineProgress?: number;
  puppeteerEngine?: HunyuanPuppeteerEngine | null;
  isPuppeteerActive?: boolean;
  onLoaded?: () => void;
}> = ({ url, isPaused, exerciseName, exerciseId, isPrep, speed, timelineProgress, puppeteerEngine, isPuppeteerActive, onLoaded }) => {
  const isFBX = url.toLowerCase().includes('.fbx') || url.includes('format=fbx');

  if (isFBX) {
    const fbx = useFBX(url);
    const cloned = useMemo(() => (fbx ? SkeletonUtils.clone(fbx) : null), [fbx]);
    useEffect(() => {
      if (cloned && onLoaded) onLoaded();
    }, [cloned, onLoaded]);
    if (!cloned) return null;
    return (
      <HunyuanRiggedCoach
        scene={cloned}
        isPaused={isPaused}
        exerciseName={exerciseName}
        exerciseId={exerciseId}
        isPrep={isPrep}
        speed={speed}
        timelineProgress={timelineProgress}
        puppeteerEngine={puppeteerEngine}
        isPuppeteerActive={isPuppeteerActive}
      />
    );
  }

  const gltf = useGLTF(url, '/draco/');
  const cloned = useMemo(() => (gltf?.scene ? SkeletonUtils.clone(gltf.scene) : null), [gltf]);

  useEffect(() => {
    if (cloned && onLoaded) {
      onLoaded();
    }
  }, [cloned, onLoaded]);

  if (!cloned) return null;

  const hasEmbeddedAnim = Boolean(gltf?.animations && gltf.animations.length > 0);
  if (hasEmbeddedAnim && !isPuppeteerActive) {
    return (
      <EmbeddedAnimationCoach
        scene={cloned}
        animations={gltf.animations}
        isPaused={isPaused}
        speed={speed}
        isPrep={isPrep}
        exerciseId={exerciseId}
        exerciseName={exerciseName}
        timelineProgress={timelineProgress}
        onLoaded={onLoaded}
      />
    );
  }

  return (
    <HunyuanRiggedCoach
      scene={cloned}
      isPaused={isPaused}
      exerciseName={exerciseName}
      exerciseId={exerciseId}
      isPrep={isPrep}
      speed={speed}
      timelineProgress={timelineProgress}
      puppeteerEngine={puppeteerEngine}
      isPuppeteerActive={isPuppeteerActive}
    />
  );
};

// Camera Preset Handler for Face / Profile / Free Orbit
const CameraPresetHandler: React.FC<{
  preset?: 'face' | 'profile' | 'free';
  controlsRef: React.RefObject<any>;
}> = ({ preset, controlsRef }) => {
  const { camera } = useThree();
  const prevPresetRef = useRef<string | undefined>(preset);

  useEffect(() => {
    if (!preset || preset === 'free') {
      if (controlsRef.current) {
        controlsRef.current.enabled = true;
      }
      prevPresetRef.current = preset;
      return;
    }

    if (prevPresetRef.current !== preset) {
      if (preset === 'face') {
        camera.position.set(0, 0.75, 3.2);
        if (controlsRef.current) {
          controlsRef.current.target.set(0, -0.45, 0);
          controlsRef.current.update();
        }
      } else if (preset === 'profile') {
        camera.position.set(3.2, 0.75, 0);
        if (controlsRef.current) {
          controlsRef.current.target.set(0, -0.45, 0);
          controlsRef.current.update();
        }
      }
      prevPresetRef.current = preset;
    }
  }, [preset, camera, controlsRef]);
  return null;
};

// Dynamic Automatic Camera Tracking: Centers on character's center of gravity (hips)
const CameraHipsTracker: React.FC<{
  controlsRef: React.RefObject<any>;
}> = ({ controlsRef }) => {
  const { scene } = useThree();
  const hipsBoneRef = useRef<THREE.Bone | null>(null);
  const tempPos = useRef(new THREE.Vector3());

  useFrame(() => {
    if (!hipsBoneRef.current) {
      scene.traverse((obj) => {
        if (!hipsBoneRef.current && ((obj as any).isBone || obj.type === 'Bone')) {
          const name = obj.name.toLowerCase();
          if (name.includes('hip') || name.includes('pelvis') || name.includes('bip01')) {
            hipsBoneRef.current = obj as THREE.Bone;
          }
        }
      });
    }

    if (hipsBoneRef.current && controlsRef.current) {
      hipsBoneRef.current.getWorldPosition(tempPos.current);
      const target = controlsRef.current.target;
      // Focus target smoothly on the center of the athlete (slightly below hips for ground contact visibility)
      const safeTargetY = Math.max(-0.65, Math.min(0.20, tempPos.current.y - 0.15));
      target.y = THREE.MathUtils.lerp(target.y, safeTargetY, 0.08);
      target.x = THREE.MathUtils.lerp(target.x, 0, 0.1);
      target.z = THREE.MathUtils.lerp(target.z, 0, 0.1);
      controlsRef.current.update();
    }
  });

  return null;
};

// 3D Canvas Studio Viewport
const CoachCanvas: React.FC<{
  finalUrl: string;
  isPaused?: boolean;
  exerciseName?: string;
  exerciseId?: string;
  isPrep?: boolean;
  isDark: boolean;
  isTransparent?: boolean;
  speed?: number;
  timelineProgress?: number;
  cameraPreset?: 'face' | 'profile' | 'free';
  puppeteerEngine?: HunyuanPuppeteerEngine | null;
  isPuppeteerActive?: boolean;
  onLoaded?: () => void;
}> = ({ finalUrl, isPaused, exerciseName, exerciseId, isPrep, isDark, isTransparent, speed, timelineProgress, cameraPreset, puppeteerEngine, isPuppeteerActive, onLoaded }) => {
  const controlsRef = useRef<any>(null);

  const initialCameraPos = useMemo<[number, number, number]>(() => {
    const isSpinning = finalUrl.toLowerCase().includes('spin') || (exerciseId && exerciseId.toLowerCase().includes('spin'));
    const dist = isSpinning ? 3.4 : 3.2;
    if (cameraPreset === 'profile') return [dist, 0.75, 0];
    return [0, 0.75, dist];
  }, [cameraPreset, finalUrl, exerciseId]);

  return (
    <Canvas
      gl={{ antialias: true, alpha: isTransparent, powerPreference: 'high-performance' }}
      camera={{ position: initialCameraPos, fov: 40 }}
      dpr={[1, 2]}
      style={{ background: 'transparent' }}
      onCreated={({ gl, scene }) => {
        if (isTransparent) {
          gl.setClearColor(0x000000, 0);
          scene.background = null;
        }
      }}
    >
      <CameraPresetHandler preset={cameraPreset} controlsRef={controlsRef} />
      <CameraHipsTracker controlsRef={controlsRef} />

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

      {/* Shock-Absorbing Black Rubber Gym Floor (Sol carré noir mousseux) */}
      {!isTransparent && <GymRubberFloor isDark={isDark} />}

      {/* Realistic contact shadow beneath model onto gym rubber floor */}
      {!isTransparent && <StudioContactShadow isDark={isDark} />}

      {/* 3D Coach Model */}
      <Suspense fallback={null}>
        <UniversalModel
          url={finalUrl}
          isPaused={isPaused}
          exerciseName={exerciseName}
          exerciseId={exerciseId}
          isPrep={isPrep}
          speed={speed}
          timelineProgress={timelineProgress}
          puppeteerEngine={puppeteerEngine}
          isPuppeteerActive={isPuppeteerActive}
          onLoaded={onLoaded}
        />
      </Suspense>

      {/* Fluid 360-degree Orbit Controls with zoom support */}
      <StudioOrbitControls
        controlsRef={controlsRef}
        enableZoom={true}
        enablePan={false}
        target={[0, -0.12, 0]}
        minDistance={1.2}
        maxDistance={5.5}
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
  exerciseId?: string;
  isPrep?: boolean;
  background?: 'transparent' | 'white' | 'dark';
  studioTheme?: 'white' | 'dark';
  onToggleStudioTheme?: (theme: 'white' | 'dark') => void;
  speed?: number;
  timelineProgress?: number;
  cameraPreset?: 'face' | 'profile' | 'free';
  hideBadge?: boolean;
  hideThemeToggle?: boolean;
  hideARButton?: boolean;
  puppeteerEngine?: HunyuanPuppeteerEngine | null;
  isPuppeteerActive?: boolean;
  disableWheelForward?: boolean;
  onLoaded?: () => void;
}

// HolographicCoach Main Component
export const HolographicCoach: React.FC<HolographicCoachProps> = ({
  modelUrl,
  isPaused = false,
  exerciseName,
  exerciseId,
  isPrep = false,
  background,
  studioTheme: propStudioTheme,
  onToggleStudioTheme,
  speed = 1.0,
  timelineProgress,
  cameraPreset,
  hideBadge = false,
  hideThemeToggle = false,
  hideARButton = true,
  puppeteerEngine,
  isPuppeteerActive,
  disableWheelForward = false,
  onLoaded,
}) => {
  const { translate } = useApp();
  const [internalStudioTheme, setInternalStudioTheme] = useState<'white' | 'dark'>(() => {
    return (localStorage.getItem('f4x_studio_theme') as 'white' | 'dark') || 'white';
  });
  const [isARModalOpen, setIsARModalOpen] = useState(false);

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

  const category = isPrep ? 'idle' : getExerciseType(exerciseName, exerciseId);
  const categoryLabels: Record<ExerciseCategory, string> = {
    squat: 'Squats',
    glute_bridge: 'Pont Fessier (Glutes)',
    pushup: 'Pompes',
    dips: 'Dips (Barres Parallèles)',
    inverted_row: 'Tirage Horizontal (Row)',
    jack: 'Jumping Jacks',
    burpee: 'Burpees',
    lunge: 'Fentes',
    boxing: 'Shadow Boxing',
    crunch: 'Abdos (Crunches)',
    plank: 'Gainage Planche',
    walk: 'Marche Active',
    run: 'Course Dynamique',
    martial_mabu: 'Posture du Cavalier (Ma Bu)',
    martial_punch: 'Frappes Directes (Kung Fu)',
    martial_palm: 'Paumes Ondulatoires',
    martial_kick: 'Coups de Pied & Balayages',
    martial_taichi: 'Neo Tai Chi Flow',
    idle: 'Respiration & Posture'
  };

  return (
    <div className={`w-full h-full relative overflow-hidden flex flex-col justify-between select-none ${
      isTransparent ? 'bg-transparent' : (isDark ? 'bg-[#08080c]' : 'bg-white')
    }`}>
      {/* TOP CONTROLS: Studio White vs Studio Black Toggle & Vue Holographique AR */}
      {!isTransparent && (!hideThemeToggle || !hideARButton) && (
        <div className="absolute top-4 right-4 z-30 flex items-center gap-2 pointer-events-auto">
          {!hideARButton && (
            <button
              onClick={() => setIsARModalOpen(true)}
              className="px-3.5 py-2 rounded-full border text-[10px] font-black uppercase tracking-wider backdrop-blur-md transition-all shadow-lg flex items-center justify-center active:scale-95 bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-purple-400/60 hover:from-purple-500 hover:to-indigo-500 shadow-purple-900/30"
              title={translate('ar.hologram')}
            >
              <span>{translate('ar.hologram')}</span>
            </button>
          )}

          {!hideThemeToggle && (
            <button
              onClick={toggleStudioTheme}
              className={`px-3.5 py-2 rounded-full border text-[10px] font-black uppercase tracking-wider backdrop-blur-md transition-all shadow-lg flex items-center gap-2 active:scale-95 ${
                isDark
                  ? 'bg-neutral-900/90 text-white border-neutral-700 hover:bg-neutral-800'
                  : 'bg-white/95 text-neutral-800 border-neutral-200 hover:bg-neutral-100'
              }`}
              title={isDark ? "Studio White" : "Studio Dark"}
            >
              {isDark ? (
                <>
                  <Sun size={13} className="text-amber-400" />
                  <span>White</span>
                </>
              ) : (
                <>
                  <Moon size={13} className="text-purple-600" />
                  <span>Dark</span>
                </>
              )}
            </button>
          )}
        </div>
      )}

      {/* 3D CANVAS VIEWPORT */}
      <div className={`flex-grow w-full relative z-10 flex items-center justify-center ${isTransparent ? 'bg-transparent' : ''}`}>
        <Suspense fallback={null}>
          <div 
            className={`w-full h-full ${isTransparent ? 'bg-transparent' : ''}`}
            style={{ touchAction: 'pan-y' }}
            onWheel={(e) => {
              if (disableWheelForward) {
                e.stopPropagation();
                return;
              }
              let el: HTMLElement | null = e.currentTarget.parentElement;
              while (el && el !== document.body) {
                const overflowY = window.getComputedStyle(el).overflowY;
                if ((overflowY === 'auto' || overflowY === 'scroll') && el.scrollHeight > el.clientHeight) {
                  el.scrollBy({ top: e.deltaY, behavior: 'auto' });
                  return;
                }
                el = el.parentElement;
              }
              window.scrollBy({ top: e.deltaY, behavior: 'auto' });
            }}
          >
            <CoachCanvas
              finalUrl={finalUrl}
              isPaused={isPaused}
              exerciseName={exerciseName}
              exerciseId={exerciseId}
              isPrep={isPrep}
              isDark={isDark}
              isTransparent={isTransparent}
              speed={speed}
              timelineProgress={timelineProgress}
              cameraPreset={cameraPreset}
              puppeteerEngine={puppeteerEngine}
              isPuppeteerActive={isPuppeteerActive}
              onLoaded={onLoaded}
            />
          </div>
        </Suspense>
      </div>

      {/* BOTTOM EXERCISE BADGE */}
      {!isTransparent && !hideBadge && (
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

      {/* Holographic AR Modal (Camera + Floor Anchor) */}
      <HolographicARModal
        isOpen={isARModalOpen}
        onClose={() => setIsARModalOpen(false)}
        modelUrl={finalUrl}
        exerciseName={categoryLabels[category] || exerciseName}
        exerciseId={exerciseId}
        isPaused={isPaused}
        speed={speed}
        initialMode="camera_ar"
      />
    </div>
  );
};

export default HolographicCoach;
