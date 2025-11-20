import { FlightCard as FlightCardComponent } from "../FlightCard";

export default function FlightCardExample() {
  return (
    <div className="p-8">
      <FlightCardComponent
        flightNumber="184"
        airline="IGO"
        from="DEL"
        to="AMD"
        date="2022-10-10"
        departureTime="09:50"
        arrivalTime="11:20"
        aircraftType="Airbus A321neo"
        status="completed"
      />
    </div>
  );
}
