"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import type { Flight } from "@shared/schema";
import airportsDataRaw from "@/airports.json";
import { motion } from "framer-motion";

interface AirportJSON {
  iata: string;
  icao: string;
  name: string;
  city: string;
  country: string;
  iso_country: string;
  latitude: number;
  longitude: number;
}

const airportsData: AirportJSON[] = airportsDataRaw as AirportJSON[];

interface Stamp {
  id: string;
  name: string;
  isoCode: string;
  travelDate?: string;
}

// Flag emoji helper
const getFlagEmoji = (countryCode: string) =>
  countryCode
    .toUpperCase()
    .replace(/./g, (char) => String.fromCodePoint(127397 + char.charCodeAt(0)));

// Airport-to-country resolver
const getCountryFromAirportCode = (code: string) => {
  const trimmed = code.trim().toUpperCase();
  const airport = airportsData.find(
    (a) => a.iata === trimmed || a.icao === trimmed
  );
  if (!airport) {
    console.warn("❌ Missing airport code:", code);
    return null;
  }
  return airport.iso_country || null;
};

export default function Achievements() {
  const { token } = useAuth();

  const { data: flights = [] } = useQuery<Flight[]>({
    queryKey: ["user-flights", token],
    enabled: !!token,
    queryFn: async () => {
      if (!token) return [];
      const res = await apiRequest("GET", "/api/flights", null, token);
      if (!res.ok) throw new Error("Failed to fetch flights");
      return res.json();
    },
  });

  const allStamps: Stamp[] = useMemo(() => {
    const countryVisits = new Map<string, string>();

    const processAirportCode = (code?: string, flightDate?: string) => {
      if (!code) return;
      const country = getCountryFromAirportCode(code);
      if (country) {
        const iso = country.toLowerCase();
        if (!countryVisits.has(iso) || (flightDate && flightDate < (countryVisits.get(iso) || ""))) {
          countryVisits.set(iso, flightDate || "");
        }
      }
    };

    for (const f of flights) {
      const flightDate = f.date || f.departure_time?.split("T")[0];
      processAirportCode(f.departure, flightDate);
      processAirportCode(f.arrival, flightDate);
    }

    return Array.from(countryVisits.entries()).map(([iso, date], i) => ({
      id: `${i + 1}`,
      name: iso.toUpperCase(),
      isoCode: iso,
      travelDate: date,
    }));
  }, [flights]);

  const rows: Stamp[][] = useMemo(() => {
    const pattern = [3, 2, 5, 4, 6];
    const stamps = [...allStamps];
    const result: Stamp[][] = [];
    let i = 0;
    while (stamps.length) {
      result.push(stamps.splice(0, pattern[i % pattern.length]));
      i++;
    }
    return result;
  }, [allStamps]);

  const getRotation = () => Math.random() * 8 - 4;
  const getYOffset = () => Math.random() * 4 - 2;

  return (
    <div className="min-h-screen w-full bg-black text-white flex flex-col relative pb-16 pt-1 overflow-x-hidden">
      <Header />
<div className="w-full flex flex-col pt-12 pb-12"></div>

      {/* Title */}
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-[#22c55e] drop-shadow-[0_0_15px_rgba(34,197,94,0.4)] text-center mb-10 w-full"
      >
        Achievements
      </motion.h1>

      {allStamps.length === 0 ? (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-white/60 text-base sm:text-lg text-center mt-10 w-full"
        >
          No journeys yet — start exploring ✈️
        </motion.p>
      ) : (
        <div className="flex flex-col gap-4 w-full">
          {rows.map((row, rowIndex) => (
            <motion.div
              key={rowIndex}
              className="flex justify-center gap-3 flex-wrap w-full"
            >
              {row.map((stamp) => (
                <motion.div
                  key={stamp.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: getYOffset(), rotate: getRotation() }}
                  transition={{ duration: 0.5 }}
                  className="flex items-center gap-2 sm:gap-3 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full px-3 py-2 sm:px-4 sm:py-2.5 md:px-5 md:py-3 hover:border-[#22c55e]/60 hover:shadow-[0_0_15px_rgba(34,197,94,0.25)] transition-all min-w-[120px] sm:min-w-[140px]"
                >
                  <span className="text-2xl sm:text-3xl">{getFlagEmoji(stamp.isoCode)}</span>
                  <div className="flex flex-col">
                    <span className="text-base sm:text-lg md:text-xl font-medium text-white tracking-wide">
                      {stamp.name}
                    </span>
                    <span className="text-xs sm:text-sm text-white/60">
                      {stamp.travelDate || "Unknown date"}
                    </span>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
