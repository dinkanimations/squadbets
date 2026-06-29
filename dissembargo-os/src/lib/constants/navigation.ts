import {
  Building2,
  Calendar,
  ClipboardCheck,
  ClipboardList,
  FileText,
  LayoutDashboard,
  Mail,
  Settings,
  Sparkles,
  Users,
  Clapperboard,
} from "lucide-react";
import type { NavItem } from "@/types";

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Inbox", href: "/inbox", icon: Mail },
  { label: "Review Queue", href: "/review-queue", icon: ClipboardCheck },
  { label: "Opportunities", href: "/opportunities", icon: Sparkles },
  { label: "Companies", href: "/companies", icon: Building2 },
  { label: "Clients", href: "/clients", icon: Users },
  { label: "Quotes", href: "/quotes", icon: FileText },
  {
    label: "Production Schedules",
    href: "/production-schedules",
    icon: Clapperboard,
  },
  { label: "Projects", href: "/projects", icon: ClipboardList },
  { label: "Calendar", href: "/calendar", icon: Calendar },
  { label: "Settings", href: "/settings", icon: Settings },
];

export const APP_NAME = "Dissembargo OS";
