"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import Link from "next/link";
import { Archive, ArrowLeft, Save } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import {
  archiveProjectAction,
  createProjectAction,
  getContactsForProjectAction,
  getOpportunitiesForProjectAction,
  getQuotesForProjectAction,
  updateProjectAction,
} from "@/lib/projects/actions";
import {
  createEmptyProjectDraft,
  PROJECT_PRIORITIES,
  PROJECT_PRIORITY_LABELS,
  PROJECT_STATUSES,
  PROJECT_STATUS_LABELS,
  type ProjectFormDraft,
} from "@/lib/projects/constants";
import { ProjectStatusBadge } from "./ProjectStatusBadge";

type CompanyOption = { id: string; company_name: string };
type ContactOption = { id: string; full_name: string | null };
type OpportunityOption = { id: string; subject: string | null; company_id: string };
type QuoteOption = {
  id: string;
  quote_number: string;
  company_id: string | null;
  project_title: string | null;
};

interface ProjectFormProps {
  mode: "create" | "edit";
  projectId?: string;
  initialDraft?: ProjectFormDraft;
  companies: CompanyOption[];
  initialContacts?: ContactOption[];
  initialOpportunities?: OpportunityOption[];
  initialQuotes?: QuoteOption[];
}

export function ProjectForm({
  mode,
  projectId,
  initialDraft,
  companies,
  initialContacts = [],
  initialOpportunities = [],
  initialQuotes = [],
}: ProjectFormProps) {
  const router = useRouter();
  const [draft, setDraft] = useState<ProjectFormDraft>(
    initialDraft ?? createEmptyProjectDraft(),
  );
  const [contacts, setContacts] = useState(initialContacts);
  const [opportunities, setOpportunities] = useState(initialOpportunities);
  const [quotes, setQuotes] = useState(initialQuotes);
  const [teamMemberInput, setTeamMemberInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const updateDraft = (patch: Partial<ProjectFormDraft>) => {
    setDraft((prev) => ({ ...prev, ...patch }));
  };

  const handleCompanyChange = (companyId: string) => {
    updateDraft({
      companyId,
      contactId: "",
      opportunityId: "",
      quoteId: "",
    });

    if (!companyId) {
      setContacts([]);
      setOpportunities([]);
      setQuotes([]);
      return;
    }

    void getContactsForProjectAction(companyId).then(setContacts);
    void getOpportunitiesForProjectAction(companyId).then(setOpportunities);
    void getQuotesForProjectAction(companyId).then(setQuotes);
  };

  const addTeamMember = () => {
    const name = teamMemberInput.trim();
    if (!name || draft.teamMembers.includes(name)) return;
    updateDraft({ teamMembers: [...draft.teamMembers, name] });
    setTeamMemberInput("");
  };

  const removeTeamMember = (index: number) => {
    updateDraft({
      teamMembers: draft.teamMembers.filter((_, i) => i !== index),
    });
  };

  const handleSave = () => {
    setError(null);
    setSuccess(null);

    startTransition(async () => {
      const payload = JSON.stringify(draft);

      if (mode === "create") {
        const result = await createProjectAction(payload);
        if (result.error) {
          setError(result.error);
        } else if (result.id) {
          router.push(`/projects/${result.id}`);
        }
        return;
      }

      if (!projectId) return;

      const result = await updateProjectAction(projectId, payload);
      if (result.error) {
        setError(result.error);
      } else {
        setSuccess(result.success ?? "Project saved.");
        router.refresh();
      }
    });
  };

  const handleArchive = () => {
    if (!projectId || !window.confirm("Archive this project?")) return;

    startTransition(async () => {
      const result = await archiveProjectAction(projectId);
      if (result?.error) setError(result.error);
    });
  };

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href="/projects"
          className="inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Projects
        </Link>

        <div className="flex flex-wrap items-center gap-2">
          {mode === "edit" && (
            <Button
              type="button"
              variant="danger"
              disabled={isPending}
              onClick={handleArchive}
            >
              <Archive className="h-4 w-4" />
              Archive
            </Button>
          )}
          <Button type="button" disabled={isPending} onClick={handleSave}>
            <Save className="h-4 w-4" />
            {isPending ? "Saving..." : "Save Project"}
          </Button>
        </div>
      </div>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {mode === "create" ? "New Project" : draft.projectName}
          </h1>
          <p className="mt-1 text-sm text-muted">
            {mode === "create"
              ? "Create a project workspace manually"
              : "Project settings and details"}
          </p>
        </div>
        {mode === "edit" && <ProjectStatusBadge status={draft.status} />}
      </div>

      {(error || success) && (
        <p
          className={`mb-4 rounded-lg px-3 py-2 text-sm ${
            error ? "bg-danger/10 text-danger" : "bg-success/10 text-success"
          }`}
        >
          {error ?? success}
        </p>
      )}

      <Card>
        <CardHeader
          title="Project Details"
          description="Link to company, contacts, opportunity, and quote"
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Project Name"
            value={draft.projectName}
            onChange={(e) => updateDraft({ projectName: e.target.value })}
            placeholder="e.g. Brand Film Production"
          />
          <Select
            label="Status"
            value={draft.status}
            onChange={(e) =>
              updateDraft({
                status: e.target.value as ProjectFormDraft["status"],
              })
            }
            options={PROJECT_STATUSES.map((s) => ({
              value: s,
              label: PROJECT_STATUS_LABELS[s],
            }))}
          />
          <Select
            label="Company"
            value={draft.companyId}
            onChange={(e) => handleCompanyChange(e.target.value)}
            options={[
              { value: "", label: "Select company" },
              ...companies.map((c) => ({
                value: c.id,
                label: c.company_name,
              })),
            ]}
          />
          <Select
            label="Contact"
            value={draft.contactId}
            onChange={(e) => updateDraft({ contactId: e.target.value })}
            options={[
              { value: "", label: "No contact" },
              ...contacts.map((c) => ({
                value: c.id,
                label: c.full_name ?? "Unnamed",
              })),
            ]}
            disabled={!draft.companyId}
          />
          <Select
            label="Opportunity"
            value={draft.opportunityId}
            onChange={(e) => updateDraft({ opportunityId: e.target.value })}
            options={[
              { value: "", label: "No opportunity" },
              ...opportunities.map((o) => ({
                value: o.id,
                label: o.subject ?? "Untitled",
              })),
            ]}
            disabled={!draft.companyId}
          />
          <Select
            label="Quote"
            value={draft.quoteId}
            onChange={(e) => updateDraft({ quoteId: e.target.value })}
            options={[
              { value: "", label: "No quote" },
              ...quotes.map((q) => ({
                value: q.id,
                label: `${q.quote_number} — ${q.project_title ?? "Untitled"}`,
              })),
            ]}
            disabled={!draft.companyId}
          />
          <Select
            label="Priority"
            value={draft.priority}
            onChange={(e) =>
              updateDraft({
                priority: e.target.value as ProjectFormDraft["priority"],
              })
            }
            options={PROJECT_PRIORITIES.map((p) => ({
              value: p,
              label: PROJECT_PRIORITY_LABELS[p],
            }))}
          />
          <Input
            label="Producer"
            value={draft.producer}
            onChange={(e) => updateDraft({ producer: e.target.value })}
            placeholder="Lead producer"
          />
          <Input
            label="Start Date"
            type="date"
            value={draft.startDate}
            onChange={(e) => updateDraft({ startDate: e.target.value })}
          />
          <Input
            label="Delivery Date"
            type="date"
            value={draft.deliveryDate}
            onChange={(e) => updateDraft({ deliveryDate: e.target.value })}
          />
          <Input
            label="Budget (£)"
            type="number"
            min="0"
            step="100"
            value={draft.budget || ""}
            onChange={(e) =>
              updateDraft({ budget: Number(e.target.value) || 0 })
            }
          />
        </div>

        <div className="mt-4">
          <span className="mb-2 block text-sm font-medium text-foreground">
            Team Members
          </span>
          <div className="flex gap-2">
            <Input
              value={teamMemberInput}
              onChange={(e) => setTeamMemberInput(e.target.value)}
              placeholder="Add team member"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addTeamMember();
                }
              }}
            />
            <Button type="button" variant="secondary" onClick={addTeamMember}>
              Add
            </Button>
          </div>
          {draft.teamMembers.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {draft.teamMembers.map((member, index) => (
                <button
                  key={`${member}-${index}`}
                  type="button"
                  onClick={() => removeTeamMember(index)}
                  className="rounded-full border border-border bg-surface-elevated px-3 py-1 text-xs text-foreground hover:border-danger hover:text-danger"
                  title="Click to remove"
                >
                  {member} ×
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="mt-4">
          <Textarea
            label="Notes"
            rows={3}
            value={draft.notes}
            onChange={(e) => updateDraft({ notes: e.target.value })}
          />
        </div>
      </Card>
    </>
  );
}
