// app/page.tsx & demo component
import { AnimatedNavFramer } from "@/components/ui/navigation-menu";
import { Sparkles, Shield, ArrowUpRight, Zap, Lock, Globe } from "lucide-react";

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-cyan-500/30">
      <AnimatedNavFramer />

      <main className="container mx-auto px-4">
        {/* Hero Section */}
        <div className="h-screen pt-32 flex flex-col items-center justify-center text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-mono text-xs tracking-wider mb-6 animate-pulse">
            <Sparkles className="h-3.5 w-3.5" />
            <span>FRAMER MOTION INTERACTION</span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight font-mono text-white">
            Navigation with <span className="text-cyan-400">Framer Motion</span>
          </h1>
          <p className="text-muted-foreground mt-6 text-base sm:text-lg leading-relaxed max-w-xl">
            Scroll down to see the magic. The pill navbar fluidly collapses into a compact floating icon. Click the circle to expand it back.
          </p>
          <div className="mt-8 flex items-center gap-3 text-xs font-mono text-slate-400">
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-muted border border-border">
              <Zap className="h-3.5 w-3.5 text-cyan-400" /> Smooth Physics
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-muted border border-border">
              <Lock className="h-3.5 w-3.5 text-emerald-400" /> Fully Responsive
            </span>
          </div>
        </div>

        {/* Extended Scroll Content Section with Unsplash Stock Images & Lucide icons */}
        <div className="min-h-[200vh] bg-muted/40 border border-border rounded-2xl p-6 sm:p-12 mb-24 space-y-12 backdrop-blur-sm">
          <div className="border-b border-border/80 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold font-mono text-white flex items-center gap-2">
                <Shield className="h-6 w-6 text-cyan-400" /> Page Content Showcase
              </h2>
              <p className="mt-2 text-muted-foreground text-sm">
                This animation is powered by Framer Motion, providing a fluid, physics-based feel.
              </p>
            </div>
            <div className="font-mono text-xs text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-3 py-1 rounded-md self-start sm:self-auto">
              THRESHOLD: 80PX SCROLL
            </div>
          </div>

          {/* Feature Grid with Unsplash Images */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="group rounded-xl overflow-hidden border border-border bg-card/80 transition-all hover:border-cyan-500/40 hover:shadow-lg">
              <div className="h-48 overflow-hidden relative">
                <img
                  src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80"
                  alt="Dynamic fluid animation simulation"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <span className="absolute bottom-3 left-3 text-xs font-mono text-cyan-300 flex items-center gap-1">
                  <Zap className="h-3.5 w-3.5" /> Fluid Spring Physics
                </span>
              </div>
              <div className="p-5 space-y-2">
                <h3 className="font-semibold text-white flex items-center justify-between text-base">
                  Stiffness & Damping
                  <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-cyan-400 transition-colors" />
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Configured with spring transitions for natural damping when collapsing on scroll down and expanding on scroll up.
                </p>
              </div>
            </div>

            <div className="group rounded-xl overflow-hidden border border-border bg-card/80 transition-all hover:border-cyan-500/40 hover:shadow-lg">
              <div className="h-48 overflow-hidden relative">
                <img
                  src="https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&w=800&q=80"
                  alt="Abstract geometric dark architecture"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <span className="absolute bottom-3 left-3 text-xs font-mono text-emerald-300 flex items-center gap-1">
                  <Globe className="h-3.5 w-3.5" /> Adaptive Layout
                </span>
              </div>
              <div className="p-5 space-y-2">
                <h3 className="font-semibold text-white flex items-center justify-between text-base">
                  Compact Pill Mode
                  <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-emerald-400 transition-colors" />
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Smoothly minimizes into a 3rem round trigger with an accessible hamburger icon while disabling pointer events on links.
                </p>
              </div>
            </div>

            <div className="group rounded-xl overflow-hidden border border-border bg-card/80 transition-all hover:border-cyan-500/40 hover:shadow-lg">
              <div className="h-48 overflow-hidden relative">
                <img
                  src="https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80"
                  alt="Encrypted zero-knowledge stream"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <span className="absolute bottom-3 left-3 text-xs font-mono text-purple-300 flex items-center gap-1">
                  <Lock className="h-3.5 w-3.5" /> Zero-Knowledge Security
                </span>
              </div>
              <div className="p-5 space-y-2">
                <h3 className="font-semibold text-white flex items-center justify-between text-base">
                  Encrypted State
                  <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-purple-400 transition-colors" />
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Tailored to match CipherChat&apos;s dark cyberpunk aesthetic with frosted glass backdrop blur and glowing cyan accents.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border/80 bg-background/50 p-6 font-mono text-xs text-muted-foreground space-y-2">
            <div className="text-slate-300 font-semibold">// INTERACTION GUIDE</div>
            <div>1. Scroll past 150px down: The navbar transitions into the collapsed circular icon.</div>
            <div>2. Scroll up by &gt; 80px: The navbar immediately springs back into the full pill menu.</div>
            <div>3. Click the circular trigger while collapsed: Manually re-expands the navigation menu.</div>
          </div>
        </div>
      </main>
    </div>
  );
}

// Keep export alias for compatibility
export { DemoPage as HomePage, DemoPage as ParticleDriftDemo };
