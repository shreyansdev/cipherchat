import React, { useState } from 'react';
import { Shield, Lock } from 'lucide-react';
import AnimatedNavFramer from '../components/ui/navigation-menu';
import CryptoPlayground from '../components/home/CryptoPlayground';
import ProtocolPipeline from '../components/home/ProtocolPipeline';
import SecurityFaq from '../components/home/SecurityFaq';
import HeroHeader from '../components/home/HeroHeader';
import RoomPortal from '../components/home/RoomPortal';
import FeatureMatrix from '../components/home/FeatureMatrix';

export const HomePage: React.FC = () => {
  const [portalMode, setPortalMode] = useState<'initial' | 'create' | 'join'>('initial');

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-transparent text-slate-100 flex flex-col relative overflow-x-hidden selection:bg-cyan-500/30 selection:text-white">
      {/* Background Ambient Glows */}
      <div
        className="fixed top-[-10%] left-1/2 -translate-x-1/2 w-[1100px] h-[550px] bg-gradient-to-b from-cyan-500/10 via-emerald-500/5 to-transparent rounded-full blur-3xl pointer-events-none -z-10 opacity-70"
        aria-hidden="true"
      />
      <div
        className="fixed bottom-[-10%] right-[-5%] w-[700px] h-[450px] bg-purple-500/5 rounded-full blur-3xl pointer-events-none -z-10 opacity-60"
        aria-hidden="true"
      />

      {/* Floating Navbar */}
      <AnimatedNavFramer
        items={[
          { name: 'Home', href: '#' },
          { name: 'Playground', href: '#playground' },
          { name: 'Protocol', href: '#protocol' },
          { name: 'Security', href: '#security' },
          { name: 'Specs', href: '#comparison' },
          { name: 'FAQ', href: '#faq' },
        ]}
        logo={
          <button
            type="button"
            onClick={() => {
              setPortalMode('initial');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="flex items-center gap-2 group text-left cursor-pointer focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none rounded-lg p-0.5"
            aria-label="Home"
          >
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-500/25 via-emerald-500/15 to-purple-500/25 border border-cyan-400/50 flex items-center justify-center relative shadow-[0_0_15px_rgba(0,240,255,0.25)] group-hover:border-cyan-300 transition-colors">
              <Shield className="h-4 w-4 text-cyber-green" strokeWidth={1.75} aria-hidden="true" />
              <Lock className="h-2 w-2 text-cyber-cyan absolute" strokeWidth={2.5} aria-hidden="true" />
            </div>
            <span className="font-mono font-extrabold text-xs tracking-wider text-white flex items-center gap-0.5">
              <span className="text-cyber-green">&gt;_</span>CIPHER<span className="text-cyber-cyan">CHAT</span>
            </span>
          </button>
        }
        onItemClick={(item, e) => {
          e.preventDefault();
          const name = item.name.toLowerCase();
          if (name === 'home' || item.href === '#') {
            setPortalMode('initial');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          } else if (name === 'playground') {
            scrollToSection('playground');
          } else if (name === 'protocol' || name === 'about') {
            scrollToSection('protocol');
          } else if (name === 'security' || name === 'services') {
            scrollToSection('security');
          } else if (name === 'specs' || name === 'contact') {
            scrollToSection('comparison');
          } else if (name === 'faq') {
            scrollToSection('faq');
          } else if (item.href.startsWith('#')) {
            scrollToSection(item.href.slice(1));
          }
        }}
      />

      {/* Main Hero & Cockpit Section */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 pb-12 sm:pb-16 lg:pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: Hero Narrative & Cryptographic Telemetry */}
          <div className="lg:col-span-6 xl:col-span-7">
            <HeroHeader />
          </div>

          {/* Right Column: Encrypted Room Portal Card */}
          <div className="lg:col-span-6 xl:col-span-5 flex justify-center">
            <RoomPortal
              initialMode={portalMode}
              onModeChange={setPortalMode}
            />
          </div>
        </div>

        {/* Interactive WebCrypto Playground */}
        <div id="playground" className="w-full pt-16 sm:pt-20 lg:pt-24">
          <CryptoPlayground />
        </div>

        {/* 4-Phase Cryptographic Protocol Pipeline */}
        <div id="protocol" className="w-full pt-16 sm:pt-20 lg:pt-24">
          <ProtocolPipeline />
        </div>

        {/* Capability Showcase Grid & Comparison Matrix */}
        <FeatureMatrix />

        {/* Threat Model FAQ */}
        <div id="faq" className="w-full pt-12 sm:pt-16">
          <SecurityFaq />
        </div>
      </main>

      {/* Application Footer */}
      <footer className="w-full border-t border-cyan-500/20 bg-[#030509]/90 backdrop-blur-md py-8 sm:py-12 text-slate-400 font-mono text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-6">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-md bg-cyan-500/10 border border-cyan-400/40 flex items-center justify-center text-cyber-cyan">
              <Shield className="h-3.5 w-3.5" aria-hidden="true" />
            </div>
            <span className="font-bold text-white tracking-wider">
              CIPHERCHAT <span className="text-cyber-green">v2.4_LTS</span>
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-6 text-[11px] text-slate-400">
            <span className="text-cyber-green">● E2EE AES-256-GCM</span>
            <span className="text-cyber-cyan">● PBKDF2 310K ITERATIONS</span>
            <span className="text-purple-400">● 100% IN-MEMORY REDIS</span>
            <span className="text-cyber-amber">● ZERO LOG RETENTION</span>
          </div>

          <div className="text-slate-400 text-center md:text-right text-[11px]">
            <span>Ephemeral channel architecture for privacy-first peer communication.</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
