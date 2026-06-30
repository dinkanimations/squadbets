"use client";

import Link from "next/link";
import {
  Calendar,
  Clapperboard,
  ExternalLink,
  FileText,
  PoundSterling,
  TrendingUp,
  User,
} from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import type { ProjectFull } from "@/lib/database/projects";
import {
  formatProjectCurrency,
  formatProjectDate,
} from "@/lib/projects/utils";
import { PROJECT_PRIORITY_LABELS } from "@/lib/projects/constants";
import { ProjectStatusBadge } from "./ProjectStatusBadge";
import { ProjectDeliverablesPanel } from "./ProjectDeliverablesPanel";
import { ProjectFilesPanel } from "./ProjectFilesPanel";
import { ProjectNotesPanel } from "./ProjectNotesPanel";
import { Badge } from "@/components/ui/Badge";

interface ProjectDetailClientProps {
  project: ProjectFull;
}

export function ProjectDetailClient({ project }: ProjectDetailClientProps) {
  const clientName =
    project.company?.company_name ??
    project.client?.company?.company_name ??
    "—";

  const upcomingDeadline = project.delivery_date
    ? formatProjectDate(project.delivery_date)
    : "Not set";

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Client"
          value={clientName}
          change={project.contact?.full_name ?? "No contact linked"}
          changeType="neutral"
          icon={User}
        />
        <StatCard
          title="Status"
          value={project.status.replace(/_/g, " ")}
          change={`Priority: ${PROJECT_PRIORITY_LABELS[project.priority]}`}
          changeType="neutral"
          icon={TrendingUp}
        />
        <StatCard
          title="Progress"
          value={`${project.progress}%`}
          change={`${project.deliverables.filter((d) => d.is_complete).length} of ${project.deliverables.length} deliverables`}
          changeType="neutral"
          icon={TrendingUp}
        />
        <StatCard
          title="Budget"
          value={
            project.budget
              ? formatProjectCurrency(Number(project.budget))
              : "—"
          }
          change={`Delivery: ${upcomingDeadline}`}
          changeType="neutral"
          icon={PoundSterling}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Overview" description="Project summary" />
          <dl className="grid gap-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Status</dt>
              <dd>
                <ProjectStatusBadge status={project.status} />
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Producer</dt>
              <dd className="text-foreground">{project.producer ?? "—"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Start Date</dt>
              <dd className="text-foreground">
                {project.start_date
                  ? formatProjectDate(project.start_date)
                  : "—"}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Delivery Date</dt>
              <dd className="flex items-center gap-1 text-foreground">
                <Calendar className="h-3.5 w-3.5 text-muted" />
                {project.delivery_date
                  ? formatProjectDate(project.delivery_date)
                  : "—"}
              </dd>
            </div>
            {project.team_members.length > 0 && (
              <div>
                <dt className="mb-2 text-muted">Team</dt>
                <dd className="flex flex-wrap gap-2">
                  {project.team_members.map((member) => (
                    <Badge key={member}>{member}</Badge>
                  ))}
                </dd>
              </div>
            )}
            {project.notes && (
              <div>
                <dt className="mb-1 text-muted">Project Notes</dt>
                <dd className="whitespace-pre-wrap text-foreground">
                  {project.notes}
                </dd>
              </div>
            )}
          </dl>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader
              title="Quote"
              description="Linked quotation"
              action={
                project.quote ? (
                  <Link
                    href={`/quotes/${project.quote.id}`}
                    className="inline-flex items-center gap-1 text-sm text-accent hover:underline"
                  >
                    Open
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Link>
                ) : undefined
              }
            />
            {project.quote ? (
              <div className="flex items-center gap-3">
                <FileText className="h-8 w-8 text-muted" />
                <div>
                  <p className="font-medium text-foreground">
                    {project.quote.quote_number}
                  </p>
                  <p className="text-sm text-muted">
                    {formatProjectCurrency(Number(project.quote.total))}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted">No quote linked to this project.</p>
            )}
          </Card>

          <Card>
            <CardHeader
              title="Production Schedule"
              description="Linked production timeline"
              action={
                project.schedule ? (
                  <Link
                    href={`/production-schedules/${project.schedule.id}`}
                    className="inline-flex items-center gap-1 text-sm text-accent hover:underline"
                  >
                    Open
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Link>
                ) : undefined
              }
            />
            {project.schedule ? (
              <div className="flex items-center gap-3">
                <Clapperboard className="h-8 w-8 text-muted" />
                <div>
                  <p className="font-medium text-foreground">
                    {project.schedule.project_title}
                  </p>
                  <p className="text-sm text-muted">
                    v{project.schedule.current_version}
                    {project.schedule.delivery_date &&
                      ` · Delivery ${formatProjectDate(project.schedule.delivery_date)}`}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted">
                No production schedule linked yet.
              </p>
            )}
          </Card>
        </div>
      </div>

      <ProjectDeliverablesPanel
        projectId={project.id}
        deliverables={project.deliverables}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <ProjectFilesPanel projectId={project.id} files={project.files} />
        <ProjectNotesPanel projectId={project.id} notes={project.projectNotes} />
      </div>
    </div>
  );
}
