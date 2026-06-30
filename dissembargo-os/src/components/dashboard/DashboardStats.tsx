import { Building2, ClipboardCheck, Mail, Sparkles, Target } from "lucide-react";
import { StatCard } from "@/components/ui/StatCard";
import { countOpportunities } from "@/lib/database/opportunities";
import {
  countInboxEmails,
  countNeedsReviewEmails,
  countOpportunitiesCreatedToday,
} from "@/lib/database/inbox";
import { countPendingPotentialOpportunities } from "@/lib/database/potential-opportunities";
import { countCompaniesThisMonth } from "@/lib/database/companies";
import { QuoteStats } from "@/components/dashboard/QuoteStats";
import { ProductionScheduleStats } from "@/components/dashboard/ProductionScheduleStats";
import { ProjectStats } from "@/components/dashboard/ProjectStats";

export async function DashboardStats() {
  let newOpportunitiesCount = 0;
  let newEmailsCount = 0;
  let needsReviewCount = 0;
  let potentialOpportunitiesCount = 0;
  let opportunitiesTodayCount = 0;
  let newCompaniesCount = 0;
  let opportunitiesError = false;
  let inboxError = false;
  let reviewError = false;
  let opportunitiesTodayError = false;
  let companiesError = false;

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
    needsReviewCount = await countNeedsReviewEmails();
  } catch {
    reviewError = true;
  }

  try {
    potentialOpportunitiesCount = await countPendingPotentialOpportunities();
  } catch {
    // reuse reviewError only for needs review; potential opps failure is silent
  }

  try {
    opportunitiesTodayCount = await countOpportunitiesCreatedToday();
  } catch {
    opportunitiesTodayError = true;
  }

  try {
    newCompaniesCount = await countCompaniesThisMonth();
  } catch {
    companiesError = true;
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
        title="Needs Review"
        value={reviewError ? "—" : String(needsReviewCount)}
        change={
          reviewError
            ? "Unable to load from database"
            : "Low-confidence AI classifications"
        }
        changeType={reviewError ? "negative" : needsReviewCount > 0 ? "negative" : "neutral"}
        icon={ClipboardCheck}
      />
      <StatCard
        title="Potential Opportunities"
        value={String(potentialOpportunitiesCount)}
        change="Staged leads awaiting conversion"
        changeType="neutral"
        icon={Target}
      />
      <StatCard
        title="Opportunities Accepted Today"
        value={opportunitiesTodayError ? "—" : String(opportunitiesTodayCount)}
        change={
          opportunitiesTodayError
            ? "Unable to load from database"
            : "Accepted from Inbox today"
        }
        changeType={opportunitiesTodayError ? "negative" : "positive"}
        icon={Sparkles}
      />
      <StatCard
        title="New Companies This Month"
        value={companiesError ? "—" : String(newCompaniesCount)}
        change={
          companiesError
            ? "Unable to load from database"
            : "Auto-enriched from opportunities"
        }
        changeType={companiesError ? "negative" : "neutral"}
        icon={Building2}
      />
      <QuoteStats />
      <ProductionScheduleStats />
      <ProjectStats />
    </div>
  );
}
