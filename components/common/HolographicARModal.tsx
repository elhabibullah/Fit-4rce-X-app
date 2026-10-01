import React, { useState, useRef, useEffect, useCallback, Suspense, useMemo } from 'react';
import { 
  X, Camera, RotateCw, ZoomIn, ZoomOut, 
  Check, FlipHorizontal, Play, Pause, 
  Sliders, Maximize, HelpCircle, Monitor, Box, 
  Smartphone, Share2, Eye, Cast, Tv, Wifi, Cable,
  Layers, ChevronDown, CheckCircle2,
  Loader2
} from 'lucide-react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, useGLTF, useFBX } from '@react-three/drei';
import * as THREE from 'three';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';
import { COACH_MODEL_URL } from '../../lib/constants.ts';
import { HumanoidMotionEngine } from '../../lib/animation/humanoidMotionEngine.ts';
import { useApp } from '../../hooks/useApp.ts';

export type ARProjectionMode = 'pyramid_360' | 'projector_cinema' | 'studio_3d' | 'camera_ar';

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

    // Master unified human height in meters: 1.68m provides commanding presence
    const targetHeight = 1.68;
    const scale = targetHeight / rawH;

    // Symmetric vertical centering:
    // Character height is 1.68m. Floor at -0.84m puts soles at -0.84m and head at +0.84m.
    const floorY = -0.84;

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
      engineRef.current.disableGroundSolver = !showFloorReticle;
      engineRef.current.setExercise(query, 0.0, true);
    } else {
      engineRef.current.disableGroundSolver = !showFloorReticle;
      engineRef.current.setExercise(query, 0.25, false);
    }
  }, [scene, exerciseId, exerciseName, baseScale, offsetPos, floorY, showFloorReticle]);

  useFrame((_, delta) => {
    if (!scene || !engineRef.current) return;
    engineRef.current.disableGroundSolver = !showFloorReticle;
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
// Fully responsive across all mobile screens in portrait or landscape (never cropped or invisible)
const UnifiedPyramid360Scene: React.FC<{
  url?: string;
  exerciseName?: string;
  exerciseId?: string;
  isPaused?: boolean;
  speed?: number;
  pyramidOffset?: number;
  facetScale?: number;
  showGuides?: boolean;
}> = ({ url = COACH_MODEL_URL, exerciseName, exerciseId, isPaused, speed, pyramidOffset = 1.35, facetScale = 0.38, showGuides = true }) => {
  const { viewport } = useThree();
  const minDim = Math.min(viewport.width, viewport.height);

  // Responsive pyramid geometry guaranteed to fit within portrait/landscape screen bounds
  const offsetRatio = (pyramidOffset / 1.35);
  const effectiveOffset = Math.max(0.24, Math.min(minDim * 0.28 * offsetRatio, minDim * 0.38));
  const scaleRatio = (facetScale / 0.38);
  const effectiveScale = Math.max(0.16, Math.min(scaleRatio * ((minDim * 0.30) / 1.68), (minDim * 0.34) / 1.68));

  const apexTargetSize = Math.max(0.06, minDim * 0.06);
  const apexGuideSquare = Math.max(0.14, minDim * 0.14);
  const apexOuterCircle = Math.max(0.22, minDim * 0.22);

  return (
    <group position={[0, 0, 0]}>
      {/* Central Alignment Apex Crosshair and Physical Prism Base Footprint */}
      {showGuides && (
        <group position={[0, 0, 0]}>
          {/* Central Apex Target for physical transparent pyramid tip */}
          <mesh position={[0, 0, 0]} rotation={[0, 0, Math.PI / 4]}>
            <ringGeometry args={[apexTargetSize * 0.85, apexTargetSize, 4]} />
            <meshBasicMaterial color="#06b6d4" transparent opacity={0.85} side={THREE.DoubleSide} />
          </mesh>
          <mesh position={[0, 0, 0]}>
            <circleGeometry args={[apexTargetSize * 0.2, 24]} />
            <meshBasicMaterial color="#c084fc" transparent opacity={0.95} side={THREE.DoubleSide} />
          </mesh>
          {/* Diagonal 45-degree ray lines showing prism facet edges */}
          <mesh position={[0, 0, -0.01]} rotation={[0, 0, Math.PI / 4]}>
            <ringGeometry args={[apexGuideSquare * 0.95, apexGuideSquare, 4]} />
            <meshBasicMaterial color="#a855f7" transparent opacity={0.5} side={THREE.DoubleSide} />
          </mesh>
          {/* Outer clearance circle */}
          <mesh position={[0, 0, -0.02]}>
            <ringGeometry args={[apexOuterCircle * 0.96, apexOuterCircle, 48]} />
            <meshBasicMaterial color="#06b6d4" transparent opacity={0.3} side={THREE.DoubleSide} />
          </mesh>
        </group>
      )}

      {/* 1. SOUTH FACET (Bottom face): Front view. Head points DOWN (away from apex), feet point UP towards apex */}
      <group position={[0, -effectiveOffset, 0]} rotation={[0, 0, Math.PI]}>
        <ARModelRig
          url={url}
          exerciseName={exerciseName}
          exerciseId={exerciseId}
          isPaused={isPaused}
          speed={speed}
          scaleMultiplier={effectiveScale}
          rotationY={0}
          heightOffset={0}
          showFloorReticle={false}
        />
      </group>

      {/* 2. NORTH FACET (Top face): Back view. Head points UP (away from apex), feet point DOWN towards apex */}
      <group position={[0, effectiveOffset, 0]} rotation={[0, 0, 0]}>
        <ARModelRig
          url={url}
          exerciseName={exerciseName}
          exerciseId={exerciseId}
          isPaused={isPaused}
          speed={speed}
          scaleMultiplier={effectiveScale}
          rotationY={Math.PI}
          heightOffset={0}
          showFloorReticle={false}
        />
      </group>

      {/* 3. WEST FACET (Left face): Right profile view. Head points LEFT (away from apex), feet point RIGHT towards apex */}
      <group position={[-effectiveOffset, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <ARModelRig
          url={url}
          exerciseName={exerciseName}
          exerciseId={exerciseId}
          isPaused={isPaused}
          speed={speed}
          scaleMultiplier={effectiveScale}
          rotationY={-Math.PI / 2}
          heightOffset={0}
          showFloorReticle={false}
        />
      </group>

      {/* 4. EAST FACET (Right face): Left profile view. Head points RIGHT (away from apex), feet point LEFT towards apex */}
      <group position={[effectiveOffset, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
        <ARModelRig
          url={url}
          exerciseName={exerciseName}
          exerciseId={exerciseId}
          isPaused={isPaused}
          speed={speed}
          scaleMultiplier={effectiveScale}
          rotationY={Math.PI / 2}
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

  // Mode selection: Pyramid 360 (default) | Projector | 3D Studio | Camera AR
  const [projectionMode, setProjectionMode] = useState<ARProjectionMode>('pyramid_360');
  const [showHowItWorksModal, setShowHowItWorksModal] = useState<boolean>(false);
  const [showProjectionConnectModal, setShowProjectionConnectModal] = useState<boolean>(false);
  const [projectionConnectTab, setProjectionConnectTab] = useState<'cable' | 'wireless'>('cable');

  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [isRequestingCamera, setIsRequestingCamera] = useState<boolean>(false);
  const [useVirtualStudioFallback, setUseVirtualStudioFallback] = useState<boolean>(false);
  const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Model Transform Controls (Default dead-center: heightOffset = 0, scale = 1.0)
  const [scaleMultiplier, setScaleMultiplier] = useState<number>(1.0);
  const [rotationY, setRotationY] = useState<number>(0);
  const [heightOffset, setHeightOffset] = useState<number>(0.0);
  const [pyramidDistance, setPyramidDistance] = useState<number>(1.30);
  const [showPyramidGuides, setShowPyramidGuides] = useState<boolean>(true);
  const [isCameraStreaming, setIsCameraStreaming] = useState<boolean>(false);
  const [wallProjectionStyle, setWallProjectionStyle] = useState<'simulated_wall' | 'pure_cinema'>('pure_cinema');
  const [wallDistance, setWallDistance] = useState<number>(-1.2);
  const [isPaused, setIsPaused] = useState<boolean>(externalIsPaused);
  const [showTuningDrawer, setShowTuningDrawer] = useState<boolean>(false);
  const [snapshotTaken, setSnapshotTaken] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const attachAndPlayVideo = useCallback(async (video: HTMLVideoElement, stream: MediaStream) => {
    try {
      video.muted = true;
      video.defaultMuted = true;
      video.playsInline = true;
      video.setAttribute('playsinline', '');
      video.setAttribute('webkit-playsinline', '');
      if (video.srcObject !== stream) {
        video.srcObject = stream;
      }
      await video.play();
      setIsCameraStreaming(true);
    } catch (err) {
      console.warn('Camera video waiting for user gesture or loading:', err);
      setIsCameraStreaming(false);
    }
  }, []);

  // Start Camera Stream
  const startCamera = useCallback(async (facing: 'environment' | 'user') => {
    setIsRequestingCamera(true);
    setErrorMessage(null);
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }

      if (!navigator?.mediaDevices?.getUserMedia) {
        throw new Error(translate('ar.camera_access_desc'));
      }

      // Soft constraints to avoid OverconstrainedError on multi-lens mobile devices
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: facing === 'user' ? 'user' : 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      let stream: MediaStream | null = null;
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (firstErr: any) {
        console.warn('Ideal constraint failed, attempting basic fallback:', firstErr);
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      }

      if (stream) {
        streamRef.current = stream;
        setHasCameraPermission(true);
        setUseVirtualStudioFallback(false);
        if (videoRef.current) {
          await attachAndPlayVideo(videoRef.current, stream);
        }
      }
    } catch (err: any) {
      console.warn('Camera access error:', err);
      setHasCameraPermission(false);
      setIsCameraStreaming(false);

      const msg = translate('ar.camera_access_desc');
      setErrorMessage(msg);
    } finally {
      setIsRequestingCamera(false);
    }
  }, [attachAndPlayVideo, translate]);

  useEffect(() => {
    if (videoRef.current && streamRef.current && !isCameraStreaming) {
      attachAndPlayVideo(videoRef.current, streamRef.current);
    }
  }, [hasCameraPermission, projectionMode, attachAndPlayVideo, isCameraStreaming]);

  useEffect(() => {
    const needsCamera = isOpen && projectionMode === 'camera_ar';

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
      setIsCameraStreaming(false);
    }

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      setIsCameraStreaming(false);
    };
  }, [isOpen, projectionMode, cameraFacing, startCamera]);

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

  const [selectedTvBrand, setSelectedTvBrand] = useState<'lg' | 'samsung' | 'chromecast' | 'apple' | 'projector'>('lg');

  // Wireless TV & Presentation Cast Handler
  const handleStartTVCast = async () => {
    // 1. Try modern Web Presentation API (opens native Cast/TV picker in Chromium)
    if ((window as any).PresentationRequest) {
      try {
        const presentationRequest = new (window as any).PresentationRequest(['/']);
        await presentationRequest.start();
        return;
      } catch (err: any) {
        console.log('Presentation API prompt dismissed:', err?.message);
      }
    }

    // 2. Put in pure cinema black screen mode and enter fullscreen for phone-to-TV screen mirroring
    setWallProjectionStyle('pure_cinema');
    toggleFullscreen();
    setShowProjectionConnectModal(false);
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
          {/* CAMERA VIDEO FEED: Live room stream (hidden when studio fallback active) */}
          {!useVirtualStudioFallback && (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              controls={false}
              onLoadedMetadata={() => {
                if (videoRef.current && streamRef.current) {
                  attachAndPlayVideo(videoRef.current, streamRef.current);
                }
              }}
              onPlaying={() => setIsCameraStreaming(true)}
              className={`absolute inset-0 w-full h-full object-cover z-0 pointer-events-none ${
                cameraFacing === 'user' ? 'transform -scale-x-100' : ''
              }`}
            />
          )}

          {/* Subdued ambient cyber grid */}
          <div className="absolute inset-0 z-5 pointer-events-none opacity-10 bg-[radial-gradient(#8a2be2_1px,transparent_1px)] [background-size:24px_24px]" />

          {/* Camera Permission Prompt / Fallback Banner if denied */}
          {hasCameraPermission === false && !useVirtualStudioFallback && (
            <div className="absolute inset-0 z-30 flex flex-col items-center justify-center p-6 bg-black/90 backdrop-blur-md text-center">
              <div className="w-16 h-16 rounded-full bg-purple-600/20 border border-purple-500/50 flex items-center justify-center text-purple-400 mb-4 animate-pulse">
                <Camera size={32} />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white mb-2">
                {translate('ar.camera_access_title')}
              </h3>
              <p className="text-xs text-gray-300 max-w-sm mb-6 leading-relaxed">
                {errorMessage || translate('ar.camera_access_desc')}
              </p>
              <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-sm">
                <button
                  onClick={() => startCamera(cameraFacing)}
                  disabled={isRequestingCamera}
                  className="w-full px-5 py-3 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs uppercase tracking-widest shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  {isRequestingCamera ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>{translate('ar.activating')}</span>
                    </>
                  ) : (
                    <>
                      <Camera size={16} />
                      <span>{translate('ar.allow_camera')}</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => setUseVirtualStudioFallback(true)}
                  className="w-full px-5 py-3 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs uppercase tracking-wider transition-all"
                >
                  🏢 {translate('ar.studio_no_camera')}
                </button>
              </div>
            </div>
          )}

          {/* THREE.JS 3D CANVAS - OCCUPIES 100% OF SCREEN WITH MODEL SUPERIMPOSED IN YOUR ROOM */}
          <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-auto">
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
                {useVirtualStudioFallback && (
                  <VirtualStudioWall 
                    floorY={-0.725 + heightOffset} 
                    wallDistance={-1.2} 
                    isPureCinema={false} 
                  />
                )}
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
                facetScale={0.44 * scaleMultiplier}
                showGuides={showPyramidGuides}
              />
            </Suspense>
          </Canvas>

          {/* 2D Guide Frame at center of screen for physical transparent prism base */}
          {showPyramidGuides && (
            <div className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center">
              <div className="w-20 h-20 sm:w-24 sm:h-24 border-2 border-dashed border-cyan-400/80 rounded-2xl flex flex-col items-center justify-center bg-cyan-950/20 backdrop-blur-[2px] shadow-[0_0_24px_rgba(6,182,212,0.4)]">
                <div className="w-2 h-2 rounded-full bg-purple-400 shadow-[0_0_8px_#c084fc] mb-0.5 animate-ping" />
                <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-wider text-cyan-300 text-center leading-tight">
                  {translate('ar.place_prism_here')}
                </span>
                <span className="text-[7px] sm:text-[8px] font-mono text-gray-400 text-center mt-0.5">
                  {translate('ar.square_base_center')}
                </span>
              </div>
            </div>
          )}

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
            <HolographicCinemaEmitter floorY={-0.84 + heightOffset} />

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
              enableZoom={true}
              enablePan={false}
              target={[0, -0.05, 0]}
              minDistance={1.0}
              maxDistance={4.2}
            />
          </Canvas>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODE 4: STUDIO DOJO 3D (360° WORKOUT STAGE)              */}
      {/* ======================================================== */}
      {projectionMode === 'studio_3d' && (
        <div className="absolute inset-0 z-10 bg-[#08080c] flex items-center justify-center overflow-hidden">
          <Canvas
            gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
            camera={{ position: [0, 0.05, 2.35], fov: 38 }}
            dpr={[1, 2]}
          >
            <color attach="background" args={['#08080c']} />
            <ambientLight intensity={1.5} color="#ffffff" />
            <directionalLight position={[3.0, 6.0, 4.0]} intensity={1.8} color="#ffffff" />
            <directionalLight position={[-3.0, 4.0, 2.5]} intensity={0.9} color="#818cf8" />
            <directionalLight position={[0, 3.5, -3.5]} intensity={2.0} color="#c084fc" />
            <pointLight position={[0, 0.5, 1.8]} intensity={1.2} color="#ec4899" />

            <VirtualStudioWall 
              floorY={-0.84 + heightOffset} 
              wallDistance={-1.2} 
              isPureCinema={false} 
            />

            <HolographicCinemaEmitter floorY={-0.84 + heightOffset} />

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
              enableZoom={true}
              enablePan={false}
              target={[0, -0.05, 0]}
              minDistance={1.0}
              maxDistance={4.2}
              minPolarAngle={Math.PI / 4}
              maxPolarAngle={Math.PI / 1.75}
            />
          </Canvas>
        </div>
      )}

      {/* ======================================================== */}
      {/* TOP HEADER: CLEAN 2-ROW ARCHITECTURE (NEVER CLUTTERING)  */}
      {/* ======================================================== */}
      <header className="relative z-40 w-full flex flex-col items-center gap-2 p-2.5 sm:p-4 pointer-events-none">
        {/* ROW 1: TOP NAVIGATION & ACTION ICONS */}
        <div className="w-full flex items-center justify-between pointer-events-none gap-2">
          {/* Left: Close Button */}
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-black/80 backdrop-blur-md text-white border border-white/20 active:scale-90 hover:bg-black/95 transition-all shadow-xl pointer-events-auto shrink-0"
            title={translate('ar.close')}
          >
            <X size={18} />
          </button>

          {/* Center: Mode Tabs */}
          <div className="flex items-center gap-1 p-1 bg-black/85 backdrop-blur-xl border border-white/20 rounded-full shadow-2xl pointer-events-auto overflow-x-auto max-w-[80vw]">
            {/* 1. Pyramide 360° (Default & Core Promise) */}
            <button
              onClick={() => setProjectionMode('pyramid_360')}
              className={`px-3 py-1.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all whitespace-nowrap ${
                projectionMode === 'pyramid_360'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Box size={13} />
              <span>{translate('ar.pyramid')}</span>
            </button>

            {/* 2. Projection TV / Vidéoprojecteur */}
            <button
              onClick={() => setProjectionMode('projector_cinema')}
              className={`px-3 py-1.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all whitespace-nowrap ${
                projectionMode === 'projector_cinema'
                  ? 'bg-gradient-to-r from-amber-600 to-yellow-600 text-white shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Monitor size={13} />
              <span>{translate('ar.projection')}</span>
            </button>

            {/* 3. Studio 3D */}
            <button
              onClick={() => setProjectionMode('studio_3d')}
              className={`px-3 py-1.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all whitespace-nowrap ${
                projectionMode === 'studio_3d'
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Layers size={13} />
              <span>{translate('ar.studio_3d')}</span>
            </button>

            {/* 4. Caméra RA */}
            <button
              onClick={() => setProjectionMode('camera_ar')}
              className={`px-3 py-1.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all whitespace-nowrap ${
                projectionMode === 'camera_ar'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Camera size={13} />
              <span>{translate('ar.camera_ar')}</span>
            </button>
          </div>

          {/* Right Tools */}
          <div className="flex items-center gap-1.5 pointer-events-auto shrink-0">
            <button
              onClick={() => setShowHowItWorksModal(true)}
              className="p-2 rounded-full bg-amber-500/20 border border-amber-500/50 text-amber-300 backdrop-blur-md active:scale-90 hover:bg-amber-500/30 transition-all shadow-lg"
              title={translate('ar.guide_title')}
            >
              <HelpCircle size={16} />
            </button>

            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-full bg-black/80 backdrop-blur-md text-white border border-white/20 active:scale-90 hover:bg-black/95 transition-all shadow-lg"
              title={translate('ar.fullscreen')}
            >
              <Maximize size={16} />
            </button>

            <button
              onClick={() => setShowTuningDrawer(!showTuningDrawer)}
              className={`p-2 rounded-full backdrop-blur-md border active:scale-90 transition-all shadow-lg ${
                showTuningDrawer ? 'bg-purple-600 text-white border-purple-400' : 'bg-black/80 text-gray-300 border-white/20'
              }`}
              title={translate('ar.tuning')}
            >
              <Sliders size={16} />
            </button>
          </div>
        </div>

        {/* ROW 2: DEDICATED CONTEXT SUB-BAR - 100% VISIBLE, NEVER HIDDEN OR OVERLAPPING */}
        {/* 1. Pyramid Sub-Bar */}
        {projectionMode === 'pyramid_360' && (
          <div className="pointer-events-auto animate-fadeIn flex flex-wrap items-center justify-center gap-1.5 px-3 py-1.5 rounded-2xl bg-neutral-950/95 backdrop-blur-xl border border-purple-500/60 shadow-2xl">
            <span className="text-[9px] font-bold text-purple-300 uppercase tracking-wider mr-1 hidden sm:inline">
              {translate('ar.prism_size')}
            </span>
            <button
              onClick={() => { setPyramidDistance(1.15); setScaleMultiplier(0.95); }}
              className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase transition-all ${
                Math.abs(pyramidDistance - 1.15) < 0.08 ? 'bg-purple-600 text-white shadow-md' : 'text-gray-300 hover:text-white'
              }`}
            >
              {translate('ar.prism_gsm')} (15mm)
            </button>
            <button
              onClick={() => { setPyramidDistance(1.35); setScaleMultiplier(1.05); }}
              className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase transition-all ${
                Math.abs(pyramidDistance - 1.35) < 0.08 ? 'bg-purple-600 text-white shadow-md' : 'text-gray-300 hover:text-white'
              }`}
            >
              {translate('ar.prism_standard')} (25mm)
            </button>
            <button
              onClick={() => { setPyramidDistance(1.75); setScaleMultiplier(1.25); }}
              className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase transition-all ${
                Math.abs(pyramidDistance - 1.75) < 0.08 ? 'bg-purple-600 text-white shadow-md' : 'text-gray-300 hover:text-white'
              }`}
            >
              {translate('ar.prism_tablet')} (40mm)
            </button>
            <div className="w-px h-3.5 bg-white/20 mx-0.5" />
            <button
              onClick={() => setShowPyramidGuides(!showPyramidGuides)}
              className={`px-2 py-1 rounded-lg text-[9px] font-bold flex items-center gap-1 transition-all ${
                showPyramidGuides ? 'bg-cyan-500/25 text-cyan-300 border border-cyan-500/50' : 'text-gray-400 hover:text-white'
              }`}
              title={translate('ar.guides')}
            >
              <Eye size={12} />
              <span>{translate('ar.guides')}</span>
            </button>
          </div>
        )}

        {/* 2. Projector Sub-Bar with Explicit HDMI Cable & Wi-Fi Options */}
        {projectionMode === 'projector_cinema' && (
          <div className="pointer-events-auto animate-fadeIn flex flex-wrap items-center justify-center gap-1.5 px-3 py-1.5 rounded-2xl bg-neutral-950/95 backdrop-blur-xl border border-amber-500/60 shadow-2xl">
            {/* Option Avec Câble (HDMI) */}
            <button
              onClick={() => {
                setProjectionConnectTab('cable');
                setShowProjectionConnectModal(true);
              }}
              className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/50 text-[10px] font-bold flex items-center gap-1 transition-all shrink-0"
              title={translate('ar.projection_cable_title')}
            >
              <Cable size={12} />
              <span>{translate('ar.projection_cable')}</span>
            </button>

            {/* Option Sans Câble (Wi-Fi / Cast) */}
            <button
              onClick={() => {
                setProjectionConnectTab('wireless');
                setShowProjectionConnectModal(true);
              }}
              className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/50 text-[10px] font-bold flex items-center gap-1 transition-all shrink-0"
              title={translate('ar.projection_wireless_title')}
            >
              <Wifi size={12} />
              <span>{translate('ar.projection_wireless')}</span>
            </button>

            <div className="w-px h-3.5 bg-white/20 mx-0.5" />

            {/* Projection Style (Pure Black Screen vs Simulated Wall) */}
            <div className="flex items-center gap-1 p-0.5 bg-black/60 rounded-xl border border-white/10 shrink-0">
              <button
                onClick={() => setWallProjectionStyle('pure_cinema')}
                className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all flex items-center gap-1 ${
                  wallProjectionStyle === 'pure_cinema'
                    ? 'bg-amber-500 text-black shadow-md'
                    : 'text-amber-200/70 hover:text-white'
                }`}
                title={translate('ar.true_projector_tooltip')}
              >
                <span>{translate('ar.black_screen')}</span>
              </button>
              <button
                onClick={() => setWallProjectionStyle('simulated_wall')}
                className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all flex items-center gap-1 ${
                  wallProjectionStyle === 'simulated_wall'
                    ? 'bg-amber-500 text-black shadow-md'
                    : 'text-amber-200/70 hover:text-white'
                }`}
                title={translate('ar.simulated_wall_tooltip')}
              >
                <span>{translate('ar.simulated_wall')}</span>
              </button>
            </div>

            <button
              onClick={() => {
                setProjectionConnectTab('wireless');
                setShowProjectionConnectModal(true);
              }}
              className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/50 text-[10px] font-bold flex items-center gap-1 transition-all shrink-0"
              title={translate('ar.start_broadcast')}
            >
              <Cast size={12} />
              <span className="hidden sm:inline">{translate('ar.cast_airplay')}</span>
            </button>
          </div>
        )}

        {/* 3. Studio 3D Sub-Bar */}
        {projectionMode === 'studio_3d' && (
          <div className="pointer-events-auto animate-fadeIn flex flex-wrap items-center justify-center gap-1.5 px-3 py-1.5 rounded-2xl bg-neutral-950/95 backdrop-blur-xl border border-cyan-500/60 shadow-2xl">
            <button
              onClick={() => { setRotationY(0); setHeightOffset(0); setScaleMultiplier(1.0); }}
              className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white border border-white/20 text-[9px] font-bold flex items-center gap-1 transition-all"
            >
              <RotateCw size={12} />
              <span>{translate('ar.reset_center')}</span>
            </button>
          </div>
        )}

        {/* 4. Camera AR Sub-Bar (NO TORCH, NO STARS, NO FLASHES) */}
        {projectionMode === 'camera_ar' && (
          <div className="pointer-events-auto animate-fadeIn flex flex-wrap items-center justify-center gap-1.5 px-3 py-1.5 rounded-2xl bg-neutral-950/95 backdrop-blur-xl border border-white/20 shadow-2xl">
            <button
              onClick={toggleCameraFacing}
              className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white border border-white/20 text-[9px] font-bold flex items-center gap-1 transition-all"
              title={translate('ar.switch_camera')}
            >
              <FlipHorizontal size={12} />
              <span>{cameraFacing === 'user' ? translate('ar.camera_front') : translate('ar.camera_room')}</span>
            </button>
            <button
              onClick={() => setProjectionMode('studio_3d')}
              className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white border border-white/20 text-[9px] font-bold flex items-center gap-1 transition-all"
            >
              <span>{translate('ar.studio_3d')}</span>
            </button>
          </div>
        )}

        {/* ROW 3: DISCRETE WORKOUT HUD PILL */}
        {(exerciseName || timer !== undefined) && (
          <div className="pointer-events-auto mt-0.5">
            <div className="inline-flex items-center gap-2.5 px-3 py-1 rounded-xl bg-black/85 backdrop-blur-md border border-white/15 text-white shadow-xl">
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
      </header>

      {/* OPTIONAL TUNING DRAWER (COLLAPSED BY DEFAULT) */}
      {showTuningDrawer && (
        <div className="relative z-40 px-3 sm:px-4 mt-1 max-w-sm mx-auto w-full pointer-events-auto">
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
                  min="0.90"
                  max="2.20"
                  step="0.05"
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
                onClick={() => { setHeightOffset(0); setScaleMultiplier(1.0); setRotationY(0); setPyramidDistance(1.35); setWallDistance(-1.2); }}
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

      {/* ======================================================== */}
      {/* PROJECTION CONNECTION ASSISTANT MODAL (HDMI & WI-FI)    */}
      {/* ======================================================== */}
      {showProjectionConnectModal && (
        <div 
          onClick={() => setShowProjectionConnectModal(false)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 overflow-y-auto"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-neutral-900 border border-amber-500/50 rounded-3xl p-5 max-w-md w-full space-y-4 shadow-2xl my-auto text-left pointer-events-auto"
          >
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Monitor className="text-amber-400" size={18} />
                <h3 className="font-black uppercase text-xs sm:text-sm tracking-wider text-white">
                  {translate('ar.projection')} • {projectionConnectTab === 'cable' ? translate('ar.projection_cable') : translate('ar.projection_wireless')}
                </h3>
              </div>
              <button
                onClick={() => setShowProjectionConnectModal(false)}
                className="p-1.5 rounded-full bg-neutral-800 text-gray-400 hover:text-white"
                title={translate('ar.close')}
              >
                <X size={16} />
              </button>
            </div>

            {/* TAB SELECTOR: CABLE VS WIRELESS */}
            <div className="flex bg-black/80 p-1 rounded-xl border border-white/15">
              <button
                onClick={() => setProjectionConnectTab('cable')}
                className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${
                  projectionConnectTab === 'cable'
                    ? 'bg-amber-500 text-black shadow-md'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Cable size={13} />
                <span>{translate('ar.projection_cable')}</span>
              </button>

              <button
                onClick={() => setProjectionConnectTab('wireless')}
                className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${
                  projectionConnectTab === 'wireless'
                    ? 'bg-amber-500 text-black shadow-md'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Wifi size={13} />
                <span>{translate('ar.projection_wireless')}</span>
              </button>
            </div>

            {/* TAB 1: AVEC CÂBLE (HDMI) */}
            {projectionConnectTab === 'cable' && (
              <div className="space-y-3 animate-fadeIn text-[11px] text-gray-300">
                <div className="p-3 rounded-xl bg-black/60 border border-amber-500/30 space-y-1.5">
                  <span className="font-black text-amber-400 uppercase text-[10px] tracking-wide block">
                    {translate('ar.projection_cable_title')}
                  </span>
                  <p className="leading-relaxed">
                    {translate('ar.projection_cable_desc')}
                  </p>
                </div>

                <div className="space-y-2 text-[10px]">
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center shrink-0">1</span>
                    <p>{translate('ar.step_hdmi_1')}</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center shrink-0">2</span>
                    <p>{translate('ar.step_hdmi_2')}</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center shrink-0">3</span>
                    <p>{translate('ar.step_hdmi_3')}</p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setWallProjectionStyle('pure_cinema');
                    setShowProjectionConnectModal(false);
                  }}
                  className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black uppercase text-xs tracking-wider shadow-lg transition-all"
                >
                  {translate('ar.activate_black_screen')}
                </button>
              </div>
            )}

            {/* TAB 2: SANS CÂBLE (WI-FI / SMART VIEW / CAST) */}
            {projectionConnectTab === 'wireless' && (
              <div className="space-y-3 animate-fadeIn text-[11px] text-gray-300">
                {/* Direct Clarification Notice */}
                <div className="p-3 rounded-2xl bg-amber-950/30 border border-amber-500/40 text-[10px] text-amber-200/90 leading-relaxed flex items-start gap-2.5">
                  <span className="text-base shrink-0">💡</span>
                  <div>
                    <strong className="text-amber-300 block text-[11px] mb-0.5">{translate('ar.tv_notice_laptop_title')}</strong>
                    <span className="leading-snug">{translate('ar.tv_notice_laptop')}</span>
                  </div>
                </div>

                {/* TV Brand Selector Pills */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-gray-300 block">
                    {translate('ar.tv_select_brand')}
                  </span>
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
                    {[
                      { id: 'lg', label: 'TV LG (webOS)', icon: Tv },
                      { id: 'samsung', label: 'TV Samsung', icon: Tv },
                      { id: 'chromecast', label: 'Chromecast', icon: Cast },
                      { id: 'apple', label: 'Apple TV', icon: Monitor },
                      { id: 'projector', label: 'Projecteur', icon: Wifi },
                    ].map((b) => (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => setSelectedTvBrand(b.id as any)}
                        className={`px-3 py-1.5 rounded-xl text-[10px] font-bold flex items-center gap-1.5 shrink-0 transition-all ${
                          selectedTvBrand === b.id
                            ? 'bg-amber-500 text-black shadow-md'
                            : 'bg-black/60 text-gray-300 hover:text-white border border-white/10'
                        }`}
                      >
                        <b.icon size={12} />
                        <span>{b.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Brand-Specific Instructions */}
                <div className="p-3 rounded-2xl bg-black/60 border border-amber-500/30 space-y-2 text-[10px]">
                  {selectedTvBrand === 'lg' && (
                    <>
                      <div className="flex items-start gap-2">
                        <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center shrink-0">1</span>
                        <p>{translate('ar.step_wifi_lg_1')}</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center shrink-0">2</span>
                        <p>{translate('ar.step_wifi_lg_2')}</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center shrink-0">3</span>
                        <p>{translate('ar.step_wifi_lg_3')}</p>
                      </div>
                    </>
                  )}

                  {selectedTvBrand === 'samsung' && (
                    <>
                      <div className="flex items-start gap-2">
                        <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center shrink-0">1</span>
                        <p>{translate('ar.step_wifi_samsung_1')}</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center shrink-0">2</span>
                        <p>{translate('ar.step_wifi_samsung_2')}</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center shrink-0">3</span>
                        <p>{translate('ar.step_wifi_samsung_3')}</p>
                      </div>
                    </>
                  )}

                  {selectedTvBrand === 'chromecast' && (
                    <>
                      <div className="flex items-start gap-2">
                        <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center shrink-0">1</span>
                        <p>{translate('ar.step_wifi_chromecast_1')}</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center shrink-0">2</span>
                        <p>{translate('ar.step_wifi_chromecast_2')}</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center shrink-0">3</span>
                        <p>{translate('ar.step_wifi_chromecast_3')}</p>
                      </div>
                    </>
                  )}

                  {selectedTvBrand === 'apple' && (
                    <>
                      <div className="flex items-start gap-2">
                        <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center shrink-0">1</span>
                        <p>{translate('ar.step_wifi_apple_1')}</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center shrink-0">2</span>
                        <p>{translate('ar.step_wifi_apple_2')}</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center shrink-0">3</span>
                        <p>{translate('ar.step_wifi_apple_3')}</p>
                      </div>
                    </>
                  )}

                  {selectedTvBrand === 'projector' && (
                    <>
                      <div className="flex items-start gap-2">
                        <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center shrink-0">1</span>
                        <p>{translate('ar.step_wifi_projector_1')}</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center shrink-0">2</span>
                        <p>{translate('ar.step_wifi_projector_2')}</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center shrink-0">3</span>
                        <p>{translate('ar.step_wifi_projector_3')}</p>
                      </div>
                    </>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleStartTVCast}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-black uppercase text-xs tracking-wider shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95"
                >
                  <Cast size={15} />
                  <span>{translate('ar.launch_tv_cast')}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default HolographicARModal;
