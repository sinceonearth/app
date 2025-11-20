"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import Globe from "react-globe.gl";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Header } from "@/components/Header";
import { StatsDashboard } from "@/components/StatsDashboard";
import { apiRequest } from "@/lib/queryClient";
import type { Flight } from "@shared/schema";
import Achievements from "./Achievements";

const countryCoordinates: Record<string, { lat: number; lon: number }> = {
  India: { lat: 20.5937, lon: 78.9629 },
  USA: { lat: 37.0902, lon: -95.7129 },
  Canada: { lat: 56.1304, lon: -106.3468 },
  Germany: { lat: 51.1657, lon: 10.4515 },
  Other: { lat: 0, lon: 0 },
};

function getCoords(country?: string) {
  if (!country) return countryCoordinates["Other"];
  const trimmed = country.trim();
  return (
    countryCoordinates[trimmed] ||
    Object.entries(countryCoordinates).find(
      ([k]) => k.toLowerCase() === trimmed.toLowerCase()
    )?.[1] ||
    countryCoordinates["Other"]
  );
}

export default function Dashboard() {
  const { token, user } = useAuth();
  const globeRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 400, height: 400 });

  const { data: flights = [], refetch: refetchFlights } = useQuery<Flight[]>({
    queryKey: ["user-flights", token],
    enabled: !!token,
    queryFn: async () => {
      if (!token) return [];
      const res = await apiRequest("GET", "/api/flights", null, token);
      if (!res.ok) throw new Error("Failed to fetch flights");
      return res.json();
    },
  });

  const { data: stayins = [], refetch: refetchStayins } = useQuery<any[]>({
    queryKey: ["user-stayins", token],
    enabled: !!token,
    queryFn: async () => {
      if (!token) return [];
      const res = await apiRequest("GET", "/api/stayins", null, token);
      if (!res.ok) throw new Error("Failed to fetch stay ins");
      return res.json();
    },
  });

  useEffect(() => {
    if (globeRef.current && user) {
      const coords = getCoords(user.country);
      globeRef.current.pointOfView(
        { lat: coords.lat, lng: coords.lon, altitude: 2.0 },
        1500
      );
    }
  }, [user]);

  useEffect(() => {
    const update = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const arcsData = useMemo(() => {
    return flights
      .filter(
        (f) =>
          f.departure_latitude &&
          f.departure_longitude &&
          f.arrival_latitude &&
          f.arrival_longitude
      )
      .map((f) => {
        const R = 6371;
        const dLat = ((f.arrival_latitude! - f.departure_latitude!) * Math.PI) / 180;
        const dLon = ((f.arrival_longitude! - f.departure_longitude!) * Math.PI) / 180;
        const a =
          Math.sin(dLat / 2) ** 2 +
          Math.cos((f.departure_latitude! * Math.PI) / 180) *
            Math.cos((f.arrival_latitude! * Math.PI) / 180) *
            Math.sin(dLon / 2) ** 2;
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;

        const arcAltitude = Math.min(0.25, Math.max(0.05, distance / 20000));

        return {
          startLat: f.departure_latitude!,
          startLng: f.departure_longitude!,
          endLat: f.arrival_latitude!,
          endLng: f.arrival_longitude!,
          startLabel: (f.departure || "").toUpperCase(),
          endLabel: (f.arrival || "").toUpperCase(),
          color: "#22c55e",
          altitude: arcAltitude,
        };
      });
  }, [flights]);

  return (
    <div className="min-h-screen w-screen bg-black text-white flex flex-col">
      {/* Header with Menu */}
      <Header />
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col pt-12 overflow-hidden">
        {/* Globe */}
        <div ref={containerRef} className="w-full h-[50vh] relative z-10">
          <Globe
            ref={globeRef}
            width={dimensions.width}
            height={dimensions.height}
            globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
            backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
            arcsData={arcsData}
            arcStartLat="startLat"
            arcStartLng="startLng"
            arcEndLat="endLat"
            arcEndLng="endLng"
            arcColor={() => "white"}
            arcAltitude={(d: any) => d.altitude}
            arcStroke={0.4}
            atmosphereColor="#22c55e"
            atmosphereAltitude={0.25}
            htmlElementsData={arcsData.flatMap((arc) => [
              { lat: arc.startLat, lng: arc.startLng },
              { lat: arc.endLat, lng: arc.endLng },
            ])}
            htmlElement={() => {
              const el = document.createElement("div");
              el.style.borderRadius = "50%";
              el.style.width = "6px";
              el.style.height = "6px";
              el.style.background = "#22c55e";
              return el;
            }}
          />
        </div>

        {/* Stats Content */}
        <div className="flex-1 overflow-y-auto px-9 py-1 md:px-1">
          <StatsDashboard
            flights={flights}
            stayins={stayins}
            totalFlights={flights.length}
            totalStayins={new Set(stayins.map((s: any) => s.name)).size}
          />

        </div>
      </div>
    </div>
  );
}
