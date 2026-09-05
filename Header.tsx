import React from 'react';

export const Header: React.FC = () => {
  return (
    <header className="border-b border-slate-800/80 bg-slate-900/80 backdrop-blur-xl sticky top-0 z-40 px-3.5 py-2.5">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="relative flex items-center justify-center w-9 h-9 rounded-xl overflow-hidden shadow-md shadow-indigo-500/25 ring-1 ring-cyan-400/30">
            <img
              src={`${import.meta.env.BASE_URL}logo.png`}
              alt="Easy Work"
              width={36}
              height={36}
              className="w-9 h-9 object-cover"
              draggable={false}
            />
          </div>

          <h1 className="text-base sm:text-lg font-black tracking-wider text-white font-sans uppercase">
            EASY WORK
          </h1>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-2.5 py-1 rounded-lg">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[11px] font-mono tracking-tight">ONLINE</span>
        </div>
      </div>
    </header>
  );
};
