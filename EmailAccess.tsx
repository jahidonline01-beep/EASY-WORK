import React, { useState, useRef } from 'react';
import { Mail, ArrowLeft, RefreshCw, Maximize2, Minimize2 } from 'lucide-react';

interface EmailAccessProps {
  onShowToast: (message: string) => void;
}

const EMAIL_HOME = 'https://painitemail.online';

export const EmailAccess: React.FC<EmailAccessProps> = ({ onShowToast }) => {
  const [isOpenModal, setIsOpenModal] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [hasOpenedOnce, setHasOpenedOnce] = useState<boolean>(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const loadTimerRef = useRef<number | null>(null);

  const clearLoadTimer = () => {
    if (loadTimerRef.current) {
      window.clearTimeout(loadTimerRef.current);
      loadTimerRef.current = null;
    }
  };

  const handleOpenPanel = () => {
    if (!hasOpenedOnce) {
      setHasOpenedOnce(true);
      setIsLoading(true);
    }
    setIsOpenModal(true);
    onShowToast('Opening painitemail.online...');
  };

  const handleClosePanel = () => {
    setIsOpenModal(false);
    setIsFullscreen(false);
  };

  // Keep the live iframe session. Never reset src to the homepage and
  // never remount to a stored address — the in-page NEW button changes
  // the mailbox, and this refresh must follow whatever is current.
  const handleSoftRefresh = () => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    setIsLoading(true);
    clearLoadTimer();

    try {
      iframe.contentWindow?.postMessage({ type: 'refresh-inbox' }, '*');
    } catch {
      // cross-origin; ignore
    }

    loadTimerRef.current = window.setTimeout(() => {
      setIsLoading(false);
    }, 800);

    onShowToast('Refreshing current inbox...');
  };

  return (
    <>
      <section className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 sm:p-3.5 shadow-lg backdrop-blur-md">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <div className="p-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Mail className="w-3.5 h-3.5" />
            </div>
            <h2 className="text-xs font-bold text-white uppercase tracking-wider">
              Temp Email
            </h2>
          </div>
          <span className="text-[10px] font-mono text-emerald-400 font-semibold">
            painitemail.online
          </span>
        </div>

        <button
          onClick={handleOpenPanel}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-emerald-600/20 active:scale-98 transition-all"
        >
          <Mail className="w-4 h-4" />
          <span>Open Email (painitemail.online)</span>
        </button>
      </section>

      {hasOpenedOnce && (
        <div
          className={`fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/90 backdrop-blur-md transition-opacity duration-200 ${
            isOpenModal ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none hidden'
          }`}
        >
          <div
            className={`flex flex-col bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden transition-all ${
              isFullscreen
                ? 'w-full h-full rounded-none border-none'
                : 'w-full max-w-5xl h-[88vh]'
            }`}
          >
            <div className="flex items-center justify-between px-3 py-2.5 bg-slate-950 border-b border-slate-800 flex-shrink-0">
              <button
                onClick={handleClosePanel}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow transition-all active:scale-95"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Home</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleSoftRefresh}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 text-xs font-bold border border-emerald-500/30 transition-all shadow active:scale-95"
                  title="Refresh the inbox currently open in the page"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-emerald-400' : ''}`} />
                  <span>Refresh Inbox</span>
                </button>

                <button
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all border border-slate-700 active:scale-95"
                  title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                >
                  {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div className="relative flex-1 w-full bg-slate-950">
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-950/70 z-10 pointer-events-none">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs text-slate-300 font-medium">Refreshing inbox...</span>
                  </div>
                </div>
              )}

              <iframe
                ref={iframeRef}
                src={EMAIL_HOME}
                title="Painite Email"
                className="w-full h-full border-0 bg-white"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-top-navigation-by-user-activation"
                onLoad={() => {
                  clearLoadTimer();
                  setIsLoading(false);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};
