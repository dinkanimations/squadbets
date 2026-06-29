import {
  Calendar,
  ClipboardList,
  FileText,
  LayoutDashboard,
  Settings,
  Target,
  Users,
  Clapperboard,
} from "lucide-react";
import type { NavItem } from "@/types";

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Leads", href: "/leads", icon: Target },
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
