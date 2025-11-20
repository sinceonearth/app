"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import {
  Globe,
  Plane,
  Ruler,
  MapPin,
  Building2,
  TowerControl,
  Apple,
  Earth,
} from "lucide-react";
import CompanyPage from "./CompanyPage";

const slides = [
  {
    id: 1,
    title: (
      <>
        Track your <br /> Adventures      </>
    ),
    text: "Log every journey you take across cities, countries, and continents — with an interactive world view.",
  },
  {
    id: 2,
    title: (
      <>
        Earn as you <br /> Explore
      </>
    ),
    text: "Collect country stamps, explore your flight stats, and watch your travel story unfold beautifully.",
  },
  {
    id: 3,
    title: (
      <>
        Visualize Your <br /> Journey
      </>
    ),
    text: "See your total flights, kilometers, and destinations all in one place like your own cosmic travel log.",
  },
];

const icons = [
  { icon: Earth, color: "#a855f7" },
  { icon: Plane, color: "#22c55e" },
  { icon: MapPin, color: "#ec4899" },
];

export default function GetStarted() {
  const [, navigate] = useLocation();
  const [index, setIndex] = useState(0);
  const [iconIndex, setIconIndex] = useState(0);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  useEffect(() => {
    const textInterval = setInterval(() => {
      setIndex((prev) => (prev + 1) % slides.length);
    }, 3500);

    const iconInterval = setInterval(() => {
      setIconIndex((prev) => (prev + 1) % icons.length);
    }, 3500);

    return () => {
      clearInterval(textInterval);
      clearInterval(iconInterval);
    };
  }, []);

  const slide = slides[index];
  const CurrentIcon = icons[iconIndex].icon;
  const iconColor = icons[iconIndex].color;

  // Show company page on desktop (1024px and above)
  if (isDesktop) {
    return <CompanyPage />;
  }

  return (
    <motion.div
      className="min-h-screen w-full flex flex-col items-center justify-between bg-gradient-to-b from-black via-gray-950 to-black text-white px-6 pt-24 pb-8 relative overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif',
      }}
    >
      {/* Animated background gradient orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-green-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Icon Container with fixed height to prevent jumping */}
      <div className="h-44 flex items-center justify-center relative z-10 mb-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={iconIndex}
            initial={{ opacity: 0, scale: 0.6, rotate: -10 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            exit={{ opacity: 0, scale: 0.8, rotate: 10 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className="relative"
          >
            <div className="absolute inset-0 blur-2xl opacity-50" style={{ background: iconColor }} />
            <CurrentIcon
              className="w-32 h-32 relative z-10"
              style={{ color: iconColor, strokeWidth: 1.5 }}
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Slide Text */}
      <AnimatePresence mode="wait">
        <motion.div
          key={slide.id}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -30 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="text-center max-w-lg px-4 mb-auto relative z-10"
        >
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-green-400 via-emerald-500 to-green-600 bg-clip-text text-transparent whitespace-pre-line leading-tight">
            {slide.title}
          </h1>
          <p className="text-gray-300 text-lg md:text-xl leading-relaxed max-w-md mx-auto">
            {slide.text}
          </p>
        </motion.div>
      </AnimatePresence>

      {/* Progress dots */}
      <div className="flex gap-2 mt-12 mb-8 relative z-10">
        {slides.map((_, idx) => (
          <div
            key={idx}
            className={`h-2 rounded-full transition-all duration-300 ${
              idx === index ? 'w-8 bg-green-500' : 'w-2 bg-gray-600'
            }`}
          />
        ))}
      </div>

      {/* Bottom Card */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="w-full max-w-md bg-gradient-to-br from-green-600 via-green-500 to-green-600 backdrop-blur-xl text-white p-8 space-y-4 shadow-2xl rounded-3xl border-2 border-green-400/30 relative z-10"
      >
        <button
          onClick={() => navigate("/register")}
          className="w-full bg-white text-green-600 text-lg font-semibold py-4 rounded-full hover:shadow-xl hover:shadow-white/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
        >
          Create new account
        </button>

        <div
          onClick={() => navigate("/login")}
          className="text-center text-sm text-white/90 cursor-pointer select-none hover:text-white transition-colors py-2 font-medium"
        >
          I already have an account
        </div>
      </motion.div>
    </motion.div>
  );
}
