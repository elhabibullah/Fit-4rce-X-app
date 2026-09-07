import React, { Suspense, useMemo, useEffect, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useGLTF, useFBX, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';
import { Sun, Moon } from 'lucide-react';
import { COACH_MODEL_URL } from '../../lib/constants.ts';
import { HumanoidMotionEngine } from '../../lib/animation/humanoidMotionEngine.ts';
import type { HunyuanPuppeteerEngine } from '../../lib/puppeteer/hunyuanPuppeteer.ts';

// Multi-language exercise name resolver for Hunyuan biomechanical animations
export type ExerciseCategory =
  | 'squat'
  | 'pushup'
  | 'inverted_row'
  | 'jack'
  | 'lunge'
  | 'boxing'
  | 'plank'
  | 'walk'
  | 'run'
  | 'martial_mabu'
  | 'martial_punch'
  | 'martial_palm'
  | 'martial_kick'
  | 'martial_taichi'
  | 'idle';

export const getExerciseType = (name?: string): ExerciseCategory => {
  if (!name) return 'idle';
  const ex = name.toLowerCase();

  // Inverted Row / Tirage horizontal / Suspension row / Australian pull-up
  if (
    ex.includes('row') || ex.includes('tirage') || ex.includes('inverted') ||
    ex.includes('traction') || ex.includes('australian') || ex.includes('pull-up') ||
    ex.includes('pullup') || ex.includes('dorsal') || ex.includes('dos')
  ) {
    return 'inverted_row';
  }

  // Martial Arts / Self-Defense Techniques (Sifu Abdelwahid & Kung Fu / Tai Chi)
  if (ex.includes('mabu') || ex.includes('cavalier') || ex.includes('horse stance') || ex.includes('enracinement') || ex.includes('stance')) {
    return 'martial_mabu';
  }
  if (ex.includes('palm') || ex.includes('paume') || ex.includes('ondulatoire') || ex.includes('deflection')) {
    return 'martial_palm';
  }
  if (ex.includes('kick') || ex.includes('fouetté') || ex.includes('fouette') || ex.includes('balayage') || ex.includes('pied') || ex.includes('jambe')) {
    return 'martial_kick';
  }
  if (ex.includes('tai') || ex.includes('chi') || ex.includes('onde') || ex.includes('flow') || ex.includes('spiral') || ex.includes('nuage') || ex.includes('fluid') || ex.includes('shift')) {
    return 'martial_taichi';
  }
  if (ex.includes('fist') || ex.includes('poing') || ex.includes('thrust') || ex.includes('chain') || ex.includes('wing chun') || ex.includes('frappe direct')) {
    return 'martial_punch';
  }

  // 1. Jumping Jacks / Cardio / Sauts / Corde
  if (
    ex.includes('jack') || ex.includes('saut') || ex.includes('jump') ||
    ex.includes('skipping') || ex.includes('rope') || ex.includes('corde') ||
    ex.includes('burpee') || ex.includes('hiit') || ex.includes('hop') ||
    ex.includes('climb') || ex.includes('mountain')
  ) {
    return 'jack';
  }

  // 2. Running / Sprint / Course
  if (ex.includes('course') || ex.includes('courir') || ex.includes('sprint') || ex.includes('run') || ex.includes('jog') || ex.includes('foulée')) {
    return 'run';
  }

  // 3. Walking / Marche
  if (ex.includes('marche') || ex.includes('marcher') || ex.includes('walk') || ex.includes('pas') || ex.includes('deplacement')) {
    return 'walk';
  }

  // 4. Push-ups / Pompes / Bench Press / Développé
  if (
    ex.includes('push') || ex.includes('pump') || ex.includes('pompe') ||
    ex.includes('press-up') || ex.includes('pressup') || ex.includes('appui') ||
    ex.includes('bench') || ex.includes('développé') || ex.includes('developpe')
  ) {
    return 'pushup';
  }

  // 5. Lunges / Fentes
  if (
    ex.includes('lunge') || ex.includes('fente') || ex.includes('split squat') ||
    ex.includes('zancada') || ex.includes('afundo')
  ) {
    return 'lunge';
  }

  // 6. Squats / Cuisses / Jambes
  if (
    ex.includes('squat') || ex.includes('cuisse') ||
    ex.includes('flexion') || ex.includes('quad') || ex.includes('glute') ||
    ex.includes('fessier') || ex.includes('chaise') || ex.includes('chair') ||
    ex.includes('sentadilla') || ex.includes('agachamento')
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

  // 8. Plank / Gainage / Core
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
// Powered by HumanoidMotionEngine with calibrated skeletal retargeting, 
// anatomical joint limits, and smooth cross-fading transitions
const HunyuanRiggedCoach: React.FC<{
  scene: THREE.Object3D;
  isPaused?: boolean;
  exerciseName?: string;
  isPrep?: boolean;
  speed?: number;
  timelineProgress?: number;
  puppeteerEngine?: HunyuanPuppeteerEngine | null;
  isPuppeteerActive?: boolean;
}> = ({ scene, isPaused, exerciseName, isPrep, speed = 1.0, timelineProgress, puppeteerEngine, isPuppeteerActive }) => {
  const groupRef = useRef<THREE.Group>(null);
  const engineRef = useRef<HumanoidMotionEngine | null>(null);

  // Adaptive model scale normalization and physical grounding for both Cyborg and Sifu Abdelwahid
  const { modelScale, offsetPos } = useMemo(() => {
    scene.updateMatrixWorld(true);

    // Compute bounding box of the mesh in its rest pose
    const box = new THREE.Box3().setFromObject(scene);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());

    // Master unified human height in meters: 1.45m provides ideal framing on both mobile and desktop
    const targetHeight = 1.45;
    const rawH = size.y > 0.5 ? size.y : 5.7;
    const scale = targetHeight / rawH;

    // Podium surface level in studio space is Y = -0.889m
    const podiumSurfaceY = -0.889;

    // Center horizontally and place soles directly on the podium
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
    if (!engineRef.current) {
      engineRef.current = new HumanoidMotionEngine(scene);
      engineRef.current.setExercise(exerciseName || 'idle', 0.0, true);
    } else {
      engineRef.current.setExercise(exerciseName || 'idle', 0.35, false);
    }
  }, [scene, exerciseName, isPuppeteerActive]);

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

// Universal Model Loader (GLTF & FBX with SkeletonUtils)
const UniversalModel: React.FC<{
  url: string;
  isPaused?: boolean;
  exerciseName?: string;
  isPrep?: boolean;
  speed?: number;
  timelineProgress?: number;
  puppeteerEngine?: HunyuanPuppeteerEngine | null;
  isPuppeteerActive?: boolean;
}> = ({ url, isPaused, exerciseName, isPrep, speed, timelineProgress, puppeteerEngine, isPuppeteerActive }) => {
  const isFBX = url.toLowerCase().includes('.fbx') || url.includes('format=fbx');

  if (isFBX) {
    const fbx = useFBX(url);
    const cloned = useMemo(() => (fbx ? SkeletonUtils.clone(fbx) : null), [fbx]);
    if (!cloned) return null;
    return (
      <HunyuanRiggedCoach
        scene={cloned}
        isPaused={isPaused}
        exerciseName={exerciseName}
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
  if (!cloned) return null;
  return (
    <HunyuanRiggedCoach
      scene={cloned}
      isPaused={isPaused}
      exerciseName={exerciseName}
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
        camera.position.set(0, 0.05, 3.0);
        if (controlsRef.current) {
          controlsRef.current.target.set(0, -0.16, 0);
          controlsRef.current.update();
        }
      } else if (preset === 'profile') {
        camera.position.set(3.0, 0.05, 0);
        if (controlsRef.current) {
          controlsRef.current.target.set(0, -0.16, 0);
          controlsRef.current.update();
        }
      }
      prevPresetRef.current = preset;
    }
  }, [preset, camera, controlsRef]);
  return null;
};

// 3D Canvas Studio Viewport
const CoachCanvas: React.FC<{
  finalUrl: string;
  isPaused?: boolean;
  exerciseName?: string;
  isPrep?: boolean;
  isDark: boolean;
  isTransparent?: boolean;
  speed?: number;
  timelineProgress?: number;
  cameraPreset?: 'face' | 'profile' | 'free';
  puppeteerEngine?: HunyuanPuppeteerEngine | null;
  isPuppeteerActive?: boolean;
}> = ({ finalUrl, isPaused, exerciseName, isPrep, isDark, isTransparent, speed, timelineProgress, cameraPreset, puppeteerEngine, isPuppeteerActive }) => {
  const controlsRef = useRef<any>(null);

  const isFloorExercise = Boolean(
    exerciseName?.toLowerCase().includes('push') || 
    exerciseName?.toLowerCase().includes('pompe') ||
    exerciseName?.toLowerCase().includes('plank') ||
    exerciseName?.toLowerCase().includes('planche')
  );

  const initialCameraPos = useMemo<[number, number, number]>(() => {
    if (cameraPreset === 'profile') return [3.2, isFloorExercise ? 0.25 : 0.05, 0];
    return [0, isFloorExercise ? 0.35 : 0.05, isFloorExercise ? 3.4 : 3.0];
  }, [cameraPreset, isFloorExercise]);

  return (
    <Canvas
      gl={{ antialias: true, alpha: isTransparent, powerPreference: 'high-performance' }}
      camera={{ position: initialCameraPos, fov: 38 }}
      dpr={[1, 2]}
    >
      <CameraPresetHandler preset={cameraPreset} controlsRef={controlsRef} />

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

      {/* 3D Coach Model */}
      <Suspense fallback={<MatrixStudioLoader isDark={isDark} />}>
        <UniversalModel
          url={finalUrl}
          isPaused={isPaused}
          exerciseName={exerciseName}
          isPrep={isPrep}
          speed={speed}
          timelineProgress={timelineProgress}
          puppeteerEngine={puppeteerEngine}
          isPuppeteerActive={isPuppeteerActive}
        />
      </Suspense>

      {/* Fluid 360-degree Orbit Controls */}
      <OrbitControls
        ref={controlsRef}
        enableZoom={true}
        enablePan={false}
        makeDefault
        target={[0, isFloorExercise ? -0.32 : -0.16, 0]}
        minDistance={1.6}
        maxDistance={4.8}
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
  speed?: number;
  timelineProgress?: number;
  cameraPreset?: 'face' | 'profile' | 'free';
  hideBadge?: boolean;
  hideThemeToggle?: boolean;
  puppeteerEngine?: HunyuanPuppeteerEngine | null;
  isPuppeteerActive?: boolean;
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
  speed = 1.0,
  timelineProgress,
  cameraPreset,
  hideBadge = false,
  hideThemeToggle = false,
  puppeteerEngine,
  isPuppeteerActive,
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
    inverted_row: 'Tirage Horizontal (Row)',
    jack: 'Jumping Jacks',
    lunge: 'Fentes',
    boxing: 'Shadow Boxing',
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
      {/* TOP CONTROLS: Studio White vs Studio Black Toggle (when not managed by external header) */}
      {!isTransparent && !hideThemeToggle && (
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
              speed={speed}
              timelineProgress={timelineProgress}
              cameraPreset={cameraPreset}
              puppeteerEngine={puppeteerEngine}
              isPuppeteerActive={isPuppeteerActive}
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
    </div>
  );
};

export default HolographicCoach;
