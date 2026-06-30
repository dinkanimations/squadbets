import { Settings } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { TeamManager } from "@/components/settings/TeamManager";
import { getTeamMembersAction } from "@/lib/settings/actions";
import { Card, CardHeader } from "@/components/ui/Card";
import { getPermissionsForRole } from "@/lib/settings/permissions";
import { USER_ROLE_LABELS, USER_ROLES } from "@/lib/settings/permissions";

export default async function TeamSettingsPage() {
  const members = await getTeamMembersAction();

  return (
    <>
      <PageHeader
        title="Team"
        description="Manage team members and role permissions."
        icon={Settings}
      />
      <div className="space-y-6">
        <TeamManager members={members} />
        <Card>
          <CardHeader
            title="Role Permissions"
            description="What each role can access in the application"
          />
          <div className="space-y-4">
            {USER_ROLES.map((role) => (
              <div key={role}>
                <p className="mb-1 text-sm font-medium text-foreground">
                  {USER_ROLE_LABELS[role]}
                </p>
                <p className="text-xs text-muted">
                  {getPermissionsForRole(role).join(" · ")}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}
