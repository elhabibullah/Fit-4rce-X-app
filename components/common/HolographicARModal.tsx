import React, { useState, useRef, useEffect, useCallback, Suspense, useMemo } from 'react';
import { 
  X, Camera, RotateCw, ZoomIn, ZoomOut, 
  Check, FlipHorizontal, Play, Pause, 
  Sliders, Maximize, HelpCircle, Monitor, Box, 
  Smartphone, Share2, Sparkles, Eye, Zap, Cast
} from 'lucide-react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, useGLTF, useFBX } from '@react-three/drei';
import * as THREE from 'three';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';
import { COACH_MODEL_URL } from '../../lib/constants.ts';
import { HumanoidMotionEngine } from '../../lib/animation/humanoidMotionEngine.ts';
import { useApp } from '../../hooks/useApp.ts';

type ARProjectionMode = 'camera_ar' | 'pyramid_360' | 'projector_cinema';

interface HolographicARModalProps {
  isOpen: boolean;
  onClose: () => void;
  modelUrl?: string;
  exerciseName?: string;
  exerciseId?: string;
  isPaused?: boolean;
  speed?: number;
  currentSet?: number;
  targetSets?: number;
  targetReps?: number;
  timer?: number;
}

// Glowing 3D Loader Ring while model loads in WebGL
const ARMatrixLoader: React.FC<{ isDark?: boolean }> = () => {
  const ringRef = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (ringRef.current) {
      ringRef.current.rotation.z = state.clock.getElapsedTime() * 2.0;
    }
  });

  return (
    <group position={[0, 0, 0]}>
      <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.5, 0.55, 48]} />
        <meshBasicMaterial color="#c084fc" transparent opacity={0.85} side={THREE.DoubleSide} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.48, 32]} />
        <meshBasicMaterial color="#06b6d4" transparent opacity={0.2} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
};

// Floor Reticle under the android's feet
const ARFloorReticle: React.FC<{ size: number; floorY: number }> = ({ size, floorY }) => {
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (ringRef.current) {
      ringRef.current.rotation.z += delta * 0.35;
    }
  });

  return (
    <group position={[0, floorY, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      {/* Soft ground contact shadow */}
      <mesh position={[0, 0, -0.01]}>
        <circleGeometry args={[0.85 * size, 32]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.35} depthWrite={false} />
      </mesh>

      {/* Cybernetic holographic target ring */}
      <mesh ref={ringRef} position={[0, 0, 0.01]}>
        <ringGeometry args={[0.7 * size, 0.76 * size, 48]} />
        <meshBasicMaterial color="#a855f7" transparent opacity={0.75} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>

      {/* Inner cyan pulse ring */}
      <mesh position={[0, 0, 0.02]}>
        <ringGeometry args={[0.22 * size, 0.26 * size, 32]} />
        <meshBasicMaterial color="#06b6d4" transparent opacity={0.85} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
};

// Realistic Architectural Studio Wall for Wall Projection Mode & Room Fallback
const VirtualStudioWall: React.FC<{ floorY: number; wallDistance?: number; isPureCinema?: boolean }> = ({ 
  floorY, 
  wallDistance = -1.2,
  isPureCinema = false
}) => {
  if (isPureCinema) return null;

  return (
    <group position={[0, 0, 0]}>
      {/* Illuminated Studio Floor with gentle reflection */}
      <mesh position={[0, floorY - 0.005, -0.6]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[16, 12]} />
        <meshStandardMaterial color="#14141c" roughness={0.7} metalness={0.2} />
      </mesh>
      
      {/* Prominently Illuminated Room / Gym Studio Wall directly behind Android Coach */}
      <mesh position={[0, floorY + 2.0, wallDistance]} rotation={[0, 0, 0]}>
        <planeGeometry args={[16, 9]} />
        <meshStandardMaterial color="#20202e" roughness={0.85} metalness={0.1} />
      </mesh>

      {/* Decorative Wall Projection Frame Border (16:9 Cinema Projection Area) */}
      <mesh position={[0, floorY + 1.25, wallDistance + 0.005]}>
        <planeGeometry args={[4.2, 2.6]} />
        <meshBasicMaterial color="#3b1d60" transparent opacity={0.35} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      <mesh position={[0, floorY + 1.25, wallDistance + 0.008]}>
        <ringGeometry args={[2.08, 2.12, 4]} />
        <meshBasicMaterial color="#a855f7" transparent opacity={0.6} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>

      {/* Architectural Baseboard on Wall */}
      <mesh position={[0, floorY + 0.06, wallDistance + 0.015]}>
        <boxGeometry args={[16, 0.12, 0.04]} />
        <meshStandardMaterial color="#333348" roughness={0.4} metalness={0.5} />
      </mesh>

      {/* Projected Holographic Light Pool / Wall Glow from Projector */}
      <mesh position={[0, floorY + 1.1, wallDistance + 0.01]}>
        <circleGeometry args={[1.6, 48]} />
        <meshBasicMaterial color="#a855f7" transparent opacity={0.25} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      
      {/* Projector Ceiling / Overhead Downlight Grazing Wall */}
      <spotLight
        position={[0, floorY + 4.5, wallDistance + 2.2]}
        target-position={[0, floorY + 1.0, wallDistance]}
        intensity={4.5}
        angle={Math.PI / 2.5}
        penumbra={0.6}
        color="#c084fc"
      />

      {/* Wall Spotlight illuminating the projector screen */}
      <spotLight
        position={[0, floorY + 2.5, 2.0]}
        target-position={[0, floorY + 1.1, wallDistance]}
        intensity={3.8}
        angle={Math.PI / 3.2}
        penumbra={0.5}
        color="#e0e7ff"
      />
    </group>
  );
};

// Holographic Floor Projector Emitter Base for Cinema Projector Mode
const HolographicCinemaEmitter: React.FC<{ floorY: number }> = ({ floorY }) => {
  const beamRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (ringRef.current) {
      ringRef.current.rotation.z = t * 0.6;
    }
    if (beamRef.current) {
      const mat = beamRef.current.material as THREE.MeshBasicMaterial;
      if (mat) {
        mat.opacity = 0.12 + Math.sin(t * 3) * 0.03;
      }
    }
  });

  return (
    <group position={[0, floorY, 0]}>
      {/* Upward Volumetric Holographic Beam Cone */}
      <mesh ref={beamRef} position={[0, 0.9, 0]} rotation={[0, 0, 0]}>
        <cylinderGeometry args={[0.95, 0.45, 1.8, 32, 1, true]} />
        <meshBasicMaterial color="#06b6d4" transparent opacity={0.14} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>

      {/* Projector Pod base on floor */}
      <group rotation={[-Math.PI / 2, 0, 0]}>
        <mesh position={[0, 0, 0.005]}>
          <ringGeometry args={[0.42, 0.46, 48]} />
          <meshBasicMaterial color="#c084fc" transparent opacity={0.9} side={THREE.DoubleSide} />
        </mesh>
        <mesh ref={ringRef} position={[0, 0, 0.01]}>
          <ringGeometry args={[0.7, 0.74, 48]} />
          <meshBasicMaterial color="#06b6d4" transparent opacity={0.8} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, 0, 0.015]}>
          <circleGeometry args={[0.38, 32]} />
          <meshBasicMaterial color="#8a2be2" transparent opacity={0.25} side={THREE.DoubleSide} />
        </mesh>
      </group>
    </group>
  );
};

