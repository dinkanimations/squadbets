import { AppShell } from "@/components/layout/AppShell";
import { buildNavUser } from "@/lib/auth/profile";
import { getDevNavUser, isAuthDisabled } from "@/lib/auth/dev-bypass";
import { getProfile, getUser } from "@/lib/auth/session";
import { getCachedAppSettings } from "@/lib/database/app-settings";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await getCachedAppSettings();

  if (isAuthDisabled()) {
    return (
      <AppShell
        companyName={settings.companyName}
        companyTagline={settings.pdfTagline}
        user={getDevNavUser()}
      >
        {children}
      </AppShell>
    );
  }

  const [{ user, error: userError }, { profile }] = await Promise.all([
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
      {children}
    </AppShell>
  );
}
