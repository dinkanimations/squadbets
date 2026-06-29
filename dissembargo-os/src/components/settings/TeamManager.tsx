"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Plus, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import {
  createTeamMemberAction,
  deleteTeamMemberAction,
  updateTeamMemberAction,
} from "@/lib/settings/actions";
import { USER_ROLE_LABELS, USER_ROLES } from "@/lib/settings/permissions";
import type { TeamMemberPayload } from "@/lib/settings/types";
import type { TeamMember, UserRole } from "@/types/database";

interface TeamManagerProps {
  members: TeamMember[];
}

const emptyMember = (): TeamMemberPayload => ({
  name: "",
  email: "",
  jobTitle: "",
  dayRate: 0,
  department: "",
  avatarUrl: null,
  status: "active",
  role: "viewer",
});

export function TeamManager({ members: initial }: TeamManagerProps) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<TeamMemberPayload>(emptyMember());
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const startEdit = (member: TeamMember) => {
    setEditingId(member.id);
    setForm({
      name: member.name,
      email: member.email,
      jobTitle: member.job_title ?? "",
      dayRate: Number(member.day_rate ?? 0),
      department: member.department ?? "",
      avatarUrl: member.avatar_url,
      status: member.status,
      role: member.role,
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyMember());
    setShowForm(false);
  };

  const handleSave = () => {
    setError(null);
    setSuccess(null);

    startTransition(async () => {
      const result = editingId
        ? await updateTeamMemberAction(editingId, JSON.stringify(form))
        : await createTeamMemberAction(JSON.stringify(form));

      if ("error" in result && result.error) {
        setError(result.error);
      } else {
        setSuccess(
          editingId ? "Team member updated." : "Team member added.",
        );
        resetForm();
        router.refresh();
      }
    });
  };

  const handleDelete = (id: string) => {
    if (!window.confirm("Remove this team member?")) return;

    startTransition(async () => {
      const result = await deleteTeamMemberAction(id);
      if (result.error) setError(result.error);
      else router.refresh();
    });
  };

  return (
    <Card>
      <CardHeader
        title="Team Members"
        description="Manage team members, roles, and day rates"
        action={
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
          >
            <Plus className="h-4 w-4" />
            Add Member
          </Button>
        }
      />

      {(error || success) && (
        <p
          className={`mb-4 rounded-lg px-3 py-2 text-sm ${
            error ? "bg-danger/10 text-danger" : "bg-success/10 text-success"
          }`}
        >
          {error ?? success}
        </p>
      )}

      {showForm && (
        <div className="mb-6 rounded-lg border border-border bg-surface-elevated/40 p-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <Input
              label="Email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            <Input
              label="Job Title"
              value={form.jobTitle}
              onChange={(e) => setForm({ ...form, jobTitle: e.target.value })}
            />
            <Input
              label="Department"
              value={form.department}
              onChange={(e) =>
                setForm({ ...form, department: e.target.value })
              }
            />
            <Input
              label="Day Rate (£)"
              type="number"
              min="0"
              value={form.dayRate || ""}
              onChange={(e) =>
                setForm({ ...form, dayRate: Number(e.target.value) || 0 })
              }
            />
            <Select
              label="Role"
              value={form.role}
              onChange={(e) =>
                setForm({ ...form, role: e.target.value as UserRole })
              }
              options={USER_ROLES.map((role) => ({
                value: role,
                label: USER_ROLE_LABELS[role],
              }))}
            />
            <Select
              label="Status"
              value={form.status}
              onChange={(e) =>
                setForm({
                  ...form,
                  status: e.target.value as TeamMemberPayload["status"],
                })
              }
              options={[
                { value: "active", label: "Active" },
                { value: "inactive", label: "Inactive" },
              ]}
            />
          </div>
          <div className="mt-4 flex gap-2">
            <Button type="button" disabled={isPending} onClick={handleSave}>
              <Save className="h-4 w-4" />
              {isPending ? "Saving..." : editingId ? "Update" : "Add"}
            </Button>
            <Button type="button" variant="ghost" onClick={resetForm}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {initial.length === 0 ? (
        <p className="text-sm text-muted">No team members yet.</p>
      ) : (
        <ul className="space-y-2">
          {initial.map((member) => (
            <li
              key={member.id}
              className="flex items-center justify-between rounded-lg border border-border bg-surface-elevated/40 px-3 py-3"
            >
              <div>
                <p className="font-medium text-foreground">{member.name}</p>
                <p className="text-sm text-muted">
                  {member.email}
                  {member.job_title ? ` · ${member.job_title}` : ""}
                </p>
                <div className="mt-1 flex flex-wrap gap-2">
                  <Badge>{USER_ROLE_LABELS[member.role]}</Badge>
                  <Badge
                    variant={member.status === "active" ? "success" : "default"}
                  >
                    {member.status}
                  </Badge>
                  {member.day_rate ? (
                    <Badge>£{member.day_rate}/day</Badge>
                  ) : null}
                </div>
              </div>
              <div className="flex gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => startEdit(member)}
                >
                  Edit
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(member.id)}
                  disabled={isPending}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
