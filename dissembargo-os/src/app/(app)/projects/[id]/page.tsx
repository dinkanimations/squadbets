import { notFound } from "next/navigation";
import { getProjectFullById } from "@/lib/database/projects";
import { projectToFormDraft } from "@/lib/projects/utils";
import {
  getCompaniesForProjectAction,
  getContactsForProjectAction,
  getOpportunitiesForProjectAction,
  getQuotesForProjectAction,
} from "@/lib/projects/actions";
import { ProjectForm } from "@/components/projects/ProjectForm";
import { ProjectDetailClient } from "@/components/projects/ProjectDetailClient";

interface ProjectDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProjectDetailPage({
  params,
}: ProjectDetailPageProps) {
  const { id } = await params;

  let project;
  try {
    project = await getProjectFullById(id);
  } catch {
    notFound();
  }

  const companyId = project.company_id ?? project.client?.company?.id ?? "";

  const [companies, contacts, opportunities, quotes] = await Promise.all([
    getCompaniesForProjectAction(),
    companyId ? getContactsForProjectAction(companyId) : [],
    companyId ? getOpportunitiesForProjectAction(companyId) : [],
    companyId ? getQuotesForProjectAction(companyId) : [],
  ]);

  return (
    <div className="space-y-6">
      <ProjectForm
        mode="edit"
        projectId={id}
        initialDraft={projectToFormDraft(project)}
        companies={companies}
        initialContacts={contacts}
        initialOpportunities={opportunities}
        initialQuotes={quotes}
      />
      <ProjectDetailClient project={project} />
    </div>
  );
}
