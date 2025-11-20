"use client";

import { useState, useEffect, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import airlinesData from "@/airlines.json";
import airportsData from "@/airports.json";
import { motion, AnimatePresence } from "framer-motion";
import { createLucideIcon } from "lucide-react";
import { faceAlien } from "@lucide/lab";

const FaceAlienIcon = createLucideIcon("FaceAlienIcon", faceAlien);

interface Airline {
  name: string;
  airline_code?: string;
}

interface Airport {
  name: string;
  iata?: string;
  ident?: string;
  latitude?: number;
  longitude?: number;
  city?: string;
  country?: string;
}

interface ManualAddFlightProps {
  userId: string;
  onSuccess?: () => void;
}

export default function ManualAddFlight({ userId, onSuccess }: ManualAddFlightProps) {
  const [airline, setAirline] = useState("");
  const [airlineCode, setAirlineCode] = useState("");
  const [flightNumber, setFlightNumber] = useState("");
  const [departureInput, setDepartureInput] = useState("");
  const [arrivalInput, setArrivalInput] = useState("");
  const [date, setDate] = useState("");
  const [departureTime, setDepartureTime] = useState("");
  const [arrivalTime, setArrivalTime] = useState("");
  const [status, setStatus] = useState("scheduled");

  const [departureAirport, setDepartureAirport] = useState<Airport | null>(null);
  const [arrivalAirport, setArrivalAirport] = useState<Airport | null>(null);

  const [suggestedAirlines, setSuggestedAirlines] = useState<Airline[]>([]);
  const [suggestedDepAirports, setSuggestedDepAirports] = useState<Airport[]>([]);
  const [suggestedArrAirports, setSuggestedArrAirports] = useState<Airport[]>([]);

  const [isAdding, setIsAdding] = useState(false);

  const airlines: Airline[] = (airlinesData as any[]).map((a) => ({
    name: a.airline_name ?? "",
    airline_code: a.airline_code ?? "",
  }));

  const airports: Airport[] = (airportsData as any[]).map((a) => ({
    name: a.name ?? "",
    iata: a.iata ?? "",
    ident: a.ident ?? "",
    latitude: a.latitude ?? 0,
    longitude: a.longitude ?? 0,
    city: a.city ?? "",
    country: a.country ?? "",
  }));

  const debounce = <T extends (...args: any[]) => void>(func: T, delay: number) => {
    let timeoutId: ReturnType<typeof setTimeout>;
    return (...args: Parameters<T>) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  };

  const handleAirlineInput = useMemo(
    () =>
      debounce((val: string) => {
        if (!val) return setSuggestedAirlines([]);
        setSuggestedAirlines(
          airlines
            .filter(
              (a) =>
                a.name.toLowerCase().includes(val.toLowerCase()) ||
                a.airline_code?.toLowerCase().includes(val.toLowerCase())
            )
            .slice(0, 8)
        );
      }, 200),
    []
  );

  const handleDepInput = useMemo(
    () =>
      debounce((val: string) => {
        if (!val) return setSuggestedDepAirports([]);
        const searchTerm = val.toLowerCase();
        const filtered = airports.filter(
          (a) =>
            a.name.toLowerCase().includes(searchTerm) ||
            a.iata?.toLowerCase().includes(searchTerm) ||
            a.ident?.toLowerCase().includes(searchTerm) ||
            a.city?.toLowerCase().includes(searchTerm)
        );
        const sorted = filtered.sort((a, b) => {
          const aIataExact = a.iata?.toLowerCase() === searchTerm;
          const bIataExact = b.iata?.toLowerCase() === searchTerm;
          const aIdentExact = a.ident?.toLowerCase() === searchTerm;
          const bIdentExact = b.ident?.toLowerCase() === searchTerm;

          if (aIataExact && !bIataExact) return -1;
          if (!aIataExact && bIataExact) return 1;
          if (aIdentExact && !bIdentExact) return -1;
          if (!aIdentExact && bIdentExact) return 1;

          return 0;
        });
        setSuggestedDepAirports(sorted.slice(0, 8));
      }, 200),
    []
  );

  const handleArrInput = useMemo(
    () =>
      debounce((val: string) => {
        if (!val) return setSuggestedArrAirports([]);
        const searchTerm = val.toLowerCase();
        const filtered = airports.filter(
          (a) =>
            a.name.toLowerCase().includes(searchTerm) ||
            a.iata?.toLowerCase().includes(searchTerm) ||
            a.ident?.toLowerCase().includes(searchTerm) ||
            a.city?.toLowerCase().includes(searchTerm)
        );
        const sorted = filtered.sort((a, b) => {
          const aIataExact = a.iata?.toLowerCase() === searchTerm;
          const bIataExact = b.iata?.toLowerCase() === searchTerm;
          const aIdentExact = a.ident?.toLowerCase() === searchTerm;
          const bIdentExact = b.ident?.toLowerCase() === searchTerm;

          if (aIataExact && !bIataExact) return -1;
          if (!aIataExact && bIataExact) return 1;
          if (aIdentExact && !bIdentExact) return -1;
          if (!aIdentExact && bIdentExact) return 1;

          return 0;
        });
        setSuggestedArrAirports(sorted.slice(0, 8));
      }, 200),
    []
  );

  useEffect(() => handleAirlineInput(airline), [airline, handleAirlineInput]);
  useEffect(() => handleDepInput(departureInput), [departureInput, handleDepInput]);
  useEffect(() => handleArrInput(arrivalInput), [arrivalInput, handleArrInput]);

  const handleAirlineSelect = (a: Airline) => {
    setAirline(`${a.name} (${a.airline_code})`);
    setAirlineCode(a.airline_code || "");
    setFlightNumber(a.airline_code ? `${a.airline_code}-` : "");
    setSuggestedAirlines([]);
  };

  const handleDepSelect = (a: Airport) => {
    setDepartureInput(`${a.name} (${a.iata || a.ident})`);
    setDepartureAirport(a);
    setSuggestedDepAirports([]);
  };

  const handleArrSelect = (a: Airport) => {
    setArrivalInput(`${a.name} (${a.iata || a.ident})`);
    setArrivalAirport(a);
    setSuggestedArrAirports([]);
  };

  const handleReset = () => {
    setAirline("");
    setAirlineCode("");
    setFlightNumber("");
    setDepartureInput("");
    setArrivalInput("");
    setDate("");
    setDepartureTime("");
    setArrivalTime("");
    setDepartureAirport(null);
    setArrivalAirport(null);
    setStatus("scheduled");
  };

  const handleAddFlight = async () => {
    if (!date) return alert("Please select a date.");
    if (!departureInput) return alert("Please enter a departure airport.");
    if (!arrivalInput) return alert("Please enter an arrival airport.");

    setIsAdding(true);
    try {
      const token = localStorage.getItem("auth_token");
      if (!token) return alert("You must be logged in to add a flight.");

      let depAirport = departureAirport;
      let arrAirport = arrivalAirport;

      if (!depAirport) {
        const searchTerm = departureInput.trim().toUpperCase();
        depAirport =
          airports.find(
            (a) =>
              a.iata?.toUpperCase() === searchTerm ||
              a.ident?.toUpperCase() === searchTerm ||
              a.name.toUpperCase().includes(searchTerm)
          ) || null;
      }

      if (!arrAirport) {
        const searchTerm = arrivalInput.trim().toUpperCase();
        arrAirport =
          airports.find(
            (a) =>
              a.iata?.toUpperCase() === searchTerm ||
              a.ident?.toUpperCase() === searchTerm ||
              a.name.toUpperCase().includes(searchTerm)
          ) || null;
      }

      if (!depAirport) {
        alert("Could not find departure airport. Please select from the dropdown suggestions.");
        setIsAdding(false);
        return;
      }

      if (!arrAirport) {
        alert("Could not find arrival airport. Please select from the dropdown suggestions.");
        setIsAdding(false);
        return;
      }

      // Use IATA first, fallback to ident
      const departureCode = depAirport.iata?.trim() || depAirport.ident?.trim() || "N/A";
      const arrivalCode = arrAirport.iata?.trim() || arrAirport.ident?.trim() || "N/A";

      const body = {
        date,
        flight_number: flightNumber || "MANUAL",
        airline_name: airline || "Manual Entry",
        airline_code: airlineCode || null,
        departure: departureCode,
        arrival: arrivalCode,
        departure_latitude: depAirport.latitude ?? 0,
        departure_longitude: depAirport.longitude ?? 0,
        arrival_latitude: arrAirport.latitude ?? 0,
        arrival_longitude: arrAirport.longitude ?? 0,
        departure_time: departureTime || null,
        arrival_time: arrivalTime || null,
        status,
        user_id: userId,
      };

      const res = await fetch("/api/flights", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        handleReset();
        if (onSuccess) onSuccess();
      } else {
        const err = await res.json();
        alert("Error: " + (err.message || "Unknown error"));
      }
    } catch (err) {
      console.error(err);
      alert("Error adding flight. Please try again.");
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="w-full mx-auto p-4 space-y-4 relative">

      {/* Divider */}
      <div className="text-center text-gray-400 font-semibold my-2">Enter details manually</div>

      {/* Airline */}
      <div className="relative w-full">
        <Label className="text-green-400 mb-1">Airline*</Label>
        <Input
          value={airline}
          onChange={(e) => setAirline(e.target.value)}
          placeholder="e.g. IndiGo"
          className="w-full bg-gray-800 text-green-100 border-gray-600 rounded-lg focus:ring-2 focus:ring-green-400"
        />
        {suggestedAirlines.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-gray-800 border border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {suggestedAirlines.map((a, idx) => (
              <div
                key={idx}
                className="px-4 py-2 hover:bg-gray-700 cursor-pointer text-green-100"
                onClick={() => handleAirlineSelect(a)}
              >
                <div className="font-semibold">{a.name}</div>
                <div className="text-sm text-gray-400">{a.airline_code}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Flight Number */}
      <div className="w-full">
        <Label className="text-green-400 mb-1">Flight Number*</Label>
        <Input
          value={flightNumber}
          onChange={(e) => setFlightNumber(e.target.value)}
          placeholder="e.g. 6E-6289"
          className="w-full bg-gray-800 text-green-100 border-gray-600 rounded-lg focus:ring-2 focus:ring-green-400"
        />
      </div>

      {/* Departure & Arrival */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
        <div className="relative w-full">
          <Label className="text-green-400 mb-1">Departure Airport*</Label>
          <Input
            value={departureInput}
            onChange={(e) => setDepartureInput(e.target.value)}
            placeholder="e.g. DEL"
            className="w-full bg-gray-800 text-green-100 border-gray-600 rounded-lg focus:ring-2 focus:ring-green-400"
          />
          {suggestedDepAirports.length > 0 && (
            <div className="absolute z-50 w-full mt-1 bg-gray-800 border border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {suggestedDepAirports.map((a, idx) => (
                <div
                  key={idx}
                  className="px-4 py-2 hover:bg-gray-700 cursor-pointer text-green-100"
                  onClick={() => handleDepSelect(a)}
                >
                  <div className="font-semibold">
                    {a.iata || a.ident} - {a.name}
                  </div>
                  <div className="text-sm text-gray-400">
                    {a.city && a.country ? `${a.city}, ${a.country}` : (a.city || a.country || '')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="relative w-full">
          <Label className="text-green-400 mb-1">Arrival Airport*</Label>
          <Input
            value={arrivalInput}
            onChange={(e) => setArrivalInput(e.target.value)}
            placeholder="e.g. BOM"
            className="w-full bg-gray-800 text-green-100 border-gray-600 rounded-lg focus:ring-2 focus:ring-green-400"
          />
          {suggestedArrAirports.length > 0 && (
            <div className="absolute z-50 w-full mt-1 bg-gray-800 border border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {suggestedArrAirports.map((a, idx) => (
                <div
                  key={idx}
                  className="px-4 py-2 hover:bg-gray-700 cursor-pointer text-green-100"
                  onClick={() => handleArrSelect(a)}
                >
                  <div className="font-semibold">
                    {a.iata || a.ident} - {a.name}
                  </div>
                  <div className="text-sm text-gray-400">
                    {a.city && a.country ? `${a.city}, ${a.country}` : (a.city || a.country || '')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Date & Time */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
        <div>
          <Label className="text-green-400 mb-1">Date*</Label>
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full bg-gray-800 text-green-100 border-gray-600 rounded-lg focus:ring-2 focus:ring-green-400"
          />
        </div>
        <div>
          <Label className="text-green-400 mb-1">Departure Time</Label>
          <Input
            type="time"
            value={departureTime}
            onChange={(e) => setDepartureTime(e.target.value)}
            className="w-full bg-gray-800 text-green-100 border-gray-600 rounded-lg focus:ring-2 focus:ring-green-400"
          />
        </div>
        <div>
          <Label className="text-green-400 mb-1">Arrival Time</Label>
          <Input
            type="time"
            value={arrivalTime}
            onChange={(e) => setArrivalTime(e.target.value)}
            className="w-full bg-gray-800 text-green-100 border-gray-600 rounded-lg focus:ring-2 focus:ring-green-400"
          />
        </div>
      </div>

      {/* Status */}
      <div className="w-full">
        <Label className="text-green-400 mb-1">Status*</Label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="w-full p-2 bg-gray-800 text-green-100 border border-gray-600 rounded-lg focus:ring-2 focus:ring-green-400"
        >
          <option value="scheduled">Scheduled</option>
          <option value="landed">Landed</option>
        </select>
      </div>

      {/* Buttons */}
      <div className="flex gap-4 mt-2">
        <Button
          className="bg-green-600 border-green-600 hover:bg-green-500 text-black rounded-full px-6 py-4 font-semibold flex-1"
          onClick={handleAddFlight}
        >
          Add Flight
        </Button>
        <Button
          className="bg-gray-700 border-green-600 hover:bg-gray-600 text-white rounded-full px-6 py-4 font-semibold"
          onClick={handleReset}
        >
          Reset
        </Button>
      </div>

      {/* Inserting overlay */}
      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 flex flex-col justify-center items-center bg-black/70 z-50"
          >
            <FaceAlienIcon className="w-12 h-12 text-green-400 drop-shadow-xl animate-pulse" />
            <span className="text-green-400 font-bold text-lg mt-2">Inserting data...</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
