/* -------------------------------------------------------------------------- */
/* 🏷️ Stamp Type (for Achievements / UI)                                      */
/* -------------------------------------------------------------------------- */
export interface UIStamp {
  id: string;        // unique ID of the stamp (string)
  name: string;      // readable country name, e.g. "Japan"
  isoCode: string;   // ISO country code, e.g. "JP"
  travelDate?: string; // First visit date, e.g. "2024-10-15"
}

/* -------------------------------------------------------------------------- */
/* ✈️ AviationStack Flight Type (for AddFlightModal)                          */
/* -------------------------------------------------------------------------- */
// Original raw API structure
export interface AviationStackFlight {
  flight_date?: string;
  flight_status?: string;
  airline?: { name?: string; iata?: string };
  flight?: {
    iata?: string;
    number?: string;
    codeshared?: {
      airline_name?: string;
      airline_iata?: string;
      airline_icao?: string;
      flight_number?: string;
      flight_iata?: string;
      flight_icao?: string;
    };
  };
  departure?: {
    iata?: string;
    airport?: string;
    scheduled?: string; // departure time
    terminal?: string;
    latitude?: number;
    longitude?: number;
  };
  arrival?: {
    iata?: string;
    airport?: string;
    scheduled?: string; // arrival time
    terminal?: string;
    latitude?: number;
    longitude?: number;
  };
  aircraft?: { model?: string };
  flight_time?: string;
  distance?: number;
}

/* -------------------------------------------------------------------------- */
/* ✅ Normalized structure your frontend uses                                  */
/* -------------------------------------------------------------------------- */
export interface NormalizedFlight {
  id: string;             // unique flight ID
  user_id: string;        // user who owns the flight
  date: string;           // flight date (YYYY-MM-DD)
  status: string;         // status of the flight ("Scheduled", "Landed", etc.)
  
  dep_iata: string;       // departure airport IATA
  dep_airport: string;    // departure airport name
  dep_time?: string;      // optional departure time
  dep_terminal?: string;  // optional departure terminal
  dep_latitude?: number | null;
  dep_longitude?: number | null;
  
  arr_iata: string;       // arrival airport IATA
  arr_airport: string;    // arrival airport name
  arr_time?: string;      // optional arrival time
  arr_terminal?: string;  // optional arrival terminal
  arr_latitude?: number | null;
  arr_longitude?: number | null;
  
  airline_name: string;   // airline name
  flight_number: string;  // flight number
  created_at?: Date | null; // record creation time
}

