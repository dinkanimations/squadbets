"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  Archive,
  ArrowLeft,
  Building2,
  ExternalLink,
  Pencil,
  RefreshCw,
  UserCheck,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@/components/ui/Table";
import {
  archiveCompanyAction,
  markAsExistingClientAction,
  refreshCompanyResearchAction,
  selectCompanyWebsiteAction,
} from "@/lib/companies/actions";
import type { CompanyProfileData } from "@/lib/companies/constants";
import {
  formatCompanyDate,
  parseWebsiteCandidates,
} from "@/lib/companies/constants";
import { OpportunityStatusBadge } from "@/components/opportunities/OpportunityStatusBadge";
import type { OpportunityStatus } from "@/types/database";
import { CompanyEditModal } from "./CompanyEditModal";
import { CompanyNoteForm } from "./CompanyNoteForm";

interface CompanyDetailClientProps {
  profile: CompanyProfileData;
}

function TagList({ items, emptyLabel }: { items: string[]; emptyLabel: string }) {
  if (!items.length) {
    return <p className="text-sm text-muted">{emptyLabel}</p>;
  }

  return (
    <ul className="flex flex-wrap gap-2">
      {items.map((item) => (
        <li key={item}>
          <Badge>{item}</Badge>
        </li>
      ))}
    </ul>
  );
}

