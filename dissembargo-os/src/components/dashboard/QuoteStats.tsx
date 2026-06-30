import { FileText, Send, CheckCircle, PoundSterling } from "lucide-react";
import { StatCard } from "@/components/ui/StatCard";
import {
  countQuotesByStatus,
  getTotalQuoteValue,
} from "@/lib/database/quotes";
import { formatCurrency } from "@/lib/quotes/calculations";

export async function QuoteStats() {
  let draftCount = 0;
  let sentCount = 0;
  let approvedCount = 0;
  let totalValue = 0;
  let error = false;

  try {
    [draftCount, sentCount, approvedCount, totalValue] = await Promise.all([
      countQuotesByStatus("draft"),
      countQuotesByStatus("sent"),
      countQuotesByStatus("approved"),
      getTotalQuoteValue(),
    ]);
  } catch {
    error = true;
  }

  return (
    <>
      <StatCard
        title="Draft Quotes"
        value={error ? "—" : String(draftCount)}
        change={error ? "Unable to load" : "In progress"}
        changeType={error ? "negative" : "neutral"}
        icon={FileText}
      />
      <StatCard
        title="Sent Quotes"
        value={error ? "—" : String(sentCount)}
        change={error ? "Unable to load" : "Awaiting client response"}
        changeType={error ? "negative" : "neutral"}
        icon={Send}
      />
      <StatCard
        title="Approved Quotes"
        value={error ? "—" : String(approvedCount)}
        change={error ? "Unable to load" : "Ready to convert"}
        changeType={error ? "negative" : "positive"}
        icon={CheckCircle}
      />
      <StatCard
        title="Total Quote Value"
        value={error ? "—" : formatCurrency(totalValue)}
        change={error ? "Unable to load" : "Draft, sent & approved"}
        changeType={error ? "negative" : "neutral"}
        icon={PoundSterling}
      />
    </>
  );
}
