import React, { Suspense, useMemo, useEffect, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, OrbitControls, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import { Video, Camera, Tv, Eye, RefreshCw, Sliders, X, Maximize2, Minimize2, Info, Sparkles } from 'lucide-react';
import { COACH_MODEL_URL } from '../../lib/constants.ts';

// Helper to resolve exercise names in multiple languages (English, French, Spanish, Russian, Arabic, etc.)
const getExerciseType = (name?: string): 'push' | 'squat' | 'jack' | 'idle' => {
  if (!name) return 'idle';
  const ex = name.toLowerCase();
  
  // 1. Jumping Jacks / Cardio / Sauts
  if (
    ex.includes('jack') || 
    ex.includes('saut') || ex.includes('écart') || 
    ex.includes('salto') || 
    ex.includes('прыж') || ex.includes('джек') || 
    ex.includes('قفز') || ex.includes('جاك') ||
    ex.includes('jump') || ex.includes('skipping') || ex.includes('rope') || 
    ex.includes('cardio') || ex.includes('run') || ex.includes('sprint') || 
    ex.includes('hiit') || ex.includes('climb') || ex.includes('mountain') || 
    ex.includes('knee') || ex.includes('heel') || ex.includes('bound') || 
    ex.includes('hop') || ex.includes('course') || ex.includes('foulée') || 
    ex.includes('genou') || ex.includes('burpee') || ex.includes('corde')
  ) {
    return 'jack';
  }
  
  // 2. Push-ups / Press / Pompes / Core
  if (
    ex.includes('push') || ex.includes('pump') || ex.includes('press') || ex.includes('bench') ||
    ex.includes('pompe') || ex.includes('appui') ||
    ex.includes('flexi') || ex.includes('lagartija') ||
    ex.includes('отжим') || ex.includes('жим') ||
    ex.includes('ضغط') || ex.includes('بنش') ||
    ex.includes('flexã') || ex.includes('apoio') ||
    ex.includes('plank') || ex.includes('dip') || ex.includes('tricep') || 
    ex.includes('chest') || ex.includes('shoulder') || ex.includes('ab') || 
    ex.includes('abs') || ex.includes('core') || ex.includes('crunch') || 
    ex.includes('sit-up') || ex.includes('situp') || ex.includes('extension') ||
    ex.includes('gainage') || ex.includes('planche') || ex.includes('ventre') || 
    ex.includes('abdo') || ex.includes('poitrine') || ex.includes('bras') || 
    ex.includes('épaule')
  ) {
    return 'push';
  }
  
  // 3. Squats / Lunges / Fentes / Legs
  if (
    ex.includes('squat') || ex.includes('lunge') ||
    ex.includes('fente') || ex.includes('flexion') ||
    ex.includes('sentadilla') || ex.includes('zancada') ||
    ex.includes('присед') || ex.includes('выпад') ||
    ex.includes('قرفصاء') || ex.includes('اندفاع') ||
    ex.includes('agachamento') || ex.includes('afundo') ||
    ex.includes('leg') || ex.includes('thigh') || ex.includes('quad') || 
    ex.includes('hamstring') || ex.includes('glute') || ex.includes('calf') || 
    ex.includes('calves') || ex.includes('raise') || ex.includes('bridge') || 
    ex.includes('kick') || ex.includes('jambe') || ex.includes('fessier') || 
    ex.includes('mollet') || ex.includes('cuisse')
  ) {
    return 'squat';
  }
  
  return 'idle';
};

// 1. Model Error Boundary to gracefully switch to the high-quality Procedural Coach if S3 fails
class ModelErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(err: any) {
    console.warn("3D GLTF model load failed. Switching seamlessly to Procedural holographic Android coach.", err);
  }
  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

// 2. Procedural Holographic Android Coach: Fully animated using React Three Fiber.
// Guaranteed 100% offline, zero external CDN assets, zero CORS blocks, ultra-high performance.
const ProceduralCoach = ({ isPaused, exerciseName, isPrep }: { isPaused?: boolean; exerciseName?: string; isPrep?: boolean }) => {
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const leftLegRef = useRef<THREE.Group>(null);
  const rightLegRef = useRef<THREE.Group>(null);
  const leftCalfRef = useRef<THREE.Group>(null);
  const rightCalfRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);

  const isPausedRef = useRef(isPaused);
  const exerciseNameRef = useRef(exerciseName);
  const isPrepRef = useRef(isPrep);

  useEffect(() => {
    isPausedRef.current = isPaused;
    exerciseNameRef.current = exerciseName;
    isPrepRef.current = isPrep;
  }, [isPaused, exerciseName, isPrep]);

  useFrame((state) => {
    if (isPausedRef.current) return;
    const t = state.clock.getElapsedTime();
    const exType = isPrepRef.current ? 'idle' : getExerciseType(exerciseNameRef.current);

    // Standard Reset / Idle state rotations
    if (bodyRef.current) {
      bodyRef.current.position.set(0, 0.4, 0);
      bodyRef.current.rotation.set(0, 0, 0);
    }
    if (headRef.current) headRef.current.rotation.set(0, 0, 0);
    if (leftArmRef.current) leftArmRef.current.rotation.set(0, 0, 0.25);
    if (rightArmRef.current) rightArmRef.current.rotation.set(0, 0, -0.25);
    if (leftLegRef.current) leftLegRef.current.rotation.set(0, 0, 0.05);
    if (rightLegRef.current) rightLegRef.current.rotation.set(0, 0, -0.05);
    if (leftCalfRef.current) leftCalfRef.current.rotation.set(0, 0, 0);
    if (rightCalfRef.current) rightCalfRef.current.rotation.set(0, 0, 0);

    // Animating the Android puppet according to resolved exercise type
    if (exType === 'jack') {
      const speed = 6;
      const wave = Math.sin(t * speed);
      // Jumping Jacks: Arms and legs move out/in
      if (bodyRef.current) bodyRef.current.position.y = 0.4 + Math.abs(wave) * 0.15;
      if (leftArmRef.current) leftArmRef.current.rotation.z = 0.25 + Math.abs(wave) * 1.8;
      if (rightArmRef.current) rightArmRef.current.rotation.z = -0.25 - Math.abs(wave) * 1.8;
      if (leftLegRef.current) leftLegRef.current.rotation.z = 0.05 + Math.abs(wave) * 0.4;
      if (rightLegRef.current) rightLegRef.current.rotation.z = -0.05 - Math.abs(wave) * 0.4;
    } else if (exType === 'push') {
      const speed = 4;
      const wave = Math.sin(t * speed);
      // Push-ups / Press: Torso moves down and rotates, arms pivot forward
      if (bodyRef.current) {
        bodyRef.current.position.y = 0.2 + (wave + 1) * 0.1;
        bodyRef.current.rotation.x = 0.4 + wave * 0.15;
      }
      if (leftArmRef.current) leftArmRef.current.rotation.x = -0.6 + wave * 0.5;
      if (rightArmRef.current) rightArmRef.current.rotation.x = -0.6 + wave * 0.5;
    } else if (exType === 'squat') {
      // Squats / Lunges: Torso drops down, thighs and calves bend
      const wave = Math.sin(t * 3);
      const squatFactor = Math.max(0, wave); // only descend
      
      if (bodyRef.current) {
        bodyRef.current.position.y = 0.4 - squatFactor * 0.35;
        bodyRef.current.rotation.x = squatFactor * 0.15;
      }
      if (leftLegRef.current) leftLegRef.current.rotation.x = -squatFactor * 0.7;
      if (rightLegRef.current) rightLegRef.current.rotation.x = -squatFactor * 0.7;
      if (leftCalfRef.current) leftCalfRef.current.rotation.x = squatFactor * 0.6;
      if (rightCalfRef.current) rightCalfRef.current.rotation.x = squatFactor * 0.6;
    } else {
      // Default / Idle state: gentle high-tech organic breathing
      const wave = Math.sin(t * 1.5);
      if (bodyRef.current) {
        bodyRef.current.position.y = 0.4 + wave * 0.015;
      }
      if (leftArmRef.current) leftArmRef.current.rotation.z = 0.25 + wave * 0.03;
      if (rightArmRef.current) rightArmRef.current.rotation.z = -0.25 - wave * 0.03;
      if (headRef.current) headRef.current.rotation.y = Math.sin(t * 0.5) * 0.15;
    }
  });

  const chromeMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#0ea5e9', // Premium neon sky blue metallic skin
    metalness: 0.95,
    roughness: 0.15,
  }), []);

  const glowMaterial = useMemo(() => new THREE.MeshBasicMaterial({
    color: '#8A2BE2', // Deep high-contrast cybernetic violet
  }), []);

  const jointMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#3b0764',
    metalness: 0.8,
    roughness: 0.2,
  }), []);

  return (
    <group>
      {/* Dynamic Torso Group */}
      <group ref={bodyRef} position={[0, 0.4, 0]}>
        {/* Core Chest Column */}
        <mesh material={chromeMaterial} position={[0, 0.4, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.22, 0.14, 0.55, 16]} />
        </mesh>
        
        {/* Futuristic glowing cyber heart indicator */}
        <mesh material={glowMaterial} position={[0, 0.48, 0.14]}>
          <sphereGeometry args={[0.07, 16, 16]} />
        </mesh>

        {/* Head and visor group */}
        <group ref={headRef} position={[0, 0.8, 0]}>
          {/* Cyber Neck */}
          <mesh material={jointMaterial} position={[0, -0.1, 0]}>
            <cylinderGeometry args={[0.06, 0.07, 0.08, 12]} />
          </mesh>
          {/* Android Helmet */}
          <mesh material={chromeMaterial} castShadow>
            <sphereGeometry args={[0.16, 20, 20]} />
          </mesh>
          {/* Glowing Visor */}
          <mesh material={glowMaterial} position={[0, 0.04, 0.12]}>
            <boxGeometry args={[0.18, 0.03, 0.08]} />
          </mesh>
        </group>

        {/* Left Arm Group */}
        <group ref={leftArmRef} position={[-0.3, 0.5, 0]}>
          {/* Shoulder Joint */}
          <mesh material={glowMaterial}><sphereGeometry args={[0.06, 8, 8]} /></mesh>
          {/* Upper Arm Segment */}
          <mesh material={chromeMaterial} position={[0, -0.18, 0]} castShadow>
            <cylinderGeometry args={[0.04, 0.035, 0.3, 8]} />
          </mesh>
          {/* Forearm */}
          <group position={[0, -0.32, 0]}>
            {/* Elbow Joint */}
            <mesh material={glowMaterial}><sphereGeometry args={[0.045, 8, 8]} /></mesh>
            <mesh material={chromeMaterial} position={[0, -0.14, 0]} castShadow>
              <cylinderGeometry args={[0.032, 0.03, 0.25, 8]} />
            </mesh>
          </group>
        </group>

        {/* Right Arm Group */}
        <group ref={rightArmRef} position={[0.3, 0.5, 0]}>
          {/* Shoulder Joint */}
          <mesh material={glowMaterial}><sphereGeometry args={[0.06, 8, 8]} /></mesh>
          {/* Upper Arm Segment */}
          <mesh material={chromeMaterial} position={[0, -0.18, 0]} castShadow>
            <cylinderGeometry args={[0.04, 0.035, 0.3, 8]} />
          </mesh>
          {/* Forearm */}
          <group position={[0, -0.32, 0]}>
            {/* Elbow Joint */}
            <mesh material={glowMaterial}><sphereGeometry args={[0.045, 8, 8]} /></mesh>
            <mesh material={chromeMaterial} position={[0, -0.14, 0]} castShadow>
              <cylinderGeometry args={[0.032, 0.03, 0.25, 8]} />
            </mesh>
          </group>
        </group>

        {/* Left Leg Group */}
        <group ref={leftLegRef} position={[-0.14, -0.05, 0]}>
          {/* Hip Joint */}
          <mesh material={glowMaterial}><sphereGeometry args={[0.065, 8, 8]} /></mesh>
          {/* Thigh */}
          <mesh material={chromeMaterial} position={[0, -0.22, 0]} castShadow>
            <cylinderGeometry args={[0.05, 0.042, 0.4, 8]} />
          </mesh>
          {/* Calf Segment */}
          <group ref={leftCalfRef} position={[0, -0.42, 0]}>
            {/* Knee Joint */}
            <mesh material={glowMaterial}><sphereGeometry args={[0.05, 8, 8]} /></mesh>
            <mesh material={chromeMaterial} position={[0, -0.18, 0]} castShadow>
              <cylinderGeometry args={[0.04, 0.035, 0.35, 8]} />
            </mesh>
          </group>
        </group>

        {/* Right Leg Group */}
        <group ref={rightLegRef} position={[0.14, -0.05, 0]}>
          {/* Hip Joint */}
          <mesh material={glowMaterial}><sphereGeometry args={[0.065, 8, 8]} /></mesh>
          {/* Thigh */}
          <mesh material={chromeMaterial} position={[0, -0.22, 0]} castShadow>
            <cylinderGeometry args={[0.05, 0.042, 0.4, 8]} />
          </mesh>
          {/* Calf Segment */}
          <group ref={rightCalfRef} position={[0, -0.42, 0]}>
            {/* Knee Joint */}
            <mesh material={glowMaterial}><sphereGeometry args={[0.05, 8, 8]} /></mesh>
            <mesh material={chromeMaterial} position={[0, -0.18, 0]} castShadow>
              <cylinderGeometry args={[0.04, 0.035, 0.35, 8]} />
            </mesh>
          </group>
        </group>
      </group>
    </group>
  );
};

