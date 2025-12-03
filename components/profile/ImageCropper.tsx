import React, { useState, useRef, MouseEvent, TouchEvent } from 'react';
import Card from '../common/Card.tsx';
import Button from '../common/Button.tsx';
import { useApp } from '../../hooks/useApp.ts';
import { X } from 'lucide-react';

interface ImageCropperProps {
    src: string;
    onSave: (croppedImageUrl: string) => void;
    onClose: () => void;
}

const ImageCropper: React.FC<ImageCropperProps> = ({ src, onSave, onClose }) => {
    const { translate } = useApp();
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const imageRef = useRef<HTMLImageElement>(null);
    const isInteracting = useRef(false);
    const lastPoint = useRef({ x: 0, y: 0 });

    const handleInteractionStart = (clientX: number, clientY: number) => {
        isInteracting.current = true;
        lastPoint.current = { x: clientX, y: clientY };
    };

    const handleInteractionMove = (clientX: number, clientY: number) => {
        if (!isInteracting.current) return;
        const dx = clientX - lastPoint.current.x;
        const dy = clientY - lastPoint.current.y;
        setPan(prev => ({ x: prev.x + dx, y: prev.y + dy }));
        lastPoint.current = { x: clientX, y: clientY };
    };

    const handleInteractionEnd = () => {
        isInteracting.current = false;
    };

    // Mouse Events
    const handleMouseDown = (e: MouseEvent<HTMLDivElement>) => {
        e.preventDefault();
        handleInteractionStart(e.clientX, e.clientY);
    };
    const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => handleInteractionMove(e.clientX, e.clientY);
    
    // Touch Events
    const handleTouchStart = (e: TouchEvent<HTMLDivElement>) => handleInteractionStart(e.touches[0].clientX, e.touches[0].clientY);
    const handleTouchMove = (e: TouchEvent<HTMLDivElement>) => handleInteractionMove(e.touches[0].clientX, e.touches[0].clientY);


    const handleSave = () => {
        if (!imageRef.current) return;

        const canvas = document.createElement('canvas');
        const cropSize = 256;
        canvas.width = cropSize;
        canvas.height = cropSize;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        const img = imageRef.current;
        const scale = img.naturalWidth / img.width;
        
        ctx.fillStyle = '#000000'; // Set background to black for any transparent areas
        ctx.fillRect(0, 0, cropSize, cropSize);

        ctx.save();
        ctx.beginPath();
        ctx.arc(cropSize / 2, cropSize / 2, cropSize / 2, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.clip();
        
        ctx.drawImage(
            img,
            (pan.x * -scale) + (img.width * scale - (img.naturalWidth / zoom)) / 2,
            (pan.y * -scale) + (img.height * scale - (img.naturalHeight / zoom)) / 2,
            img.naturalWidth / zoom,
            img.naturalHeight / zoom,
            0,
            0,
            cropSize,
            cropSize
        );
        ctx.restore();

        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        onSave(dataUrl);
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-fadeIn">
            <Card className="max-w-md w-full relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white z-10 p-1">
                    <X className="w-6 h-6" />
                </button>
                <h2 className="text-xl font-bold text-white text-center mb-4">{translate('imageCropper.title')}</h2>
                
                <div 
                    className="w-48 h-48 rounded-full mx-auto overflow-hidden relative cursor-move bg-gray-900"
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleInteractionEnd}
                    onMouseLeave={handleInteractionEnd}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleInteractionEnd}
                >
                    <img
                        ref={imageRef}
                        src={src}
                        alt="To crop"
                        style={{
                            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                            touchAction: 'none'
                        }}
                        className="w-full h-full object-cover"
                        draggable="false"
                    />
                </div>

                <div className="my-4">
                    <label className="text-gray-400 text-sm">{translate('imageCropper.zoom')}</label>
                    <input
                        type="range"
                        min="1"
                        max="3"
                        step="0.05"
                        value={zoom}
                        onChange={(e) => setZoom(parseFloat(e.target.value))}
                        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                    />
                </div>
                
                <div className="grid grid-cols-2 gap-2 mt-6">
                    <Button variant="secondary" onClick={onClose}>{translate('imageCropper.cancel')}</Button>
                    <Button onClick={handleSave}>{translate('imageCropper.save')}</Button>
                </div>
            </Card>
        </div>
    );
};

export default ImageCropper;