// Rigged Humanoid Model Runner - Mathematically Centered in Viewport
const ARModelRig: React.FC<{
  url: string;
  exerciseName?: string;
  exerciseId?: string;
  isPaused?: boolean;
  speed?: number;
  scaleMultiplier: number;
  rotationY: number;
  heightOffset: number;
  showFloorReticle?: boolean;
}> = ({ url, exerciseName, exerciseId, isPaused, speed = 1.0, scaleMultiplier, rotationY, heightOffset, showFloorReticle = true }) => {
  const isFBX = url.toLowerCase().includes('.fbx') || url.includes('format=fbx');
  const groupRef = useRef<THREE.Group>(null);
  const engineRef = useRef<HumanoidMotionEngine | null>(null);

  const gltf = useGLTF(!isFBX ? url : COACH_MODEL_URL, '/draco/');
  const fbx = isFBX ? useFBX(url) : null;
  const rawScene = isFBX ? fbx : gltf?.scene;

  const scene = React.useMemo(() => {
    if (!rawScene) return null;
    return SkeletonUtils.clone(rawScene);
  }, [rawScene]);

  // Compute exact center and scale to guarantee dead-center positioning
  const { baseScale, offsetPos, floorY } = React.useMemo(() => {
    if (!scene) return { baseScale: 1, offsetPos: [0, 0, 0] as [number, number, number], floorY: -0.725 };
    scene.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(scene);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const rawH = size.y > 0.5 ? size.y : 5.7;

    // Master unified human height in meters: 1.45m provides ideal framing
    const targetHeight = 1.45;
    const scale = targetHeight / rawH;

    // Symmetric vertical centering:
    // Character height is 1.45m. Floor at -0.725m puts soles at -0.725m and head at +0.725m.
    // Center of the android is EXACTLY at Y = 0.0m (dead-center in front of camera)!
    const floorY = -0.725;

    const posX = -center.x * scale;
    const posY = floorY - (box.min.y * scale);
    const posZ = -center.z * scale;

    return {
      baseScale: scale,
      offsetPos: [posX, posY, posZ] as [number, number, number],
      floorY,
    };
  }, [scene]);

  // Initialize Motion Engine with calibrated floor at floorY (-0.725)
  useEffect(() => {
    if (!scene) return;
    const query = exerciseId || exerciseName || 'idle';
    if (!engineRef.current) {
      if (groupRef.current) {
        groupRef.current.position.set(offsetPos[0], offsetPos[1], offsetPos[2]);
        groupRef.current.scale.set(baseScale, baseScale, baseScale);
        groupRef.current.updateMatrixWorld(true);
      }
      engineRef.current = new HumanoidMotionEngine(scene, baseScale, floorY);
      engineRef.current.setExercise(query, 0.0, true);
    } else {
      engineRef.current.setExercise(query, 0.25, false);
    }
  }, [scene, exerciseId, exerciseName, baseScale, offsetPos, floorY]);

  useFrame((_, delta) => {
    if (!scene || !engineRef.current) return;
    const effectiveDelta = isPaused ? 0 : Math.min(delta, 0.05);
    engineRef.current.update(effectiveDelta, speed, undefined, false);
  });

  return (
    <group 
      rotation={[0, rotationY, 0]} 
      position={[0, heightOffset, 0]}
      scale={[scaleMultiplier, scaleMultiplier, scaleMultiplier]}
    >
      <group 
        ref={groupRef} 
        scale={[baseScale, baseScale, baseScale]} 
        position={offsetPos}
      >
        {scene && <primitive object={scene} />}
      </group>
      {showFloorReticle && <ARFloorReticle size={1.0} floorY={floorY} />}
    </group>
  );
};

