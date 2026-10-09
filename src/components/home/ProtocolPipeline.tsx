import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { KeyRound, Lock, ShieldCheck, Check, Terminal, Zap, Shield } from 'lucide-react';

interface StepDetail {
  id: string;
  stepNumber: string;
  title: string;
  shortDesc: string;
  icon: React.ComponentType<{ className?: string; 'aria-hidden'?: string | boolean }>;
  accentColor: string;
  bgTint: string;
  borderTint: string;
  algorithm: string;
  standard: string;
  guarantee: string;
  details: string[];
  codeSnippet: string;
}

const PROTOCOL_STEPS: StepDetail[] = [
  {
    id: 'synthesis',
    stepNumber: '01',
    title: 'Key Synthesis',
    shortDesc: 'PBKDF2-SHA256 • 310k Rounds',
    icon: KeyRound,
    accentColor: 'text-cyber-green',
    bgTint: 'bg-emerald-500/10',
    borderTint: 'border-emerald-500/40',
    algorithm: 'PBKDF2 with HMAC-SHA256',
    standard: 'NIST SP 800-132 / RFC 8018',
    guarantee: 'Key never leaves client memory',
    details: [
      'Derived directly in browser from room password and room slug salt.',
      '310,000 iterations make offline brute-force attacks computationally infeasible.',
      'Deterministic salt ensures all authorized participants derive identical AES-256 keys.',
    ],
    codeSnippet: `const key = await window.crypto.subtle.deriveKey(
  { name: 'PBKDF2', salt: new TextEncoder().encode(roomSlug), iterations: 310000, hash: 'SHA-256' },
  passwordKey,
  { name: 'AES-GCM', length: 256 },
  false,
  ['encrypt', 'decrypt']
);`,
  },
  {
    id: 'encryption',
    stepNumber: '02',
    title: 'Client Encryption',
    shortDesc: 'AES-256-GCM + 96-bit Random IV',
    icon: Lock,
    accentColor: 'text-cyber-cyan',
    bgTint: 'bg-cyan-500/10',
    borderTint: 'border-cyan-500/40',
    algorithm: 'AES-GCM (Galois/Counter Mode)',
    standard: 'NIST SP 800-38D',
    guarantee: 'Authenticated ciphertext before network transit',
    details: [
      'Each packet generates a fresh, cryptographically strong 96-bit Initialization Vector.',
      'Provides confidentiality alongside authenticated integrity verification.',
      'Only encrypted byte arrays and IV nonces ever reach the WebSocket stream.',
    ],
    codeSnippet: `const iv = window.crypto.getRandomValues(new Uint8Array(12));
const ciphertext = await window.crypto.subtle.encrypt(
  { name: 'AES-GCM', iv },
  derivedKey,
  new TextEncoder().encode(plaintext)
);
// Payload: { ciphertext, iv }`,
  },
  {
    id: 'relay',
    stepNumber: '03',
    title: 'Ephemeral Relay',
    shortDesc: 'Redis 7 RAM • Zero Disk Writes',
    icon: Terminal,
    accentColor: 'text-purple-400',
    bgTint: 'bg-purple-500/10',
    borderTint: 'border-purple-500/40',
    algorithm: 'Volatile In-Memory TTL Queue',
    standard: 'Blind Transport Relay',
    guarantee: 'Hard automated memory purge on TTL expiry',
    details: [
      'Node.js relays opaque ciphertext blocks into Redis RAM with creator-set TTL (1h – 7d).',
      'The server never has the room password or derived keys; payload is 100% unreadable.',
      'Zero disk writes, zero database logging, and instant automated unrecoverable key purge.',
    ],
    codeSnippet: `// Node.js Blind Relay Handler
await redis.rpush(\`room:\${slug}:messages\`, JSON.stringify({ ciphertext, iv }));
await redis.expire(\`room:\${slug}:messages\`, roomTtlSeconds);
socket.to(slug).emit('message', { ciphertext, iv, timestamp });`,
  },
  {
    id: 'decryption',
    stepNumber: '04',
    title: 'Peer Decryption',
    shortDesc: 'Local WebCrypto Verification',
    icon: ShieldCheck,
    accentColor: 'text-cyber-amber',
    bgTint: 'bg-amber-500/10',
    borderTint: 'border-amber-500/40',
    algorithm: 'GCM Authenticated Tag Validation',
    standard: 'Tamper-Evident Decryption',
    guarantee: 'Corrupted packets rejected instantly',
    details: [
      'Recipient browser decrypts ciphertext in isolated RAM using its matching derived key.',
      '128-bit authentication tag guarantees message has not been altered or intercepted.',
      'Sanitized with DOMPurify before rendering into the DOM to block script injection.',
    ],
    codeSnippet: `const decrypted = await window.crypto.subtle.decrypt(
  { name: 'AES-GCM', iv },
  derivedKey,
  ciphertext
);
const plaintext = new TextDecoder().decode(decrypted);
const safeHtml = DOMPurify.sanitize(plaintext);`,
  },
];

