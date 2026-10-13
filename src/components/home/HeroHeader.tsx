import React from 'react';
import { Terminal } from 'lucide-react';

export const HeroHeader: React.FC = () => {
  return (
    <div className="space-y-5 sm:space-y-6 text-left">
      {/* Top Eyebrow Tag */}
      <div className="inline-flex items-center gap-2 px-3 sm:px-3.5 py-1 sm:py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-[10px] sm:text-xs font-mono text-cyber-cyan tracking-wider shadow-[0_0_15px_rgba(0,240,255,0.12)] max-w-full flex-wrap">
        <span className="w-2 h-2 rounded-full bg-cyber-green animate-pulse flex-shrink-0" aria-hidden="true" />
        <span className="break-words">MIL-SPEC ENCRYPTION • ZERO DISK RESIDUE</span>
      </div>

      {/* Giant Main Headline */}
      <div className="space-y-2.5 sm:space-y-3">
        <h1 className="text-3xl sm:text-5xl xl:text-6xl font-extrabold tracking-tight text-white font-mono leading-tight">
          Ephemeral Rooms. <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-cyan-400 to-purple-400">
            Zero Metadata Trace.
          </span>
        </h1>
        <p className="text-slate-300 text-xs sm:text-base lg:text-lg font-mono leading-relaxed pt-1 max-w-2xl">
          Real-time, zero-knowledge chat channels with browser-derived AES-256-GCM keys. All messages reside strictly in volatile Redis RAM with hard TTL expiration.
        </p>
      </div>

      {/* Key Metric Highlights with tabular numbers */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 pt-1 sm:pt-2 font-mono tabular-nums">
        <div className="bg-[#0b121e]/80 border border-cyan-500/20 rounded-xl p-2.5 sm:p-3.5">
          <div className="text-[10px] sm:text-xs text-slate-400 uppercase">Cipher</div>
          <div className="text-base sm:text-lg font-bold text-cyber-green">AES-256</div>
          <div className="text-[9px] sm:text-[10px] text-slate-500">GCM Authenticated</div>
        </div>
        <div className="bg-[#0b121e]/80 border border-cyan-500/20 rounded-xl p-2.5 sm:p-3.5">
          <div className="text-[10px] sm:text-xs text-slate-400 uppercase">KDF Iterations</div>
          <div className="text-base sm:text-lg font-bold text-cyber-cyan">310,000</div>
          <div className="text-[9px] sm:text-[10px] text-slate-500">PBKDF2 SHA-256</div>
        </div>
        <div className="bg-[#0b121e]/80 border border-cyan-500/20 rounded-xl p-2.5 sm:p-3.5">
          <div className="text-[10px] sm:text-xs text-slate-400 uppercase">Server Plaintext</div>
          <div className="text-base sm:text-lg font-bold text-purple-400">0.00%</div>
          <div className="text-[9px] sm:text-[10px] text-slate-500">End-to-End Blind</div>
        </div>
        <div className="bg-[#0b121e]/80 border border-cyan-500/20 rounded-xl p-2.5 sm:p-3.5">
          <div className="text-[10px] sm:text-xs text-slate-400 uppercase">Persistence</div>
          <div className="text-base sm:text-lg font-bold text-cyber-amber">0 Disk</div>
          <div className="text-[9px] sm:text-[10px] text-slate-500">Pure RAM + Hard TTL</div>
        </div>
      </div>

      {/* Live Cryptographic Telemetry Console */}
      <div className="bg-[#05080e]/90 border border-cyan-500/30 rounded-2xl p-3.5 sm:p-5 font-mono shadow-[0_0_30px_rgba(0,240,255,0.08)] relative overflow-hidden">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-cyan-500/20 text-xs gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Terminal className="h-4 w-4 text-cyber-green flex-shrink-0" aria-hidden="true" />
            <span className="text-slate-200 font-bold tracking-wider truncate text-[11px] sm:text-xs">LIVE_SECURITY_TELEMETRY.SYS</span>
          </div>
          <span className="text-[9px] sm:text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold flex-shrink-0">
            SYSTEM READY
          </span>
        </div>
        <div className="space-y-2 sm:space-y-1.5 text-xs text-slate-400 font-mono">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-0.5 sm:gap-2">
            <span className="text-slate-500 text-[11px] sm:text-xs">&gt; WebCrypto Subtle API:</span>
            <span className="text-emerald-400 font-bold text-[11px] sm:text-xs">ACTIVE (In-Browser Only)</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-0.5 sm:gap-2">
            <span className="text-slate-500 text-[11px] sm:text-xs">&gt; Ephemeral Key Storage:</span>
            <span className="text-cyan-400 font-bold text-[11px] sm:text-xs">SESSION_RAM (Non-extractable)</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-0.5 sm:gap-2">
            <span className="text-slate-500 text-[11px] sm:text-xs">&gt; Redis Cluster Pipeline:</span>
            <span className="text-purple-400 font-bold text-[11px] sm:text-xs">CIPHERTEXT_ONLY (Hard TTL Attached)</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-0.5 sm:gap-2">
            <span className="text-slate-500 text-[11px] sm:text-xs">&gt; Zero Metadata Protocol:</span>
            <span className="text-amber-400 font-bold text-[11px] sm:text-xs">ANONYMOUS (No Auth / No Cookies)</span>
          </div>
        </div>

        {/* Console Footnote */}
        <div className="mt-4 pt-3 border-t border-cyan-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[10px] sm:text-[11px] text-slate-500 font-mono">
          <span>HOST STATUS: OK</span>
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg bg-[#0b121e] border border-cyan-500/20 text-slate-300">
              TLS 1.3
            </span>
            <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg bg-[#0b121e] border border-cyan-500/20 text-slate-300">
              STRICT-CSP
            </span>
            <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg bg-[#0b121e] border border-cyan-500/20 text-slate-300">
              HSTS PRELOAD
            </span>
            <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg bg-[#0b121e] border border-cyan-500/20 text-slate-300">
              XSS_PURIFY
            </span>
            <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg bg-[#0b121e] border border-cyan-500/20 text-slate-300">
              VOLATILE_ONLY
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroHeader;
