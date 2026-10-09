// components/animated-nav-framer.tsx
"use client";

import * as React from "react";
import { motion, useScroll, useMotionValueEvent } from "framer-motion";
import { Navigation, Menu } from "lucide-react";
import { cn } from "@/lib/utils";

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
  
  const { scrollY } = useScroll();
  const lastScrollY = React.useRef(0);
  const scrollPositionOnCollapse = React.useRef(0);

  useMotionValueEvent(scrollY, "change", (latest) => {
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
    <div className={cn("fixed top-6 left-1/2 -translate-x-1/2 z-50", className)}>
      <motion.nav
        initial={{ y: -80, opacity: 0 }}
        animate={isExpanded ? "expanded" : "collapsed"}
        variants={containerVariants}
        whileHover={!isExpanded ? { scale: 1.1 } : {}}
        whileTap={!isExpanded ? { scale: 0.95 } : {}}
        onClick={handleNavClick}
        className={cn(
          "flex items-center overflow-hidden rounded-full border border-cyan-500/30 bg-[#070b13]/85 shadow-[0_0_30px_rgba(0,240,255,0.15)] backdrop-blur-xl h-12 relative",
          !isExpanded && "cursor-pointer justify-center"
        )}
      >
        <motion.div
          variants={logoVariants}
          className="flex-shrink-0 flex items-center font-semibold pl-4 pr-2"
        >
          {logo || <Navigation className="h-6 w-6 text-foreground" />}
        </motion.div>
        
        {/* Navigation links - hidden / non-interactive when collapsed */}
        <motion.div
          className={cn(
            "flex items-center gap-1 sm:gap-2 pr-4 font-mono",
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
  );
}

export default AnimatedNavFramer;
