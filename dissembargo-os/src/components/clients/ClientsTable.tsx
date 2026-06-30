"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import type { Client, Company } from "@/types/database";
import {
  CLIENT_STATUS_LABELS,
  formatClientDate,
} from "@/lib/clients/constants";

type ClientWithCompany = Client & {
  company: Company | null;
};

interface ClientsTableProps {
  clients: ClientWithCompany[];
}

const statusVariant: Record<
  string,
  "default" | "success" | "warning" | "danger"
> = {
  prospect: "default",
  onboarding: "warning",
  active: "success",
  inactive: "default",
  churned: "danger",
};

export function ClientsTable({ clients }: ClientsTableProps) {
  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableHeaderCell>Client</TableHeaderCell>
          <TableHeaderCell>Industry</TableHeaderCell>
          <TableHeaderCell>Status</TableHeaderCell>
          <TableHeaderCell>Onboarding</TableHeaderCell>
          <TableHeaderCell>Added</TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {clients.map((client) => {
          const company = client.company;

          return (
            <TableRow key={client.id}>
              <TableCell>
                {company ? (
                  <Link
                    href={`/companies/${company.id}`}
                    className="flex items-center gap-3 font-medium text-foreground hover:text-accent"
                  >
                    {company.logo_url ? (
                      <Image
                        src={company.logo_url}
                        alt=""
                        width={28}
                        height={28}
                        className="rounded-md bg-surface-elevated object-contain"
                        unoptimized
                      />
                    ) : (
                      <div className="flex h-7 w-7 items-center justify-center rounded-md bg-surface-elevated text-xs font-semibold text-muted">
                        {company.company_name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span>{company.company_name}</span>
                  </Link>
                ) : (
                  <span className="text-muted">Unknown company</span>
                )}
              </TableCell>
              <TableCell className="text-muted">
                {company?.industry ?? "—"}
              </TableCell>
              <TableCell>
                <Badge variant={statusVariant[client.client_status] ?? "default"}>
                  {CLIENT_STATUS_LABELS[client.client_status]}
                </Badge>
              </TableCell>
              <TableCell className="text-muted">
                {formatClientDate(client.onboarding_date)}
              </TableCell>
              <TableCell className="text-muted">
                {formatClientDate(client.created_at)}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
