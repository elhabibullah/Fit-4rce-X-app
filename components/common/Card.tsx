
import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
}

// Card component with a standard futuristic design for the app
const Card: React.FC<CardProps> = ({ children, className = '', onClick }) => {
  return (
    <div onClick={onClick} className={`bg-zinc-900/50 backdrop-blur-xl border border-white/5 rounded-[2rem] p-6 shadow-2xl ${className}`}>
      {children}
    </div>
  );
};

export default Card;
