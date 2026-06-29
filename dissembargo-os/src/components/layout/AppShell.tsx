import { Sidebar } from "./Sidebar";
import { TopNav } from "./TopNav";

interface AppShellProps {
  children: React.ReactNode;
  companyName?: string;
  companyTagline?: string;
}

export function AppShell({
  children,
  companyName,
  companyTagline,
}: AppShellProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar companyName={companyName} companyTagline={companyTagline} />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopNav />
        <main className="flex-1 overflow-y-auto">
          <div className="animate-fade-in p-6 lg:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
