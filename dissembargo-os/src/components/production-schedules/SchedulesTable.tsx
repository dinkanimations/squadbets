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
import type { ScheduleWithRelations } from "@/lib/database/production-schedules";
import { formatScheduleDate } from "@/lib/production-schedules/calculations";
import { ScheduleStatusBadge } from "./ScheduleStatusBadge";

interface SchedulesTableProps {
  schedules: ScheduleWithRelations[];
}

export function SchedulesTable({ schedules }: SchedulesTableProps) {
  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableHeaderCell>Project</TableHeaderCell>
          <TableHeaderCell>Company</TableHeaderCell>
          <TableHeaderCell>Status</TableHeaderCell>
          <TableHeaderCell>Start</TableHeaderCell>
          <TableHeaderCell>Delivery</TableHeaderCell>
          <TableHeaderCell>Version</TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {schedules.map((schedule) => (
          <TableRow key={schedule.id}>
            <TableCell>
              <Link
                href={`/production-schedules/${schedule.id}`}
                className="font-medium text-foreground hover:text-accent"
              >
                {schedule.project_title}
              </Link>
            </TableCell>
            <TableCell className="text-muted">
              {schedule.company?.company_name ?? "—"}
            </TableCell>
            <TableCell>
              <ScheduleStatusBadge status={schedule.status} />
            </TableCell>
            <TableCell className="text-muted">
              {schedule.start_date
                ? formatScheduleDate(schedule.start_date)
                : "—"}
            </TableCell>
            <TableCell className="text-muted">
              {schedule.delivery_date
                ? formatScheduleDate(schedule.delivery_date)
                : "—"}
            </TableCell>
            <TableCell className="text-muted">v{schedule.current_version}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
