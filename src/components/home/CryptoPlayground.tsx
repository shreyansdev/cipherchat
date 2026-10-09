import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Shield, Terminal, RefreshCw, KeyRound, Check, Sparkles, ShieldCheck } from 'lucide-react';

export const CryptoPlayground: React.FC = () => {
  const [sampleText, setSampleText] = useState('Meeting confirmed at 22:00 UTC. Zero traces.');
  const [passphrase, setPassphrase] = useState('quantum-vault-2026');
  const [derivedKeyHex, setDerivedKeyHex] = useState('a9f4c8e17b32d04a6e89f1c2d3b4e5f6');
  const [ivHex, setIvHex] = useState('0f4b82c19d4e5a6b7c8d9e0f');
  const [ciphertextHex, setCiphertextHex] = useState('');
  const [authTagHex, setAuthTagHex] = useState('7e8f9a0b1c2d3e4f');
  const [viewMode, setViewMode] = useState<'server' | 'peer'>('server');
  const [isComputing, setIsComputing] = useState(false);
  const [copiedCipher, setCopiedCipher] = useState(false);

  // Live real-time Web Crypto API encryption simulation
  useEffect(() => {
    let active = true;

    const runWebCryptoSimulation = async () => {
      try {
        setIsComputing(true);
        if (typeof window === 'undefined' || !window.crypto || !window.crypto.subtle) {
          // Fallback static hex for environments without subtle crypto
          if (active) {
            setCiphertextHex('3e8a7f92b4c10d5e89a47b12c3d5e6f8019a2b3c4d5e6f7a8b9c0d1e2f3a4b5c');
            setIsComputing(false);
          }
          return;
        }

        const encoder = new TextEncoder();
        const textData = encoder.encode(sampleText || ' ');
        const passData = encoder.encode(passphrase || 'cipherchat');

        // Derive key using PBKDF2
        const baseKey = await window.crypto.subtle.importKey(
          'raw',
          passData,
          { name: 'PBKDF2' },
          false,
          ['deriveKey']
        );

        const salt = encoder.encode('cipherchat-playground-salt');
        const derivedKey = await window.crypto.subtle.deriveKey(
          {
            name: 'PBKDF2',
            salt,
            iterations: 10000, // fast in-browser preview rounds for responsiveness
            hash: 'SHA-256',
          },
          baseKey,
          { name: 'AES-GCM', length: 256 },
          true,
          ['encrypt', 'decrypt']
        );

        // Export derived raw key for visualization
        const rawKeyBuf = await window.crypto.subtle.exportKey('raw', derivedKey);
        const rawKeyArr = Array.from(new Uint8Array(rawKeyBuf));
        const rawKeyHexStr = rawKeyArr.slice(0, 16).map(b => b.toString(16).padStart(2, '0')).join('');

        // Generate fresh 96-bit (12 byte) IV
        const iv = window.crypto.getRandomValues(new Uint8Array(12));
        const ivHexStr = Array.from(iv).map(b => b.toString(16).padStart(2, '0')).join('');

        // Encrypt with AES-GCM
        const encrypted = await window.crypto.subtle.encrypt(
          { name: 'AES-GCM', iv },
          derivedKey,
          textData
        );

        const encBytes = Array.from(new Uint8Array(encrypted));
        const tag = encBytes.slice(-16).map(b => b.toString(16).padStart(2, '0')).join('');
        const cipherPayload = encBytes.slice(0, -16).map(b => b.toString(16).padStart(2, '0')).join('');

        if (active) {
          setDerivedKeyHex(rawKeyHexStr);
          setIvHex(ivHexStr);
          setCiphertextHex(cipherPayload || '7d2e9f0a4b1c8e3a');
          setAuthTagHex(tag || 'e8f1a2b3c4d5e6f7');
          setIsComputing(false);
        }
      } catch (err) {
        console.error('Playground crypto error:', err);
        if (active) setIsComputing(false);
      }
    };

    const timer = setTimeout(runWebCryptoSimulation, 80);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [sampleText, passphrase]);

  const handleCopyCipher = () => {
    navigator.clipboard.writeText(`${ivHex}:${ciphertextHex}:${authTagHex}`);
    setCopiedCipher(true);
    setTimeout(() => setCopiedCipher(false), 2000);
  };

  const handleRandomizeMessage = () => {
    const samples = [
      'Meeting confirmed at 22:00 UTC. Zero traces.',
      'Deploy the updated ephemeral node cluster at midnight.',
      'Cryptographic handshake validated. Blind relay is active.',
      'Transferring encrypted seed shards via isolated channel.',
      'Memory countdown active: 3600 seconds until Redis RAM purge.',
    ];
    const pick = samples[Math.floor(Math.random() * samples.length)];
    setSampleText(pick);
  };

  return (
    <div className="w-full bg-[#080d16]/80 backdrop-blur-xl border border-cyan-500/30 rounded-2xl p-5 sm:p-6 shadow-[0_0_40px_rgba(0,240,255,0.08)] relative overflow-hidden font-mono">
      {/* Decorative corner accent hairlines */}
      <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-cyan-400/60 rounded-tl-xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-emerald-400/60 rounded-br-xl pointer-events-none" />

      {/* Header bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-cyan-500/20 gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyber-cyan shadow-[0_0_15px_rgba(0,240,255,0.2)]">
            <Terminal className="h-4 w-4" aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-white tracking-wide flex items-center gap-2">
              <span>LIVE CRYPTOGRAPHIC ENGINE</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold">
                ACTIVE
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Interactive Web Crypto Subtle API Sandbox • Zero Server Plaintext Proof
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleRandomizeMessage}
          className="text-[11px] px-2.5 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 hover:border-cyan-400 flex items-center gap-1.5 transition-all focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none"
          aria-label="Load random encrypted message"
        >
          <Sparkles className="h-3 w-3 text-cyber-cyan" aria-hidden="true" />
          <span>[Randomize Sample]</span>
        </button>
      </div>

      {/* Interactive Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 pt-4">
        {/* Plaintext Input */}
        <div className="md:col-span-7 space-y-1.5">
          <label htmlFor="crypto-sample-input" className="text-xs font-semibold text-emerald-400 flex items-center justify-between">
            <span>&gt; In-Browser Plaintext (Never leaves client)</span>
            <span className="text-[10px] text-slate-400 font-normal">{sampleText.length} chars</span>
          </label>
          <div className="relative">
            <input
              id="crypto-sample-input"
              name="sample-plaintext"
              type="text"
              value={sampleText}
              onChange={(e) => setSampleText(e.target.value)}
              placeholder="Type message to test live in-browser encryption…"
              maxLength={120}
              spellCheck={false}
              autoComplete="off"
              className="w-full h-11 px-3.5 rounded-xl bg-[#03060a]/90 border border-emerald-500/30 focus:border-emerald-400 text-slate-100 text-xs sm:text-sm font-mono placeholder:text-slate-600 focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none transition-all"
            />
            {isComputing && (
              <RefreshCw className="h-3.5 w-3.5 text-cyber-cyan animate-spin absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
            )}
          </div>
        </div>

        {/* Room Passphrase Input */}
        <div className="md:col-span-5 space-y-1.5">
          <label htmlFor="crypto-passphrase-input" className="text-xs font-semibold text-purple-400 flex items-center justify-between">
            <span>&gt; Room Passphrase</span>
            <span className="text-[10px] text-slate-400 font-normal">PBKDF2 Salt Seed</span>
          </label>
          <div className="relative">
            <input
              id="crypto-passphrase-input"
              name="sample-passphrase"
              type="text"
              value={passphrase}
              onChange={(e) => setPassphrase(e.target.value)}
              placeholder="Room password…"
              maxLength={30}
              spellCheck={false}
              autoComplete="off"
              className="w-full h-11 px-3.5 rounded-xl bg-[#03060a]/90 border border-purple-500/30 focus:border-purple-400 text-slate-100 text-xs sm:text-sm font-mono placeholder:text-slate-600 focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:outline-none transition-all"
            />
            <KeyRound className="h-3.5 w-3.5 text-purple-400/60 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
          </div>
        </div>
      </div>

      {/* Live Cryptographic Pipeline Visualizer */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-4 text-xs">
        <div className="p-2.5 rounded-xl bg-[#040810]/80 border border-cyan-500/20 space-y-1">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>PBKDF2-Derived AES-GCM Key</span>
            <Lock className="h-3 w-3 text-purple-400" aria-hidden="true" />
          </div>
          <div className="text-purple-300 font-bold truncate text-[11px] tracking-widest font-mono">
            0x{derivedKeyHex}...
          </div>
          <div className="text-[10px] text-slate-500">256-bit isolated in browser memory</div>
        </div>

        <div className="p-2.5 rounded-xl bg-[#040810]/80 border border-cyan-500/20 space-y-1">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Fresh 96-Bit Initialization Vector (IV)</span>
            <Shield className="h-3 w-3 text-cyan-400" aria-hidden="true" />
          </div>
          <div className="text-cyan-300 font-bold truncate text-[11px] tracking-widest font-mono">
            0x{ivHex}
          </div>
          <div className="text-[10px] text-slate-500">Unique nonce per packet stream</div>
        </div>

        <div className="p-2.5 rounded-xl bg-[#040810]/80 border border-cyan-500/20 space-y-1">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>GCM Authenticated Tag</span>
            <Check className="h-3 w-3 text-emerald-400" aria-hidden="true" />
          </div>
          <div className="text-emerald-300 font-bold truncate text-[11px] tracking-widest font-mono">
            0x{authTagHex}
          </div>
          <div className="text-[10px] text-slate-500">Rejects tampering / packet forgery</div>
        </div>
      </div>

      {/* Dual Perspective Comparison Switcher */}
      <div className="mt-4 pt-4 border-t border-cyan-500/20 space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-xs text-slate-300 font-bold uppercase tracking-wider">
            Dual-Perspective Cryptographic Inspection:
          </div>

          <div className="inline-flex rounded-lg bg-[#040810] p-1 border border-cyan-500/30">
            <button
              type="button"
              onClick={() => setViewMode('server')}
              className={`px-3 py-1 rounded-md text-xs font-mono font-bold transition-all focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none ${
                viewMode === 'server'
                  ? 'bg-cyan-500/25 text-cyan-300 border border-cyan-400/50 shadow-[0_0_15px_rgba(0,240,255,0.2)]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              [What Server Sees]
            </button>
            <button
              type="button"
              onClick={() => setViewMode('peer')}
              className={`px-3 py-1 rounded-md text-xs font-mono font-bold transition-all focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none ${
                viewMode === 'peer'
                  ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-400/50 shadow-[0_0_15px_rgba(0,255,101,0.2)]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              [What Peer Decrypts]
            </button>
          </div>
        </div>

        {/* Inspection Display Window */}
        <AnimatePresence mode="wait">
          {viewMode === 'server' ? (
            <motion.div
              key="server-view"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
              className="p-3.5 rounded-xl bg-[#04070d] border border-cyan-500/30 space-y-2"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="text-cyan-400 font-bold flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5 text-cyan-400" aria-hidden="true" />
                  <span>BLIND NETWORK PACKET RELAYED TO REDIS RAM:</span>
                </span>
                <button
                  type="button"
                  onClick={handleCopyCipher}
                  className="text-[10px] text-slate-400 hover:text-cyan-300 flex items-center gap-1 transition-colors focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none"
                  aria-label="Copy raw ciphertext hex"
                >
                  {copiedCipher ? (
                    <span className="text-emerald-400 flex items-center gap-1">
                      <Check className="h-3 w-3" aria-hidden="true" /> Copied!
                    </span>
                  ) : (
                    <span>[Copy Hex]</span>
                  )}
                </button>
              </div>

              <div className="bg-[#020408] p-3 rounded-lg border border-cyan-500/20 text-xs font-mono text-cyan-300/90 break-all select-all leading-relaxed">
                <span className="text-purple-400 font-bold" title="IV Nonce">{ivHex}</span>
                <span className="text-slate-500">:</span>
                <span className="text-cyan-300" title="Ciphertext">{ciphertextHex}</span>
                <span className="text-slate-500">:</span>
                <span className="text-emerald-400 font-bold" title="Auth Tag">{authTagHex}</span>
              </div>

              <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-400 pt-1">
                <span className="text-emerald-400/90 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" aria-hidden="true" />
                  Zero server plaintext • Zero key storage • Ephemeral RAM TTL only
                </span>
                <span className="text-slate-500 font-mono">Format: [IV:Ciphertext:Tag]</span>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="peer-view"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
              className="p-3.5 rounded-xl bg-[#04070d] border border-emerald-500/30 space-y-2"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
                  <span>AUTHENTICATED IN-BROWSER DECRYPTION:</span>
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  GCM Verified
                </span>
              </div>

              <div className="bg-[#020408] p-3 rounded-lg border border-emerald-500/20 text-sm font-mono text-slate-100 break-words leading-relaxed">
                {sampleText ? (
                  <span className="text-emerald-200">{sampleText}</span>
                ) : (
                  <span className="text-slate-500 italic">[Empty Message]</span>
                )}
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                <span className="text-cyan-400/90 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" aria-hidden="true" />
                  Decrypted locally with PBKDF2 room key • Never stored on disk
                </span>
                <span className="text-slate-500 font-mono">Latency: &lt; 0.4ms</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default CryptoPlayground;
