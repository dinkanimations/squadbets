import { ClipboardCheck, Mail, Sparkles, Target } from "lucide-react";
import { StatCard } from "@/components/ui/StatCard";
import { countOpportunities } from "@/lib/database/opportunities";
import {
  countInboxEmails,
  countOpportunitiesCreatedToday,
} from "@/lib/database/inbox";
import { DASHBOARD_PLACEHOLDER_STATS } from "@/lib/data/dummy";

export async function DashboardStats() {
  let newOpportunitiesCount = 0;
  let newEmailsCount = 0;
  let reviewQueueCount = 0;
  let opportunitiesTodayCount = 0;
  let opportunitiesError = false;
  let inboxError = false;
  let reviewError = false;
  let opportunitiesTodayError = false;

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  try {
    newOpportunitiesCount = await countOpportunities({ status: "new" });
  } catch {
    opportunitiesError = true;
  }

  try {
    newEmailsCount = await countInboxEmails({
      importedSince: sevenDaysAgo.toISOString(),
    });
  } catch {
    inboxError = true;
  }

  try {
    reviewQueueCount = await countInboxEmails({ reviewPending: true });
  } catch {
    reviewError = true;
  }

  try {
    opportunitiesTodayCount = await countOpportunitiesCreatedToday();
  } catch {
    opportunitiesTodayError = true;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      <StatCard
        title="New Opportunities"
        value={opportunitiesError ? "—" : String(newOpportunitiesCount)}
        change={
          opportunitiesError
            ? "Unable to load from database"
            : "Awaiting review in inbox"
        }
        changeType={opportunitiesError ? "negative" : "neutral"}
        icon={Sparkles}
      />
      <StatCard
        title="New Emails Imported"
        value={inboxError ? "—" : String(newEmailsCount)}
        change={
          inboxError
            ? "Unable to load from database"
            : "Imported in the last 7 days"
        }
        changeType={inboxError ? "negative" : "neutral"}
        icon={Mail}
      />
      <StatCard
        title="Emails Awaiting Review"
        value={reviewError ? "—" : String(reviewQueueCount)}
        change={
          reviewError
            ? "Unable to load from database"
            : "Low-confidence opportunities"
        }
        changeType={reviewError ? "negative" : "neutral"}
        icon={ClipboardCheck}
      />
      <StatCard
        title="Opportunities Created Today"
        value={opportunitiesTodayError ? "—" : String(opportunitiesTodayCount)}
        change={
          opportunitiesTodayError
            ? "Unable to load from database"
            : "Auto-created from AI qualification"
        }
        changeType={opportunitiesTodayError ? "negative" : "positive"}
        icon={Target}
      />
      {DASHBOARD_PLACEHOLDER_STATS.map((stat) => (
        <StatCard key={stat.title} {...stat} />
      ))}
    </div>
  );
}
