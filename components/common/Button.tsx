
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'chrome';
}

const Button: React.FC<ButtonProps> = ({ children, className, variant = 'primary', ...props }) => {
  const baseClasses = 'px-6 py-4 font-light tracking-[0.15em] rounded-2xl transition-all duration-300 transform active:scale-95 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed text-center flex items-center justify-center';
  
  const variantClasses = {
    primary: 'bg-[#8A2BE2] text-white hover:bg-purple-700 shadow-[0_10px_25px_rgba(138,43,226,0.3)] border border-purple-400/30',
    secondary: 'bg-zinc-900 border border-gray-800 text-gray-300 hover:bg-zinc-800 hover:border-gray-600',
    chrome: 'chrome-button text-white border border-white/20 hover:border-white/40 shadow-2xl'
  };

  return (
    <button className={`${baseClasses} ${variantClasses[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};

export default Button;
