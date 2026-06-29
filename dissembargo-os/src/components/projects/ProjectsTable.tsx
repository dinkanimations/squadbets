"use client";

import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@/components/ui/Table";
import type { ProjectWithRelations } from "@/lib/database/projects";
import {
  formatProjectCurrency,
  formatProjectDate,
} from "@/lib/projects/utils";
import { PROJECT_PRIORITY_LABELS } from "@/lib/projects/constants";
import { ProjectStatusBadge } from "./ProjectStatusBadge";
import { Badge } from "@/components/ui/Badge";

interface ProjectsTableProps {
  projects: ProjectWithRelations[];
}

export function ProjectsTable({ projects }: ProjectsTableProps) {
  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableHeaderCell>Project</TableHeaderCell>
          <TableHeaderCell>Client</TableHeaderCell>
          <TableHeaderCell>Status</TableHeaderCell>
          <TableHeaderCell>Priority</TableHeaderCell>
          <TableHeaderCell>Progress</TableHeaderCell>
          <TableHeaderCell>Budget</TableHeaderCell>
          <TableHeaderCell>Delivery</TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {projects.map((project) => (
          <TableRow key={project.id}>
            <TableCell>
              <Link
                href={`/projects/${project.id}`}
                className="font-medium text-foreground hover:text-accent"
              >
                {project.project_name}
              </Link>
            </TableCell>
            <TableCell className="text-muted">
              {project.company?.company_name ??
                project.client?.company?.company_name ??
                "—"}
            </TableCell>
            <TableCell>
              <ProjectStatusBadge status={project.status} />
            </TableCell>
            <TableCell>
              <Badge>{PROJECT_PRIORITY_LABELS[project.priority]}</Badge>
            </TableCell>
            <TableCell className="text-muted">{project.progress}%</TableCell>
            <TableCell className="font-medium">
              {project.budget ? formatProjectCurrency(Number(project.budget)) : "—"}
            </TableCell>
            <TableCell className="text-muted">
              {project.delivery_date
                ? formatProjectDate(project.delivery_date)
                : "—"}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