// 3. GLTF Model Loader (Rigged S3 Android Model)
const Model = ({ url, isPaused, exerciseName, isPrep }: { url: string; isPaused?: boolean; exerciseName?: string; isPrep?: boolean }) => {
  const { scene } = useGLTF(url);
  const clonedScene = useMemo(() => scene.clone(), [scene]);

  const isPausedRef = useRef(isPaused);
  const exerciseNameRef = useRef(exerciseName);
  const isPrepRef = useRef(isPrep);

  useEffect(() => {
    isPausedRef.current = isPaused;
    exerciseNameRef.current = exerciseName;
    isPrepRef.current = isPrep;
  }, [isPaused, exerciseName, isPrep]);

  useEffect(() => {
    if (!clonedScene) return;

    const updateScaleAndRotation = () => {
      try {
        const box = new THREE.Box3().setFromObject(clonedScene);
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);

        if (maxDim > 0.05 && maxDim < 500) {
          const calculatedScale = 1.8 / maxDim;
          // Clamp the scale to a safe range to prevent microscopic/massive rendering glitches
          const safeScale = Math.min(Math.max(calculatedScale, 0.4), 2.5);
          clonedScene.scale.setScalar(safeScale);
        } else {
          // Safe default fallback scale
          clonedScene.scale.setScalar(1.0);
        }
        
        // Force perfect front-facing orientation
        clonedScene.rotation.set(0, 0, 0);
      } catch (err) {
        console.warn("Scale computation failed, using safe fallback scale.", err);
        clonedScene.scale.setScalar(1.0);
      }
    };

    // Run immediately
    updateScaleAndRotation();

    // Schedule subsequent updates to handle asynchronous layout and compilation steps
    const t1 = setTimeout(updateScaleAndRotation, 50);
    const t2 = setTimeout(updateScaleAndRotation, 150);
    const t3 = setTimeout(updateScaleAndRotation, 400);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [clonedScene]);

  // Puppeteer logic to animate bones of the GLTF skeleton
  useFrame((state) => {
    if (isPausedRef.current) return;
    const t = state.clock.getElapsedTime();
    const exType = isPrepRef.current ? 'idle' : getExerciseType(exerciseNameRef.current);

    clonedScene.traverse((obj) => {
      if (obj instanceof THREE.Bone) {
        const name = obj.name.toLowerCase();

        // Reset bone rotation
        obj.rotation.set(0, 0, 0);

        // Movement scripts based on resolved exercise type
        if (exType === 'jack') {
          const speed = 6;
          if (name.includes('arm') || name.includes('shoulder') || name.includes('forearm')) {
            obj.rotation.z = Math.sin(t * speed) * 1.5;
          }
          if (name.includes('leg') || name.includes('thigh')) {
            obj.rotation.z = Math.sin(t * speed) * 0.4;
          }
        } else if (exType === 'push') {
          const speed = 4;
          if (name.includes('arm') || name.includes('shoulder') || name.includes('forearm')) {
            obj.rotation.x = -Math.PI / 2 + Math.sin(t * speed) * 0.6;
          }
          if (name.includes('spine')) {
            obj.rotation.x = Math.sin(t * speed) * 0.2;
          }
        } else if (exType === 'squat') {
          const speed = 4;
          if (name.includes('thigh') || name.includes('leg') || name.includes('calf')) {
            obj.rotation.x = Math.sin(t * speed) * 0.7;
          }
          if (name.includes('spine') || name.includes('hips')) {
            obj.rotation.x = Math.sin(t * speed) * 0.3;
          }
        } else {
          // Idle state movement
          if (name.includes('spine')) {
            obj.rotation.x = Math.sin(t * 1.5) * 0.05;
          }
          if (name.includes('arm')) {
            obj.rotation.z = Math.sin(t * 1.5) * 0.1;
          }
        }
      }
    });
  });

  return <primitive object={clonedScene} />;
};

