import React, { useState, useEffect } from 'react';
import { Mic, MapPin, Camera, ShieldCheck, AlertCircle } from 'lucide-react';
import { useApp } from '../../hooks/useApp.ts';

export const SensorsPermissionBanner: React.FC = () => {
  const { translate } = useApp();
  const [micStatus, setMicStatus] = useState<'prompt' | 'granted' | 'denied' | 'unknown'>('unknown');
  const [geoStatus, setGeoStatus] = useState<'prompt' | 'granted' | 'denied' | 'unknown'>('unknown');
  const [camStatus, setCamStatus] = useState<'prompt' | 'granted' | 'denied' | 'unknown'>('unknown');
  const [isRequesting, setIsRequesting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const checkPermissions = async () => {
    try {
      if (navigator.permissions && navigator.permissions.query) {
        try {
          const micPerm = await navigator.permissions.query({ name: 'microphone' as any });
          setMicStatus(micPerm.state as any);
          micPerm.onchange = () => setMicStatus(micPerm.state as any);
        } catch (e) {}

        try {
          const geoPerm = await navigator.permissions.query({ name: 'geolocation' as any });
          setGeoStatus(geoPerm.state as any);
          geoPerm.onchange = () => setGeoStatus(geoPerm.state as any);
        } catch (e) {}

        try {
          const camPerm = await navigator.permissions.query({ name: 'camera' as any });
          setCamStatus(camPerm.state as any);
          camPerm.onchange = () => setCamStatus(camPerm.state as any);
        } catch (e) {}
      }
    } catch (e) {}
  };

  useEffect(() => {
    checkPermissions();
  }, []);

  const handleRequestAllPermissions = async () => {
    setIsRequesting(true);
    setFeedback(null);
    let micOk = false;
    let geoOk = false;
    let camOk = false;

    // 1. Microphone request
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(t => t.stop());
        setMicStatus('granted');
        micOk = true;
      }
    } catch (err) {
      setMicStatus('denied');
    }

    // 2. Camera request
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach(t => t.stop());
        setCamStatus('granted');
        camOk = true;
      }
    } catch (err) {
      setCamStatus('denied');
    }

    // 3. Geolocation request with safe 2-second timeout
    try {
      if (navigator.geolocation) {
        await new Promise<void>((resolve) => {
          const timer = setTimeout(() => resolve(), 2000);
          navigator.geolocation.getCurrentPosition(
            () => {
              clearTimeout(timer);
              setGeoStatus('granted');
              geoOk = true;
              resolve();
            },
            () => {
              clearTimeout(timer);
              setGeoStatus('denied');
              resolve();
            },
            { timeout: 2000, enableHighAccuracy: true, maximumAge: 60000 }
          );
        });
      }
    } catch (err) {
      setGeoStatus('denied');
    }

    setIsRequesting(false);
    if (micOk && geoOk && camOk) {
      setFeedback(translate('sensors.feedback_all'));
    } else if (micOk || geoOk || camOk) {
      setFeedback("Capteurs activés avec succès.");
    } else {
      setFeedback(translate('sensors.feedback_none'));
    }
  };

  const isAllGranted = micStatus === 'granted' && geoStatus === 'granted';

  return (
    <div className="bg-zinc-950/80 border border-purple-500/30 rounded-2xl p-3.5 backdrop-blur-md shadow-lg">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl border ${isAllGranted ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-purple-500/10 border-purple-500/30 text-purple-400'}`}>
            {isAllGranted ? <ShieldCheck size={18} /> : <AlertCircle size={18} />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-black uppercase text-white tracking-widest">{translate('sensors.title')}</span>
              <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-widest ${isAllGranted ? 'bg-green-950 text-green-400 border border-green-800' : 'bg-purple-950 text-purple-400 border border-purple-800'}`}>
                {isAllGranted ? translate('sensors.ready') : translate('sensors.required')}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1 text-[10px] text-gray-400 flex-wrap">
              <span className="flex items-center gap-1">
                <Mic size={10} className={micStatus === 'granted' ? 'text-green-400' : 'text-yellow-400'} />
                <span>Micro: {micStatus === 'granted' ? 'OK' : 'Attente'}</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <MapPin size={10} className={geoStatus === 'granted' ? 'text-green-400' : 'text-yellow-400'} />
                <span>GPS: {geoStatus === 'granted' ? 'OK' : 'Attente'}</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Camera size={10} className={camStatus === 'granted' ? 'text-green-400' : 'text-yellow-400'} />
                <span>Vision AR: {camStatus === 'granted' ? 'OK' : 'Attente'}</span>
              </span>
            </div>
          </div>
        </div>

        {!isAllGranted && (
          <button
            onClick={handleRequestAllPermissions}
            disabled={isRequesting}
            className="shrink-0 px-3 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-[10px] font-black uppercase tracking-wider shadow-md transition-all active:scale-95 disabled:opacity-50"
          >
            {isRequesting ? '...' : translate('sensors.authorize')}
          </button>
        )}
      </div>

      {feedback && (
        <div className="mt-2 text-[10px] text-purple-300 font-medium bg-purple-950/40 px-2.5 py-1 rounded-lg border border-purple-800/40">
          {feedback}
        </div>
      )}
    </div>
  );
};

export default SensorsPermissionBanner;
