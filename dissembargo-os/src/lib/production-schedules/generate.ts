import {
  DEFAULT_PHASES,
  MILESTONE_TYPE_LABELS,
  MILESTONE_COLORS,
  PHASE_COLORS,
  PHASE_WEIGHTS,
  type ScheduleData,
  type ScheduleMilestone,
  type SchedulePhase,
} from "./constants";
import {
  addDays,
  daysBetween,
  formatDateISO,
  parseDate,
} from "./calculations";
import type { MilestoneType } from "@/types/database";

function createPhase(
  name: string,
  startDate: Date,
  durationDays: number,
  sortOrder: number,
): SchedulePhase {
  const endDate = addDays(startDate, Math.max(0, durationDays - 1));
  return {
    id: crypto.randomUUID(),
    name,
    startDate: formatDateISO(startDate),
    endDate: formatDateISO(endDate),
    durationDays: Math.max(1, durationDays),
    sortOrder,
    notes: "",
    color: PHASE_COLORS[sortOrder % PHASE_COLORS.length],
  };
}

function createMilestone(
  type: MilestoneType,
  date: string,
  sortOrder: number,
  label?: string,
): ScheduleMilestone {
  return {
    id: crypto.randomUUID(),
    type,
    label: label ?? MILESTONE_TYPE_LABELS[type],
    date,
    sortOrder,
    notes: "",
    color: MILESTONE_COLORS[type],
  };
}

export function generateScheduleData(input: {
  startDate: string;
  deliveryDate: string;
  reviewRounds: number;
  phaseNames?: string[];
  phaseWeights?: Record<string, number>;
}): Pick<ScheduleData, "phases" | "milestones"> {
  const start = parseDate(input.startDate);
  const end = parseDate(input.deliveryDate);
  const totalDays = daysBetween(input.startDate, input.deliveryDate);
  const phaseNames = input.phaseNames ?? [...DEFAULT_PHASES];
  const weights = input.phaseWeights ?? PHASE_WEIGHTS;

  const productionPhases = phaseNames.filter(
    (name) => name !== "Client Review" && name !== "Final Delivery",
  );

  const totalWeight = productionPhases.reduce(
    (sum, name) => sum + (weights[name] ?? 1),
    0,
  );

  const reviewDays = Math.max(input.reviewRounds, 1);
  const deliveryPhaseDays = 2;
  const reservedDays = reviewDays * 2 + deliveryPhaseDays;
  const productionDays = Math.max(totalDays - reservedDays, productionPhases.length);

  const phases: SchedulePhase[] = [];
  let cursor = new Date(start);

  productionPhases.forEach((name, index) => {
    const weight = weights[name] ?? 1;
    const duration = Math.max(
      1,
      Math.round((productionDays * weight) / totalWeight),
    );
    phases.push(createPhase(name, cursor, duration, index));
    cursor = addDays(cursor, duration);
  });

  const reviewPhaseIndex = phaseNames.indexOf("Client Review");
  if (reviewPhaseIndex >= 0) {
    for (let round = 0; round < input.reviewRounds; round++) {
      phases.push(
        createPhase(
          input.reviewRounds > 1
            ? `Client Review ${round + 1}`
            : "Client Review",
          cursor,
          1,
          reviewPhaseIndex + round,
        ),
      );
      cursor = addDays(cursor, 1);
    }
  }

  const finalIndex = phaseNames.indexOf("Final Delivery");
  if (finalIndex >= 0) {
    const finalStart = addDays(end, -deliveryPhaseDays + 1);
    phases.push(
      createPhase("Final Delivery", finalStart, deliveryPhaseDays, finalIndex),
    );
  }

  phases.sort((a, b) => a.sortOrder - b.sortOrder);

  const milestones: ScheduleMilestone[] = [
    createMilestone("kick_off", input.startDate, 0),
  ];

  const wipPhases = phases.filter((phase) =>
    ["Design", "Animation", "Rendering", "Compositing"].some((name) =>
      phase.name.includes(name),
    ),
  );

  wipPhases.forEach((phase) => {
    milestones.push(
      createMilestone(
        "wip_review",
        phase.endDate,
        milestones.length,
        `WIP Review — ${phase.name}`,
      ),
    );
  });

  const clientReviewPhases = phases.filter((phase) =>
    phase.name.includes("Client Review"),
  );

  clientReviewPhases.forEach((phase, index) => {
    milestones.push(
      createMilestone(
        "client_feedback",
        phase.startDate,
        milestones.length,
        `Client Feedback ${index + 1}`,
      ),
    );
    milestones.push(
      createMilestone(
        "client_approval",
        phase.endDate,
        milestones.length,
        `Client Approval ${index + 1}`,
      ),
    );
  });

  milestones.push(
    createMilestone("final_delivery", input.deliveryDate, milestones.length),
  );

  return { phases, milestones };
}

export function reorderPhases(phases: SchedulePhase[]): SchedulePhase[] {
  return phases.map((phase, index) => ({ ...phase, sortOrder: index }));
}

export function shiftPhaseDates(
  phase: SchedulePhase,
  newStartDate: string,
): SchedulePhase {
  const start = parseDate(newStartDate);
  const end = addDays(start, phase.durationDays - 1);
  return {
    ...phase,
    startDate: formatDateISO(start),
    endDate: formatDateISO(end),
  };
}

export function resizePhase(
  phase: SchedulePhase,
  newDurationDays: number,
): SchedulePhase {
  const durationDays = Math.max(1, newDurationDays);
  const start = parseDate(phase.startDate);
  const end = addDays(start, durationDays - 1);
  return {
    ...phase,
    durationDays,
    endDate: formatDateISO(end),
  };
}

export function resizePhaseFromStart(
  phase: SchedulePhase,
  newStartDate: string,
): SchedulePhase {
  const start = parseDate(newStartDate);
  const end = parseDate(phase.endDate);
  if (start > end) {
    const date = formatDateISO(start);
    return { ...phase, startDate: date, endDate: date, durationDays: 1 };
  }
  const durationDays = daysBetween(formatDateISO(start), phase.endDate);
  return {
    ...phase,
    startDate: formatDateISO(start),
    durationDays,
  };
}

export function resizePhaseToEnd(
  phase: SchedulePhase,
  newEndDate: string,
): SchedulePhase {
  const start = parseDate(phase.startDate);
  const end = parseDate(newEndDate);
  if (end < start) {
    const date = formatDateISO(end);
    return { ...phase, startDate: date, endDate: date, durationDays: 1 };
  }
  const durationDays = daysBetween(phase.startDate, formatDateISO(end));
  return {
    ...phase,
    endDate: formatDateISO(end),
    durationDays,
  };
}
