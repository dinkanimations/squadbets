import { AppShell } from "@/components/layout/AppShell";
import { getAppSettings } from "@/lib/database/app-settings";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await getAppSettings();

  return (
    <AppShell
      companyName={settings.companyName}
      companyTagline={settings.pdfTagline}
    >
      {children}
    </AppShell>
  );
}
