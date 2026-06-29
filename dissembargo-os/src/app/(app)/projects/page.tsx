import { Suspense } from "react";
import { ClipboardList } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { ProjectsTable } from "@/components/projects/ProjectsTable";
import { ProjectsToolbar } from "@/components/projects/ProjectsToolbar";
import { getProjectsFiltered } from "@/lib/database/projects";
import type { ProjectStatus } from "@/types/database";

interface ProjectsPageProps {
  searchParams: Promise<{ search?: string; status?: string }>;
}

export default async function ProjectsPage({ searchParams }: ProjectsPageProps) {
  const params = await searchParams;
  const { data: projects } = await getProjectsFiltered({
    search: params.search,
    status: params.status as ProjectStatus | undefined,
  });

  const hasFilters = Boolean(params.search || params.status);

  return (
    <>
      <PageHeader
        title="Projects"
        description="Central workspace for active and completed creative projects."
        icon={ClipboardList}
      />

      <Suspense fallback={null}>
        <ProjectsToolbar />
      </Suspense>

      {projects.length > 0 ? (
        <ProjectsTable projects={projects} />
      ) : (
        <EmptyState
          title={hasFilters ? "No matching projects" : "No projects yet"}
          description={
            hasFilters
              ? "Try adjusting your search or filter criteria."
              : "Projects are created automatically when quotes are approved, or you can create one manually."
          }
          action={
            !hasFilters ? (
              <Link href="/projects/new">
                <Button>New Project</Button>
              </Link>
            ) : undefined
          }
        />
      )}
    </>
  );
}
