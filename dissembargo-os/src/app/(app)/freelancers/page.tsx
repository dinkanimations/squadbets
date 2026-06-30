import { Suspense } from "react";
import { UserPlus } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { FreelancersTable } from "@/components/freelancers/FreelancersTable";
import { getFreelancers } from "@/lib/database/freelancers";

export default async function FreelancersPage() {
  return (
    <Suspense fallback={<div className="p-8 text-muted">Loading…</div>}>
      <FreelancersContent />
    </Suspense>
  );
}

async function FreelancersContent() {
  let freelancers: Awaited<ReturnType<typeof getFreelancers>>["data"] = [];
  let error: string | null = null;

  try {
    const result = await getFreelancers();
    freelancers = result.data;
  } catch (err) {
    error = err instanceof Error ? err.message : "Failed to load freelancers.";
  }

  return (
    <>
      <PageHeader
        title="Freelancers"
        description="Freelancers, contractors, and talent detected from Gmail — portfolios, CVs, and availability."
        icon={UserPlus}
      />

      {error ? (
        <div className="rounded-xl border border-danger/20 bg-danger/10 p-6 text-sm text-danger">
          {error}
        </div>
      ) : freelancers.length === 0 ? (
        <EmptyState
          title="No freelancers yet"
          description="When AI detects someone offering freelance services or sending a portfolio, they will appear here — never as a Potential Opportunity."
        />
      ) : (
        <FreelancersTable freelancers={freelancers} />
      )}
    </>
  );
}
