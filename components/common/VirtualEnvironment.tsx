
import React, { useEffect, useRef, useState } from 'react';
import { Loader } from 'lucide-react';

// Matching static thumbnails using User's Dropbox Images
export const ENVIRONMENT_THUMBNAILS = {
    'studio': 'https://www.dropbox.com/scl/fi/jryp732ar5tl7eqydrcee/spinning-room.jpg?rlkey=i18o66uec35kej86ztaxjx7mg&st=8s9umlh6&raw=1',
    'mountains': 'https://www.dropbox.com/scl/fi/ydubt27r5xshfmhiv6kix/mountains-forest-running-road.jpg?rlkey=n6lv5wiuayer57m28p2kkcajj&st=28wjuh7o&raw=1', 
    'city': 'https://www.dropbox.com/scl/fi/mnut7qqoy6tya4v5iwj3i/kiyoto-futuristic-neon-city-rain.jpeg?rlkey=vbuq0azqarjen2iy8lao26xfd&st=qqa2n55u&raw=1',
    'track': 'https://www.dropbox.com/scl/fi/gmr75y8kk9nmw2jax7uh9/POV-athletic-field.jpg?rlkey=oox5xgovp7hqoba3cf2fxvntu&st=d5zyy4fd&raw=1',
    'trail': 'https://www.dropbox.com/scl/fi/2wx174h3pgsq2ydw9fpcm/running-woods.jpg?rlkey=86s5n63drmlw96nm6uggiw5il&st=ey9c11f5&raw=1', 
    'mountains_run': 'https://www.dropbox.com/scl/fi/ydubt27r5xshfmhiv6kix/mountains-forest-running-road.jpg?rlkey=n6lv5wiuayer57m28p2kkcajj&st=28wjuh7o&raw=1',
};

// Definition of Environment Media
const ENVIRONMENTS: Record<string, { type: 'image' | 'video', url: string }> = {
    // Neon Studio - Uses static image matching the thumbnail
    'studio': { 
        type: 'image', 
        url: ENVIRONMENT_THUMBNAILS.studio
    },
    
    // Alpine Pass (Cycling POV) - Uses Pexels Video 4554469 (Road Circulation)
    'mountains': { 
        type: 'video', 
        url: 'https://videos.pexels.com/video-files/4554469/4554469-hd_1920_1080_25fps.mp4' 
    },

    // Alpine Pass (Running POV) - Uses Dropbox Image (Mountains Forest Running Road)
    'mountains_run': {
        type: 'image',
        url: 'https://www.dropbox.com/scl/fi/ydubt27r5xshfmhiv6kix/mountains-forest-running-road.jpg?rlkey=n6lv5wiuayer57m28p2kkcajj&st=28wjuh7o&raw=1'
    },
    
    // Cyber City - Updated to Cyber_City_Sun.mp4 as requested
    'city': { 
        type: 'video', 
        url: 'https://fit-4rce-x.s3.eu-north-1.amazonaws.com/Cyber_City_Sun.mp4' 
    },
    
    // Athletics Track (Running POV) - Uses Dropbox Image (POV Athletic Field)
    'track': { 
        type: 'image', 
        url: 'https://www.dropbox.com/scl/fi/gmr75y8kk9nmw2jax7uh9/POV-athletic-field.jpg?rlkey=oox5xgovp7hqoba3cf2fxvntu&st=d5zyy4fd&raw=1' 
    },
    
    // Forest Path (Running Woods) - Uses Dropbox Image (Running Woods)
    'trail': { 
        type: 'image', 
        url: 'https://www.dropbox.com/scl/fi/2wx174h3pgsq2ydw9fpcm/running-woods.jpg?rlkey=86s5n63drmlw96nm6uggiw5il&st=ey9c11f5&raw=1' 
    },
};

export type EnvironmentType = keyof typeof ENVIRONMENTS;

interface VirtualEnvironmentProps {
    type: EnvironmentType;
}

const VirtualEnvironment: React.FC<VirtualEnvironmentProps> = ({ type }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isVideoPlaying, setIsVideoPlaying] = useState(false);
    const envData = ENVIRONMENTS[type] || ENVIRONMENTS['studio'];
    const thumbnailUrl = ENVIRONMENT_THUMBNAILS[type] || ENVIRONMENT_THUMBNAILS['studio'];
    
    // Reset video state when type changes
    useEffect(() => {
        setIsVideoPlaying(false);
    }, [type]);

    useEffect(() => {
        if (videoRef.current && envData.type === 'video') {
            videoRef.current.load();
            const playPromise = videoRef.current.play();
            if (playPromise !== undefined) {
                playPromise
                    .then(() => {
                        // Only show video once it actually starts playing
                        setIsVideoPlaying(true);
                    })
                    .catch(error => {
                        console.log("Auto-play was prevented or failed:", error);
                        setIsVideoPlaying(false);
                    });
            }
        }
    }, [type, envData]);

    return (
        <div className="absolute inset-0 w-full h-full z-0 overflow-hidden bg-black">
            
            {/* LAYER 0: Permanent Background Image (Thumbnail) 
                This is ALWAYS visible. No black screens.
            */}
            <img
                src={thumbnailUrl}
                alt="Background Base"
                className="absolute top-1/2 left-1/2 min-w-full min-h-full object-cover transform -translate-x-1/2 -translate-y-1/2 z-0"
            />

            {/* Dark overlay for text readability (applied to base image) */}
            <div className="absolute inset-0 bg-black/30 z-1 pointer-events-none"></div>

            {/* LAYER 1: Video Player (Only if video) 
                Fades in over the image once ready.
            */}
            {envData.type === 'video' && (
                <video
                    key={envData.url}
                    ref={videoRef}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className={`absolute top-1/2 left-1/2 min-w-full min-h-full object-cover transform -translate-x-1/2 -translate-y-1/2 z-2 transition-opacity duration-1000 ${isVideoPlaying ? 'opacity-100' : 'opacity-0'}`}
                    style={{ objectFit: 'cover' }}
                >
                    <source src={envData.url} type="video/mp4" />
                </video>
            )}
            
            {/* LAYER 1 (Alternative): High Res Image (If strictly image type) */}
            {envData.type === 'image' && envData.url !== thumbnailUrl && (
                 <img
                    src={envData.url}
                    alt="High Res Background"
                    className="absolute top-1/2 left-1/2 min-w-full min-h-full object-cover transform -translate-x-1/2 -translate-y-1/2 z-2"
                />
            )}
        </div>
    );
};

export default VirtualEnvironment;
