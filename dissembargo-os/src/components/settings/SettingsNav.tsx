"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  Clapperboard,
  FileText,
  Globe,
  Palette,
  Plug,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

const SETTINGS_LINKS = [
  { href: "/settings/general", label: "General", icon: Globe },
  { href: "/settings/team", label: "Team", icon: Users },
  { href: "/settings/quotes", label: "Quote Defaults", icon: FileText },
  { href: "/settings/schedules", label: "Schedule Defaults", icon: Clapperboard },
  { href: "/settings/integrations", label: "Integrations", icon: Plug },
  { href: "/settings/notifications", label: "Notifications", icon: Bell },
  { href: "/settings/branding", label: "Branding", icon: Palette },
];

export function SettingsNav() {
  const pathname = usePathname();

  return (
    <nav className="space-y-1">
      {SETTINGS_LINKS.map((link) => {
        const Icon = link.icon;
        const isActive = pathname === link.href;

        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-accent/10 text-accent"
                : "text-muted hover:bg-surface-elevated hover:text-foreground",
            )}
          >
            <Icon className="h-4 w-4" />
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
