"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import ManualAddFlight from "@/components/ManualAddFlight";
import { Ruler, Clock, ArrowLeft, Trash2, Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import airportsDataRaw from "@/airports.json";

interface Airport {
  ident?: string;
  iata_code?: string;
  icao_code?: string;
  municipality?: string;
}

interface Flight {
  id: string;
  airline_code?: string;
  airline_name?: string;
  flight_number?: string;
  departure?: string;
  arrival?: string;
  departure_time?: string | null;
  date?: string | null;
  distance?: number | null;
  duration?: string | null;
  status?: string;
  departure_latitude?: number | null;
  departure_longitude?: number | null;
  arrival_latitude?: number | null;
  arrival_longitude?: number | null;
}

const PAGE_SIZE = 12;

// --- Normalize airports data ---
const airportsData: Airport[] = Array.isArray(airportsDataRaw)
  ? airportsDataRaw
  : (airportsDataRaw as any).airports || [];

// --- Safe date parsing ---
const safeParseDate = (dateStr?: string | null): Date | null => {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? null : d;
};

// --- Distance calculation ---
const getDistanceKm = (
  lat1?: number | null,
  lon1?: number | null,
  lat2?: number | null,
  lon2?: number | null,
  storedDistance?: number | null
): number | null => {
  if (storedDistance && storedDistance > 0) return storedDistance;
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c * 1.15;
};

// --- Duration parsing ---
const getDurationHours = (f: Flight, distanceKm: number | null) => {
  let hours = 0;
  const durationStr = f.duration || "";
  const h = durationStr.match(/(\d+)h/);
  const m = durationStr.match(/(\d+)m/);
  if (h || m) {
    hours += (h ? +h[1] : 0) + (m ? +m[1] / 60 : 0);
  } else {
    hours += distanceKm ? distanceKm / 850 + 0.5 : 0;
  }
  return hours;
};

// --- Robust city lookup ---
const findCityByCode = (code?: string | null): string | null => {
  if (!code) return null;
  const c = code.trim().toUpperCase();
  const airport = (airportsDataRaw as Airport[]).find((a: any) => {
    return (
      (a.ident || "").trim().toUpperCase() === c ||
      (a.iata || "").trim().toUpperCase() === c ||
      (a.icao || "").trim().toUpperCase() === c
    );
  });
  return airport?.municipality || null;
};


export default function TripHistory() {
  const { token, user } = useAuth();
  const [upcomingFlights, setUpcomingFlights] = useState<Flight[]>([]);
  const [pastFlights, setPastFlights] = useState<Flight[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedPastTab, setSelectedPastTab] = useState("All");
  const [visibleUpcomingCount, setVisibleUpcomingCount] = useState(PAGE_SIZE);
  const [visiblePastCount, setVisiblePastCount] = useState(PAGE_SIZE);

  const now = new Date();

  const { data: flights = [], refetch } = useQuery<Flight[]>({
    queryKey: ["user-flights", token],
    enabled: !!token,
    queryFn: async () => {
      if (!token) return [];
      const res = await apiRequest("GET", "/api/flights", null, token);
      if (!res.ok) throw new Error("Failed to fetch flights");
      return res.json();
    },
  });

  // Split flights into upcoming & past
  useEffect(() => {
    const upcoming: Flight[] = [];
    const past: Flight[] = [];
    flights.forEach((f) => {
      if (f.status?.toLowerCase() === "landed") {
        past.push(f);
      } else {
        upcoming.push(f);
      }
    });
    setUpcomingFlights(upcoming);
    setPastFlights(past);
  }, [flights]);

  // Extract years for past tabs
  const years = useMemo(() => {
    const setYears = new Set<number>();
    pastFlights.forEach((f) => {
      const d = safeParseDate(f.date ?? f.departure_time ?? undefined);
      if (d) setYears.add(d.getFullYear());
    });
    return [...setYears].sort((a, b) => b - a);
  }, [pastFlights]);

  const pastTabs = ["All", ...years.map(String)];

  const pastToShow = useMemo(() => {
    const filtered =
      selectedPastTab === "All"
        ? pastFlights
        : pastFlights.filter((f) => {
            const d = safeParseDate(f.date ?? f.departure_time ?? undefined);
            return d && d.getFullYear() === Number(selectedPastTab);
          });
    return filtered.sort((a, b) => {
      const dA = safeParseDate(a.date ?? a.departure_time)?.getTime() ?? 0;
      const dB = safeParseDate(b.date ?? b.departure_time)?.getTime() ?? 0;
      return dB - dA;
    });
  }, [pastFlights, selectedPastTab]);

  const handleFlightAdded = () => {
    setShowAddForm(false);
    refetch();
  };
  const handleLoadMoreUpcoming = () => setVisibleUpcomingCount((c) => c + PAGE_SIZE);
  const handleLoadMorePast = () => setVisiblePastCount((c) => c + PAGE_SIZE);

  const handleDeleteFlight = async (id: string, flightNumber: string) => {
    if (!confirm(`Delete flight ${flightNumber}?`)) return;
    if (!token) return;
    const res = await apiRequest("DELETE", `/api/flights/${id}`, null, token);
    if (!res.ok) return alert("Failed to delete flight");
    refetch();
  };

  // --- Flight Card ---
  const FlightCard = ({ f, showStatus }: { f: Flight; showStatus?: boolean }) => {
    const [open, setOpen] = useState(false);

    const depCity = useMemo(() => findCityByCode(f.departure), [f.departure]);
    const arrCity = useMemo(() => findCityByCode(f.arrival), [f.arrival]);

    const dateStr =
      safeParseDate(f.date ?? f.departure_time ?? undefined)?.toLocaleDateString() ||
      "N/A";

    const distanceKm = getDistanceKm(
      f.departure_latitude,
      f.departure_longitude,
      f.arrival_latitude,
      f.arrival_longitude,
      f.distance
    );
    const hours = getDurationHours(f, distanceKm);
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);

    return (
      <motion.div
        layout
        onClick={() => setOpen((p) => !p)}
        initial={false}
        animate={{ scale: open ? 1.015 : 1 }}
        transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
        className={`relative cursor-pointer rounded-[25px] overflow-hidden 
          shadow-[0_8px_32px_rgba(0,0,0,0.25)] border border-white/10 backdrop-blur-xl 
          bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900
          ${open ? "z-20" : "z-10 -mt-7 hover:-translate-y-1"} 
          transition-all duration-300`}
      >
        {/* side cutouts */}
        <motion.div
          animate={{ top: open ? "50%" : "88%", translateY: "-50%" }}
          transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
          className="absolute -left-5 w-11 h-20 rounded-full bg-green-500 z-[25]"
        />
        <motion.div
          animate={{ top: open ? "50%" : "88%", translateY: "-50%" }}
          transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
          className="absolute -right-5 w-11 h-20 rounded-full bg-green-500 z-[25]"
        />

        {/* Header */}
        <div className="flex items-center justify-between px-8 py-4">
          <div>
            <div className="text-gray-200 font-semibold text-xl flex items-center gap-2">
              <span>{f.departure}</span>
              <span className="text-gray-400">→</span>
              <span>
                {f.arrival}{" "}
                {f.flight_number && (
                  <span className="text-red-250 text-sm font-normal">{`{${f.flight_number}}`}</span>
                )}
              </span>
            </div>
            <div className="text-green-300 text-sm">{dateStr}</div>
          </div>

          {showStatus && f.status && (
            <span className="text-xs px-2 py-1 rounded-full bg-green-300/20 text-green-300 font-semibold">
              {f.status}
            </span>
          )}
        </div>

        {/* Expanded details */}
        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              key="expanded"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
              className="border-t border-white/10 px-10 py-4 text-sm text-gray-300 space-y-4 overflow-hidden"
            >
              <div className="font-semibold text-white text-2xl">
                {f.airline_name || f.airline_code || "Unknown Airline"}
              </div>

              {/* Cities */}
              <div className="flex justify-between text-gray-400 text-sm">
                <div className="flex flex-col">
                  <span className="font-medium text-white">{f.departure}</span>
                  <span className="text-xs text-gray-500">{depCity || "Unknown City"}</span>
                </div>
                <div className="flex flex-col text-right">
                  <span className="font-medium text-white">{f.arrival}</span>
                  <span className="text-xs text-gray-500">{arrCity || "Unknown City"}</span>
                </div>
              </div>

              {/* Distance & Duration */}
              {(distanceKm || h || m) && (
                <div className="flex items-center gap-6 text-gray-300 text-sm">
                  {distanceKm && (
                    <div className="flex items-center gap-1">
                      <Ruler className="w-4 h-4" /> {distanceKm.toFixed(0)} km
                    </div>
                  )}
                  {(h || m) && (
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" /> {h}h {m}m
                    </div>
                  )}
                </div>
              )}

              {/* Bottom strip */}
              <div className="border-t border-white/10 pt-4 flex justify-between items-center">
                <div className="flex flex-col">
                  <span className="text-xs text-gray-500">Flight Pass</span>
                  <div className="mt-1">
                    <div className="flex gap-[2px]">
                      {Array.from({ length: 40 }).map((_, i) => (
                        <div
                          key={i}
                          className={`h-6 ${i % 2 === 0 ? "w-[2px]" : "w-[1px]"} bg-white/70 rounded-sm`}
                        />
                      ))}
                    </div>
                    <div className="text-[10px] text-gray-500 mt-1">
                      ID: {f.id?.slice(0, 8) || "XXXXXX"}
                    </div>
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    f.id && handleDeleteFlight(f.id, f.flight_number || "");
                  }}
                  className="p-2 hover:bg-red-500/20 rounded-full transition-colors"
                >
                  <Trash2 size={18} className="text-red-400" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen w-full bg-black text-white flex flex-col relative px-4 md:px-8 lg:px-12 pb-12 pt-4 overflow-x-hidden">
      {/* Add Form Overlay */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 bg-black z-20 px-4 md:px-8 lg:px-12 py-6 overflow-y-auto"
          >
            <button
              onClick={() => setShowAddForm(false)}
              className="flex items-center gap-2 text-white hover:text-green-400 mb-6 transition"
            >
              <ArrowLeft size={20} />
              <span className="font-semibold">Back to Trips</span>
            </button>
            <ManualAddFlight userId={user?.id || ""} onSuccess={handleFlightAdded} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Flight */}
      <div className="mb-6 flex justify-center md:justify-start">
        <button
          onClick={() => setShowAddForm(true)}
          className="px-6 py-3 bg-green-500 hover:bg-green-600 text-black font-semibold rounded-full flex items-center gap-2 transition-all hover:scale-105"
        >
          <Plus size={20} /> Add Flight
        </button>
      </div>

      <div className="border-b border-white/20 my-6" />

      {/* Upcoming Flights */}
      <div className="mb-8">
        <h2 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-green-400 mb-6">
          Upcoming Flights
        </h2>
        {upcomingFlights.length === 0 ? (
          <div className="text-gray-400 text-center">No upcoming flights</div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {upcomingFlights.slice(0, visibleUpcomingCount).map((f) => (
                <FlightCard key={f.id} f={f} showStatus />
              ))}
            </div>
            {visibleUpcomingCount < upcomingFlights.length && (
              <div className="flex justify-center mt-8">
                <button
                  onClick={handleLoadMoreUpcoming}
                  className="px-6 py-3 rounded-full bg-green-500 hover:bg-green-600 text-black font-semibold transition-all hover:scale-105"
                >
                  Load More
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Past Flights */}
      <div className="mb-8">
        <h2 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-green-400 mb-4">
          Past Flights
        </h2>
        <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-hide">
          {pastTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setSelectedPastTab(tab);
                setVisiblePastCount(PAGE_SIZE);
              }}
              className={`px-5 py-2 rounded-full ${
                tab === selectedPastTab
                  ? "bg-gray-100 text-black font-semibold"
                  : "text-grey-400 hover:text-gray-300"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Total flights */}
        <div className="mb-12">
          <span className="font-semibold text-gray-400">✈️ Total flights:</span>{" "}
          <span className="text-white font-semibold">{pastToShow.length}</span>
        </div>

        {pastToShow.length === 0 ? (
          <div className="text-gray-400 text-center">No flights for {selectedPastTab}</div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {pastToShow.slice(0, visiblePastCount).map((f) => (
                <FlightCard key={f.id} f={f} showStatus />
              ))}
            </div>
            {visiblePastCount < pastToShow.length && (
              <div className="flex justify-center mt-8">
                <button
                  onClick={handleLoadMorePast}
                  className="px-6 py-3 rounded-full bg-green-500 hover:bg-green-600 text-black font-semibold transition-all hover:scale-105"
                >
                  Load More
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
