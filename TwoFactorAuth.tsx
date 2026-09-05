import React, { useState, useEffect, useCallback } from 'react';
import * as OTPAuth from 'otpauth';
import { KeyRound, Copy, Check, X, Shield, Clock } from 'lucide-react';
import confetti from 'canvas-confetti';

interface TwoFactorAuthProps {
  onShowToast: (message: string) => void;
}

export const TwoFactorAuth: React.FC<TwoFactorAuthProps> = ({ onShowToast }) => {
  const [secret, setSecret] = useState<string>('');
  const [currentOtp, setCurrentOtp] = useState<string>('');
  const [timeLeft, setTimeLeft] = useState<number>(30);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const generateOtp = useCallback(() => {
    if (!secret.trim()) {
      setCurrentOtp('');
      setError(null);
      return;
    }

    let rawKey = secret.trim();

    // Extract secret if user pastes full otpauth:// URL or key=value format
    if (rawKey.includes('otpauth://') || rawKey.includes('secret=')) {
      const match = rawKey.match(/secret=([A-Za-z0-9]+)/i);
      if (match && match[1]) {
        rawKey = match[1];
      }
    }

    // Clean out spaces, dashes, and non-base32 characters
    const cleanedSecret = rawKey.replace(/[^A-Za-z2-7]/g, '').toUpperCase();

    if (cleanedSecret.length < 8) {
      setError('Key too short (min 8 chars Base32)');
      setCurrentOtp('');
      return;
    }

    try {
      const totp = new OTPAuth.TOTP({
        issuer: 'EasyWork',
        label: 'Account',
        algorithm: 'SHA1',
        digits: 6,
        period: 30,
        secret: OTPAuth.Secret.fromBase32(cleanedSecret),
      });

      const token = totp.generate();
      setCurrentOtp(token);
      setError(null);
    } catch {
      setError('Invalid Key (Base32 format required)');
      setCurrentOtp('');
    }
  }, [secret]);

  useEffect(() => {
    const update = () => {
      const epochSeconds = Math.floor(Date.now() / 1000);
      const remaining = 30 - (epochSeconds % 30);
      setTimeLeft(remaining);

      if (secret.trim()) {
        generateOtp();
      }
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [secret, generateOtp]);

  const handleClear = () => {
    setSecret('');
    setCurrentOtp('');
    setError(null);
  };

  const handleCopy = (code: string) => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setIsCopied(true);
    onShowToast(`Copied OTP: ${code}`);

    try {
      confetti({
        particleCount: 15,
        spread: 40,
        origin: { y: 0.3 },
        colors: ['#6366f1', '#a855f7', '#38bdf8']
      });
    } catch {
      // safe fallback
    }

    setTimeout(() => setIsCopied(false), 2000);
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setSecret(text.trim());
      }
    } catch {
      // ignore
    }
  };

  const formattedOtp = currentOtp.length === 6 
    ? `${currentOtp.slice(0, 3)} ${currentOtp.slice(3)}` 
    : currentOtp;

  return (
    <section className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 sm:p-3.5 shadow-lg backdrop-blur-md">
      {/* Title & Clear */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <div className="p-1 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Shield className="w-3.5 h-3.5" />
          </div>
          <h2 className="text-xs font-bold text-white uppercase tracking-wider">
            2FA OTP
          </h2>
        </div>

        {secret && (
          <button
            onClick={handleClear}
            className="text-[11px] font-semibold text-rose-400 hover:text-rose-300 transition-colors flex items-center gap-0.5"
          >
            <X className="w-3 h-3" />
            <span>Clear</span>
          </button>
        )}
      </div>

      <div className="space-y-2">
        {/* Input Box */}
        <div className="relative flex items-center">
          <div className="absolute left-3 text-slate-500 pointer-events-none">
            <KeyRound className="w-3.5 h-3.5" />
          </div>

          <input
            type="text"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            placeholder="Paste 2FA Secret Key..."
            className="w-full pl-8 pr-16 py-2 bg-slate-950/90 border border-slate-800 focus:border-indigo-500 rounded-xl text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none font-mono"
            spellCheck={false}
          />

          <div className="absolute right-2 flex items-center gap-1">
            {secret ? (
              <button
                onClick={handleClear}
                className="p-1 rounded-md bg-rose-500/10 hover:bg-rose-500/20 text-rose-400"
                title="Clear"
              >
                <X className="w-3 h-3" />
              </button>
            ) : (
              <button
                onClick={handlePaste}
                className="px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-semibold"
              >
                Paste
              </button>
            )}
          </div>
        </div>

        {error && (
          <p className="text-[11px] text-rose-400 px-2 py-1 bg-rose-950/40 border border-rose-800/40 rounded-lg">
            {error}
          </p>
        )}

        {/* Live OTP Output Box */}
        {currentOtp && (
          <div 
            onClick={() => handleCopy(currentOtp)}
            className="flex items-center justify-between px-3.5 py-2.5 bg-gradient-to-r from-slate-950 via-indigo-950/40 to-slate-950 border border-indigo-500/40 rounded-xl cursor-pointer hover:border-indigo-400 transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 text-xs font-mono font-bold text-indigo-400 bg-indigo-950 px-2 py-1 rounded-lg border border-indigo-700/40">
                <Clock className="w-3 h-3 animate-pulse" />
                <span>{timeLeft}s</span>
              </div>

              <div className="text-xl sm:text-2xl font-black tracking-widest text-white font-mono select-all">
                {formattedOtp}
              </div>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                handleCopy(currentOtp);
              }}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow active:scale-95 transition-all"
            >
              {isCopied ? <Check className="w-3 h-3 text-emerald-300" /> : <Copy className="w-3 h-3" />}
              <span>{isCopied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        )}
      </div>
    </section>
  );
};
