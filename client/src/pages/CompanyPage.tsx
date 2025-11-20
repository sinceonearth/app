"use client";

import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import {
  Globe,
  Plane,
  MapPin,
  BarChart3,
  Trophy,
  Earth,
  ArrowRight,
  createLucideIcon,
} from "lucide-react";
import { faceAlien } from "@lucide/lab";

// Import from public folder: no relative paths, just root-relative URL
const deviceImg = "/SimulatorScreenshot-iPhone13.png";

const FaceAlienIcon = createLucideIcon("FaceAlienIcon", faceAlien);

interface Stats {
  totalFlights: number;
  totalCountries: number;
  totalUsers: number;
  userRating: number;
}

export default function CompanyPage() {
  const [, navigate] = useLocation();
  const [stats, setStats] = useState<Stats>({
    totalFlights: 0,
    totalCountries: 0,
    totalUsers: 0,
    userRating: 4.9,
  });
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch("/api/public/stats");
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error("Failed to fetch stats:", error);
      }
    };
    fetchStats();
  }, []);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      alert(
        "To install the app:\n- On iOS: Tap Share → Add to Home Screen\n- On Android: Use Chrome and the install prompt should appear",
      );
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log("Install outcome:", outcome);
    setDeferredPrompt(null);
  };

  const features = [
    {
      icon: Earth,
      value: "180+",
      label: "Countries",
      description:
        "Track every country you visit and watch your passport fill up",
      color: "text-purple-400",
      bgColor: "from-purple-500/10 to-purple-500/5",
    },
    {
      icon: Plane,
      value: "50K+",
      label: "Flights",
      description: "Log all your flights with detailed routes and travel times",
      color: "text-green-400",
      bgColor: "from-green-500/10 to-green-500/5",
    },
    {
      icon: MapPin,
      value: "1000+",
      label: "Places",
      description: "Record your stays and create a complete travel timeline",
      color: "text-pink-400",
      bgColor: "from-pink-500/10 to-pink-500/5",
    },
    {
      icon: BarChart3,
      value: "Real-time",
      label: "Analytics",
      description: "See your travel stats - distance, hours, and achievements",
      color: "text-yellow-400",
      bgColor: "from-yellow-500/10 to-yellow-500/5",
    },
    {
      icon: Trophy,
      value: "Achievements",
      label: "Unlockable",
      description: "Collect country stamps and unlock travel milestones",
      color: "text-orange-400",
      bgColor: "from-orange-500/10 to-orange-500/5",
    },
    {
      icon: Globe,
      value: "3D",
      label: "Globe View",
      description: "Visualize your journeys on an interactive 3D world map",
      color: "text-indigo-400",
      bgColor: "from-indigo-500/10 to-indigo-500/5",
    },
  ];

  return (
    <div
      className="w-full min-h-screen text-white relative"
      style={{
        backgroundImage:
          "url(//unpkg.com/three-globe/example/img/night-sky.png)",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* HEADER */}
      <header className="w-full bg-black/80 py-6 px-12 flex items-center justify-between backdrop-blur-sm">
        <div className="text-2xl font-bold flex items-center gap-2">
          <FaceAlienIcon className="w-7 h-7 text-green-500" />
          Since On Earth
        </div>
        <button
          onClick={handleInstallClick}
          className="bg-green-500 text-black px-6 py-3 rounded-full font-semibold hover:bg-green-600 transition"
        >
          Add to Home Screen
        </button>
      </header>

      {/* HERO */}
      <section className="w-full max-w-7xl mx-auto py-16 px-4 relative z-10">
        <div className="bg-gradient-to-br from-[#22c55e] via-[#16a34a] to-[#15803d] text-white rounded-3xl p-8 md:p-16 relative overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-black/10 rounded-full blur-3xl"></div>

          <div className="relative z-10 grid md:grid-cols-2 gap-12 items-center">
            {/* LEFT CONTENT */}
            <div className="space-y-8">
              <div className="space-y-4">
                <h1 className="text-5xl md:text-6xl lg:text-8xl font-extrabold leading-tight">
                  A little magic,
                  <br />
                  <span className="text-green-300">for your Memories.</span>
                </h1>
                <p className="text-lg md:text-xl text-white/90 leading-relaxed">
                  Map every flight, log every stay, and visualize your
                  adventures with real-time location sharing.
                </p>
              </div>

              {/* Quick Stats */}
              <div className="flex gap-8 flex-wrap">
                <div>
                  <div className="text-3xl font-bold text-white">
                    {stats.totalFlights}+
                  </div>
                  <div className="text-sm text-green-300">Flights Tracked</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-white">
                    {stats.totalCountries}+
                  </div>
                  <div className="text-sm text-green-300">Countries Visited</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-white">
                    {stats.totalUsers}+
                  </div>
                  <div className="text-sm text-green-300">Active Travelers</div>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-wrap gap-4 items-center">
                <a
                  href="https://apps.apple.com/in/app/sinceonearth/id6754191924"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:scale-105 transition-transform"
                >
                  <img
                    src="/App_Store_(iOS)-Badge-Alternative-Logo.wine.svg"
                    alt="Download on the App Store"
                    className="h-24 md:h-32"
                  />
                </a>
                <button
                  onClick={() => navigate("/register")}
                  className="bg-white text-green-600 px-8 py-4 rounded-full flex items-center gap-2 font-semibold hover:bg-gray-100 transition-all shadow-lg hover:scale-105 border-2 border-green-500"
                >
                  Get Started Free
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>

              {/* Trust Badge */}
              <div className="flex items-center gap-2 text-sm text-white/70">
                <div className="flex items-center">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <svg
                      key={i}
                      className="w-4 h-4 fill-yellow-300"
                      viewBox="0 0 20 20"
                    >
                      <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                    </svg>
                  ))}
                </div>
                <span>Trusted by travelers worldwide</span>
              </div>
            </div>

            {/* RIGHT - DEVICE IMAGE */}
            <div className="flex justify-center md:justify-end">
              <div className="relative">
                {/* Glow effect behind phone */}
                <div className="absolute inset-0 bg-white/20 rounded-[50px] blur-2xl scale-105"></div>
                <img
                  src={deviceImg}
                  alt="Since On Earth App"
                  className="relative w-[280px] md:w-[340px] rounded-[40px] shadow-2xl border-4 border-white/20 hover:scale-105 transition-transform duration-500"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section className="relative px-9 z-10">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className={`group p-6 bg-gradient-to-br ${feature.bgColor} backdrop-blur-sm border-2 border-white/10 rounded-2xl hover:border-green-500/30 transition-all duration-300 hover:shadow-[0_0_30px_rgba(34,197,94,0.15)]`}
              >
                <div className="flex items-center gap-4 mb-4">
                  <feature.icon
                    className={`w-12 h-12 ${feature.color} group-hover:scale-110 transition-transform duration-300`}
                  />
                  <div>
                    <div className="text-3xl font-bold text-white">
                      {feature.value}
                    </div>
                    <div className="text-sm text-gray-400 font-medium">
                      {feature.label}
                    </div>
                  </div>
                </div>
                <p className="text-gray-400 leading-relaxed text-sm">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-12 text-center text-gray-400 relative z-10">
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-2">
            <span>© {new Date().getFullYear()} Since On Earth</span>
          </div>
          <div className="flex items-center gap-6 text-sm">
            <button
              className="hover:text-white"
              onClick={() => navigate("/privacy")}
            >
              Privacy
            </button>
            <button
              className="hover:text-white"
              onClick={() => navigate("/terms")}
            >
              Terms
            </button>
            <button
              className="hover:text-white"
              onClick={() => navigate("/contact")}
            >
              Contact
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
