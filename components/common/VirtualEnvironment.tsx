import React, { useEffect, useRef } from 'react';

// Matching static thumbnails using cached local assets
export const ENVIRONMENT_THUMBNAILS: Record<string, string> = {
    'studio': '/assets/spinning-room.jpg',
    'mountains': '/assets/mountains-forest.jpg', 
    'city': '/assets/kiyoto-city.jpeg',
    'track': '/assets/athletic-field.jpg',
    'field': '/assets/athletic-field.jpg',
    'trail': '/assets/running-woods.jpg', 
    'mountains_run': '/assets/mountains-forest.jpg',
};

// Definition of Environment Media
const ENVIRONMENTS: Record<string, { type: 'image' | 'video', url: string }> = {
    // Cyber Cycle - Studio Environment (Fit-4rce-X Studio)
    'studio': { 
        type: 'image', 
        url: '/assets/spinning-room.jpg'
    },
    
    // Alpine Pass (Cycling POV)
    'mountains': { 
        type: 'video', 
        url: 'https://videos.pexels.com/video-files/4554469/4554469-hd_1920_1080_25fps.mp4' 
    },

    // Alpine Pass (Running POV)
    'mountains_run': {
        type: 'image',
        url: 'https://www.dropbox.com/scl/fi/ydubt27r5xshfmhiv6kix/mountains-forest-running-road.jpg?rlkey=n6lv5wiuayer57m28p2kkcajj&st=28wjuh7o&raw=1'
    },
    
    // Cyber City
    'city': { 
        type: 'video', 
        url: 'https://fit-4rce-x.s3.eu-north-1.amazonaws.com/Cyber_City_Sun.mp4' 
    },
    
    // Athletics Track
    'track': { 
        type: 'image', 
        url: 'https://www.dropbox.com/scl/fi/gmr75y8kk9nmw2jax7uh9/POV-athletic-field.jpg?rlkey=oox5xgovp7hqoba3cf2fxvntu&st=d5zyy4fd&raw=1' 
    },

    // Track and Field Video
    'field': {
        type: 'video',
        url: 'https://videos.pexels.com/video-files/2753715/2753715-hd_1920_1080_25fps.mp4'
    },
    
    // Forest Path
    'trail': { 
        type: 'image', 
        url: 'https://www.dropbox.com/scl/fi/2wx174h3pgsq2ydw9fpcm/running-woods.jpg?rlkey=86s5n63drmlw96nm6uggiw5il&st=ey9c11f5&raw=1' 
    },
};

export type EnvironmentType = keyof typeof ENVIRONMENTS;

interface VirtualEnvironmentProps {
    type: EnvironmentType;
    isPaused?: boolean;
}

const VirtualEnvironment: React.FC<VirtualEnvironmentProps> = ({ type, isPaused = false }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [videoError, setVideoError] = React.useState(false);
    const envData = ENVIRONMENTS[type as string] || ENVIRONMENTS['studio'];
    const thumbnailUrl = ENVIRONMENT_THUMBNAILS[type as keyof typeof ENVIRONMENT_THUMBNAILS] || ENVIRONMENT_THUMBNAILS['studio'];

    // Reset video error when type changes
    useEffect(() => {
        setVideoError(false);
    }, [type]);

    // Sync Play/Pause
    useEffect(() => {
        if (videoRef.current && envData.type === 'video' && !videoError) {
            if (isPaused) {
                videoRef.current.pause();
            } else {
                videoRef.current.play().catch(e => {
                    console.log("Video play error:", e);
                    setVideoError(true);
                });
            }
        }
    }, [isPaused, envData.type, type, videoError]);

    return (
        <div className="absolute inset-0 w-full h-full z-0 overflow-hidden bg-black">
            
            {/* THUMBNAIL BACKDROP - Always present to prevent black flashes */}
            <img
                src={thumbnailUrl}
                alt=""
                className="absolute top-1/2 left-1/2 min-w-full min-h-full object-cover transform -translate-x-1/2 -translate-y-1/2 z-0"
            />

            {/* VIDEO LAYER - Top Priority if available and no errors */}
            {envData.type === 'video' && !videoError && (
                <video
                    key={envData.url}
                    ref={videoRef}
                    autoPlay
                    loop
                    muted
                    playsInline
                    onError={() => {
                        console.warn(`Video load failed for ${envData.url}. Falling back to image.`);
                        setVideoError(true);
                    }}
                    className="absolute top-1/2 left-1/2 min-w-full min-h-full object-cover transform -translate-x-1/2 -translate-y-1/2 z-10"
                    style={{ objectFit: 'cover' }}
                >
                    <source src={envData.url} type="video/mp4" />
                </video>
            )}
            
            {/* OVERLAY for UI contrast */}
            <div className="absolute inset-0 bg-black/20 z-20 pointer-events-none"></div>
        </div>
    );
};

export default VirtualEnvironment;