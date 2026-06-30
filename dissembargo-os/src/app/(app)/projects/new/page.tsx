import { ProjectForm } from "@/components/projects/ProjectForm";
import { getCompaniesForProjectAction } from "@/lib/projects/actions";

export default async function NewProjectPage() {
  const companies = await getCompaniesForProjectAction();

  return <ProjectForm mode="create" companies={companies} />;
}
