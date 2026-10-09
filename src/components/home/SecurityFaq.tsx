import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Shield, Lock } from 'lucide-react';

interface FaqItem {
  question: string;
  answer: string;
  category: string;
}

const FAQ_ITEMS: FaqItem[] = [
  {
    category: 'E2EE & BLIND RELAY',
    question: 'Can server operators, cloud hosts, or network ISPs inspect my messages?',
    answer: 'No. All messages are encrypted directly inside the browser using AES-256-GCM via the Web Crypto API before any bytes touch the network. The server only receives opaque ciphertext blobs and random 96-bit IVs. Because the encryption key is derived client-side and never sent to the backend, the server is cryptographically blind.',
  },
  {
    category: 'ZERO-KNOWLEDGE AUTH',
    question: 'How does password protection work if the server has zero knowledge of plaintext?',
    answer: 'Dual-layer cryptography: For gatekeeping room entry, the password is transmitted over TLS and hashed with bcrypt (cost factor 12) for server-side verification. Concurrently, the browser uses the password plus the room slug salt to derive an AES-256 encryption key via PBKDF2 (310,000 iterations). The derived key never leaves local browser RAM.',
  },
  {
    category: 'EPHEMERAL LIFECYCLE',
    question: 'What happens when a room’s configured TTL timer reaches zero?',
    answer: 'All data is stored exclusively in volatile Redis RAM with hard TTL expiration timers (1h, 6h, 24h, or 7d). When the timer expires, Redis automatically evicts and purges the room key, message payload list, and presence sets. Nothing is ever written to disk, databases, or backups.',
  },
  {
    category: 'MEDIA PRIVACY',
    question: 'Are shared images and document attachments also end-to-end encrypted?',
    answer: 'Yes. File blobs are encrypted in-browser with the same derived AES-256 key before being transmitted. Recipient peers download the raw encrypted binary and decrypt it locally into an in-memory object URL. The server never has access to unencrypted images or documents.',
  },
  {
    category: 'TELEMETRY & TRACKING',
    question: 'Are user IP addresses, device fingerprints, or metadata logged?',
    answer: 'CipherChat is built with a zero-footprint philosophy. There are no user accounts, no tracking cookies, no third-party analytics scripts, and no database schemas. Socket connections maintain only volatile in-memory presence that is destroyed when users disconnect or rooms expire.',
  },
];

export const SecurityFaq: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleItem = (idx: number) => {
    setOpenIndex(prev => (prev === idx ? null : idx));
  };

  return (
    <section id="faq" className="w-full border-t border-cyan-500/20 py-16 sm:py-20 lg:py-24 bg-[#03060c]/90 relative font-mono">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        
        {/* Section Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-xs text-purple-400 font-bold uppercase tracking-wider shadow-[0_0_15px_rgba(168,85,247,0.15)]">
            <FileText className="h-3.5 w-3.5" aria-hidden="true" />
            <span>CRYPTOGRAPHIC THREAT MODEL &amp; FAQ</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight font-mono">
            Frequently Asked Inquiries
          </h2>
          <p className="text-slate-300 text-xs sm:text-sm max-w-xl mx-auto leading-relaxed">
            Transparent answers regarding zero-knowledge trust models, memory persistence, and cryptographic assurances.
          </p>
        </div>

        {/* Accordion List */}
        <div className="space-y-3.5">
          {FAQ_ITEMS.map((item, idx) => {
            const isOpen = openIndex === idx;

            return (
              <div
                key={idx}
                className="rounded-2xl border border-cyan-500/20 bg-[#080d16]/80 backdrop-blur-md overflow-hidden transition-all duration-200 hover:border-cyan-500/40"
              >
                <button
                  type="button"
                  onClick={() => toggleItem(idx)}
                  className="w-full p-4 sm:p-5 flex items-center justify-between text-left gap-4 transition-colors focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none"
                  aria-expanded={isOpen}
                >
                  <div className="space-y-1 min-w-0">
                    <span className="text-[10px] text-cyber-cyan font-bold tracking-wider uppercase block">
                      // {item.category}
                    </span>
                    <h3 className="text-sm sm:text-base font-bold text-white tracking-wide leading-snug">
                      {item.question}
                    </h3>
                  </div>

                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-transform duration-300 border ${
                    isOpen
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400 rotate-180'
                      : 'bg-[#04070d] text-slate-400 border-cyan-500/20'
                  }`}>
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.22, ease: 'easeOut' }}
                    >
                      <div className="px-4 sm:px-5 pb-5 pt-1 text-xs sm:text-sm text-slate-300 leading-relaxed border-t border-cyan-500/15">
                        <p>{item.answer}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};

export default SecurityFaq;
