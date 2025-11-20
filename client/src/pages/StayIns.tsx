"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import type { Stayin } from "@shared/schema";
import { MapPin, Calendar, ArrowLeft, Plus, Trash2 } from "lucide-react";
import AddStayInForm from "@/components/AddStayInForm";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";

const PAGE_SIZE = 12;

export default function StayIns() {
  const { token } = useAuth();
  const [stayins, setStayins] = useState<Stayin[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedYear, setSelectedYear] = useState<string>("All");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const cacheRef = useRef<Stayin[]>([]);

  useEffect(() => {
    const cached = localStorage.getItem("stayins");
    if (cached) {
      const data = JSON.parse(cached);
      cacheRef.current = data;
      setStayins(data);
    }
  }, []);

  useEffect(() => {
    if (!token) return;
    let cancel = false;

    const fetchStayIns = async () => {
      try {
        const res = await apiRequest("GET", "/api/stayins", null, token);
        if (!res.ok) throw new Error("Failed to fetch stay-ins");
        const data = await res.json();
        if (!cancel) {
          cacheRef.current = data;
          setStayins(data);
          localStorage.setItem("stayins", JSON.stringify(data));
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (!cancel) setLoading(false);
      }
    };

    fetchStayIns();
    return () => {
      cancel = true;
    };
  }, [token]);

  const safeDate = (d?: string | null) => (d ? new Date(d) : null);

  const years = useMemo(() => {
    const ys = new Set<number>();
    stayins.forEach((s) => {
      const d = safeDate(s.check_in);
      if (d) ys.add(d.getFullYear());
    });
    return [...ys].sort((a, b) => b - a);
  }, [stayins]);

  const tabs = ["All", ...years.map(String)];

  const filtered = useMemo(() => {
    if (selectedYear === "All") return stayins;
    const yr = Number(selectedYear);
    return stayins.filter((s) => {
      const d = safeDate(s.check_in);
      return d && d.getFullYear() === yr;
    });
  }, [stayins, selectedYear]);

  const handleStayInAdded = () => {
    setShowAddForm(false);
    if (token) {
      apiRequest("GET", "/api/stayins", null, token)
        .then((res) => res.ok && res.json())
        .then((data: Stayin[]) => {
          setStayins(data);
          localStorage.setItem("stayins", JSON.stringify(data));
        })
        .catch(console.error);
    }
  };

  const calcNights = (a: string, b: string) => {
    const d1 = safeDate(a),
      d2 = safeDate(b);
    if (!d1 || !d2) return 0;
    return Math.ceil((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
  };

  const handleDeleteStayIn = async (id: string, name: string) => {
    if (!confirm(`Delete stay at ${name}?`)) return;
    if (!token) return;
    const res = await apiRequest("DELETE", `/api/stayins/${id}`, null, token);
    if (!res.ok) return alert("Failed to delete stay-in");
    // Refresh the list
    const refreshRes = await apiRequest("GET", "/api/stayins", null, token);
    if (refreshRes.ok) {
      const data = await refreshRes.json();
      setStayins(data);
      localStorage.setItem("stayins", JSON.stringify(data));
    }
  };

  // --- Expandable Blue Theme StayIn Card
const StayCard = ({ s }: { s: Stayin }) => {
  const [open, setOpen] = useState(false);
  const nights = calcNights(s.check_in, s.check_out);

  const typeColor: Record<string, string> = {
    HOTEL: "text-blue-400",
    AIRBNB: "text-cyan-400",
    HOSTEL: "text-teal-400",
    MOTEL: "text-indigo-400",
  };

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
        ${open ? "z-20" : "z-10 -mt-6 hover:-translate-y-1"}
        transition-all duration-300`}
    >
      {/* side cutouts */}
      <motion.div
        animate={{ top: open ? "50%" : "88%", translateY: "-50%" }}
        transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
        className="absolute -left-5 w-11 h-20 rounded-full bg-cyan-400 z-[25]"
      />
      <motion.div
        animate={{ top: open ? "50%" : "88%", translateY: "-50%" }}
        transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
        className="absolute -right-5 w-11 h-20 rounded-full bg-cyan-400 z-[25]"
      />

      {/* Header */}
      <div className="flex items-start justify-between px-8 py-4">
        <div className="text-white font-semibold text-lg break-words max-w-[80%]">
          {s.name}
        </div>
        <span className={`text-xs ${typeColor[s.type] || "text-blue-400"} shrink-0`}>
          {s.type}
        </span>
      </div>

      {/* Expandable Details */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="expanded"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            className="border-t border-white/10 px-10 py-4 text-gray-300 space-y-3 overflow-hidden"
          >
            <div className="flex items-center gap-2 text-sm">
              <MapPin size={14} className="text-gray-400" />
              <span>
                {s.city && `${s.city}, `} {s.country}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <Calendar size={12} />
              <span>
                {safeDate(s.check_in)?.toLocaleDateString()} →{" "}
                {safeDate(s.check_out)?.toLocaleDateString()}{" "}
                {nights > 0 && `(${nights} night${nights !== 1 ? "s" : ""})`}
              </span>
            </div>
            {s.maps_pin && (
              <a
                href={s.maps_pin}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-cyan-400 hover:text-cyan-300 hover:underline"
              >
                View on Maps →
              </a>
            )}
            
            {/* Delete Button */}
            <div className="border-t border-white/10 pt-3 flex justify-end">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  s.id && handleDeleteStayIn(s.id, s.name);
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
    <div className="relative min-h-screen w-full bg-black text-white flex flex-col px-4 md:px-8 lg:px-12 pb-12 pt-4 overflow-x-hidden">
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
              className="flex items-center gap-2 text-white hover:text-cyan-400 mb-6 transition"
            >
              <ArrowLeft size={20} />
              <span className="font-semibold">Back</span>
            </button>
            <AddStayInForm userId="" onSuccess={handleStayInAdded} alwaysOpen />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header + Tabs */}
      <div className="mb-6 flex justify-center md:justify-start">
        <button
          onClick={() => setShowAddForm(true)}
          className="px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-black font-semibold rounded-full flex items-center gap-2 transition-all hover:scale-105"
        >
          <Plus size={20} /> Add Stay In
        </button>
      </div>

      <div className="border-b border-white/20 my-6" />

      {/* Tabs */}
      <div className="mb-4">
        <h2 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-cyan-400 mb-3">
          Bookings
        </h2>
        <div className="w-full overflow-x-auto scrollbar-hide">
          <div className="flex gap-1 py-2 min-w-[max-content]">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setSelectedYear(tab);
                  setVisibleCount(PAGE_SIZE);
                }}
                className={`px-5 py-2 transition-all rounded-full ${
                  tab === selectedYear
                    ? "bg-cyan-500 text-black font-semibold"
                    : "text-cyan-400 hover:text-cyan-300"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="text-gray-300 mb-9">
        Total Stay Ins: <span className="text-white font-semibold">{filtered.length}</span>
      </div>

      {/* Grid */}
      {loading && stayins.length === 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: PAGE_SIZE }).map((_, i) => (
            <div
              key={i}
              className="p-4 bg-blue-800 border border-blue-700 rounded-xl animate-pulse h-40"
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-gray-400 text-center py-8">No stay-ins found</div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filtered.slice(0, visibleCount).map((s) => (
              <StayCard key={s.id} s={s} />
            ))}
          </div>

          {visibleCount < filtered.length && (
            <div className="flex justify-center mt-8">
              <button
                onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                className="px-6 py-3 rounded-full bg-cyan-500 hover:bg-cyan-600 text-black font-semibold transition-all hover:scale-105"
              >
                Load More
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
