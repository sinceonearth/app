"use client";

import { Header } from "@/components/Header";
import { motion, AnimatePresence } from "framer-motion";
import React, { useState, useEffect, useCallback } from "react";
import { Geolocation } from "@capacitor/geolocation";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { MapPin, Users, Navigation, MessageCircle, Plus, Send, MapPinned, Clock, UserPlus, Trash2 } from "lucide-react";
import { UserIcon } from "@/components/UserIcon";

interface NearbyUser {
  userId: string;
  username: string;
  lat: number;
  lng: number;
  distance: number;
  lastSeen: number;
  profile_icon?: string;
}

interface RadrGroup {
  id: string;
  target_name: string;
  target_lat: number;
  target_lng: number;
  target_radius_km: number;
  expires_at: string;
  created_at: string;
  has_arrived: boolean;
  arrived_at?: string;
  member_count: number;
  arrived_count: number;
  is_creator: boolean;
}

interface RadrMessage {
  id: string;
  group_id: string;
  user_id: string;
  type: string;
  content: string;
  metadata: any;
  created_at: string;
  username: string;
  name?: string;
}

const Radar = () => {
  const { token } = useAuth();
  
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [nearbyUsers, setNearbyUsers] = useState<NearbyUser[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [scanning, setScanning] = useState<boolean>(false);

  const detectLocation = async () => {
    setLoading(true);
    setError(null);

    try {
      let latitude: number;
      let longitude: number;

      try {
        const position = await Geolocation.getCurrentPosition();
        latitude = position.coords.latitude;
        longitude = position.coords.longitude;
      } catch (capacitorError) {
        if (!navigator.geolocation) {
          throw new Error("Geolocation is not supported by your browser");
        }
        
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
          });
        });
        
        latitude = position.coords.latitude;
        longitude = position.coords.longitude;
      }

      setLocation({ lat: latitude, lng: longitude });
      
      if (token) {
        await apiRequest("POST", "/api/radr/update", { lat: latitude, lng: longitude }, token);
      }
    } catch (err: any) {
      console.error("Geolocation error:", err);
      setError(err?.message || "Unable to retrieve your location. Please allow location access.");
    } finally {
      setLoading(false);
    }
  };

  const fetchNearbyUsers = useCallback(async () => {
    if (!location || !token) return;
    
    setScanning(true);
    try {
      const res = await apiRequest(
        "GET",
        `/api/radr/nearby?lat=${location.lat}&lng=${location.lng}`,
        null,
        token
      );
      
      if (res.ok) {
        const data = await res.json();
        setNearbyUsers(data.nearby || []);
      }
    } catch (err) {
      console.error("Failed to fetch nearby users:", err);
    } finally {
      setTimeout(() => setScanning(false), 500);
    }
  }, [location, token]);

  useEffect(() => {
    detectLocation();
  }, []);

  useEffect(() => {
    if (!location || !token) return;
    fetchNearbyUsers();
    const interval = setInterval(fetchNearbyUsers, 15000);
    return () => clearInterval(interval);
  }, [location, token, fetchNearbyUsers]);

  return (
    <>
      <Header />
      <div className="relative min-h-screen w-full bg-black text-white pb-24 flex flex-col items-center px-4" style={{ paddingTop: 'calc(3.5rem + env(safe-area-inset-top))' }}>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] h-[300px] sm:w-[400px] sm:h-[400px] bg-[#22c55e]/10 blur-[120px] rounded-full pointer-events-none" />

        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-[#22c55e] drop-shadow-[0_0_15px_rgba(34,197,94,0.4)] text-center mb-10"
        >
          Radr
        </motion.h1>

        {loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center text-white">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500 mb-4"></div>
            <p>Detecting your location...</p>
          </motion.div>
        )}

        {error && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
            <button
              onClick={detectLocation}
              className="px-8 py-3 bg-white hover:bg-gray-100 text-green-600 border-2 border-green-600 rounded-full transition-colors font-semibold"
            >
              Try Again
            </button>
          </motion.div>
        )}

        {location && !loading && !error && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-4xl space-y-6">
                <div className="bg-neutral-900/50 backdrop-blur-xl border border-white/10 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Navigation className="text-green-400" size={24} />
                    <h2 className="text-xl font-semibold text-white">Your Location</h2>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-400">Latitude</p>
                      <p className="text-white font-mono">{location.lat.toFixed(6)}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Longitude</p>
                      <p className="text-white font-mono">{location.lng.toFixed(6)}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-neutral-900/50 backdrop-blur-xl border border-white/10 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <Users className="text-green-400" size={24} />
                      <h2 className="text-xl font-semibold text-white">
                        Nearby Travelers ({nearbyUsers.length})
                      </h2>
                    </div>
                    <button
                      onClick={fetchNearbyUsers}
                      disabled={scanning}
                      className="px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-full transition-colors text-sm disabled:opacity-50"
                    >
                      {scanning ? "Scanning..." : "Refresh"}
                    </button>
                  </div>

                  <AnimatePresence mode="popLayout">
                    {nearbyUsers.length === 0 ? (
                      <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center py-12 text-gray-400">
                        <MapPin className="mx-auto mb-4 opacity-50" size={48} />
                        <p>No travelers nearby right now</p>
                        <p className="text-sm mt-2">Check back later!</p>
                      </motion.div>
                    ) : (
                      <div className="space-y-3">
                        {nearbyUsers.map((user, index) => (
                          <motion.div
                            key={user.userId}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ delay: index * 0.05 }}
                            className="bg-black/40 border border-white/5 rounded-lg p-4 hover:border-green-500/30 transition-colors"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <UserIcon iconName={user.profile_icon} className="w-10 h-10" />
                                <div>
                                  <p className="text-white font-semibold">{user.username}</p>
                                  <p className="text-xs text-gray-400">Active traveler</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-green-400 font-bold">{user.distance.toFixed(1)} km</p>
                                <p className="text-xs text-gray-400">away</p>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </AnimatePresence>
                </div>
          </motion.div>
        )}
      </div>
    </>
  );
};

export default Radar;
