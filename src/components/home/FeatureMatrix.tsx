import React from 'react';
import {
  ShieldCheck,
  Lock,
  UserX,
  Zap,
  Check,
  X,
  FileText,
  AlertTriangle,
  Fingerprint
} from 'lucide-react';

export const FeatureMatrix: React.FC = () => {
  return (
    <>
      {/* ========================================================================= */}
      {/* CAPABILITY GRID SHOWCASE */}
      {/* ========================================================================= */}
      <section id="security" className="w-full py-12 sm:py-16 font-mono">
        <div className="text-center max-w-3xl mx-auto mb-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-xs font-mono text-cyan-400">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
            <span>CRYPTOGRAPHIC PRIMITIVES & RESILIENCE</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white">
            Architecture Designed to Forget
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm">
            Zero persistence guarantee. When a room reaches TTL expiration, the cryptographic keys and Redis storage keys are irrevocably purged.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <div className="bg-[#090f18]/85 border border-cyan-500/20 rounded-2xl p-6 hover:border-cyan-500/60 transition-all space-y-3 shadow-[0_0_25px_rgba(0,240,255,0.04)]">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyber-cyan">
              <Lock className="h-5 w-5" aria-hidden="true" />
            </div>
            <h3 className="text-base font-bold text-white">E2EE AES-256-GCM</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Every message is encrypted with unique 96-bit random IVs and authenticated tags via the browser Web Crypto API. The server never observes plaintext.
            </p>
          </div>

          <div className="bg-[#090f18]/85 border border-cyan-500/20 rounded-2xl p-6 hover:border-cyan-500/60 transition-all space-y-3 shadow-[0_0_25px_rgba(0,240,255,0.04)]">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-cyber-green">
              <Zap className="h-5 w-5" aria-hidden="true" />
            </div>
            <h3 className="text-base font-bold text-white">Hard TTL Expiry</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Creator-enforced expiration (1h to 7d). Redis triggers automated memory eviction upon timeout, ensuring complete destruction of room telemetry.
            </p>
          </div>

          <div className="bg-[#090f18]/85 border border-cyan-500/20 rounded-2xl p-6 hover:border-cyan-500/60 transition-all space-y-3 shadow-[0_0_25px_rgba(0,240,255,0.04)]">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <UserX className="h-5 w-5" aria-hidden="true" />
            </div>
            <h3 className="text-base font-bold text-white">True Anonymity</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Zero registration. Zero phone numbers, email addresses, cookies, or device fingerprinting. Ephemeral session handles disappear on leave.
            </p>
          </div>

          <div className="bg-[#090f18]/85 border border-cyan-500/20 rounded-2xl p-6 hover:border-cyan-500/60 transition-all space-y-3 shadow-[0_0_25px_rgba(0,240,255,0.04)]">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Fingerprint className="h-5 w-5" aria-hidden="true" />
            </div>
            <h3 className="text-base font-bold text-white">DOMPurify Defense</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Multi-tier HTML sanitization on incoming display names, custom messages, and error states blocks script injection and cross-site execution vectors.
            </p>
          </div>

          <div className="bg-[#090f18]/85 border border-cyan-500/20 rounded-2xl p-6 hover:border-cyan-500/60 transition-all space-y-3 shadow-[0_0_25px_rgba(0,240,255,0.04)]">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400">
              <AlertTriangle className="h-5 w-5" aria-hidden="true" />
            </div>
            <h3 className="text-base font-bold text-white">Dual Rate Limiting</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Strict per-IP REST sliding window limiting paired with socket burst controls throttles brute-force room attacks and prevents network flooding.
            </p>
          </div>

          <div className="bg-[#090f18]/85 border border-cyan-500/20 rounded-2xl p-6 hover:border-cyan-500/60 transition-all space-y-3 shadow-[0_0_25px_rgba(0,240,255,0.04)]">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <FileText className="h-5 w-5" aria-hidden="true" />
            </div>
            <h3 className="text-base font-bold text-white">Ephemeral Sockets</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Real-time message propagation via Socket.IO WebSocket pipelines with automatic fallback to polling, auto-reconnect backoff, and heartbeat monitoring.
            </p>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* COMPARISON MATRIX SECTION */}
      {/* ========================================================================= */}
      <section id="comparison" className="w-full border-t border-cyan-500/20 bg-[#060a12]/80 py-16 sm:py-20 lg:py-24 font-mono">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-xs font-mono text-cyan-400">
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
              <span>SECURITY ARCHITECTURE COMPARISON</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white">
              Why CipherChat vs Traditional Messengers?
            </h2>
            <p className="text-slate-400 text-xs sm:text-sm">
              Standard chat applications demand persistent identifiers, store metadata on disk, and retain backups. CipherChat enforces ephemeral zero-knowledge principles.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex sm:hidden items-center justify-end gap-1.5 text-[10px] text-cyan-400/80 font-mono">
              <span>&larr; Swipe horizontally to compare &rarr;</span>
            </div>
            <div className="overflow-x-auto rounded-2xl border border-cyan-500/30 bg-[#090f18]/85 shadow-[0_0_30px_rgba(0,240,255,0.06)]">
              <table className="w-full min-w-[660px] sm:min-w-[720px] text-left text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-cyan-500/30 bg-[#05080e] text-slate-400 font-bold">
                    <th scope="col" className="p-3.5 sm:p-5">Security Vector</th>
                    <th scope="col" className="p-3.5 sm:p-5 text-emerald-400 bg-emerald-500/10 border-x border-emerald-500/30">
                      &gt;_ CipherChat
                    </th>
                    <th scope="col" className="p-3.5 sm:p-5">Signal</th>
                    <th scope="col" className="p-3.5 sm:p-5">Telegram</th>
                    <th scope="col" className="p-3.5 sm:p-5">Discord / Slack</th>
                  </tr>
                </thead>
              <tbody className="divide-y divide-cyan-500/15 text-slate-300">
                <tr className="hover:bg-cyan-500/5 transition-colors">
                  <td className="p-4 sm:p-5 font-semibold text-white">No Account / Phone # Required</td>
                  <td className="p-4 sm:p-5 text-emerald-400 bg-emerald-500/5 border-x border-emerald-500/30 font-bold">
                    <span className="flex items-center gap-1.5"><Check className="h-4 w-4 text-emerald-400" /> Yes (100% Anonymous)</span>
                  </td>
                  <td className="p-4 sm:p-5 text-slate-400"><span className="flex items-center gap-1.5"><X className="h-4 w-4 text-red-400" /> Phone required</span></td>
                  <td className="p-4 sm:p-5 text-slate-400"><span className="flex items-center gap-1.5"><X className="h-4 w-4 text-red-400" /> Phone required</span></td>
                  <td className="p-4 sm:p-5 text-slate-400"><span className="flex items-center gap-1.5"><X className="h-4 w-4 text-red-400" /> Email / Phone required</span></td>
                </tr>

                <tr className="hover:bg-cyan-500/5 transition-colors">
                  <td className="p-4 sm:p-5 font-semibold text-white">Zero Disk Persistence (RAM Only)</td>
                  <td className="p-4 sm:p-5 text-emerald-400 bg-emerald-500/5 border-x border-emerald-500/30 font-bold">
                    <span className="flex items-center gap-1.5"><Check className="h-4 w-4 text-emerald-400" /> Yes (Pure Redis RAM)</span>
                  </td>
                  <td className="p-4 sm:p-5 text-slate-400"><span className="flex items-center gap-1.5"><X className="h-4 w-4 text-amber-400" /> Client disk cached</span></td>
                  <td className="p-4 sm:p-5 text-slate-400"><span className="flex items-center gap-1.5"><X className="h-4 w-4 text-red-400" /> Cloud disk stored</span></td>
                  <td className="p-4 sm:p-5 text-slate-400"><span className="flex items-center gap-1.5"><X className="h-4 w-4 text-red-400" /> Permanent database</span></td>
                </tr>

                <tr className="hover:bg-cyan-500/5 transition-colors">
                  <td className="p-4 sm:p-5 font-semibold text-white">Hardware / Browser E2EE</td>
                  <td className="p-4 sm:p-5 text-emerald-400 bg-emerald-500/5 border-x border-emerald-500/30 font-bold">
                    <span className="flex items-center gap-1.5"><Check className="h-4 w-4 text-emerald-400" /> AES-256-GCM (Browser)</span>
                  </td>
                  <td className="p-4 sm:p-5 text-slate-300"><span className="flex items-center gap-1.5"><Check className="h-4 w-4 text-emerald-400" /> Signal Protocol</span></td>
                  <td className="p-4 sm:p-5 text-slate-400"><span className="flex items-center gap-1.5"><X className="h-4 w-4 text-amber-400" /> Secret Chats Only</span></td>
                  <td className="p-4 sm:p-5 text-slate-400"><span className="flex items-center gap-1.5"><X className="h-4 w-4 text-red-400" /> No E2EE (TLS only)</span></td>
                </tr>

                <tr className="hover:bg-cyan-500/5 transition-colors">
                  <td className="p-4 sm:p-5 font-semibold text-white">Room TTL Hard Self-Destruction</td>
                  <td className="p-4 sm:p-5 text-emerald-400 bg-emerald-500/5 border-x border-emerald-500/30 font-bold">
                    <span className="flex items-center gap-1.5"><Check className="h-4 w-4 text-emerald-400" /> Automated (1h - 7d)</span>
                  </td>
                  <td className="p-4 sm:p-5 text-slate-400"><span className="flex items-center gap-1.5"><X className="h-4 w-4 text-amber-400" /> Timer per message</span></td>
                  <td className="p-4 sm:p-5 text-slate-400"><span className="flex items-center gap-1.5"><X className="h-4 w-4 text-amber-400" /> Optional per chat</span></td>
                  <td className="p-4 sm:p-5 text-slate-400"><span className="flex items-center gap-1.5"><X className="h-4 w-4 text-red-400" /> None</span></td>
                </tr>

                <tr className="hover:bg-cyan-500/5 transition-colors">
                  <td className="p-4 sm:p-5 font-semibold text-white">Zero Metadata Retention</td>
                  <td className="p-4 sm:p-5 text-emerald-400 bg-emerald-500/5 border-x border-emerald-500/30 font-bold">
                    <span className="flex items-center gap-1.5"><Check className="h-4 w-4 text-emerald-400" /> Absolute (No user graphs)</span>
                  </td>
                  <td className="p-4 sm:p-5 text-slate-300"><span className="flex items-center gap-1.5"><Check className="h-4 w-4 text-emerald-400" /> Minimal metadata</span></td>
                  <td className="p-4 sm:p-5 text-slate-400"><span className="flex items-center gap-1.5"><X className="h-4 w-4 text-red-400" /> Retains contacts & logs</span></td>
                  <td className="p-4 sm:p-5 text-slate-400"><span className="flex items-center gap-1.5"><X className="h-4 w-4 text-red-400" /> Extensive tracking</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
    </>
  );
};

export default FeatureMatrix;
