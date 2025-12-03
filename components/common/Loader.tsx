import React from 'react';

const Loader: React.FC = () => {
  return (
    <div className="relative w-24 h-24">
      <div className="absolute inset-0 rounded-full border-4 border-gray-800"></div>
      <div className="absolute inset-0 rounded-full border-t-4 border-t-[#8A2BE2] animate-spin"></div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-4 h-4 rounded-full bg-[#8A2BE2] animate-pulse"></div>
      </div>
    </div>
  );
};

export default Loader;