import React from 'react';
import { Star } from 'lucide-react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onFavoriteClick?: () => void;
  isFavorited?: boolean;
  showFavoriteButton?: boolean;
}

const Card: React.FC<CardProps> = ({ children, className, onFavoriteClick, isFavorited = false, showFavoriteButton = false }) => {
  const ariaLabel = isFavorited ? "Remove from favorites" : "Add to favorites";

  return (
    <div 
      className={`
        app-card
        bg-black/50 border border-gray-800
        rounded-2xl 
        p-6 
        relative group 
        transition-all duration-300 
        backdrop-blur-sm
        shadow-[0_8px_30px_rgb(0,0,0,0.12)]
        hover:border-purple-500
        ${className}
      `}
    >
      {showFavoriteButton && (
        <button 
          onClick={onFavoriteClick} 
          aria-label={ariaLabel}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-yellow-400 focus:text-yellow-400 focus:outline-none transition-colors duration-200 z-20"
        >
          <Star 
            className={`w-6 h-6 transition-all duration-200 ${isFavorited ? 'text-yellow-400 fill-yellow-400' : 'text-gray-400 group-hover:text-yellow-400'}`} 
          />
        </button>
      )}

      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};

export default Card;