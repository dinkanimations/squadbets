import type { LucideIcon } from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export interface StatCardData {
  title: string;
  value: string;
  change: string;
  changeType: "positive" | "negative" | "neutral";
  icon: LucideIcon;
}

export interface DeadlineItem {
  id: string;
  title: string;
  client: string;
  dueDate: string;
  priority: "high" | "medium" | "low";
}

export interface PipelineStage {
  stage: string;
  amount: string;
  deals: number;
  percentage: number;
}

export interface NotificationItem {
  id: string;
  title: string;
  description: string;
  time: string;
  read: boolean;
}
