"use client";

import { formatScheduleDate } from "@/lib/production-schedules/calculations";
import { Input } from "@/components/ui/Input";

interface ScheduleHeaderBarProps {
  projectTitle: string;
  clientName: string;
  startDate: string;
  deliveryDate: string;
  onProjectTitleChange: (value: string) => void;
  onClientNameChange: (value: string) => void;
  onStartDateChange: (value: string) => void;
  onDeliveryDateChange: (value: string) => void;
}

export function ScheduleHeaderBar({
  projectTitle,
  clientName,
  startDate,
  deliveryDate,
  onProjectTitleChange,
  onClientNameChange,
  onStartDateChange,
  onDeliveryDateChange,
}: ScheduleHeaderBarProps) {
  return (
    <div className="grid gap-3 rounded-xl border border-border bg-card p-4 sm:grid-cols-2 lg:grid-cols-4">
      <Input
        label="Project Name"
        value={projectTitle}
        onChange={(event) => onProjectTitleChange(event.target.value)}
        placeholder="e.g. Brand Film Production"
      />
      <Input
        label="Client"
        value={clientName}
        onChange={(event) => onClientNameChange(event.target.value)}
        placeholder="Enter client name"
      />
      <Input
        label="Start Date"
        type="date"
        value={startDate}
        onChange={(event) => onStartDateChange(event.target.value)}
      />
      <Input
        label="Delivery Date"
        type="date"
        value={deliveryDate}
        onChange={(event) => onDeliveryDateChange(event.target.value)}
      />
      {startDate && deliveryDate ? (
        <p className="text-xs text-muted sm:col-span-2 lg:col-span-4">
          Timeline range: {formatScheduleDate(startDate)} →{" "}
          {formatScheduleDate(deliveryDate)}
        </p>
      ) : null}
    </div>
  );
}