// Premium sub-component to render the 3D Canvas
const CoachCanvas: React.FC<{
  finalUrl: string;
  isPaused?: boolean;
  exerciseName?: string;
  isPrep?: boolean;
  isTransparent: boolean;
  flipX?: boolean;
  flipY?: boolean;
}> = ({ finalUrl, isPaused, exerciseName, isPrep, isTransparent, flipX, flipY }) => {
  return (
    <Canvas
      gl={{ antialias: true, alpha: isTransparent, powerPreference: 'high-performance' }}
      camera={{ position: [0, 0.15, 5.1], fov: 35 }}
      dpr={[1, 2]}
      shadows
      style={{
        transform: `${flipX ? 'scaleX(-1)' : ''} ${flipY ? 'scaleY(-1)' : ''}`,
      }}
    >
      {/* If transparent, background is empty. Otherwise, futuristic dark slate/black background */}
      {!isTransparent && <color attach="background" args={['#0a0a0a']} />}

      {/* High-quality studio lights */}
      <ambientLight intensity={1.2} />
      <directionalLight position={[5, 10, 5]} intensity={1.5} castShadow />
      <directionalLight position={[-5, 5, -5]} intensity={0.8} />
      <pointLight position={[0, 3, -2]} intensity={2} color="#8A2BE2" />

      <group position={[0, -0.8, 0]}>
        <ModelErrorBoundary fallback={
          <group position={[0, 0.43, 0]} scale={1.15}>
            <ProceduralCoach isPaused={isPaused} exerciseName={exerciseName} isPrep={isPrep} />
          </group>
        }>
          <Model url={finalUrl} isPaused={isPaused} exerciseName={exerciseName} isPrep={isPrep} />
        </ModelErrorBoundary>
      </group>

      <ContactShadows
        position={[0, -0.81, 0]}
        opacity={0.15}
        scale={10}
        blur={2.5}
        far={4}
        color="#000000"
      />

      <OrbitControls
        enableZoom={false}
        enablePan={false}
        makeDefault
        target={[0, 0.1, 0]}
        minPolarAngle={Math.PI / 4}
        maxPolarAngle={Math.PI / 1.6}
      />
    </Canvas>
  );
};

