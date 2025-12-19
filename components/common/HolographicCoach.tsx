
import React, { useEffect, useRef, useState } from 'react';
import { COACH_MODEL_URL } from '../../constants.ts';

interface HolographicCoachProps {
  state?: 'idle' | 'active' | 'listening' | 'speaking';
  modelUrl?: string;
  isPaused?: boolean;
  cameraOrbit?: string;
  cameraTarget?: string;
}

export const HolographicCoach: React.FC<HolographicCoachProps> = ({ 
  modelUrl, 
  isPaused,
  cameraOrbit = "0deg 90deg 2.5m", // Default close-up
  cameraTarget = "0m 0.9m 0m"      // Default torso target
}) => {
  const url = modelUrl || COACH_MODEL_URL;
  const modelViewerRef = useRef<HTMLElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const viewer = modelViewerRef.current as any;
    let heartbeatInterval: any;

    const handleLoad = () => {
        console.log("3D Model Loaded");
        setIsLoaded(true);
        if (viewer) {
            // Reset time scale to normal speed
            viewer.timeScale = 1; 
            
            // REMOVED: Manual animation selection logic (viewer.animationName = ...)
            // This was likely selecting a static 'bind' pose instead of the motion.
            // We now rely purely on the 'autoplay' and 'animation-name="*"' props.
            
            // Force play if not paused
            if (!isPaused) {
                const playPromise = viewer.play();
                if(playPromise) {
                    playPromise.catch((e: any) => console.log("Play trigger failed", e));
                }
            }
        }
    };

    if (viewer) {
        viewer.addEventListener('load', handleLoad);
        
        // Imperative Play/Pause Control based on prop
        if (!isPaused && isLoaded) {
            viewer.timeScale = 1;
            viewer.play();
        } else if (isPaused) {
            viewer.pause();
        }

        // ANIMATION HEARTBEAT:
        // Forcefully checks every 1 second if the model should be moving but isn't.
        // This defeats browser battery saving modes that freeze background tabs.
        heartbeatInterval = setInterval(() => {
            if (!isPaused && viewer.paused && isLoaded) {
                console.log("Heartbeat: Restarting Animation");
                viewer.play();
            }
        }, 1000);
    }

    return () => {
        if (viewer) {
            viewer.removeEventListener('load', handleLoad);
        }
        if (heartbeatInterval) clearInterval(heartbeatInterval);
    };
  }, [isPaused, url, isLoaded]);

  return (
    <div className="w-full h-full relative flex items-center justify-center">
      {/* @ts-ignore */}
      <model-viewer
        ref={modelViewerRef}
        src={url}
        alt="Holographic Coach"
        
        // --- ANIMATION CONFIG ---
        autoplay
        animation-name="*"
        loop 
        
        // --- PERFORMANCE CONFIG ---
        loading="eager" 
        reveal="auto"
        seamless-poster
        power-preference="high-performance"
        
        // --- CAMERA CONFIG ---
        camera-controls 
        camera-orbit={cameraOrbit}
        camera-target={cameraTarget}
        field-of-view="30deg"
        interpolation-decay="200"
        
        // --- UI CLEANUP ---
        interaction-prompt="none" 
        
        // --- RENDERING QUALITY ---
        shadow-intensity="1" 
        shadow-softness="0.5"
        exposure="1.2"
        
        style={{ width: '100%', height: '100%', backgroundColor: 'transparent' }}
      >
        {/* Transparent Loading State */}
        <div slot="poster" className="flex flex-col items-center justify-center w-full h-full absolute inset-0 bg-transparent">
           {!isLoaded && (
               <div className="flex flex-col items-center">
                <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
               </div>
           )}
        </div>
      {/* @ts-ignore */}
      </model-viewer>
    </div>
  );
};
