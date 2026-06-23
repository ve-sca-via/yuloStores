// Waiter · Customer Requests (/waiter/requests) — acknowledge and resolve guest
// assistance requests (PRD §11.2 WAIT-05, §11.3).

import WaiterLayout from "./WaiterLayout";
import RequestsBoard from "@/screens/shared/RequestsBoard";

export default function WaiterRequests() {
  return (
    <WaiterLayout>
      <h1 className="text-3xl font-bold">Customer Requests</h1>
      <p className="mb-6 mt-1 text-sm text-muted-foreground">
        Respond to guest assistance requests from your tables.
      </p>
      <RequestsBoard />
    </WaiterLayout>
  );
}
