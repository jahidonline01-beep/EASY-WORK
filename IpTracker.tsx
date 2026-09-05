import React, { useState, useEffect } from 'react';
import { Globe, RefreshCw, Copy, Check, ShieldCheck, MapPin, Wifi, ShieldAlert } from 'lucide-react';

interface IpData {
  ip: string;
  country: string;
  countryCode: string;
  city: string;
  region: string;
  isp: string;
  org: string;
  isVpnOrProxy?: boolean;
}

interface IpTrackerProps {
  onShowToast: (message: string) => void;
}

export const IpTracker: React.FC<IpTrackerProps> = ({ onShowToast }) => {
  const [ipData, setIpData] = useState<IpData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Convert country code (e.g., US, BD) to Flag Emoji
  const getFlagEmoji = (countryCode: string) => {
    if (!countryCode || countryCode.length !== 2) return '🌐';
    const codePoints = countryCode
      .toUpperCase()
      .split('')
      .map(char => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
  };

  const fetchIpInfo = async () => {
    setLoading(true);
    setError(null);

    const checkIsVpn = (text: string) => {
      const lower = text.toLowerCase();
      return lower.includes('vpn') || 
             lower.includes('hosting') || 
             lower.includes('datacenter') || 
             lower.includes('cloud') || 
             lower.includes('digitalocean') || 
             lower.includes('m247') ||
             lower.includes('ovh') ||
             lower.includes('linode') ||
             lower.includes('amazon') ||
             lower.includes('google');
    };

    // Service 1: ipwho.is (fast, CORS enabled, HTTPS)
    try {
      const res = await fetch('https://ipwho.is/', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data.success !== false && data.ip) {
          const orgStr = `${data.connection?.org || ''} ${data.connection?.isp || ''}`;
          setIpData({
            ip: data.ip,
            country: data.country || 'Live Network',
            countryCode: data.country_code || '',
            city: data.city || '',
            region: data.region || '',
            isp: data.connection?.isp || data.connection?.org || 'Network Provider',
            org: data.connection?.org || '',
            isVpnOrProxy: checkIsVpn(orgStr),
          });
          setLoading(false);
          return;
        }
      }
    } catch {
      // try next
    }

    // Service 2: freeipapi.com
    try {
      const res = await fetch('https://freeipapi.com/api/json', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data.ipAddress) {
          setIpData({
            ip: data.ipAddress,
            country: data.countryName || 'Global',
            countryCode: data.countryCode || '',
            city: data.cityName || '',
            region: data.regionName || '',
            isp: 'Broadband / Cellular',
            org: '',
            isVpnOrProxy: data.isProxy || false,
          });
          setLoading(false);
          return;
        }
      }
    } catch {
      // try next
    }

    // Service 3: ipapi.co
    try {
      const res = await fetch('https://ipapi.co/json/');
      if (res.ok) {
        const data = await res.json();
        if (data.ip) {
          const orgStr = `${data.org || ''} ${data.asn || ''}`;
          setIpData({
            ip: data.ip,
            country: data.country_name || data.country || 'Global',
            countryCode: data.country_code || '',
            city: data.city || '',
            region: data.region || '',
            isp: data.org || data.asn || 'Connected',
            org: data.org || '',
            isVpnOrProxy: checkIsVpn(orgStr),
          });
          setLoading(false);
          return;
        }
      }
    } catch {
      // try next
    }

    // Fallback: ipify
    try {
      const res = await fetch('https://api.ipify.org?format=json');
      const data = await res.json();
      setIpData({
        ip: data.ip,
        country: 'Online Network',
        countryCode: '',
        city: '',
        region: '',
        isp: 'Active Connection',
        org: '',
        isVpnOrProxy: false,
      });
    } catch {
      setError('Unable to detect IP. Click refresh.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIpInfo();
  }, []);

  const handleRefresh = () => {
    fetchIpInfo();
    onShowToast('Checking IP and Location...');
  };

  const handleCopyIp = () => {
    if (!ipData?.ip) return;
    navigator.clipboard.writeText(ipData.ip);
    setCopied(true);
    onShowToast(`Copied IP: ${ipData.ip}`);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 sm:p-3.5 shadow-lg backdrop-blur-md relative overflow-hidden">
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5">
          <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Globe className="w-3.5 h-3.5" />
          </div>
          <h2 className="text-xs font-bold text-white uppercase tracking-wider">
            Live IP & Location
          </h2>

          {ipData && (
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
              ipData.isVpnOrProxy 
                ? 'bg-amber-950/80 text-amber-300 border border-amber-700/50' 
                : 'bg-emerald-950/80 text-emerald-300 border border-emerald-700/50'
            }`}>
              {ipData.isVpnOrProxy ? (
                <>
                  <ShieldAlert className="w-3 h-3 text-amber-400" />
                  <span>VPN / Proxy Active</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  <span>Direct Connection</span>
                </>
              )}
            </span>
          )}
        </div>

        <button
          onClick={handleRefresh}
          disabled={loading}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all active:scale-95 disabled:opacity-50"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-2.5 text-xs text-slate-400">
          <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-400" />
          <span>Detecting IP Address & Location...</span>
        </div>
      ) : error ? (
        <div className="flex items-center justify-between py-2 text-xs text-rose-400">
          <span>{error}</span>
          <button onClick={handleRefresh} className="underline text-indigo-400">Retry</button>
        </div>
      ) : ipData ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {/* IP Address Card */}
          <div 
            onClick={handleCopyIp}
            className="flex items-center justify-between px-3 py-2 bg-slate-950/90 rounded-xl border border-slate-800 hover:border-cyan-500/40 cursor-pointer transition-all group"
            title="Click to copy IP"
          >
            <div className="flex items-center gap-2 truncate">
              <Wifi className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
              <div className="truncate">
                <span className="text-[10px] text-slate-500 block leading-tight font-semibold">IP ADDRESS</span>
                <span className="text-xs font-bold text-white font-mono group-hover:text-cyan-300 transition-colors truncate">
                  {ipData.ip}
                </span>
              </div>
            </div>
            <div className="p-1 rounded bg-slate-800 text-slate-400 group-hover:bg-cyan-500 group-hover:text-white transition-all flex-shrink-0 ml-2">
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            </div>
          </div>

          {/* Country & Location */}
          <div className="flex items-center gap-2.5 px-3 py-2 bg-slate-950/90 rounded-xl border border-slate-800 truncate">
            <span className="text-xl flex-shrink-0 leading-none">
              {getFlagEmoji(ipData.countryCode)}
            </span>
            <div className="truncate">
              <span className="text-[10px] text-slate-500 block leading-tight font-semibold">COUNTRY / CITY</span>
              <span className="text-xs font-bold text-slate-200 truncate block">
                {ipData.country} {ipData.city ? `(${ipData.city})` : ''}
              </span>
            </div>
          </div>

          {/* ISP / Provider */}
          <div className="flex items-center gap-2 px-3 py-2 bg-slate-950/90 rounded-xl border border-slate-800 truncate">
            <MapPin className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
            <div className="truncate">
              <span className="text-[10px] text-slate-500 block leading-tight font-semibold">ISP / HOST</span>
              <span className="text-xs font-semibold text-slate-300 truncate block font-mono">
                {ipData.isp}
              </span>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
};
