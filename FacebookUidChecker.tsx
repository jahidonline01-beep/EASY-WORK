import React, { useState, useMemo, useRef } from 'react';
import { 
  Users, CheckCircle2, XCircle, Copy, Trash2, 
  Download, Play, Square, RefreshCw, Check, ExternalLink
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface UidItem {
  uid: string;
  status: 'pending' | 'checking' | 'active' | 'suspended' | 'invalid';
  detail?: string;
}

interface FacebookUidCheckerProps {
  onShowToast: (message: string) => void;
}

export const FacebookUidChecker: React.FC<FacebookUidCheckerProps> = ({ onShowToast }) => {
  const [inputText, setInputText] = useState<string>('');
  const [items, setItems] = useState<UidItem[]>([]);
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [activeCopied, setActiveCopied] = useState<boolean>(false);
  const [suspendedCopied, setSuspendedCopied] = useState<boolean>(false);
  const [progress, setProgress] = useState<{ current: number; total: number }>({ current: 0, total: 0 });

  const abortControllerRef = useRef<boolean>(false);

  // Parsing & deduplication stats
  const parsingStats = useMemo(() => {
    const rawLines = inputText
      .split(/[\r\n,]+/)
      .map(s => s.trim())
      .filter(Boolean);

    const extractedUids: string[] = [];
    const seen = new Set<string>();
    let duplicatesCount = 0;

    for (const line of rawLines) {
      const match = line.match(/\d{4,20}/);
      if (match) {
        const uid = match[0];
        if (seen.has(uid)) {
          duplicatesCount++;
        } else {
          seen.add(uid);
          extractedUids.push(uid);
        }
      }
    }

    return {
      totalRaw: rawLines.length,
      uniqueCount: extractedUids.length,
      duplicatesCount,
      uniqueUids: extractedUids,
    };
  }, [inputText]);

  const activeList = useMemo(() => items.filter(i => i.status === 'active'), [items]);
  const suspendedList = useMemo(() => items.filter(i => i.status === 'suspended' || i.status === 'invalid'), [items]);

  const handleInputChange = (text: string) => {
    setInputText(text);
    if (!isChecking) {
      const rawLines = text.split(/[\r\n,]+/).map(s => s.trim()).filter(Boolean);
      const seen = new Set<string>();
      const newItems: UidItem[] = [];

      for (const line of rawLines) {
        const match = line.match(/\d{4,20}/);
        if (match) {
          const uid = match[0];
          if (!seen.has(uid)) {
            seen.add(uid);
            newItems.push({ uid, status: 'pending' });
          }
        }
      }
      setItems(newItems);
    }
  };

  const verifyUidStatus = async (uid: string): Promise<{ status: 'active' | 'suspended' | 'invalid' }> => {
    if (uid.length < 4 || !/^\d+$/.test(uid)) {
      return { status: 'invalid' };
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);
    const url = `https://graph.facebook.com/${encodeURIComponent(uid)}/picture?type=normal&redirect=false`;

    try {
      const res = await fetch(url, { signal: controller.signal, cache: 'no-store' });
      const data = await res.json().catch(() => null);
      if (!data || data.error) return { status: 'suspended' };

      const pic = (data.data && data.data.url) || '';
      if (!pic || /rsrc\.php/i.test(pic)) return { status: 'suspended' };
      return { status: 'active' };
    } catch {
      return { status: 'suspended' };
    } finally {
      clearTimeout(timer);
    }
  };

  const handleStartCheck = async () => {
    if (items.length === 0) {
      if (parsingStats.uniqueUids.length > 0) {
        const initial = parsingStats.uniqueUids.map(uid => ({ uid, status: 'pending' as const }));
        setItems(initial);
      } else {
        onShowToast('Paste Facebook UIDs first');
        return;
      }
    }

    setIsChecking(true);
    abortControllerRef.current = false;
    onShowToast(`Checking ${items.length} UIDs...`);

    const updatedList = [...items];
    const total = updatedList.length;
    setProgress({ current: 0, total });

    const concurrency = 4;
    for (let i = 0; i < total; i += concurrency) {
      if (abortControllerRef.current) break;

      const chunk = updatedList.slice(i, i + concurrency);
      chunk.forEach(item => { item.status = 'checking'; });
      setItems([...updatedList]);

      const results = await Promise.all(
        chunk.map(item => verifyUidStatus(item.uid))
      );

      chunk.forEach((item, idx) => {
        item.status = results[idx].status;
      });

      const currentCount = Math.min(i + concurrency, total);
      setProgress({ current: currentCount, total });
      setItems([...updatedList]);

      await new Promise(r => setTimeout(r, 60));
    }

    setIsChecking(false);
    onShowToast('Verification Complete');

    try {
      confetti({
        particleCount: 25,
        spread: 50,
        origin: { y: 0.5 },
        colors: ['#3b82f6', '#10b981', '#6366f1']
      });
    } catch {
      // safe fallback
    }
  };

  const handleStopCheck = () => {
    abortControllerRef.current = true;
    setIsChecking(false);
  };

  const handleClearAll = () => {
    setInputText('');
    setItems([]);
    setProgress({ current: 0, total: 0 });
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) handleInputChange(text);
    } catch {
      // ignore
    }
  };

  const handleCopyActive = () => {
    if (activeList.length === 0) return;
    navigator.clipboard.writeText(activeList.map(i => i.uid).join('\n'));
    setActiveCopied(true);
    onShowToast(`Copied ${activeList.length} Active UIDs`);
    setTimeout(() => setActiveCopied(false), 2000);
  };

  const handleCopySuspended = () => {
    if (suspendedList.length === 0) return;
    navigator.clipboard.writeText(suspendedList.map(i => i.uid).join('\n'));
    setSuspendedCopied(true);
    onShowToast(`Copied ${suspendedList.length} Suspended UIDs`);
    setTimeout(() => setSuspendedCopied(false), 2000);
  };

  const handleExportTxt = (type: 'active' | 'suspended') => {
    const list = type === 'active' ? activeList : suspendedList;
    if (list.length === 0) return;

    const content = list.map(i => i.uid).join('\n');
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fb_${type}_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 sm:p-3.5 shadow-lg backdrop-blur-md">
      {/* Title & Stats */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <div className="p-1 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Users className="w-3.5 h-3.5" />
          </div>
          <h2 className="text-xs font-bold text-white uppercase tracking-wider">
            FB UID Checker
          </h2>
        </div>

        <div className="flex items-center gap-1.5 font-mono text-[11px]">
          <span className="text-slate-400">Total: <strong className="text-white">{parsingStats.totalRaw}</strong></span>
          <span className="text-slate-600">|</span>
          <span className="text-indigo-300">Valid: <strong>{parsingStats.uniqueCount}</strong></span>
          <span className="text-slate-600">|</span>
          <span className="text-amber-400">Dup: <strong>{parsingStats.duplicatesCount}</strong></span>
        </div>
      </div>

      {/* Compact Input */}
      <div className="space-y-2 mb-2.5">
        <div className="relative">
          <textarea
            value={inputText}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder="Paste FB UIDs here..."
            rows={2}
            className="w-full p-2.5 bg-slate-950/90 border border-slate-800 focus:border-blue-500 rounded-xl text-xs text-slate-200 placeholder:text-slate-500 font-mono focus:outline-none resize-none"
          />

          <div className="absolute top-2 right-2 flex items-center gap-1">
            {!inputText ? (
              <button
                onClick={handlePaste}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold transition-all border border-slate-700 active:scale-95 shadow"
              >
                Paste
              </button>
            ) : (
              <button
                onClick={handleClearAll}
                className="p-1 rounded-md bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400"
                title="Clear"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {!isChecking ? (
            <button
              onClick={handleStartCheck}
              disabled={items.length === 0}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-600/20 active:scale-95 transition-all disabled:opacity-40"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>Check UIDs ({items.length})</span>
            </button>
          ) : (
            <button
              onClick={handleStopCheck}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl active:scale-95 transition-all"
            >
              <Square className="w-3.5 h-3.5 fill-white" />
              <span>Stop ({progress.current}/{progress.total})</span>
            </button>
          )}

          {inputText && (
            <button
              onClick={handleClearAll}
              className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 active:scale-95 transition-all"
            >
              Clear
            </button>
          )}
        </div>

        {/* Progress bar */}
        {isChecking && (
          <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 to-emerald-400 transition-all"
              style={{ width: `${(progress.current / Math.max(1, progress.total)) * 100}%` }}
            />
          </div>
        )}
      </div>

      {/* Output Boxes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {/* ACTIVE BOX */}
        <div className="bg-slate-950/80 border border-emerald-500/30 rounded-xl p-2.5">
          <div className="flex items-center justify-between pb-1.5 border-b border-emerald-500/20 mb-1.5">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-xs font-bold text-emerald-300 uppercase">Active</span>
              <span className="px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 text-[10px] font-bold font-mono">
                {activeList.length}
              </span>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleCopyActive}
                disabled={activeList.length === 0}
                className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 text-[11px] font-semibold hover:bg-emerald-500/20 disabled:opacity-30"
              >
                {activeCopied ? 'Copied' : 'Copy'}
              </button>
              <button
                onClick={() => handleExportTxt('active')}
                disabled={activeList.length === 0}
                className="p-1 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-30"
                title="Download"
              >
                <Download className="w-3 h-3" />
              </button>
            </div>
          </div>

          <div className="max-h-[140px] overflow-y-auto space-y-1 font-mono text-[11px]">
            {activeList.length > 0 ? (
              activeList.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-1.5 rounded bg-emerald-950/30 border border-emerald-500/20 text-emerald-200">
                  <span className="font-bold select-all truncate">{item.uid}</span>
                  <a
                    href={`https://facebook.com/${item.uid}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-0.5 text-slate-400 hover:text-emerald-300"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              ))
            ) : (
              <div className="py-4 text-center text-slate-600 text-[11px]">
                Active results appear here
              </div>
            )}
          </div>
        </div>

        {/* SUSPENDED BOX */}
        <div className="bg-slate-950/80 border border-rose-500/30 rounded-xl p-2.5">
          <div className="flex items-center justify-between pb-1.5 border-b border-rose-500/20 mb-1.5">
            <div className="flex items-center gap-1.5">
              <XCircle className="w-3.5 h-3.5 text-rose-400" />
              <span className="text-xs font-bold text-rose-300 uppercase">Suspended</span>
              <span className="px-1.5 py-0.2 rounded bg-rose-950 text-rose-300 text-[10px] font-bold font-mono">
                {suspendedList.length}
              </span>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleCopySuspended}
                disabled={suspendedList.length === 0}
                className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-300 text-[11px] font-semibold hover:bg-rose-500/20 disabled:opacity-30"
              >
                {suspendedCopied ? 'Copied' : 'Copy'}
              </button>
              <button
                onClick={() => handleExportTxt('suspended')}
                disabled={suspendedList.length === 0}
                className="p-1 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-30"
                title="Download"
              >
                <Download className="w-3 h-3" />
              </button>
            </div>
          </div>

          <div className="max-h-[140px] overflow-y-auto space-y-1 font-mono text-[11px]">
            {suspendedList.length > 0 ? (
              suspendedList.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-1.5 rounded bg-rose-950/30 border border-rose-500/20 text-rose-200">
                  <span className="font-bold select-all truncate">{item.uid}</span>
                  <span className="text-[9px] px-1 py-0.5 rounded bg-rose-900/50 text-rose-300">Dead</span>
                </div>
              ))
            ) : (
              <div className="py-4 text-center text-slate-600 text-[11px]">
                Suspended results appear here
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
