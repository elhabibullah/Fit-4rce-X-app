import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import { AlertTriangle, Loader, MapPin } from 'lucide-react';
import { useApp } from '../../hooks/useApp.ts';

const RecenterMap = ({ position }: { position: [number, number] }) => {
    const map = useMap();
    useEffect(() => {
        map.setView(position);
    }, [position, map]);
    return null;
};

function RunnerMap() {
  const { translate } = useApp();
  const [position, setPosition] = useState<[number, number] | null>(null);
  const [path, setPath] = useState<[number, number][]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isMock, setIsMock] = useState(false);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
        if (!position) {
            const mockPos: [number, number] = [24.7136, 46.6753]; // Default to Riyadh
            setPosition(mockPos);
            setPath([mockPos]);
            setIsMock(true);
        }
    }, 3000);

    if (!navigator.geolocation) {
        clearTimeout(timeoutId);
        setError("GPS not supported");
        return;
    }

    const options = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
    };

    navigator.geolocation.getCurrentPosition(
        (pos) => {
            clearTimeout(timeoutId);
            const { latitude, longitude } = pos.coords;
            const initialPos: [number, number] = [latitude, longitude];
            setPosition(initialPos);
            setPath([initialPos]);
            setError(null);
            setIsMock(false);
        },
        () => {},
        options
    );

    const watchId = navigator.geolocation.watchPosition(
        (pos) => {
            const { latitude, longitude, accuracy } = pos.coords;
            const newPos: [number, number] = [latitude, longitude];
            if (accuracy > 50) return;
            setPosition(newPos);
            setPath((prevPath) => [...prevPath, newPos]);
            setError(null);
            setIsMock(false);
        }, 
        () => {}, 
        options
    );

    return () => {
        clearTimeout(timeoutId);
        navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  if (error) {
      return (
          <div className="flex flex-col items-center justify-center h-full w-full bg-gray-900/80 text-red-400 p-6 text-center">
              <AlertTriangle className="w-10 h-10 mb-2" />
              <span className="text-sm font-black uppercase tracking-widest">{error}</span>
          </div>
      );
  }

  if (!position) {
      return (
          <div className="flex flex-col items-center justify-center h-full w-full bg-black text-cyan-400">
              <Loader className="w-8 h-8 mb-4 animate-spin" />
              <span className="animate-pulse font-black text-[10px] uppercase tracking-[0.4em]">LOCATING SATELLITE LINK...</span>
          </div>
      );
  }

  return (
    <div className="relative w-full h-full z-0 overflow-hidden">
        {isMock && (
            <div className="absolute top-4 left-4 z-[400] bg-cyan-500/20 backdrop-blur-xl px-4 py-2 rounded-full border border-cyan-500/50 flex items-center shadow-2xl">
                <MapPin className="w-4 h-4 text-cyan-400 mr-2" />
                <span className="text-[10px] font-black text-white uppercase tracking-widest">PEDOMETER ACTIVE // SIMULATED</span>
            </div>
        )}
        <MapContainer 
            {...{
                center: position,
                zoom: 18,
                style: { height: '100%', width: '100%', filter: 'invert(100%) hue-rotate(180deg) brightness(0.8) contrast(1.2)' },
                zoomControl: false,
                attributionControl: false
            } as any}
        >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <Marker position={position}></Marker>
            <Polyline positions={path} {...{ color: "#00FFFF", weight: 6, opacity: 0.8 } as any} />
            <RecenterMap position={position} />
        </MapContainer>
    </div>
  );
}

export default RunnerMap;