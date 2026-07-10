import { Suspense } from "react";
import { TicketsBuy } from "./tickets-buy";

export const metadata = { title: "Buy tickets — Generous Motors" };

export default function TicketsPage() {
  return (
    <Suspense>
      <TicketsBuy />
    </Suspense>
  );
}
