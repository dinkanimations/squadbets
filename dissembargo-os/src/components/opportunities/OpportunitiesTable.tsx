"use client";

import Link from "next/link";
import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@/components/ui/Table";
import { deleteOpportunityAction } from "@/lib/opportunities/actions";
import type { OpportunityWithRelations } from "@/lib/opportunities/constants";
import { formatCurrency, formatDate } from "@/lib/opportunities/utils";
import { OpportunityStatusBadge } from "./OpportunityStatusBadge";

interface OpportunitiesTableProps {
  opportunities: OpportunityWithRelations[];
  onEdit: (opportunity: OpportunityWithRelations) => void;
}

export function OpportunitiesTable({
  opportunities,
  onEdit,
}: OpportunitiesTableProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async (id: string, subject: string | null) => {
    const confirmed = window.confirm(
      `Delete opportunity "${subject ?? "Untitled"}"? This cannot be undone.`,
    );

    if (!confirmed) return;

    setDeletingId(id);
    setError(null);

    const result = await deleteOpportunityAction(id);

    if (result?.error) {
      setError(result.error);
      setDeletingId(null);
    }
  };

  return (
    <div>
      {error && (
        <p className="mb-4 rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}

      <Table>
        <TableHead>
          <TableRow>
            <TableHeaderCell>Company</TableHeaderCell>
            <TableHeaderCell>Contact</TableHeaderCell>
            <TableHeaderCell>Subject</TableHeaderCell>
            <TableHeaderCell>Status</TableHeaderCell>
            <TableHeaderCell>Estimated Budget</TableHeaderCell>
            <TableHeaderCell>Created Date</TableHeaderCell>
            <TableHeaderCell className="text-right">Actions</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {opportunities.map((opportunity) => (
            <TableRow key={opportunity.id}>
              <TableCell>
                <Link
                  href={`/companies/${opportunity.company_id}`}
                  className="font-medium text-foreground hover:text-accent"
                >
                  {opportunity.company?.company_name ?? "—"}
                </Link>
              </TableCell>
              <TableCell className="text-muted">
                {opportunity.contact?.full_name ?? "—"}
              </TableCell>
              <TableCell>
                <Link
                  href={`/opportunities/${opportunity.id}`}
                  className="line-clamp-1 hover:text-accent"
                >
                  {opportunity.subject ?? "Untitled opportunity"}
                </Link>
              </TableCell>
              <TableCell>
                <OpportunityStatusBadge status={opportunity.opportunity_status} />
              </TableCell>
              <TableCell>{formatCurrency(opportunity.estimated_budget)}</TableCell>
              <TableCell className="text-muted">
                {formatDate(opportunity.created_at)}
              </TableCell>
              <TableCell>
                <div className="flex items-center justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(opportunity)}
                    aria-label="Edit opportunity"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      handleDelete(opportunity.id, opportunity.subject)
                    }
                    disabled={deletingId === opportunity.id}
                    aria-label="Delete opportunity"
                  >
                    <Trash2 className="h-4 w-4 text-danger" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
