import React, { Suspense, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { useGLTF, OrbitControls, Center, Environment, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import { COACH_MODEL_URL } from '../../lib/constants.ts';

const Model = ({ url }: { url: string }) => {
    const { scene } = useGLTF(url);
    
    useMemo(() => {
        scene.traverse((child) => {
            if ((child as any).isMesh) {
                const m = child as any;
                if (m.material) {
                    m.material.side = THREE.DoubleSide;
                    m.material.needsUpdate = true;
                    m.castShadow = true;
                    m.receiveShadow = true;
                    
                    // Metallic Android Look
                    m.material.roughness = 0.02;
                    m.material.metalness = 1.0;
                    
                    // Intense glowing purple highlights
                    const glowColor = new THREE.Color('#9D50FF');
                    if (m.material.emissive) {
                        m.material.emissive = glowColor;
                        m.material.emissiveIntensity = 2.5; 
                    }
                }
            }
        });
        
        const box = new THREE.Box3().setFromObject(scene);
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 1.4 / maxDim;
        scene.scale.setScalar(scale);
    }, [scene]);

    return <primitive object={scene} />;
};

export const HolographicCoach: React.FC<{ modelUrl?: string; isPaused?: boolean }> = ({ modelUrl, isPaused }) => {
  const finalUrl = modelUrl || COACH_MODEL_URL;

  return (
    <div className="w-full h-full relative bg-[#F5F5F7]">
        <Canvas 
            gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
            camera={{ position: [0, 1.4, 4.0], fov: 32 }}
            dpr={[1, 2]}
            shadows
        >
            <color attach="background" args={['#F5F5F7']} />
            
            <Suspense fallback={null}>
                <Environment preset="city" />
                <ambientLight intensity={2.5} />
                
                {/* ULTIMATE VISIBILITY LIGHTING */}
                <spotLight 
                    position={[10, 20, 10]} 
                    angle={0.5} 
                    penumbra={1} 
                    intensity={40} 
                    castShadow 
                    shadow-mapSize={[1024, 1024]}
                />

                <pointLight position={[0, 5, 12]} intensity={25.0} color="#ffffff" /> {/* Bright Front Fill */}
                <pointLight position={[-8, 8, -8]} intensity={20.0} color="#BF00FF" /> {/* Side Rim */}
                <pointLight position={[8, -2, 8]} intensity={12.0} color="#8A2BE2" />
                
                <Center top position={[0, -0.7, 0]}>
                    <Model url={finalUrl} />
                </Center>

                <ContactShadows 
                    position={[0, -0.7, 0]} 
                    opacity={0.5} 
                    scale={15} 
                    blur={4} 
                    far={5} 
                    color="#000000" 
                />
            </Suspense>

            <OrbitControls 
                enableZoom={false} 
                enablePan={false}
                makeDefault 
                target={[0, 0.7, 0]}
                minPolarAngle={Math.PI / 4}
                maxPolarAngle={Math.PI / 1.6}
            />
        </Canvas>
    </div>
  );
};