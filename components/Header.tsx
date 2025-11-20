
import React from 'react';
import { BrainCircuitIcon } from './Icons';

export const Header: React.FC = () => {
  return (
    <header className="flex items-center justify-center p-4 border-b border-[#2a2a30] bg-[#0A0A0C]">
      <div className="flex items-center gap-3">
        <BrainCircuitIcon className="w-8 h-8 text-[#7b61ff]" />
        <h1 className="text-3xl font-bold tracking-wider text-center text-white">
          PHILOVOID
        </h1>
      </div>
      <div className="absolute right-4 top-4 text-xs font-mono text-gray-500">v0.4.0 WEB</div>
    </header>
  );
};