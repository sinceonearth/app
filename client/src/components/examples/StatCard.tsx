import { StatCard as StatCardComponent } from "../StatCard";
import { Plane } from "lucide-react";

export default function StatCardExample() {
  return (
    <div className="p-8">
      <StatCardComponent
        title="Total Flights"
        value={42}
        icon={Plane}
        subtitle="All time"
      />
    </div>
  );
}
