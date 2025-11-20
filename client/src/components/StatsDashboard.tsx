"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Globe, Plane, Ruler, Building2, TowerControl, Clock, MapPin, Earth } from "lucide-react";
import type { Flight } from "@shared/schema";
import airportsDataRaw from "@/airports.json";

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

interface StatsDashboardProps {
  totalFlights: number;
  totalStayins: number;
  flights: Flight[];
  stayins: any[];
}

const getCountryFromLatLon = (lat: number, lon: number) => {
  const tolerance = 0.01;
  const airport = airportsData.find(
    (a) => Math.abs(a.latitude - lat) < tolerance && Math.abs(a.longitude - lon) < tolerance
  );
  return airport?.iso_country || null;
};

export function StatsDashboard({ totalFlights, totalStayins, flights, stayins }: StatsDashboardProps) {
  const { uniqueCountries, uniquePlaces, totalDistance, totalHours, uniqueAirportCodes } = useMemo(() => {
    const countrySet = new Set<string>();
    const placeSet = new Set<string>();
    const airportSet = new Set<string>();
    let distanceSum = 0;
    let hoursSum = 0;

    for (const f of flights) {
      if (f.departure_latitude && f.departure_longitude) {
        const c = getCountryFromLatLon(f.departure_latitude, f.departure_longitude);
        if (c) countrySet.add(c.toUpperCase());
      }
      if (f.arrival_latitude && f.arrival_longitude) {
        const c = getCountryFromLatLon(f.arrival_latitude, f.arrival_longitude);
        if (c) countrySet.add(c.toUpperCase());
      }

      if (f.departure) airportSet.add(f.departure.toUpperCase());
      if (f.arrival) airportSet.add(f.arrival.toUpperCase());

      if (f.departure_latitude && f.arrival_latitude && f.departure_longitude && f.arrival_longitude) {
        const R = 6371;
        const dLat = ((f.arrival_latitude - f.departure_latitude) * Math.PI) / 180;
        const dLon = ((f.arrival_longitude - f.departure_longitude) * Math.PI) / 180;
        const a =
          Math.sin(dLat / 2) ** 2 +
          Math.cos((f.departure_latitude * Math.PI) / 180) *
            Math.cos((f.arrival_latitude * Math.PI) / 180) *
            Math.sin(dLon / 2) ** 2;
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const dist = (R * c * 1.15) || 0;
        distanceSum += dist;

        const durationStr = String(f.duration || "");
        if (durationStr.includes("h") || durationStr.includes("m")) {
          const h = durationStr.match(/(\d+)h/);
          const m = durationStr.match(/(\d+)m/);
          hoursSum += (h ? +h[1] : 0) + (m ? +m[1] / 60 : 0);
        } else {
          hoursSum += f.duration ? +f.duration / 60 : dist / 850 + 0.5;
        }
      }
    }

    for (const s of stayins) if (s.name) placeSet.add(s.name);

    return {
      uniqueCountries: countrySet,
      uniquePlaces: placeSet,
      totalDistance: distanceSum.toFixed(0),
      totalHours: hoursSum.toFixed(1),
      uniqueAirportCodes: airportSet,
    };
  }, [flights, stayins]);

  const formatNumber = (num: number | string) =>
    isNaN(Number(num)) ? num : new Intl.NumberFormat("en-IN").format(Number(num));

  const labelClass = "text-xs sm:text-sm opacity-80 font-medium leading-none";

  const StatCard = ({
    icon: Icon,
    value,
    label,
    color,
  }: {
    icon: any;
    value: string | number;
    label: string;
    color: string;
  }) => (
    <div className="flex items-center gap-3 bg-gradient-to-br from-green-500/10 to-black/40 backdrop-blur-sm px-5 py-3 rounded-full text-white shadow-lg border-2 border-green-500/20 hover:border-green-400/40 transition-all duration-300 hover:shadow-green-500/20">
      <Icon className={`h-8 w-8 ${color}`} />
      <div className="flex flex-col items-start">
        <span className="text-xl sm:text-2xl font-bold">{value}</span>
        <span className={labelClass}>{label}</span>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col items-center w-full mb-8 px-4 select-none">
      {/* Distance + Hours */}
      <div className="flex items-center justify-center gap-8 bg-gradient-to-br from-green-500/10 to-black/40 px-6 py-4 rounded-full border-2 border-green-500/20 text-white shadow-lg mb-6">
        <div className="flex items-center gap-3">
          <Ruler className="h-8 w-8 text-yellow-400" />
          <div>
            <span className="text-2xl font-bold">{formatNumber(totalDistance)}</span>
            <p className={labelClass}>Km's in Distance</p>
          </div>
        </div>
        <div className="h-8 w-px bg-white/20" />
        <div className="flex items-center gap-3">
          <Clock className="h-8 w-8 text-orange-400" />
          <div>
            <span className="text-2xl font-bold">{formatNumber(totalHours)}</span>
            <p className={labelClass}>Hours</p>
          </div>
        </div>
      </div>

      {/* 4 Stat Capsules — same look on mobile, 1-line on desktop */}
<div className="flex flex-wrap justify-center gap-4 w-full max-w-6xl mt-1 lg:flex-nowrap">
  <StatCard icon={Earth} value={uniqueCountries.size} label="Countries" color="text-purple-400" />
  {/* <StatCard icon={MapPin} value={uniquePlaces.size} label="Places" color="text-pink-400" /> */}
  <StatCard icon={Plane} value={formatNumber(totalFlights)} label="Flights" color="text-green-400" />
  <StatCard icon={TowerControl} value={uniqueAirportCodes.size} label="Airports" color="text-indigo-400" />
  <StatCard icon={Building2} value={formatNumber(totalStayins)} label="Stay Ins" color="text-sky-400" />
</div>

      {/* Animated Gradient Bar */}
      <div className="relative w-full max-w-4xl h-[8px] rounded-full overflow-hidden mt-6">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: "100%" }}
          transition={{ duration: 1.3, ease: "easeOut" }}
          className="absolute top-0 left-0 h-full"
          style={{
            background: "linear-gradient(to right, #a855f7, #22c55e, #eab308, #6366f1, #38bdf8)",
          }}
        />
      </div>
    </div>
  );
}
