import {
  CalendarClock,
  DollarSign,
  FolderKanban,
} from "lucide-react";
import type {
  DeadlineItem,
  NotificationItem,
  PipelineStage,
  StatCardData,
} from "@/types";

export const DASHBOARD_PLACEHOLDER_STATS: StatCardData[] = [
  {
    title: "Active Projects",
    value: "18",
    change: "3 launching this month",
    changeType: "neutral",
    icon: FolderKanban,
  },
  {
    title: "Revenue Pipeline",
    value: "£486K",
    change: "+8.2% vs last quarter",
    changeType: "positive",
    icon: DollarSign,
  },
];

export const PIPELINE_STAGES: PipelineStage[] = [
  { stage: "Discovery", amount: "£82,000", deals: 6, percentage: 17 },
  { stage: "Proposal", amount: "£124,500", deals: 4, percentage: 26 },
  { stage: "Negotiation", amount: "£98,000", deals: 3, percentage: 20 },
  { stage: "Closed Won", amount: "£181,500", deals: 5, percentage: 37 },
];

export const UPCOMING_DEADLINES: DeadlineItem[] = [
  {
    id: "1",
    title: "Brand Identity Delivery",
    client: "Northwind Studio",
    dueDate: "Jun 30, 2026",
    priority: "high",
  },
  {
    id: "2",
    title: "Motion Graphics Revisions",
    client: "Apex Athletics",
    dueDate: "Jul 2, 2026",
    priority: "medium",
  },
  {
    id: "3",
    title: "Website Launch",
    client: "Lumen Health",
    dueDate: "Jul 5, 2026",
    priority: "high",
  },
  {
    id: "4",
    title: "Social Campaign Assets",
    client: "Drift Coffee Co.",
    dueDate: "Jul 8, 2026",
    priority: "low",
  },
  {
    id: "5",
    title: "Pitch Deck Final Review",
    client: "Vertex Ventures",
    dueDate: "Jul 10, 2026",
    priority: "medium",
  },
];

export const NOTIFICATIONS: NotificationItem[] = [
  {
    id: "1",
    title: "New opportunity qualified",
    description:
      "AI flagged an inquiry from Sarah Chen at Meridian Labs as high-fit.",
    time: "5m ago",
    read: false,
  },
  {
    id: "2",
    title: "Quote approved",
    description: "Northwind Studio approved the brand identity quote.",
    time: "1h ago",
    read: false,
  },
  {
    id: "3",
    title: "Deadline reminder",
    description: "Brand Identity Delivery is due tomorrow.",
    time: "3h ago",
    read: true,
  },
];

export const CURRENT_USER = {
  name: "Alex Morgan",
  role: "Creative Director",
  initials: "AM",
  email: "alex@dissembargo.com",
};

export const DEADLINE_ICON = CalendarClock;