// Unified 4-Faced 360° Holographic Pyramid (Pepper's Ghost) running in ONE single Canvas
// Calibrated with heads pointing OUTWARD towards the 4 edges and feet towards center apex
const UnifiedPyramid360Scene: React.FC<{
  url: string;
  exerciseName?: string;
  exerciseId?: string;
  isPaused?: boolean;
  speed?: number;
  pyramidOffset?: number;
  facetScale?: number;
}> = ({ url, exerciseName, exerciseId, isPaused, speed, pyramidOffset = 0.38, facetScale = 0.32 }) => {
  const { viewport } = useThree();
  const minDim = Math.min(viewport.width, viewport.height);

  // Dynamic responsive geometry: guarantees 100% visibility on any screen aspect ratio (GSM portrait to tablet)
  const responsiveOffset = Math.min(pyramidOffset, minDim * 0.28);
  const responsiveScale = Math.min(facetScale, minDim * 0.22);

  return (
    <group position={[0, 0, 0]}>
      {/* Central Alignment Apex Crosshair: exact 1cm square apex tip for physical transparent prism */}
      <group position={[0, 0, 0]}>
        {/* Square apex target marker */}
        <mesh position={[0, 0, 0]} rotation={[0, 0, Math.PI / 4]}>
          <ringGeometry args={[0.035, 0.045, 4]} />
          <meshBasicMaterial color="#06b6d4" transparent opacity={0.85} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, 0, 0]}>
          <circleGeometry args={[0.015, 16]} />
          <meshBasicMaterial color="#c084fc" transparent opacity={0.9} side={THREE.DoubleSide} />
        </mesh>
        {/* Subtle guide ring */}
        <mesh position={[0, 0, -0.01]}>
          <ringGeometry args={[0.12, 0.135, 32]} />
          <meshBasicMaterial color="#9333ea" transparent opacity={0.3} side={THREE.DoubleSide} />
        </mesh>
      </group>

      {/* 1. SOUTH FACET (Bottom face): Front view. Head points DOWN (away from apex), feet point UP towards apex */}
      <group position={[0, -responsiveOffset, 0]} rotation={[0, 0, Math.PI]}>
        <ARModelRig
          url={url}
          exerciseName={exerciseName}
          exerciseId={exerciseId}
          isPaused={isPaused}
          speed={speed}
          scaleMultiplier={responsiveScale}
          rotationY={0}
          heightOffset={0}
          showFloorReticle={false}
        />
      </group>

      {/* 2. NORTH FACET (Top face): Back view. Head points UP (away from apex), feet point DOWN towards apex */}
      <group position={[0, responsiveOffset, 0]} rotation={[0, 0, 0]}>
        <ARModelRig
          url={url}
          exerciseName={exerciseName}
          exerciseId={exerciseId}
          isPaused={isPaused}
          speed={speed}
          scaleMultiplier={responsiveScale}
          rotationY={Math.PI}
          heightOffset={0}
          showFloorReticle={false}
        />
      </group>

      {/* 3. WEST FACET (Left face): Left profile view. Head points LEFT (away from apex), feet point RIGHT towards apex */}
      <group position={[-responsiveOffset, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <ARModelRig
          url={url}
          exerciseName={exerciseName}
          exerciseId={exerciseId}
          isPaused={isPaused}
          speed={speed}
          scaleMultiplier={responsiveScale}
          rotationY={Math.PI / 2}
          heightOffset={0}
          showFloorReticle={false}
        />
      </group>

      {/* 4. EAST FACET (Right face): Right profile view. Head points RIGHT (away from apex), feet point LEFT towards apex */}
      <group position={[responsiveOffset, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
        <ARModelRig
          url={url}
          exerciseName={exerciseName}
          exerciseId={exerciseId}
          isPaused={isPaused}
          speed={speed}
          scaleMultiplier={responsiveScale}
          rotationY={-Math.PI / 2}
          heightOffset={0}
          showFloorReticle={false}
        />
      </group>
    </group>
  );
};

export const HolographicARModal: React.FC<HolographicARModalProps> = ({
  isOpen,
  onClose,
  modelUrl = COACH_MODEL_URL,
  exerciseName = 'Squats',
  exerciseId,
  isPaused: externalIsPaused = false,
  speed = 1.0,
  currentSet,
  targetSets,
  targetReps,
  timer,
}) => {
  const { translate } = useApp();

  // Mode selection: Camera (default) | Pyramid 360 | Projector
  const [projectionMode, setProjectionMode] = useState<ARProjectionMode>('camera_ar');
  const [showHowItWorksModal, setShowHowItWorksModal] = useState<boolean>(false);

  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Model Transform Controls (Default dead-center: heightOffset = 0, scale = 1.0)
  const [scaleMultiplier, setScaleMultiplier] = useState<number>(1.0);
  const [rotationY, setRotationY] = useState<number>(0);
  const [heightOffset, setHeightOffset] = useState<number>(0.0);
  const [pyramidDistance, setPyramidDistance] = useState<number>(0.38);
  const [wallProjectionStyle, setWallProjectionStyle] = useState<'simulated_wall' | 'live_camera_wall' | 'pure_cinema'>('simulated_wall');
  const [wallDistance, setWallDistance] = useState<number>(-1.2);
  const [isPaused, setIsPaused] = useState<boolean>(externalIsPaused);
  const [showTuningDrawer, setShowTuningDrawer] = useState<boolean>(false);
  const [snapshotTaken, setSnapshotTaken] = useState<boolean>(false);
  const [isTorchOn, setIsTorchOn] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Toggle phone LED torch/flashlight
  const toggleTorch = async () => {
    try {
      const track = streamRef.current?.getVideoTracks()[0];
      if (track) {
        const nextTorch = !isTorchOn;
        await (track as any).applyConstraints?.({
          advanced: [{ torch: nextTorch }],
        });
        setIsTorchOn(nextTorch);
      }
    } catch (e) {
      console.warn('Torch constraint not supported', e);
    }
  };

  // Start Camera Stream
  const startCamera = useCallback(async (facing: 'environment' | 'user') => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      setErrorMessage(null);

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: facing },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(console.error);
      }
      setHasCameraPermission(true);
    } catch (err: any) {
      console.warn('Camera access warning:', err);
      try {
        const fallbackStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        streamRef.current = fallbackStream;
        if (videoRef.current) {
          videoRef.current.srcObject = fallbackStream;
          videoRef.current.play().catch(console.error);
        }
        setHasCameraPermission(true);
      } catch (fallbackErr: any) {
        setHasCameraPermission(false);
        setErrorMessage(translate('ar.camera_permission_desc'));
      }
    }
  }, [translate]);

  useEffect(() => {
    const needsCamera = isOpen && (
      projectionMode === 'camera_ar' || 
      (projectionMode === 'projector_cinema' && wallProjectionStyle === 'live_camera_wall')
    );

    if (needsCamera) {
      startCamera(cameraFacing);
    } else {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      setIsTorchOn(false);
    }

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      setIsTorchOn(false);
    };
  }, [isOpen, projectionMode, wallProjectionStyle, cameraFacing, startCamera]);

  // Flip Camera between back and front
  const toggleCameraFacing = () => {
    const nextFacing = cameraFacing === 'environment' ? 'user' : 'environment';
    setCameraFacing(nextFacing);
    startCamera(nextFacing);
  };

  // Toggle Fullscreen for Projector & Pyramid Modes
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.().catch(console.warn);
    } else {
      document.exitFullscreen?.().catch(console.warn);
    }
  };

  // Screen Cast / Share Presentation Helper
  const handleShareCast = () => {
    if (navigator.share) {
      navigator.share({
        title: `Fit-4rce X Hologram · ${exerciseName}`,
        text: `Watch 3D Holographic Coach ${exerciseName} in full screen!`,
        url: window.location.href,
      }).catch(console.warn);
    } else {
      toggleFullscreen();
    }
  };

  // Zoom helpers
  const handleZoomIn = () => setScaleMultiplier((prev) => Math.min(prev + 0.15, 1.8));
  const handleZoomOut = () => setScaleMultiplier((prev) => Math.max(prev - 0.15, 0.45));
  const handleRotate = () => setRotationY((prev) => prev + Math.PI / 4);

  // Capture Photo
  const captureSnapshot = () => {
    if (!videoRef.current || !containerRef.current) return;

    try {
      const canvasElements = containerRef.current.querySelectorAll('canvas');
      const threeCanvas = canvasElements[0];
      if (!threeCanvas) return;

      const offscreen = document.createElement('canvas');
      offscreen.width = videoRef.current.videoWidth || window.innerWidth;
      offscreen.height = videoRef.current.videoHeight || window.innerHeight;
      const ctx = offscreen.getContext('2d');
      if (!ctx) return;

      ctx.drawImage(videoRef.current, 0, 0, offscreen.width, offscreen.height);
      ctx.drawImage(threeCanvas, 0, 0, offscreen.width, offscreen.height);

      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.roundRect(20, offscreen.height - 70, 260, 42, 10);
      ctx.fill();
      ctx.fillStyle = '#c084fc';
      ctx.font = 'bold 15px Poppins, sans-serif';
      ctx.fillText(`FIT-4RCE X · ${translate('ar.hologram').toUpperCase()}`, 35, offscreen.height - 43);

      const dataUrl = offscreen.toDataURL('image/jpeg', 0.95);
      const link = document.createElement('a');
      link.download = `fit4rce-hologram-${Date.now()}.jpg`;
      link.href = dataUrl;
      link.click();

      setSnapshotTaken(true);
      setTimeout(() => setSnapshotTaken(false), 2500);
    } catch (err) {
      console.error('Snapshot error:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 z-[9999] bg-black flex flex-col font-['Poppins'] select-none overflow-hidden"
    >
      {/* ======================================================== */}
      {/* MODE 1: CAMERA STREAM + 3D COACH DEAD-CENTER            */}
      {/* ======================================================== */}
      {projectionMode === 'camera_ar' && (
        <>
          {/* CAMERA VIDEO FEED */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`absolute inset-0 w-full h-full object-cover z-0 ${
              cameraFacing === 'user' ? 'transform -scale-x-100' : ''
            }`}
          />

          {/* Subdued ambient cyber grid */}
          <div className="absolute inset-0 z-5 pointer-events-none opacity-15 bg-[radial-gradient(#8a2be2_1px,transparent_1px)] [background-size:24px_24px]" />

          {/* THREE.JS 3D CANVAS - OCCUPIES 100% OF SCREEN WITH MODEL DEAD-CENTER */}
          <div className="absolute inset-0 z-10 flex items-center justify-center">
            <Canvas
              gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
              camera={{ position: [0, 0, 2.7], fov: 38 }}
              dpr={[1, 2]}
            >
              <ambientLight intensity={1.6} color="#ffffff" />
              <directionalLight position={[2, 5, 3]} intensity={2.0} color="#ffffff" />
              <directionalLight position={[-3, 2, -2]} intensity={1.2} color="#a855f7" />
              <pointLight position={[0, 0.3, 1.5]} intensity={1.6} color="#06b6d4" />

              <Suspense fallback={<ARMatrixLoader />}>
                <ARModelRig
                  url={modelUrl}
                  exerciseName={exerciseName}
                  exerciseId={exerciseId}
                  isPaused={isPaused}
                  speed={speed}
                  scaleMultiplier={scaleMultiplier}
                  rotationY={rotationY}
                  heightOffset={heightOffset}
                  showFloorReticle={true}
                />
              </Suspense>

              <OrbitControls
                enableZoom={false}
                enablePan={false}
                target={[0, 0, 0]}
                minPolarAngle={Math.PI / 6}
                maxPolarAngle={Math.PI / 1.75}
              />
            </Canvas>
          </div>
        </>
      )}

      {/* ======================================================== */}
      {/* MODE 2: PYRAMIDE HOLOGRAPHIQUE 360° (SUR TABLE)         */}
      {/* Running synchronously in ONE single WebGL Canvas        */}
      {/* ======================================================== */}
      {projectionMode === 'pyramid_360' && (
        <div className="absolute inset-0 z-10 bg-black flex items-center justify-center overflow-hidden">
          <Canvas
            gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
            camera={{ position: [0, 0, 3.8], fov: 44 }}
            dpr={[1, 2]}
          >
            <color attach="background" args={['#000000']} />
            <ambientLight intensity={1.8} color="#ffffff" />
            <directionalLight position={[0, 4, 3]} intensity={2.2} color="#ffffff" />
            <directionalLight position={[0, 0, 4]} intensity={1.6} color="#c084fc" />

            <Suspense fallback={<ARMatrixLoader />}>
              <UnifiedPyramid360Scene
                url={modelUrl}
                exerciseName={exerciseName}
                exerciseId={exerciseId}
                isPaused={isPaused}
                speed={speed}
                pyramidOffset={pyramidDistance}
                facetScale={0.38 * scaleMultiplier}
              />
            </Suspense>
          </Canvas>

          {/* Quick Prism Presets Bar */}
          <div className="absolute top-16 z-30 px-3 py-1.5 rounded-full bg-neutral-950/85 backdrop-blur-md border border-purple-500/40 flex items-center gap-1.5 shadow-2xl">
            <button
              onClick={() => { setPyramidDistance(0.40); setScaleMultiplier(0.9); }}
              className={`px-2.5 py-1 rounded-full text-[9px] font-bold uppercase transition-all ${
                Math.abs(pyramidDistance - 0.40) < 0.03 ? 'bg-purple-600 text-white shadow' : 'text-gray-300 hover:text-white'
              }`}
            >
              {translate('ar.prism_gsm')}
            </button>
            <button
              onClick={() => { setPyramidDistance(0.48); setScaleMultiplier(1.0); }}
              className={`px-2.5 py-1 rounded-full text-[9px] font-bold uppercase transition-all ${
                Math.abs(pyramidDistance - 0.48) < 0.03 ? 'bg-purple-600 text-white shadow' : 'text-gray-300 hover:text-white'
              }`}
            >
              {translate('ar.prism_standard')}
            </button>
            <button
              onClick={() => { setPyramidDistance(0.62); setScaleMultiplier(1.2); }}
              className={`px-2.5 py-1 rounded-full text-[9px] font-bold uppercase transition-all ${
                Math.abs(pyramidDistance - 0.62) < 0.03 ? 'bg-purple-600 text-white shadow' : 'text-gray-300 hover:text-white'
              }`}
            >
              {translate('ar.prism_tablet')}
            </button>
          </div>

          {/* Instructions tag */}
          <div className="absolute bottom-20 z-30 px-3.5 py-1.5 rounded-full bg-neutral-900/90 border border-purple-500/40 text-purple-300 text-[10px] font-bold shadow-2xl pointer-events-none text-center max-w-xs">
            {translate('ar.pyramid_hint')}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODE 3: PROJECTEUR CINÉMA / PROJECTION MURALE (1M80)    */}
      {/* Ultra-High Contrast Pure Black Screen with Beaming Cone  */}
      {/* ======================================================== */}
      {projectionMode === 'projector_cinema' && (
        <div className="absolute inset-0 z-10 bg-black flex items-center justify-center overflow-hidden">
          <Canvas
            gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
            camera={{ position: [0, 0, 2.7], fov: 38 }}
            dpr={[1, 2]}
          >
            <color attach="background" args={['#000000']} />
            <ambientLight intensity={wallProjectionStyle === 'simulated_wall' ? 1.5 : 1.9} color="#ffffff" />
            <directionalLight position={[0, 4, 3]} intensity={2.2} color="#ffffff" />
            <directionalLight position={[0, 2, -3]} intensity={2.0} color="#a855f7" />
            <pointLight position={[0, 0.2, 1.5]} intensity={1.8} color="#06b6d4" />

            {/* Virtual Studio Gym Wall with Projector Cone & Spotlight */}
            <VirtualStudioWall 
              floorY={-0.725 + heightOffset} 
              wallDistance={wallDistance} 
              isPureCinema={wallProjectionStyle === 'pure_cinema'} 
            />

            {/* Glowing Floor Hologram Projector Unit with Upward Volumetric Beams */}
            <HolographicCinemaEmitter floorY={-0.725 + heightOffset} />

            <Suspense fallback={<ARMatrixLoader />}>
              <ARModelRig
                url={modelUrl}
                exerciseName={exerciseName}
                exerciseId={exerciseId}
                isPaused={isPaused}
                speed={speed}
                scaleMultiplier={scaleMultiplier}
                rotationY={rotationY}
                heightOffset={heightOffset}
                showFloorReticle={true}
              />
            </Suspense>

            <OrbitControls
              enableZoom={false}
              enablePan={false}
              target={[0, 0, 0]}
            />
          </Canvas>

          {/* Projector instruction banner & quick actions */}
          <div className="absolute top-16 z-30 px-3 py-1.5 rounded-2xl bg-neutral-950/90 backdrop-blur-md border border-amber-500/40 text-amber-300 text-[11px] font-bold shadow-2xl flex items-center gap-2 max-w-[95vw] overflow-x-auto">
            <div className="flex items-center gap-1 p-0.5 bg-black/60 rounded-xl border border-white/10 shrink-0">
              <button
                onClick={() => setWallProjectionStyle('simulated_wall')}
                className={`px-2 py-1 rounded-lg text-[9px] font-bold uppercase transition-all ${
                  wallProjectionStyle === 'simulated_wall'
                    ? 'bg-amber-500 text-black shadow'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {translate('ar.simulated_wall')}
              </button>
              <button
                onClick={() => setWallProjectionStyle('pure_cinema')}
                className={`px-2 py-1 rounded-lg text-[9px] font-bold uppercase transition-all ${
                  wallProjectionStyle === 'pure_cinema'
                    ? 'bg-amber-500 text-black shadow'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {translate('ar.true_projector')}
              </button>
            </div>
            <button
              onClick={toggleFullscreen}
              className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/50 text-[10px] font-black uppercase tracking-wider transition-all shrink-0"
            >
              {translate('ar.fullscreen')}
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TOP COMPACT BAR: PURE DISCRETION, NEVER CLUTTERING       */}
      {/* ======================================================== */}
      <div className="relative z-30 p-2.5 sm:p-4 flex items-center justify-between pointer-events-none gap-2">
        {/* Left: Close Button */}
        <button
          onClick={onClose}
          className="p-2 rounded-full bg-black/75 backdrop-blur-md text-white border border-white/20 active:scale-90 hover:bg-black/90 transition-all shadow-xl pointer-events-auto shrink-0"
          title={translate('ar.close')}
        >
          <X size={18} />
        </button>

        {/* Center: Mode Tabs */}
        <div className="flex items-center gap-1 p-1 bg-black/80 backdrop-blur-xl border border-white/15 rounded-full shadow-2xl pointer-events-auto">
          <button
            onClick={() => setProjectionMode('camera_ar')}
            className={`px-2.5 py-1 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-wider flex items-center gap-1 transition-all ${
              projectionMode === 'camera_ar'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Smartphone size={12} />
            <span>{translate('ar.room')}</span>
          </button>

          <button
            onClick={() => setProjectionMode('pyramid_360')}
            className={`px-2.5 py-1 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-wider flex items-center gap-1 transition-all ${
              projectionMode === 'pyramid_360'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Box size={12} />
            <span>{translate('ar.pyramid')}</span>
          </button>

          <button
            onClick={() => setProjectionMode('projector_cinema')}
            className={`px-2.5 py-1 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-wider flex items-center gap-1 transition-all ${
              projectionMode === 'projector_cinema'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Monitor size={12} />
            <span>{translate('ar.projector')}</span>
          </button>
        </div>

        {/* Right Tools */}
        <div className="flex items-center gap-1.5 pointer-events-auto shrink-0">
          <button
            onClick={() => setShowHowItWorksModal(true)}
            className="p-2 rounded-full bg-amber-500/20 border border-amber-500/50 text-amber-300 backdrop-blur-md active:scale-90 transition-all shadow-lg"
            title={translate('ar.guide_title')}
          >
            <HelpCircle size={16} />
          </button>

          {projectionMode === 'camera_ar' && (
            <button
              onClick={toggleCameraFacing}
              className="p-2 rounded-full bg-black/75 backdrop-blur-md text-white border border-white/20 active:scale-90 transition-all shadow-lg"
              title={translate('ar.switch_camera')}
            >
              <FlipHorizontal size={16} />
            </button>
          )}

          {(projectionMode === 'projector_cinema' || projectionMode === 'pyramid_360') && (
            <>
              <button
                onClick={handleShareCast}
                className="p-2 rounded-full bg-black/75 backdrop-blur-md text-white border border-white/20 active:scale-90 transition-all shadow-lg"
                title="Cast / AirPlay"
              >
                <Share2 size={16} />
              </button>
              <button
                onClick={toggleFullscreen}
                className="p-2 rounded-full bg-black/75 backdrop-blur-md text-white border border-white/20 active:scale-90 transition-all shadow-lg"
                title={translate('ar.fullscreen')}
              >
                <Maximize size={16} />
              </button>
            </>
          )}

          <button
            onClick={() => setShowTuningDrawer(!showTuningDrawer)}
            className={`p-2 rounded-full backdrop-blur-md border active:scale-90 transition-all shadow-lg ${
              showTuningDrawer ? 'bg-purple-600 text-white border-purple-400' : 'bg-black/75 text-gray-300 border-white/20'
            }`}
            title={translate('ar.tuning')}
          >
            <Sliders size={16} />
          </button>
        </div>
      </div>

      {/* DISCRETE WORKOUT HUD PILL (WHEN ACTIVE SESSION) */}
      {(exerciseName || timer !== undefined) && (
        <div className="relative z-30 px-3 sm:px-5 pointer-events-none mt-1">
          <div className="inline-flex items-center gap-2.5 px-3 py-1 rounded-xl bg-black/80 backdrop-blur-md border border-white/15 text-white shadow-xl">
            <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
            <span className="text-[11px] font-black uppercase tracking-wide text-purple-300">
              {exerciseName}
            </span>
            {currentSet !== undefined && (
              <span className="text-[9px] text-gray-300 font-mono">
                {currentSet}/{targetSets}
              </span>
            )}
            {timer !== undefined && (
              <span className="pl-1.5 border-l border-white/20 text-emerald-400 font-mono font-bold text-xs">
                {timer}s
              </span>
            )}
          </div>
        </div>
      )}

      {/* OPTIONAL TUNING DRAWER (COLLAPSED BY DEFAULT) */}
      {showTuningDrawer && (
        <div className="relative z-30 px-3 sm:px-4 mt-2 max-w-sm mx-auto w-full pointer-events-auto">
          <div className="bg-black/90 backdrop-blur-xl border border-purple-500/40 rounded-2xl p-3 shadow-2xl space-y-2.5 animate-fadeIn">
            <div className="flex items-center justify-between text-[11px] text-gray-300 font-bold">
              <span>{translate('ar.height_centering')}</span>
              <span className="font-mono text-cyan-400">
                {heightOffset > 0 ? `+${Math.round(heightOffset * 100)}cm` : `${Math.round(heightOffset * 100)}cm`}
              </span>
            </div>
            <input
              type="range"
              min="-0.5"
              max="0.5"
              step="0.05"
              value={heightOffset}
              onChange={(e) => setHeightOffset(parseFloat(e.target.value))}
              className="w-full h-1 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />

            {projectionMode === 'pyramid_360' && (
              <>
                <div className="flex items-center justify-between text-[11px] text-gray-300 font-bold pt-1">
                  <span>{translate('ar.pyramid_spread')}</span>
                  <span className="font-mono text-purple-400">
                    {Math.round(pyramidDistance * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.25"
                  max="0.80"
                  step="0.02"
                  value={pyramidDistance}
                  onChange={(e) => setPyramidDistance(parseFloat(e.target.value))}
                  className="w-full h-1 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-purple-400"
                />
              </>
            )}

            {projectionMode === 'projector_cinema' && (
              <>
                <div className="flex items-center justify-between text-[11px] text-gray-300 font-bold pt-1">
                  <span>{translate('ar.wall_distance')}</span>
                  <span className="font-mono text-amber-400">
                    {Math.abs(Math.round(wallDistance * 100))}cm
                  </span>
                </div>
                <input
                  type="range"
                  min="-1.2"
                  max="-0.3"
                  step="0.05"
                  value={wallDistance}
                  onChange={(e) => setWallDistance(parseFloat(e.target.value))}
                  className="w-full h-1 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-amber-400"
                />
              </>
            )}

            <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-white/10">
              <button
                onClick={() => { setHeightOffset(0); setScaleMultiplier(1.0); setRotationY(0); setPyramidDistance(0.44); setWallDistance(-0.65); }}
                className="flex-1 py-1 rounded-lg bg-neutral-800 text-[10px] font-bold text-gray-300 hover:text-white"
              >
                {translate('ar.reset_center')}
              </button>
              <button
                onClick={() => setShowTuningDrawer(false)}
                className="px-3 py-1 rounded-lg bg-purple-600 text-[10px] font-bold text-white"
              >
                {translate('ar.close')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CAMERA PERMISSION ERROR */}
      {projectionMode === 'camera_ar' && hasCameraPermission === false && (
        <div className="absolute inset-0 z-40 bg-neutral-950/95 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-14 h-14 rounded-full bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-400 mb-3">
            <Camera size={28} />
          </div>
          <h3 className="text-base font-bold text-white mb-1.5">{translate('ar.camera_required')}</h3>
          <p className="text-xs text-gray-400 max-w-xs mb-5 leading-relaxed">
            {errorMessage || translate('ar.camera_permission_desc')}
          </p>
          <button
            onClick={() => startCamera(cameraFacing)}
            className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg"
          >
            {translate('ar.allow_camera')}
          </button>
        </div>
      )}

      {/* ======================================================== */}
      {/* BOTTOM FLOATING CONTROLS CAPSULE - ULTRA SLEEK & COMPACT */}
      {/* ======================================================== */}
      <div className="mt-auto relative z-30 pb-4 sm:pb-6 px-4 flex items-center justify-center pointer-events-none">
        <div className="pointer-events-auto px-4 py-2 rounded-full bg-black/80 backdrop-blur-xl border border-white/20 shadow-2xl flex items-center gap-3">
          {/* Pause / Play */}
          <button
            onClick={() => setIsPaused(!isPaused)}
            className="p-2 rounded-full text-white hover:text-emerald-400 transition-colors active:scale-90"
            title={isPaused ? translate('ar.resume') : translate('ar.pause')}
          >
            {isPaused ? <Play size={18} fill="currentColor" className="text-emerald-400 ml-0.5" /> : <Pause size={18} fill="currentColor" />}
          </button>

          <div className="w-px h-4 bg-white/20" />

          {/* Zoom Out */}
          <button
            onClick={handleZoomOut}
            className="p-1.5 text-gray-300 hover:text-white transition-colors active:scale-90"
            title={translate('ar.zoom_out')}
          >
            <ZoomOut size={16} />
          </button>

          {/* Scale Indicator */}
          <span className="text-[10px] font-mono text-purple-300 font-bold min-w-[36px] text-center">
            {Math.round(scaleMultiplier * 100)}%
          </span>

          {/* Zoom In */}
          <button
            onClick={handleZoomIn}
            className="p-1.5 text-gray-300 hover:text-white transition-colors active:scale-90"
            title={translate('ar.zoom_in')}
          >
            <ZoomIn size={16} />
          </button>

          <div className="w-px h-4 bg-white/20" />

          {/* Rotate 45deg */}
          <button
            onClick={handleRotate}
            className="p-1.5 text-gray-300 hover:text-white transition-colors active:scale-90 flex items-center gap-1 text-[10px] font-bold"
            title={translate('ar.rotate')}
          >
            <RotateCw size={15} />
          </button>

          {/* Photo Capture (in Camera mode) */}
          {projectionMode === 'camera_ar' && (
            <>
              <div className="w-px h-4 bg-white/20" />
              <button
                onClick={captureSnapshot}
                className="p-2 rounded-full bg-purple-600 text-white hover:bg-purple-500 transition-colors active:scale-90 shadow-md"
                title={translate('ar.snapshot')}
              >
                {snapshotTaken ? <Check size={16} className="text-emerald-300" /> : <Camera size={16} />}
              </button>
            </>
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* EDUCATIONAL MODAL: "COMMENT PROJETER DANS LA PIÈCE"     */}
      {/* ======================================================== */}
      {showHowItWorksModal && (
        <div 
          onClick={() => setShowHowItWorksModal(false)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 overflow-y-auto"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-neutral-900 border border-purple-500/40 rounded-3xl p-5 max-w-md w-full space-y-3.5 shadow-2xl my-auto text-left"
          >
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <h3 className="font-black uppercase text-xs sm:text-sm tracking-wider text-white">
                {translate('ar.guide_title')}
              </h3>
              <button
                onClick={() => setShowHowItWorksModal(false)}
                className="p-1.5 rounded-full bg-neutral-800 text-gray-400 hover:text-white"
                title={translate('ar.close')}
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-[11px] text-gray-300 leading-relaxed">
              {translate('ar.guide_intro')}
            </p>

            {/* Method 1: Pyramide */}
            <div className="p-3 rounded-xl bg-black/60 border border-purple-500/30 space-y-1">
              <span className="text-[11px] font-bold text-purple-400 uppercase">
                {translate('ar.guide_pyramid_title')}
              </span>
              <p className="text-[10px] text-gray-300 leading-relaxed">
                {translate('ar.guide_pyramid_desc')}
              </p>
            </div>

            {/* Method 2: Projecteur Vidéo */}
            <div className="p-3 rounded-xl bg-black/60 border border-amber-500/30 space-y-1">
              <span className="text-[11px] font-bold text-amber-400 uppercase">
                {translate('ar.guide_projector_title')}
              </span>
              <p className="text-[10px] text-gray-300 leading-relaxed">
                {translate('ar.guide_projector_desc')}
              </p>
            </div>

            {/* Method 3: Caméra Pièce */}
            <div className="p-3 rounded-xl bg-black/60 border border-cyan-500/30 space-y-1">
              <span className="text-[11px] font-bold text-cyan-400 uppercase">
                {translate('ar.guide_room_title')}
              </span>
              <p className="text-[10px] text-gray-300 leading-relaxed">
                {translate('ar.guide_room_desc')}
              </p>
            </div>

            <button
              onClick={() => setShowHowItWorksModal(false)}
              className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg"
            >
              {translate('ar.guide_close')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default HolographicARModal;
