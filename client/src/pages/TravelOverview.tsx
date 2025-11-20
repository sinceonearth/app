"use client";

import React, { useState } from "react";
import { Header } from "@/components/Header";
import TripHistory from "./TripHistory";
import StayIns from "./StayIns";

const tabs = ["Trips", "Stayins"];

export default function TravelOverview() {
  const [activeTab, setActiveTab] = useState<string>("Trips");

  return (
    <>
      <Header />

      <div className="relative min-h-screen w-full bg-black text-white pt-20 pb-24 flex flex-col px-6 md:px-8">
        {/* Toggle Tab Bar */}
        <div className="flex justify-center mb-3 rounded-full p-3 gap-8 w-full max-w-md mx-auto shadow-inner">
          {tabs.map((tab) => {
            const isActive = activeTab === tab;
            const borderColor = tab === "Trips" ? "border-green-500" : "border-cyan-400";
            const gradient =
              tab === "Trips"
                ? "from-green-200 to-green-300"
                : "from-cyan-200 to-cyan-400";

            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 flex items-center justify-center py-3 rounded-full font-semibold transition-all duration-200 ${
                  isActive
                    ? `border-2 ${borderColor} scale-105`
                    : "border-2 border-gray-600 text-gray-400 hover:bg-gray-700"
                }`}
              >
                <span
                  className={`${
                    isActive
                      ? `text-transparent bg-clip-text bg-gradient-to-r ${gradient}`
                      : "text-gray-400"
                  } font-bold text-2xl md:text-xl`}
                >
                  {tab}
                </span>
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="relative flex-1 w-full overflow-y-auto">
          {/* Both pages mounted; show/hide using display */}
          <div className={activeTab === "Trips" ? "block" : "hidden"}>
            <TripHistory />
          </div>

          <div className={activeTab === "Stayins" ? "block" : "hidden"}>
            <StayIns />
          </div>
        </div>
      </div>
    </>
  );
}
