import {
  Building2,
  Calendar,
  ClipboardList,
  FileText,
  LayoutDashboard,
  Mail,
  Settings,
  Sparkles,
  Users,
  Clapperboard,
  UserPlus,
} from "lucide-react";
import type { NavItem } from "@/types";

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  {
    label: "Potential Opportunities",
    href: "/potential-opportunities",
    icon: Sparkles,
  },
  { label: "Companies", href: "/companies", icon: Building2 },
  { label: "Clients", href: "/clients", icon: Users },
  { label: "Freelancers", href: "/freelancers", icon: UserPlus },
  { label: "Quotes", href: "/quotes", icon: FileText },
  {
    label: "Production Schedules",
    href: "/production-schedules",
    icon: Clapperboard,
  },
  { label: "Projects", href: "/projects", icon: ClipboardList },
  { label: "Inbox", href: "/inbox", icon: Mail },
  { label: "Calendar", href: "/calendar", icon: Calendar },
  { label: "Settings", href: "/settings", icon: Settings },
];

export const APP_NAME = "Dissembargo OS";
