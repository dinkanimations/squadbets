import { AppShell } from "@/components/layout/AppShell";
import { SchemaSetupBanner } from "@/components/setup/SchemaSetupBanner";
import { buildNavUser } from "@/lib/auth/profile";
import { getDevNavUser, isAuthDisabled } from "@/lib/auth/dev-bypass";
import { getProfile, getUser } from "@/lib/auth/session";
import { getCachedAppSettings } from "@/lib/database/app-settings";
import { getSchemaHealth } from "@/lib/database/schema-health";
import { STATIC_APP_SETTINGS } from "@/lib/settings/defaults";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (isAuthDisabled()) {
    const [settings, schema] = await Promise.all([
      getCachedAppSettings().catch(() => STATIC_APP_SETTINGS),
      getSchemaHealth(),
    ]);

    return (
      <AppShell
        companyName={settings.companyName}
        companyTagline={settings.pdfTagline}
        user={getDevNavUser()}
      >
        {!schema.ready ? <SchemaSetupBanner projectRef={schema.projectRef} /> : null}
        {children}
      </AppShell>
    );
  }

  const [settings, schema, { user, error: userError }, { profile }] =
    await Promise.all([
      getCachedAppSettings().catch(() => STATIC_APP_SETTINGS),
      getSchemaHealth(),
      getUser(),
      getProfile(),
    ]);

  if (userError || !user) {
    redirect("/login");
  }

  return (
    <AppShell
      companyName={settings.companyName}
      companyTagline={settings.pdfTagline}
      user={buildNavUser(user, profile)}
    >
      {!schema.ready ? <SchemaSetupBanner projectRef={schema.projectRef} /> : null}
      {children}
    </AppShell>
  );
}
