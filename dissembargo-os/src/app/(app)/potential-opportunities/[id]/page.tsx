import { notFound } from "next/navigation";
import { PotentialOpportunityDetail } from "@/components/inbox/PotentialOpportunityDetail";
import { getPotentialOpportunityById } from "@/lib/database/potential-opportunities";
import { getAllCompanies } from "@/lib/database/companies";

interface PotentialOpportunityDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function PotentialOpportunityDetailPage({
  params,
}: PotentialOpportunityDetailPageProps) {
  const { id } = await params;

  try {
    const [potential, companies] = await Promise.all([
      getPotentialOpportunityById(id),
      getAllCompanies(),
    ]);

    if (!potential) {
      notFound();
    }

    return (
      <PotentialOpportunityDetail
        potential={potential}
        companies={companies ?? []}
      />
    );
  } catch {
    notFound();
  }
}
