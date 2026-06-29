import { Sidebar } from "./Sidebar";
import { TopNav } from "./TopNav";
import type { NavUser } from "@/lib/auth/profile";

interface AppShellProps {
  children: React.ReactNode;
  companyName?: string;
  companyTagline?: string;
  user: NavUser;
}

export function AppShell({
  children,
  companyName,
  companyTagline,
  user,
}: AppShellProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar companyName={companyName} companyTagline={companyTagline} />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopNav user={user} />
        <main className="flex-1 overflow-y-auto" id="main-content">
          <div className="animate-fade-in p-4 sm:p-6 lg:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
