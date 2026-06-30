import { SettingsNav } from "@/components/settings/SettingsNav";

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
      <aside className="lg:sticky lg:top-8 lg:self-start">
        <SettingsNav />
      </aside>
      <div className="min-w-0 max-w-3xl">{children}</div>
    </div>
  );
}
