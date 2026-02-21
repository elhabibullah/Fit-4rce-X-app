
import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

// Card component with a standard futuristic design for the app
const Card: React.FC<CardProps> = ({ children, className = '' }) => {
  return (
    <div className={`bg-zinc-900/50 backdrop-blur-xl border border-white/5 rounded-[2rem] p-6 shadow-2xl ${className}`}>
      {children}
    </div>
  );
};

export default Card;