export const ProtocolPipeline: React.FC = () => {
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const activeStep = PROTOCOL_STEPS[activeStepIndex];

  return (
    <section id="protocol" className="w-full border-t border-cyan-500/20 bg-[#05080f]/80 py-16 sm:py-20 lg:py-24 relative overflow-hidden font-mono">
      {/* Background ambient lighting */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[600px] h-[350px] bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-[500px] h-[300px] bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 relative z-10">
        {/* Section Header */}
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-xs text-cyber-cyan font-bold uppercase tracking-wider shadow-[0_0_15px_rgba(0,240,255,0.15)]">
            <Zap className="h-3.5 w-3.5 text-cyber-green" aria-hidden="true" />
            <span>CRYPTOGRAPHIC LIFECYCLE PIPELINE</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight font-mono">
            Zero-Knowledge Protocol Flow
          </h2>
          <p className="text-slate-300 text-xs sm:text-sm lg:text-base leading-relaxed">
            The server operates purely as a blind ciphertext relay. Key derivation, message encryption, and integrity verification are strictly confined to the user’s browser runtime.
          </p>
        </div>

        {/* 4-Step Interactive Stepper Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {PROTOCOL_STEPS.map((step, idx) => {
            const Icon = step.icon;
            const isSelected = idx === activeStepIndex;

            return (
              <button
                key={step.id}
                type="button"
                onClick={() => setActiveStepIndex(idx)}
                className={`text-left p-5 sm:p-6 rounded-2xl border transition-all duration-300 flex flex-col justify-between group relative overflow-hidden focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none ${
                  isSelected
                    ? `${step.bgTint} ${step.borderTint} shadow-[0_0_30px_rgba(0,240,255,0.15)] -translate-y-1`
                    : 'bg-[#080d16]/70 border-cyan-500/20 hover:border-cyan-500/40 hover:bg-[#080d16]'
                }`}
              >
                {/* Active Indicator Line */}
                {isSelected && (
                  <motion.div
                    layoutId="active-step-bar"
                    className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 via-cyan-400 to-purple-400"
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                  />
                )}

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className={`text-2xl font-black ${step.accentColor} tracking-tighter`}>
                      {step.stepNumber}
                    </span>
                    <div className={`w-9 h-9 rounded-xl ${step.bgTint} border ${step.borderTint} flex items-center justify-center ${step.accentColor}`}>
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </div>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-white tracking-wide">
                      {step.title}
                    </h3>
                    <div className={`text-xs ${step.accentColor} mt-0.5 font-semibold`}>
                      {step.shortDesc}
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-cyan-500/15 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="flex items-center gap-1 text-emerald-400/90 font-medium">
                    <Check className="h-3 w-3 text-emerald-400" aria-hidden="true" />
                    {step.guarantee.split(' ')[0]} Verified
                  </span>
                  <span className={`text-[10px] font-bold ${isSelected ? 'text-cyber-cyan' : 'text-slate-500 group-hover:text-slate-300'}`}>
                    [INSPECT] &gt;
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Deep Inspection Panel for Selected Step */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeStep.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.22 }}
            className="p-6 sm:p-8 rounded-2xl bg-[#090e18]/90 border border-cyan-500/30 shadow-[0_0_40px_rgba(0,240,255,0.08)] relative overflow-hidden"
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Column: Spec Analysis */}
              <div className="lg:col-span-6 space-y-5">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2.5 py-0.5 rounded-full ${activeStep.bgTint} border ${activeStep.borderTint} ${activeStep.accentColor} font-bold`}>
                      PHASE {activeStep.stepNumber} SPECIFICATION
                    </span>
                    <span className="text-xs text-slate-400">
                      Standard: {activeStep.standard}
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold text-white">
                    {activeStep.title}: {activeStep.shortDesc}
                  </h3>
                  <p className="text-xs text-emerald-400 font-semibold flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                    <span>Cryptographic Assurance: {activeStep.guarantee}</span>
                  </p>
                </div>

                <div className="space-y-2.5 text-xs text-slate-300 leading-relaxed">
                  {activeStep.details.map((detail, idx) => (
                    <div key={idx} className="flex items-start gap-2.5">
                      <span className="text-cyber-cyan font-bold mt-0.5">&gt;</span>
                      <span>{detail}</span>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
                  <div className="p-3 rounded-xl bg-[#03060c] border border-cyan-500/20">
                    <div className="text-[10px] text-slate-500 uppercase">Algorithm Primitive</div>
                    <div className="text-white font-bold mt-0.5">{activeStep.algorithm}</div>
                  </div>
                  <div className="p-3 rounded-xl bg-[#03060c] border border-cyan-500/20">
                    <div className="text-[10px] text-slate-500 uppercase">Storage Subsystem</div>
                    <div className="text-cyan-400 font-bold mt-0.5">Volatile Browser Memory</div>
                  </div>
                </div>
              </div>

              {/* Right Column: Verified Source Code Preview */}
              <div className="lg:col-span-6 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400 pb-1">
                  <span className="flex items-center gap-1.5 text-slate-300 font-bold">
                    <Terminal className="h-3.5 w-3.5 text-cyber-green" aria-hidden="true" />
                    <span>CLIENT_CRYPTO_EXECUTION.TS</span>
                  </span>
                  <span className="text-[10px] text-slate-500">WEBCRYPTO API SUBTLE</span>
                </div>

                <div className="rounded-xl bg-[#030509] border border-cyan-500/30 p-4 text-xs font-mono text-cyan-300/90 overflow-x-auto shadow-inner leading-relaxed">
                  <pre className="text-[11px] leading-5 text-slate-300">
                    <code>{activeStep.codeSnippet}</code>
                  </pre>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
};

export default ProtocolPipeline;
