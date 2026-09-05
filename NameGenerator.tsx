import React, { useState, useEffect } from 'react';
import { getRandomUsaFemaleName, getRandomBatchNames } from '../data/usaNames';
import { UserCheck, Copy, Check, RefreshCw, Layers } from 'lucide-react';
import confetti from 'canvas-confetti';

interface NameGeneratorProps {
  onShowToast: (message: string) => void;
}

export const NameGenerator: React.FC<NameGeneratorProps> = ({ onShowToast }) => {
  const [currentName, setCurrentName] = useState<string>('Emma Smith');
  const [batchNames, setBatchNames] = useState<string[]>([]);
  const [showBatch, setShowBatch] = useState<boolean>(false);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  useEffect(() => {
    setCurrentName(getRandomUsaFemaleName());
  }, []);

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      if (showBatch) {
        const batch = getRandomBatchNames(5);
        setBatchNames(batch);
        setCurrentName(batch[0]);
      } else {
        setCurrentName(getRandomUsaFemaleName());
      }
      setIsGenerating(false);
    }, 100);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    onShowToast(`Copied "${text}"`);
    
    try {
      confetti({
        particleCount: 15,
        spread: 40,
        origin: { y: 0.2 },
        colors: ['#f472b6', '#c084fc', '#818cf8']
      });
    } catch {
      // safe fallback
    }

    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleCopyAll = () => {
    navigator.clipboard.writeText(batchNames.join('\n'));
    onShowToast(`Copied ${batchNames.length} names`);
  };

  const toggleBatch = () => {
    const next = !showBatch;
    setShowBatch(next);
    if (next && batchNames.length === 0) {
      const b = getRandomBatchNames(5);
      setBatchNames(b);
      setCurrentName(b[0]);
    }
  };

  return (
    <section className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 sm:p-3.5 shadow-lg backdrop-blur-md">
      {/* Short Title & Batch Toggle */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <div className="p-1 rounded-md bg-pink-500/10 text-pink-400 border border-pink-500/20">
            <UserCheck className="w-3.5 h-3.5" />
          </div>
          <h2 className="text-xs font-bold text-white uppercase tracking-wider">
            USA Names
          </h2>
        </div>

        <button
          onClick={toggleBatch}
          className={`flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md border transition-all ${
            showBatch
              ? 'bg-pink-500/20 border-pink-500/50 text-pink-300'
              : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-3 h-3" />
          <span>{showBatch ? 'Batch (5)' : 'Single'}</span>
        </button>
      </div>

      {/* 2-Line Compact Layout */}
      <div className="space-y-2">
        {/* LINE 1: Clean Name Display Card */}
        <div
          onClick={() => handleCopy(currentName)}
          className="flex items-center justify-between px-3.5 py-2.5 bg-slate-950/90 border border-slate-800 hover:border-pink-500/40 rounded-xl cursor-pointer transition-all"
        >
          <span className="text-base sm:text-lg font-bold text-white font-sans truncate select-all">
            {currentName}
          </span>
          <div className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-pink-500 hover:text-white transition-all flex-shrink-0 ml-2">
            {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </div>
        </div>

        {/* LINE 2: Action Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="flex items-center justify-center gap-1.5 py-2 px-3 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white text-xs font-bold rounded-xl shadow-md shadow-pink-600/20 active:scale-95 transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
            <span>Generate</span>
          </button>

          <button
            onClick={() => handleCopy(currentName)}
            className="flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl border border-slate-700 active:scale-95 transition-all"
          >
            {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-300" />}
            <span>{isCopied ? 'Copied' : 'Copy'}</span>
          </button>

          {showBatch && (
            <button
              onClick={handleCopyAll}
              className="col-span-2 sm:col-span-1 flex items-center justify-center gap-1 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-pink-300 text-xs font-semibold rounded-xl border border-pink-500/30 active:scale-95 transition-all"
            >
              <Copy className="w-3 h-3" />
              <span>Copy All</span>
            </button>
          )}
        </div>

        {/* Batch List (if active) */}
        {showBatch && batchNames.length > 0 && (
          <div className="pt-1 grid grid-cols-1 sm:grid-cols-2 gap-1">
            {batchNames.map((name, i) => (
              <div
                key={i}
                onClick={() => {
                  setCurrentName(name);
                  handleCopy(name);
                }}
                className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-slate-950/60 hover:bg-pink-500/10 border border-slate-800 text-xs text-slate-300 cursor-pointer transition-colors"
              >
                <span className="truncate">{i + 1}. {name}</span>
                <Copy className="w-3 h-3 text-slate-500 flex-shrink-0 ml-1.5" />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
