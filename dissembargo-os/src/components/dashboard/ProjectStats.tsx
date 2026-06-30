import {
  CheckCircle2,
  Clock,
  FolderKanban,
  MessageSquare,
} from "lucide-react";
import { StatCard } from "@/components/ui/StatCard";
import {
  countProjectsByStatus,
  getProjectsDueThisWeek,
} from "@/lib/database/projects";

export async function ProjectStats() {
  let activeCount = 0;
  let waitingCount = 0;
  let dueThisWeekCount = 0;
  let completedCount = 0;
  let error = false;

  try {
    [activeCount, waitingCount, dueThisWeekCount, completedCount] =
      await Promise.all([
        countProjectsByStatus(["planning", "in_progress", "rendering", "review"]),
        countProjectsByStatus("waiting_for_client"),
        getProjectsDueThisWeek(100).then((items) => items.length),
        countProjectsByStatus("complete"),
      ]);
  } catch {
    error = true;
  }

  return (
    <>
      <StatCard
        title="Active Projects"
        value={error ? "—" : String(activeCount)}
        change={
          error ? "Unable to load" : "Planning, in progress, rendering, review"
        }
        changeType={error ? "negative" : "neutral"}
        icon={FolderKanban}
      />
      <StatCard
        title="Waiting for Feedback"
        value={error ? "—" : String(waitingCount)}
        change={error ? "Unable to load" : "Awaiting client response"}
        changeType={error ? "negative" : "neutral"}
        icon={MessageSquare}
      />
      <StatCard
        title="Due This Week"
        value={error ? "—" : String(dueThisWeekCount)}
        change={error ? "Unable to load" : "Delivery deadlines in 7 days"}
        changeType={error ? "negative" : "neutral"}
        icon={Clock}
      />
      <StatCard
        title="Completed Projects"
        value={error ? "—" : String(completedCount)}
        change={error ? "Unable to load" : "Successfully delivered"}
        changeType={error ? "negative" : "positive"}
        icon={CheckCircle2}
      />
    </>
  );
}
