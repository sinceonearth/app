import { useState } from "react";
import { useLocation } from "wouter";
import {
  Plane,
  Globe,
  Map,
  Compass,
  Luggage,
  Camera,
  Mountain,
  Palmtree,
  Ship,
  Train,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { motion } from "framer-motion";

const TRAVEL_ICONS = [
  { name: "plane", Icon: Plane, label: "Airplane" },
  { name: "globe", Icon: Globe, label: "Globe" },
  { name: "map", Icon: Map, label: "Map" },
  { name: "compass", Icon: Compass, label: "Compass" },
  { name: "luggage", Icon: Luggage, label: "Luggage" },
  { name: "camera", Icon: Camera, label: "Camera" },
  { name: "mountain", Icon: Mountain, label: "Mountain" },
  { name: "palmtree", Icon: Palmtree, label: "Palm Tree" },
  { name: "ship", Icon: Ship, label: "Ship" },
  { name: "train", Icon: Train, label: "Train" },
];

const COLORS = [
  { name: "green", value: "#22c55e", label: "Green" },
  { name: "blue", value: "#3b82f6", label: "Blue" },
  { name: "purple", value: "#a855f7", label: "Purple" },
  { name: "pink", value: "#ec4899", label: "Pink" },
  { name: "orange", value: "#f97316", label: "Orange" },
  { name: "red", value: "#ef4444", label: "Red" },
  { name: "yellow", value: "#eab308", label: "Yellow" },
  { name: "cyan", value: "#06b6d4", label: "Cyan" },
  { name: "emerald", value: "#10b981", label: "Emerald" },
  { name: "indigo", value: "#6366f1", label: "Indigo" },
];

export default function ProfileSetup() {
  const [, navigate] = useLocation();
  const { token, refreshUser, user } = useAuth();
  const [selectedIcon, setSelectedIcon] = useState<string>("plane");
  const [loading, setLoading] = useState(false);

  const handleComplete = async () => {
    if (!token) return;

    setLoading(true);
    try {
      const res = await apiRequest(
        "POST",
        "/api/auth/profile-setup",
        {
          profile_icon: selectedIcon,
          profile_color: "#22c55e",
        },
        token
      );

      if (res.ok) {
        await refreshUser();
        navigate("/dashboard");
      } else {
        const error = await res.json();
        console.error("Failed to save profile:", error);
      }
    } catch (error) {
      console.error("Error saving profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const selectedIconData = TRAVEL_ICONS.find((i) => i.name === selectedIcon);

  return (
    <div className="h-screen overflow-hidden bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-2xl"
      >
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Welcome Onboard!
          </h1>
          <p className="text-gray-400">
            Choose your icon for profile
          </p>
        </div>

        <div className="p-8">
          {/* Preview */}
          <div className="flex items-center justify-center mb-12">
            {selectedIconData && (
              <motion.div
                key={selectedIcon}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="flex items-center gap-3 px-4 py-3 rounded-full bg-white/10 border-2 border-green-500/50"
              >
                {/* Icon */}
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10">
                  <selectedIconData.Icon className="h-6 w-6 text-green-400" />
                </div>

                {/* Alien Badge */}
                <span className="text-white font-semibold text-sm pr-2">
                  alien #{user?.alien ?? "—"}
                </span>
              </motion.div>
            )}
          </div>

          {/* Icons */}
          <div className="flex flex-wrap justify-center gap-3 mb-12 max-w-md mx-auto">
            {TRAVEL_ICONS.map(({ name, Icon }) => (
              <button
                key={name}
                onClick={() => setSelectedIcon(name)}
                className="transition-all duration-200 hover:scale-110 bg-transparent flex-shrink-0"
              >
                <Icon 
                  className={`w-9 h-9 transition-all duration-200 ${
                    selectedIcon === name ? 'text-white' : 'text-green-500/50'
                  }`}
                />
              </button>
            ))}
          </div>

          {/* Complete Button */}
          <button
            onClick={handleComplete}
            disabled={loading}
            className="w-full h-14 bg-white hover:bg-gray-100 text-green-600 border-2 border-green-600 font-semibold text-base rounded-full transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Saving..." : "Continue"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
