import type { ProjectFormDraft } from "./constants";
import type { Project } from "@/types/database";

export function projectToFormDraft(project: Project): ProjectFormDraft {
  return {
    projectName: project.project_name,
    companyId: project.company_id ?? "",
    contactId: project.contact_id ?? "",
    opportunityId: project.opportunity_id ?? "",
    quoteId: project.quote_id ?? "",
    status: project.status,
    startDate: project.start_date ?? "",
    deliveryDate: project.delivery_date ?? "",
    producer: project.producer ?? "",
    teamMembers: project.team_members ?? [],
    priority: project.priority,
    budget: Number(project.budget ?? 0),
    notes: project.notes ?? "",
  };
}

export function formatProjectDate(date: string): string {
  return new Date(date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatProjectCurrency(amount: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function calculateProgressFromDeliverables(
  deliverables: Array<{ is_complete: boolean }>,
): number {
  if (deliverables.length === 0) return 0;
  const completed = deliverables.filter((d) => d.is_complete).length;
  return Math.round((completed / deliverables.length) * 100);
}
