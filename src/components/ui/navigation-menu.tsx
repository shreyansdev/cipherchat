// components/animated-nav-framer.tsx
"use client";

import * as React from "react";
import { motion, useScroll, useMotionValueEvent } from "framer-motion";
import { Navigation, Menu, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet";

export interface NavItem {
  name: string;
  href: string;
}

const defaultNavItems: NavItem[] = [
  { name: "Home", href: "#" },
  { name: "About", href: "#" },
  { name: "Services", href: "#" },
  { name: "Contact", href: "#" },
];

const EXPAND_SCROLL_THRESHOLD = 80;

const containerVariants = {
  expanded: {
    y: 0,
    opacity: 1,
    width: "auto",
    transition: {
      y: { type: "spring", damping: 18, stiffness: 250 },
      opacity: { duration: 0.3 },
      type: "spring",
      damping: 20,
      stiffness: 300,
      staggerChildren: 0.07,
      delayChildren: 0.2,
    },
  },
  collapsed: {
    y: 0,
    opacity: 1,
    width: "3rem",
    transition: {
      type: "spring",
      damping: 20,
      stiffness: 300,
      when: "afterChildren",
      staggerChildren: 0.05,
      staggerDirection: -1,
    },
  },
};

const logoVariants = {
  expanded: { opacity: 1, x: 0, rotate: 0, transition: { type: "spring", damping: 15 } },
  collapsed: { opacity: 0, x: -25, rotate: -180, transition: { duration: 0.3 } },
};

const itemVariants = {
  expanded: { opacity: 1, x: 0, scale: 1, transition: { type: "spring", damping: 15 } },
  collapsed: { opacity: 0, x: -20, scale: 0.95, transition: { duration: 0.2 } },
};

const collapsedIconVariants = {
  expanded: { opacity: 0, scale: 0.8, transition: { duration: 0.2 } },
  collapsed: { 
    opacity: 1, 
    scale: 1,
    transition: {
      type: "spring",
      damping: 15,
      stiffness: 300,
      delay: 0.15,
    }
  },
};

export interface AnimatedNavFramerProps {
  items?: NavItem[];
  className?: string;
  logo?: React.ReactNode;
  onItemClick?: (item: NavItem, e: React.MouseEvent) => void;
}

export function AnimatedNavFramer({
  items = defaultNavItems,
  className,
  logo,
  onItemClick,
}: AnimatedNavFramerProps = {}) {
  const [isExpanded, setExpanded] = React.useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  
  const { scrollY } = useScroll();
  const lastScrollY = React.useRef(0);
  const scrollPositionOnCollapse = React.useRef(0);

  // Automatically close mobile sheet drawer if viewport expands to desktop
  React.useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useMotionValueEvent(scrollY, "change", (latest) => {
    // If mobile menu drawer is open, avoid collapse interference
    if (isMobileMenuOpen) return;

    const previous = lastScrollY.current;
    
    if (isExpanded && latest > previous && latest > 150) {
      setExpanded(false);
      scrollPositionOnCollapse.current = latest; 
    } 
    else if (!isExpanded && latest < previous && (scrollPositionOnCollapse.current - latest > EXPAND_SCROLL_THRESHOLD)) {
      setExpanded(true);
    }
    
    lastScrollY.current = latest;
  });

  const handleNavClick = (e: React.MouseEvent) => {
    if (!isExpanded) {
      e.preventDefault();
      setExpanded(true);
    }
  };

  return (
    <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
      <div className={cn("fixed top-4 sm:top-6 left-1/2 -translate-x-1/2 z-50 max-w-[calc(100vw-2rem)]", className)}>
        <motion.nav
          initial={{ y: -80, opacity: 0 }}
          animate={isExpanded ? "expanded" : "collapsed"}
          variants={containerVariants}
          whileHover={!isExpanded ? { scale: 1.1 } : {}}
          whileTap={!isExpanded ? { scale: 0.95 } : {}}
          onClick={handleNavClick}
          className={cn(
            "flex items-center overflow-hidden rounded-full border border-cyan-500/30 bg-[#070b13]/85 shadow-[0_0_30px_rgba(0,240,255,0.15)] backdrop-blur-xl h-12 relative max-w-full",
            !isExpanded && "cursor-pointer justify-center"
          )}
        >
          <motion.div
            variants={logoVariants}
            className="flex-shrink-0 flex items-center font-semibold pl-4 pr-2"
          >
            {logo || <Navigation className="h-6 w-6 text-foreground" />}
          </motion.div>
          
          {/* Desktop Navigation Links (hidden on mobile, visible on md: and above) */}
          <motion.div
            className={cn(
              "hidden md:flex items-center gap-1 sm:gap-2 pr-4 font-mono",
              !isExpanded && "pointer-events-none"
            )}
          >
            {items.map((item) => (
              <motion.a
                key={item.name}
                href={item.href}
                variants={itemVariants}
                onClick={(e) => {
                  e.stopPropagation();
                  if (onItemClick) {
                    onItemClick(item, e);
                  }
                }}
                className="text-xs sm:text-sm font-medium text-slate-300 hover:text-cyan-300 transition-colors px-2.5 py-1 rounded-full hover:bg-cyan-500/10 focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none"
              >
                {item.name}
              </motion.a>
            ))}
          </motion.div>

          {/* Mobile Navigation Trigger Button (visible on mobile, hidden on md: and above) */}
          <motion.div
            variants={itemVariants}
            className={cn(
              "flex md:hidden items-center pr-3 font-mono",
              !isExpanded && "pointer-events-none"
            )}
          >
            <SheetTrigger asChild>
              <button
                type="button"
                onClick={(e) => e.stopPropagation()}
                className="flex items-center justify-center h-8 w-8 rounded-full text-slate-300 hover:text-cyber-cyan hover:bg-cyan-500/10 focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none transition-colors border border-cyan-500/30 shadow-[0_0_10px_rgba(0,240,255,0.1)]"
                aria-label="Open navigation menu"
              >
                <Menu className="h-4 w-4 text-cyber-cyan" aria-hidden="true" />
              </button>
            </SheetTrigger>
          </motion.div>
          
          {/* Collapsed floating menu icon (shown when collapsed on scroll) */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <motion.div
              variants={collapsedIconVariants}
              animate={isExpanded ? "expanded" : "collapsed"}
            >
              <Menu className="h-5 w-5 text-cyber-cyan" aria-hidden="true" />
            </motion.div>
          </div>
        </motion.nav>
      </div>

      {/* Mobile Drawer Content */}
      <SheetContent
        side="right"
        className="w-[280px] sm:w-[340px] max-w-[85vw] bg-[#070b13]/95 border-l border-cyan-500/30 backdrop-blur-2xl text-slate-100 font-mono p-6 flex flex-col justify-between"
      >
        <div>
          <SheetHeader className="text-left border-b border-cyan-500/20 pb-4">
            <div 
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center gap-2 cursor-pointer"
            >
              {logo || (
                <div className="flex items-center gap-2">
                  <Navigation className="h-5 w-5 text-cyber-green" />
                  <span className="font-mono font-bold text-xs text-white">
                    CIPHER<span className="text-cyber-cyan">CHAT</span>
                  </span>
                </div>
              )}
            </div>
            <SheetTitle className="font-mono text-[11px] uppercase tracking-wider text-slate-400 mt-2">
              Navigation Protocol
            </SheetTitle>
            <SheetDescription className="sr-only">
              Navigation links for accessing CipherChat features and protocol specifications
            </SheetDescription>
          </SheetHeader>

          <nav className="flex flex-col gap-1.5 py-6" aria-label="Mobile Navigation Drawer">
            {items.map((item) => (
              <a
                key={item.name}
                href={item.href}
                onClick={(e) => {
                  setIsMobileMenuOpen(false);
                  if (onItemClick) {
                    onItemClick(item, e);
                  }
                }}
                className="group flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-medium font-mono text-slate-300 hover:text-cyber-cyan hover:bg-cyan-500/10 border border-transparent hover:border-cyan-500/30 transition-all duration-150 focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none"
              >
                <span className="flex items-center gap-2.5">
                  <span className="text-cyber-green text-xs opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all">
                    &gt;
                  </span>
                  <span>{item.name}</span>
                </span>
                <ChevronRight className="h-4 w-4 text-slate-500 group-hover:text-cyber-cyan group-hover:translate-x-1 transition-all" aria-hidden="true" />
              </a>
            ))}
          </nav>
        </div>

        <div className="border-t border-cyan-500/20 pt-4 font-mono text-xs text-slate-400 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-cyber-green text-[11px]">
            <span className="w-1.5 h-1.5 rounded-full bg-cyber-green animate-pulse" />
            <span>AES-256-GCM E2EE</span>
          </div>
          <div className="text-[10px] text-slate-500">
            ZERO PERSISTENCE • RAM ONLY
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default AnimatedNavFramer;
