import { notFound } from "next/navigation";
import { CompanyDetailClient } from "@/components/companies/CompanyDetailClient";
import { getCompanyProfile } from "@/lib/database/companies";
import type { CompanyProfileData } from "@/lib/companies/constants";

interface CompanyDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function CompanyDetailPage({
  params,
}: CompanyDetailPageProps) {
  const { id } = await params;

  let profile: CompanyProfileData | null = null;

  try {
    profile = await getCompanyProfile(id);
  } catch {
    notFound();
  }

  if (!profile) {
    notFound();
  }

  return <CompanyDetailClient profile={profile} />;
}
