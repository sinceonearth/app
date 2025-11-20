import { FlightTimeline as FlightTimelineComponent } from "../FlightTimeline";

const mockFlights = [
  {
    id: "1",
    flightNumber: "184",
    airline: "IGO",
    from: "DEL",
    to: "AMD",
    date: "2022-10-10",
    departureTime: "09:50",
    arrivalTime: "11:20",
    aircraftType: "Airbus A321neo",
    status: "completed" as const,
  },
  {
    id: "2",
    flightNumber: "122",
    airline: "FIN",
    from: "DEL",
    to: "HEL",
    date: "2022-09-25",
    departureTime: "07:40",
    arrivalTime: "14:35",
    aircraftType: "Airbus A330-300",
    status: "completed" as const,
  },
  {
    id: "3",
    flightNumber: "823",
    airline: "IGO",
    from: "AMD",
    to: "BLR",
    date: "2021-11-07",
    departureTime: "06:00",
    arrivalTime: "08:25",
    aircraftType: "Airbus A321neo",
    status: "completed" as const,
  },
];

export default function FlightTimelineExample() {
  return (
    <div className="mx-auto max-w-4xl p-8">
      <FlightTimelineComponent flights={mockFlights} />
    </div>
  );
}