export const HolographicCoach: React.FC<{
  modelUrl?: string;
  isPaused?: boolean;
  background?: string;
  exerciseName?: string;
  isPrep?: boolean;
}> = ({ modelUrl, isPaused, background = 'white', exerciseName, isPrep }) => {
  const finalUrl = modelUrl || COACH_MODEL_URL;
  const isTransparent = background === 'transparent';
  
  // Projection mode state: normal, ar (cam background), pyramid (4-way cross), ghost (Pepper's Ghost mirrored)
  const [projectionMode, setProjectionMode] = useState<'normal' | 'ar' | 'pyramid' | 'ghost'>('normal');
  const [showMenu, setShowMenu] = useState(false);
  const [flipX, setFlipX] = useState(false);
  const [flipY, setFlipY] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [cameraActive, setCameraActive] = useState(false);

  // Preload the GLTF Model
  useEffect(() => {
    useGLTF.preload(finalUrl);
  }, [finalUrl]);

  // AR Camera stream management
  useEffect(() => {
    if (projectionMode === 'ar') {
      navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
        .then(stream => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play().catch(e => console.warn("Camera play error:", e));
            setCameraActive(true);
          }
        })
        .catch(err => {
          console.warn("Camera access denied or failed", err);
          setCameraActive(false);
        });
    } else {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null;
        setCameraActive(false);
      }
    }

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [projectionMode]);

  return (
    <div className="w-full h-full relative bg-neutral-950 overflow-hidden flex flex-col justify-between">
      
      {/* BACKGROUNDS FOR SPECIAL MODES */}
      {projectionMode === 'ar' && (
        <video 
          ref={videoRef} 
          className="absolute inset-0 w-full h-full object-cover z-0" 
          playsInline 
          muted 
        />
      )}

      {/* TOP FLOATING PROJECTION METHOD MENU */}
      <div className="absolute top-3 left-3 right-3 z-30 flex items-center justify-between">
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="px-3 py-1.5 bg-purple-900/80 hover:bg-purple-800 border border-purple-500/40 rounded-xl text-[10px] font-black uppercase tracking-wider text-white shadow-[0_0_15px_rgba(138,43,226,0.4)] transition-all flex items-center gap-1.5 backdrop-blur-md active:scale-95"
        >
          <Sparkles size={11} className="animate-pulse" />
          <span>PROJECTION HOLO</span>
        </button>

        <div className="flex gap-2">
          {projectionMode === 'ghost' && (
            <>
              <button 
                onClick={() => setFlipX(!flipX)}
                className={`px-2 py-1 rounded border text-[8px] font-bold uppercase transition-all ${flipX ? 'bg-amber-500 text-black border-amber-400' : 'bg-neutral-900/80 text-neutral-400 border-neutral-800'}`}
              >
                MIROIR X
              </button>
              <button 
                onClick={() => setFlipY(!flipY)}
                className={`px-2 py-1 rounded border text-[8px] font-bold uppercase transition-all ${flipY ? 'bg-amber-500 text-black border-amber-400' : 'bg-neutral-900/80 text-neutral-400 border-neutral-800'}`}
              >
                MIROIR Y
              </button>
            </>
          )}
          {projectionMode !== 'normal' && (
            <button 
              onClick={() => setProjectionMode('normal')}
              className="p-1.5 bg-red-600/90 hover:bg-red-500 rounded-xl border border-red-500/30 text-white flex items-center justify-center active:scale-95"
            >
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      {/* INTERACTIVE MENU OVERLAY */}
      {showMenu && (
        <div className="absolute inset-x-3 top-14 z-40 p-4 rounded-2xl bg-neutral-950/95 border border-neutral-800/80 shadow-2xl backdrop-blur-xl animate-fadeIn text-left space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-purple-400">DIFFUSION DU COACH EN PHYSIQUE</h4>
            <button onClick={() => setShowMenu(false)} className="text-neutral-500 hover:text-white">
              <X size={14} />
            </button>
          </div>
          
          <p className="text-[9px] text-neutral-400 leading-relaxed">
            Choisissez la technologie de projection holographique virtuelle adaptée à votre environnement d’entraînement (chez vous) :
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            
            {/* AR MODE */}
            <button
              onClick={() => {
                setProjectionMode('ar');
                setShowMenu(false);
              }}
              className={`p-2.5 rounded-xl border text-left flex items-start gap-2.5 transition-all ${projectionMode === 'ar' ? 'bg-purple-950/40 border-purple-500' : 'bg-neutral-900/40 border-neutral-800 hover:bg-neutral-900/80'}`}
            >
              <Camera size={16} className="text-purple-400 mt-0.5 flex-shrink-0" />
              <div>
                <span className="text-[9px] font-black uppercase text-white block">1. Réalité Augmentée Web AR</span>
                <span className="text-[8px] text-neutral-500 block mt-0.5 leading-tight">Superposez le coach en taille réelle 1:1 sur votre caméra de chambre/salon.</span>
              </div>
            </button>

            {/* PYRAMID MODE */}
            <button
              onClick={() => {
                setProjectionMode('pyramid');
                setShowMenu(false);
              }}
              className={`p-2.5 rounded-xl border text-left flex items-start gap-2.5 transition-all ${projectionMode === 'pyramid' ? 'bg-purple-950/40 border-purple-500' : 'bg-neutral-900/40 border-neutral-800 hover:bg-neutral-900/80'}`}
            >
              <Tv size={16} className="text-emerald-400 mt-0.5 flex-shrink-0" />
              <div>
                <span className="text-[9px] font-black uppercase text-white block">2. Pyramide Holographique 3D</span>
                <span className="text-[8px] text-neutral-500 block mt-0.5 leading-tight">Génère 4 vues croisées symétriques. Posez un prisme en plastique sur l’écran pour un hologramme 3D physique !</span>
              </div>
            </button>

            {/* PEPPERS GHOST MODE */}
            <button
              onClick={() => {
                setProjectionMode('ghost');
                setShowMenu(false);
              }}
              className={`p-2.5 rounded-xl border text-left flex items-start gap-2.5 transition-all ${projectionMode === 'ghost' ? 'bg-purple-950/40 border-purple-500' : 'bg-neutral-900/40 border-neutral-800 hover:bg-neutral-900/80'}`}
            >
              <Eye size={16} className="text-amber-400 mt-0.5 flex-shrink-0" />
              <div>
                <span className="text-[9px] font-black uppercase text-white block">3. Projecteur "Pepper's Ghost"</span>
                <span className="text-[8px] text-neutral-500 block mt-0.5 leading-tight">Fond ultra-noir contrasté avec effet miroir. Idéal pour refléter sur une vitre ou projeter au mur.</span>
              </div>
            </button>

          </div>
        </div>
      )}

      {/* CORE CANVAS VIEWPORT DISPLAY DELEGATION */}
      <div className="flex-grow w-full relative z-10 flex items-center justify-center">
        <Suspense
          fallback={
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm z-50">
              <div className="w-12 h-12 border-4 border-neutral-800 border-t-purple-500 rounded-full animate-spin mb-4" />
              <p className="text-[10px] font-black text-purple-500 uppercase tracking-[0.4em] animate-pulse">
                Synchronisation du coach...
              </p>
            </div>
          }
        >
          {projectionMode === 'pyramid' ? (
            /* PYRAMID MODE 4-WAY SYMMETRICAL CROSS LAYOUT */
            <div className="w-full h-full bg-black flex items-center justify-center p-4">
              <div className="relative w-[280px] h-[280px] md:w-[360px] md:h-[360px] flex items-center justify-center bg-black/90 rounded-full border border-purple-500/10">
                
                {/* Visual grid target helpers */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-6 h-6 rounded-full bg-purple-500/20 border border-purple-500/40 animate-ping"></div>
                </div>

                {/* TOP (Rotated 180 deg for projection pyramid) */}
                <div className="absolute top-0 w-24 h-24 md:w-32 md:h-32 transform rotate-180">
                  <CoachCanvas finalUrl={finalUrl} isPaused={isPaused} exerciseName={exerciseName} isPrep={isPrep} isTransparent={true} />
                </div>

                {/* BOTTOM */}
                <div className="absolute bottom-0 w-24 h-24 md:w-32 md:h-32">
                  <CoachCanvas finalUrl={finalUrl} isPaused={isPaused} exerciseName={exerciseName} isPrep={isPrep} isTransparent={true} />
                </div>

                {/* LEFT (Rotated 90 deg) */}
                <div className="absolute left-0 w-24 h-24 md:w-32 md:h-32 transform rotate-90">
                  <CoachCanvas finalUrl={finalUrl} isPaused={isPaused} exerciseName={exerciseName} isPrep={isPrep} isTransparent={true} />
                </div>

                {/* RIGHT (Rotated -90 deg) */}
                <div className="absolute right-0 w-24 h-24 md:w-32 md:h-32 transform -rotate-90">
                  <CoachCanvas finalUrl={finalUrl} isPaused={isPaused} exerciseName={exerciseName} isPrep={isPrep} isTransparent={true} />
                </div>

              </div>
            </div>
          ) : (
            /* STANDARD OR AR PASSTHROUGH OR GHOST MIRRORED CANVAS DISPLAY */
            <div className="w-full h-full">
              <CoachCanvas 
                finalUrl={finalUrl} 
                isPaused={isPaused} 
                exerciseName={exerciseName} 
                isPrep={isPrep} 
                isTransparent={projectionMode === 'ar' || isTransparent}
                flipX={flipX}
                flipY={flipY}
              />
            </div>
          )}
        </Suspense>
      </div>

      {/* FOOTER METADATA / INFORMATION FOR ACTIVE PROJECTION MODES */}
      {projectionMode !== 'normal' && (
        <div className="absolute bottom-3 left-3 right-3 z-30 p-2.5 rounded-xl bg-neutral-900/90 border border-neutral-800/80 backdrop-blur-md flex items-center gap-2 animate-slideInUp text-left">
          <Info size={14} className="text-purple-400 flex-shrink-0" />
          <div className="text-[8px] text-neutral-400 leading-normal">
            {projectionMode === 'ar' && "Caméra active. Posez votre appareil à hauteur d'yeux pour simuler le coach devant vous."}
            {projectionMode === 'pyramid' && "Posez votre pyramide réfléchissante au centre de l'écran pour un effet 3D relief direct."}
            {projectionMode === 'ghost' && "Reliez votre écran à un vidéoprojecteur. Utilisez les boutons Miroir pour caler la réflexion."}
          </div>
        </div>
      )}

    </div>
  );
};
