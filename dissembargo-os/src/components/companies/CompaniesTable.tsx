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
import type { Company } from "@/types/database";
import { formatCompanyDate } from "@/lib/companies/constants";

interface CompaniesTableProps {
  companies: Company[];
}

export function CompaniesTable({ companies }: CompaniesTableProps) {
  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableHeaderCell>Company</TableHeaderCell>
          <TableHeaderCell>Industry</TableHeaderCell>
          <TableHeaderCell>Website</TableHeaderCell>
          <TableHeaderCell>Size</TableHeaderCell>
          <TableHeaderCell>Status</TableHeaderCell>
          <TableHeaderCell>Added</TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {companies.map((company) => (
          <TableRow key={company.id}>
            <TableCell>
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
            </TableCell>
            <TableCell className="text-muted">
              {company.industry ?? "—"}
            </TableCell>
            <TableCell>
              {company.website ? (
                <a
                  href={company.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  {company.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                </a>
              ) : company.website_pending_selection ? (
                <Badge variant="warning">Select website</Badge>
              ) : (
                "—"
              )}
            </TableCell>
            <TableCell className="text-muted">
              {company.estimated_size ?? "—"}
            </TableCell>
            <TableCell>
              {company.is_existing_client ? (
                <Badge variant="success">Client</Badge>
              ) : (
                <Badge>Prospect</Badge>
              )}
            </TableCell>
            <TableCell className="text-muted">
              {formatCompanyDate(company.created_at)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
