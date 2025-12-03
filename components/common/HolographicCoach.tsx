
import React, { Suspense, useEffect, useState } from 'react';
import { Canvas, useLoader } from '@react-three/fiber';
import { OrbitControls, Environment, useAnimations } from '@react-three/drei';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { COACH_MODEL_URL } from '../../constants.ts';
import * as THREE from 'three';

const Model = ({ url, isPaused }: { url: string; isPaused?: boolean }) => {
  // CACHE BUSTING: Append timestamp to force fresh fetch, bypassing corrupted builder cache
  const cacheBustedUrl = `${url}?t=${Date.now()}`;

  const gltf = useLoader(GLTFLoader, cacheBustedUrl, (loader) => {
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/');
    loader.setDRACOLoader(dracoLoader);
    // CORS FORCE: Attempt to bypass strict sandbox restrictions
    loader.crossOrigin = 'anonymous';
  });

  const { actions } = useAnimations(gltf.animations, gltf.scene);

  useEffect(() => {
    if (actions) {
       const actionKeys = Object.keys(actions);
       if (actionKeys.length > 0) {
           const firstAction = actions[actionKeys[0]];
           if (firstAction) {
               firstAction.reset().fadeIn(0.5).play();
           }
       }
    }
  }, [actions]);

  useEffect(() => {
      if (actions) {
          Object.values(actions).forEach((action: any) => {
              if (action) action.paused = !!isPaused;
          });
      }
  }, [actions, isPaused]);

  // AUTO-SCALE: Force model to fit view regardless of unit scale
  useEffect(() => {
      const box = new THREE.Box3().setFromObject(gltf.scene);
      const size = new THREE.Vector3();
      box.getSize(size);
      const maxDim = Math.max(size.x, size.y, size.z);
      const targetHeight = 2.5; 
      const scale = targetHeight / maxDim;
      gltf.scene.scale.setScalar(scale);
      gltf.scene.position.y = -1.2;
  }, [gltf.scene]);

  return <primitive object={gltf.scene} />;
};

export const HolographicCoach: React.FC<{
  state?: 'idle' | 'active' | 'listening' | 'speaking';
  modelUrl?: string;
  isPaused?: boolean;
}> = ({ modelUrl, isPaused }) => {
  const url = modelUrl || COACH_MODEL_URL;
  const [hasError, setHasError] = useState(false);

  if (hasError) {
      return (
          <div className="w-full h-full flex items-center justify-center bg-transparent">
              {/* Error state handled silently or with transparent background as requested */}
          </div>
      );
  }

  return (
    <div className="w-full h-full relative bg-transparent">
        <Canvas
            camera={{ position: [0, 0, 4], fov: 45 }}
            gl={{ 
                alpha: true, 
                antialias: true, 
                preserveDrawingBuffer: true,
                powerPreference: "high-performance"
            }}
            onCreated={({ gl }) => {
                gl.setClearColor(0x000000, 0);
            }}
            onError={() => setHasError(true)}
        >
            <ambientLight intensity={2.5} />
            <spotLight position={[5, 5, 5]} angle={0.3} penumbra={1} intensity={2} castShadow />
            <directionalLight position={[-2, 4, 5]} intensity={1.5} />
            <Environment preset="city" />
            
            {/* Removed Text Overlay from Fallback */}
            <Suspense fallback={null}>
                <Model url={url} isPaused={isPaused} />
            </Suspense>

            <OrbitControls enableZoom={true} enablePan={false} maxPolarAngle={Math.PI / 1.8} />
        </Canvas>
    </div>
  );
};
