"use client";

import { Satellite, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { UserIcon } from "@/components/UserIcon";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export const Header = () => {
  const { user } = useAuth();
  const [location, navigate] = useLocation();
  const [topInset, setTopInset] = useState(0);
  const [mounted, setMounted] = useState(false); // ✅ Only render after hydration
  const [isVisible, setIsVisible] = useState(true); // Track header visibility
  const [lastScrollY, setLastScrollY] = useState(0); // Track last scroll position
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { toast } = useToast();
  
  const isRadrPage = location === "/radr";
  const toggleRadr = () => {
    if (isRadrPage) {
      navigate("/dashboard");
    } else {
      navigate("/radr");
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await queryClient.invalidateQueries();
    toast({ title: "Data refreshed" });
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  // Detect safe-area inset (notch) and mount header
  useEffect(() => {
    const isIos = /iPhone|iPad|iPod/.test(navigator.userAgent) && !(window as any).MSStream;

    if (isIos) {
      const div = document.createElement("div");
      div.style.position = "absolute";
      div.style.top = "env(safe-area-inset-top)";
      document.body.appendChild(div);

      const computed = parseInt(getComputedStyle(div).top || "0", 10);
      setTopInset(computed);

      document.body.removeChild(div);
    }

    setMounted(true); // ✅ Header now renders only after hydration
  }, []);

  // Auto-hide header on scroll down, show on scroll up
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY < 10) {
        // Always show header at top of page
        setIsVisible(true);
      } else if (currentScrollY > lastScrollY) {
        // Scrolling down - hide header
        setIsVisible(false);
      } else if (currentScrollY < lastScrollY) {
        // Scrolling up - show header
        setIsVisible(true);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  if (!mounted) return null; // Prevent blink on web

  return (
    <header
      className="fixed top-0 left-0 w-full z-50 bg-transparent backdrop-blur-md transition-transform duration-300"
      style={{ 
        paddingTop: topInset,
        transform: isVisible ? 'translateY(0)' : 'translateY(-100%)'
      }}
    >
      <div className="container mx-auto flex h-16 items-center justify-between px-6">
        <div className="flex items-center gap-2">
          {/* User icon */}
          <button className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 active:bg-white/10 transition-all duration-300">
            <UserIcon iconName={user?.profile_icon} className="h-6 w-6 text-white" />
          </button>

          {/* User badge */}
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex items-center"
          >
            <div className="px-4 py-1.5 rounded-full bg-white/10 text-white font-semibold text-sm flex items-center gap-1.5">
              <span>alien #{user?.alien ?? "—"}</span>
            </div>
          </motion.div>
        </div>

        <div className="flex items-center gap-2">
          {/* Refresh button */}
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 active:bg-white/10 transition-all duration-300 disabled:opacity-50"
          >
            <RefreshCw
              className={`h-5 w-5 text-white transition-transform duration-500 ${isRefreshing ? 'animate-spin' : ''}`}
            />
          </button>

          {/* Satellite icon for scanning nearby travelers */}
          <button
            onClick={toggleRadr}
            className="flex h-12 w-12 items-center justify-center rounded-full transition-all duration-300 active:opacity-80"
          >
            <Satellite
              className="h-9 w-9"
              style={{ stroke: isRadrPage ? "#22c55e" : "#ffffff" }}
            />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
