
import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Navigation } from 'lucide-react';

interface HolographicMapProps {
    className?: string;
    isActive: boolean;
}

const HolographicMap: React.FC<HolographicMapProps> = ({ className, isActive }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [points, setPoints] = useState<{x: number, y: number}[]>([]);
    
    // Generate initial random path
    useEffect(() => {
        const initialPoints = [];
        let cx = 50;
        let cy = 50;
        for(let i=0; i<10; i++) {
            initialPoints.push({x: cx, y: cy});
            cx += (Math.random() - 0.5) * 20;
            cy += (Math.random() - 0.5) * 20;
        }
        setPoints(initialPoints);
    }, []);

    // Animate the path adding points
    useEffect(() => {
        if (!isActive) return;
        
        const interval = setInterval(() => {
            setPoints(prev => {
                const last = prev[prev.length - 1] || {x: 50, y: 50};
                const newX = last.x + (Math.random() - 0.5) * 5;
                const newY = last.y + (Math.random() - 0.5) * 5;
                // Keep strictly within 0-100 bounds
                const clampedX = Math.max(5, Math.min(95, newX));
                const clampedY = Math.max(5, Math.min(95, newY));
                
                const newPoints = [...prev, {x: clampedX, y: clampedY}];
                if (newPoints.length > 50) newPoints.shift(); // Keep trail manageable
                return newPoints;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [isActive]);

    // Draw the canvas
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw Grid
        ctx.strokeStyle = 'rgba(0, 255, 255, 0.1)';
        ctx.lineWidth = 1;
        const gridSize = 20;
        for(let x=0; x<canvas.width; x+=gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
            ctx.stroke();
        }
        for(let y=0; y<canvas.height; y+=gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
            ctx.stroke();
        }

        if (points.length < 2) return;

        // Scale points to canvas size
        const w = canvas.width;
        const h = canvas.height;

        // Draw Path Glow
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#00ffff';
        ctx.strokeStyle = '#00ffff';
        ctx.lineWidth = 2;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';

        ctx.beginPath();
        const start = points[0];
        ctx.moveTo((start.x/100)*w, (start.y/100)*h);

        for (let i = 1; i < points.length; i++) {
            const p = points[i];
            ctx.lineTo((p.x/100)*w, (p.y/100)*h);
        }
        ctx.stroke();
        
        // Reset Shadow for cursor
        ctx.shadowBlur = 0;

        // Draw Current Position Cursor
        const last = points[points.length - 1];
        const lx = (last.x/100)*w;
        const ly = (last.y/100)*h;

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(lx, ly, 4, 0, Math.PI * 2);
        ctx.fill();
        
        // Pulsing Ring
        ctx.strokeStyle = 'rgba(0, 255, 255, 0.5)';
        ctx.beginPath();
        ctx.arc(lx, ly, 8 + Math.sin(Date.now() / 200) * 2, 0, Math.PI * 2);
        ctx.stroke();

    }, [points]);

    return (
        <div className={`relative bg-black/60 backdrop-blur-md rounded-xl border border-blue-500/30 overflow-hidden shadow-lg ${className}`}>
             <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent pointer-events-none"></div>
             <canvas ref={canvasRef} width={200} height={200} className="w-full h-full opacity-80" />
             
             {/* Overlay Text */}
             <div className="absolute top-2 left-2 flex items-center gap-1">
                 <Navigation className="w-3 h-3 text-blue-400 animate-pulse" />
                 <span className="text-[10px] text-blue-300 font-mono tracking-widest">LIVE GPS</span>
             </div>
             
             <div className="absolute bottom-2 right-2 flex items-center gap-1">
                 <MapPin className="w-3 h-3 text-white" />
                 <span className="text-[10px] text-white font-mono">TRACKING</span>
             </div>
        </div>
    );
};

export default HolographicMap;