export function CompanyDetailClient({ profile }: CompanyDetailClientProps) {
  const router = useRouter();
  const { company, contacts, opportunities, projects, quotes, schedules, emailHistory } =
    profile;
  const [editOpen, setEditOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const websiteCandidates = parseWebsiteCandidates(company.website_candidates);

  const runAction = (action: () => Promise<{ error?: string; success?: string }>) => {
    setActionError(null);
    setActionSuccess(null);

    startTransition(async () => {
      const result = await action();
      if (result.error) {
        setActionError(result.error);
      } else if (result.success) {
        setActionSuccess(result.success);
        router.refresh();
      }
    });
  };

  const handleSelectWebsite = (website: string) => {
    runAction(() => selectCompanyWebsiteAction(company.id, website));
  };

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href="/companies"
          className="inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Companies
        </Link>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            disabled={isPending}
            onClick={() =>
              runAction(() => refreshCompanyResearchAction(company.id))
            }
          >
            <RefreshCw className="h-4 w-4" />
            Refresh AI Research
          </Button>
          <Button variant="secondary" onClick={() => setEditOpen(true)}>
            <Pencil className="h-4 w-4" />
            Edit
          </Button>
          <Button
            variant="secondary"
            disabled={isPending}
            onClick={() =>
              runAction(() =>
                markAsExistingClientAction(company.id, !company.is_existing_client),
              )
            }
          >
            <UserCheck className="h-4 w-4" />
            {company.is_existing_client ? "Unmark Client" : "Mark as Client"}
          </Button>
          <Button
            variant="danger"
            disabled={isPending}
            onClick={() => {
              if (
                window.confirm(
                  `Archive "${company.company_name}"? It will be hidden from the active list.`,
                )
              ) {
                void archiveCompanyAction(company.id);
              }
            }}
          >
            <Archive className="h-4 w-4" />
            Archive
          </Button>
        </div>
      </div>

      {(actionError || actionSuccess) && (
        <p
          className={`mb-4 rounded-lg px-3 py-2 text-sm ${
            actionError
              ? "bg-danger/10 text-danger"
              : "bg-success/10 text-success"
          }`}
        >
          {actionError ?? actionSuccess}
        </p>
      )}

      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-surface-elevated">
          {company.logo_url ? (
            <Image
              src={company.logo_url}
              alt=""
              width={64}
              height={64}
              className="object-contain"
              unoptimized
            />
          ) : (
            <Building2 className="h-8 w-8 text-muted" />
          )}
        </div>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              {company.company_name}
            </h1>
            {company.is_existing_client && (
              <Badge variant="success">Existing Client</Badge>
            )}
            {company.website_pending_selection && (
              <Badge variant="warning">Website selection required</Badge>
            )}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-muted">
            {company.industry && <span>{company.industry}</span>}
            {company.headquarters && <span>{company.headquarters}</span>}
            {company.estimated_size && <span>{company.estimated_size} employees</span>}
            {company.last_contact_at && (
              <span>Last contact {formatCompanyDate(company.last_contact_at)}</span>
            )}
            {company.website && (
              <a
                href={company.website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-accent hover:underline"
              >
                {company.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        </div>
      </div>

      {company.website_pending_selection && websiteCandidates.length > 0 && (
        <Card className="mb-6 border-warning/30">
          <CardHeader
            title="Select Company Website"
            description="Multiple websites were detected. Choose the correct one to continue AI research."
          />
          <div className="flex flex-wrap gap-2">
            {websiteCandidates.map((website) => (
              <Button
                key={website}
                variant="secondary"
                disabled={isPending}
                onClick={() => handleSelectWebsite(website)}
              >
                {website.replace(/^https?:\/\//, "")}
              </Button>
            ))}
          </div>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {company.executive_summary && (
            <Card>
              <CardHeader
                title="Executive Summary"
                description="Read in under 30 seconds before your call"
              />
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                {company.executive_summary}
              </p>
            </Card>
          )}

          {company.ai_summary && (
            <Card>
              <CardHeader title="Company Summary" />
              <p className="whitespace-pre-wrap text-sm text-foreground">
                {company.ai_summary}
              </p>
            </Card>
          )}

          <Card>
            <CardHeader title="Products" />
            <TagList items={company.products ?? []} emptyLabel="No products identified yet." />
          </Card>

          <Card>
            <CardHeader title="Services" />
            <TagList items={company.services ?? []} emptyLabel="No services identified yet." />
          </Card>

          <Card>
            <CardHeader title="Key Markets" />
            <TagList items={company.key_markets ?? []} emptyLabel="No key markets identified yet." />
          </Card>

          <Card>
            <CardHeader title="Target Customers" />
            <TagList
              items={company.target_customers ?? []}
              emptyLabel="No target customers identified yet."
            />
          </Card>

          <Card>
            <CardHeader
              title="Potential Creative Opportunities"
              description="AI-suggested project angles for Dissembargo"
            />
            <TagList
              items={company.creative_opportunities ?? []}
              emptyLabel="No creative opportunities identified yet."
            />
          </Card>

          <Card>
            <CardHeader
              title="Suggested Services We Could Offer"
              description="Tailored pitch ideas for this company"
            />
            <TagList
              items={company.suggested_services ?? []}
              emptyLabel="No suggested services yet."
            />
          </Card>

          <Card>
            <CardHeader title="Opportunities" />
            {opportunities.length > 0 ? (
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeaderCell>Subject</TableHeaderCell>
                    <TableHeaderCell>Contact</TableHeaderCell>
                    <TableHeaderCell>Status</TableHeaderCell>
                    <TableHeaderCell>Created</TableHeaderCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {opportunities.map((opportunity) => (
                    <TableRow key={opportunity.id}>
                      <TableCell>
                        <Link
                          href={`/opportunities/${opportunity.id}`}
                          className="font-medium hover:text-accent"
                        >
                          {opportunity.subject ?? "Untitled"}
                        </Link>
                      </TableCell>
                      <TableCell className="text-muted">
                        {opportunity.contact?.full_name ?? "—"}
                      </TableCell>
                      <TableCell>
                        <OpportunityStatusBadge
                          status={opportunity.opportunity_status as OpportunityStatus}
                        />
                      </TableCell>
                      <TableCell className="text-muted">
                        {formatCompanyDate(opportunity.created_at)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-sm text-muted">No linked opportunities yet.</p>
            )}
          </Card>

          <Card>
            <CardHeader title="Projects" />
            {projects.length > 0 ? (
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeaderCell>Project</TableHeaderCell>
                    <TableHeaderCell>Status</TableHeaderCell>
                    <TableHeaderCell>Delivery</TableHeaderCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {projects.map((project) => (
                    <TableRow key={project.id}>
                      <TableCell className="font-medium">
                        <Link
                          href={`/projects/${project.id}`}
                          className="hover:text-accent"
                        >
                          {project.project_name}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Badge>{project.status}</Badge>
                      </TableCell>
                      <TableCell className="text-muted">
                        {project.delivery_date
                          ? formatCompanyDate(project.delivery_date)
                          : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-sm text-muted">No projects yet.</p>
            )}
          </Card>

          <Card>
            <CardHeader title="Quotes" />
            {quotes.length > 0 ? (
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeaderCell>Quote</TableHeaderCell>
                    <TableHeaderCell>Project</TableHeaderCell>
                    <TableHeaderCell>Status</TableHeaderCell>
                    <TableHeaderCell>Total</TableHeaderCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {quotes.map((quote) => (
                    <TableRow key={quote.id}>
                      <TableCell>
                        <Link
                          href={`/quotes/${quote.id}`}
                          className="font-medium hover:text-accent"
                        >
                          {quote.quote_number}
                        </Link>
                      </TableCell>
                      <TableCell className="text-muted">
                        {quote.project_title ?? "—"}
                      </TableCell>
                      <TableCell>
                        <Badge>{quote.quote_status}</Badge>
                      </TableCell>
                      <TableCell>
                        £{quote.total.toLocaleString("en-GB")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-sm text-muted">No quotes yet.</p>
            )}
          </Card>

          <Card>
            <CardHeader title="Production Schedules" />
            {schedules.length > 0 ? (
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeaderCell>Schedule</TableHeaderCell>
                    <TableHeaderCell>Status</TableHeaderCell>
                    <TableHeaderCell>Delivery</TableHeaderCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {schedules.map((schedule) => (
                    <TableRow key={schedule.id}>
                      <TableCell>
                        <Link
                          href={`/production-schedules/${schedule.id}`}
                          className="font-medium hover:text-accent"
                        >
                          {schedule.project_title}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Badge>{schedule.status}</Badge>
                      </TableCell>
                      <TableCell className="text-muted">
                        {schedule.delivery_date
                          ? formatCompanyDate(schedule.delivery_date)
                          : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-sm text-muted">No production schedules yet.</p>
            )}
          </Card>

          <Card>
            <CardHeader title="Email History" />
            {emailHistory.length > 0 ? (
              <ul className="space-y-4">
                {emailHistory.map((item) => (
                  <li key={item.id} className="rounded-lg border border-border p-3 text-sm">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge>{item.status}</Badge>
                      <Badge variant="default">
                        {item.item_type === "client_communication"
                          ? "Client reply"
                          : "New enquiry"}
                      </Badge>
                      <span className="text-xs text-muted">
                        {item.inbox?.date_received
                          ? formatCompanyDate(item.inbox.date_received)
                          : formatCompanyDate(item.created_at)}
                      </span>
                    </div>
                    <p className="mt-2 font-medium text-foreground">
                      {item.inbox?.subject ?? "Email enquiry"}
                    </p>
                    <p className="mt-1 text-muted">{item.ai_summary}</p>
                    {item.status === "pending" && (
                      <Link
                        href={`/inbox/${item.id}`}
                        className="mt-2 inline-block text-xs text-accent hover:underline"
                      >
                        Review in Inbox
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted">No email history linked yet.</p>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Contacts" />
            {contacts.length > 0 ? (
              <ul className="space-y-4">
                {contacts.map((contact) => (
                  <li key={contact.id} className="text-sm">
                    <p className="font-medium text-foreground">{contact.full_name}</p>
                    {contact.role && (
                      <p className="text-muted">{contact.role}</p>
                    )}
                    {contact.email && (
                      <a
                        href={`mailto:${contact.email}`}
                        className="text-accent hover:underline"
                      >
                        {contact.email}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted">No contacts yet.</p>
            )}
          </Card>

          <Card>
            <CardHeader title="Internal Notes" />
            <p className="mb-4 whitespace-pre-wrap text-sm text-muted">
              {company.internal_notes || "No internal notes yet."}
            </p>
            <CompanyNoteForm companyId={company.id} />
          </Card>

          {company.ai_research_cached_at && (
            <Card>
              <CardHeader title="AI Research" />
              <p className="text-sm text-muted">
                Last refreshed{" "}
                {formatCompanyDate(company.ai_research_cached_at)}
              </p>
            </Card>
          )}
        </div>
      </div>

      <CompanyEditModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        company={company}
      />
    </>
  );
}
