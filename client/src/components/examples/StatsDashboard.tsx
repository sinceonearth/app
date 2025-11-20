import { StatsDashboard as StatsDashboardComponent } from "../StatsDashboard";

const mockStats = {
  totalFlights: 42,
  uniqueAirlines: 8,
  uniqueAirports: 15,
  totalDistance: "52,340 km",
};

export default function StatsDashboardExample() {
  return (
    <div className="mx-auto max-w-7xl p-8">
      <StatsDashboardComponent stats={mockStats} />
    </div>
  );
}
