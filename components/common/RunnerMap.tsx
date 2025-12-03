
import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import { AlertTriangle, Loader, MapPin } from 'lucide-react';
import { useApp } from '../../hooks/useApp.ts';

// Component to force the map to center on the new position when it updates
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
    // If GPS doesn't load within 3 seconds, fall back to a default location (Central Park, NY)
    // This prevents the "Map is gone" white screen issue.
    const timeoutId = setTimeout(() => {
        if (!position) {
            console.log("GPS Timeout - Using Mock Location");
            const mockPos: [number, number] = [40.785091, -73.968285];
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
        timeout: 5000,
        maximumAge: 0
    };

    // 1. Get initial position
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
        (err) => {
            console.error("Initial GPS Error:", err);
            // Don't set error immediately, let timeout handle fallback
        },
        options
    );

    // 2. Watch for live updates
    const watchId = navigator.geolocation.watchPosition(
        (pos) => {
            const { latitude, longitude, accuracy } = pos.coords;
            const newPos: [number, number] = [latitude, longitude];
            
            // Accuracy Filter for visualization
            // Ignore points with poor accuracy (>30m) to keep map clean
            if (accuracy > 30) return;

            setPosition(newPos);
            setPath((prevPath) => [...prevPath, newPos]);
            setError(null);
            setIsMock(false);
        }, 
        (err) => {
            console.error("Watch GPS Error:", err);
            // Only show error if we haven't fallen back to mock yet
            if (!position && !isMock) {
                 if (err.code === 1) setError("Location Denied");
            }
        }, 
        options
    );

    return () => {
        clearTimeout(timeoutId);
        navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  // Error State
  if (error) {
      return (
          <div className="flex flex-col items-center justify-center h-full w-full bg-gray-900/80 text-red-400 p-2 text-center">
              <AlertTriangle className="w-6 h-6 mb-1" />
              <span className="text-xs font-bold">{error}</span>
              <span className="text-[10px] text-gray-500">Check permissions</span>
          </div>
      );
  }

  // Loading State (Only if both real and mock positions are null)
  if (!position) {
      return (
          <div className="flex flex-col items-center justify-center h-full w-full bg-gray-900 text-xs text-blue-400">
              <Loader className="w-6 h-6 mb-2 animate-spin" />
              <span className="animate-pulse font-bold tracking-wider">{translate('gps.locating')}</span>
          </div>
      );
  }

  return (
    <div className="relative w-full h-full">
        {isMock && (
            <div className="absolute top-2 left-2 z-[400] bg-yellow-500/20 backdrop-blur-md px-2 py-1 rounded border border-yellow-500/50 flex items-center">
                <MapPin className="w-3 h-3 text-yellow-500 mr-1" />
                <span className="text-[9px] font-bold text-yellow-200 uppercase">{translate('gps.simulated')}</span>
            </div>
        )}
        <MapContainer 
            center={position} 
            zoom={16} 
            style={{ height: '100%', width: '100%' }} 
            zoomControl={false} 
            attributionControl={false}
        >
        <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={position}></Marker>
        <Polyline positions={path} color="#00FFFF" weight={4} />
        <RecenterMap position={position} />
        </MapContainer>
    </div>
  );
}

export default RunnerMap;
