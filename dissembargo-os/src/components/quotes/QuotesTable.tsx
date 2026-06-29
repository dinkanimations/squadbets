"use client";

import Link from "next/link";
import { Copy } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";
import type { QuoteWithRelations } from "@/lib/database/quotes";
import { formatCurrency, formatQuoteDate } from "@/lib/quotes/calculations";
import { duplicateQuoteAction } from "@/lib/quotes/actions";
import { QuoteStatusBadge } from "./QuoteStatusBadge";

interface QuotesTableProps {
  quotes: QuoteWithRelations[];
}

export function QuotesTable({ quotes }: QuotesTableProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleDuplicate = (quoteId: string) => {
    startTransition(async () => {
      const result = await duplicateQuoteAction(quoteId);
      if (result.id) {
        router.push(`/quotes/${result.id}`);
      }
    });
  };

  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableHeaderCell>Quote #</TableHeaderCell>
          <TableHeaderCell>Project</TableHeaderCell>
          <TableHeaderCell>Company</TableHeaderCell>
          <TableHeaderCell>Status</TableHeaderCell>
          <TableHeaderCell>Total</TableHeaderCell>
          <TableHeaderCell>Created</TableHeaderCell>
          <TableHeaderCell className="text-right">Actions</TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {quotes.map((quote) => (
          <TableRow key={quote.id}>
            <TableCell>
              <Link
                href={`/quotes/${quote.id}`}
                className="font-medium text-foreground hover:text-accent"
              >
                {quote.quote_number}
              </Link>
            </TableCell>
            <TableCell>
              {quote.project_title ?? "—"}
            </TableCell>
            <TableCell className="text-muted">
              {quote.company?.company_name ?? "—"}
            </TableCell>
            <TableCell>
              <QuoteStatusBadge status={quote.quote_status} />
            </TableCell>
            <TableCell className="font-medium">
              {formatCurrency(quote.total)}
            </TableCell>
            <TableCell className="text-muted">
              {formatQuoteDate(quote.created_at)}
            </TableCell>
            <TableCell>
              <div className="flex items-center justify-end gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={isPending}
                  onClick={() => handleDuplicate(quote.id)}
                  aria-label="Duplicate quote"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
