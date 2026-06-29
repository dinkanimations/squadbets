"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAllCompanies } from "@/lib/database/companies";
import { getOpportunitiesFiltered } from "@/lib/database/opportunities";
import { getQuotesFiltered } from "@/lib/database/quotes";
import {
  archiveSchedule,
  createScheduleRecord,
  getScheduleFullById,
  saveScheduleVersion,
  updateScheduleRecord,
} from "@/lib/database/production-schedules";
import { generateScheduleData } from "@/lib/production-schedules/generate";
import type { ScheduleFormDraft } from "@/lib/production-schedules/constants";
import type { ScheduleStatus } from "@/types/database";

export type ScheduleActionState = {
  error?: string;
  success?: string;
};

function parsePayload(raw: string): ScheduleFormDraft {
  const parsed = JSON.parse(raw) as ScheduleFormDraft;

  if (!parsed.projectTitle?.trim()) {
    throw new Error("Project title is required.");
  }
  if (!parsed.startDate || !parsed.deliveryDate) {
    throw new Error("Start and delivery dates are required.");
  }
  if (parsed.startDate > parsed.deliveryDate) {
    throw new Error("Delivery date must be after start date.");
  }

  return parsed;
}

function mapDeliverables(deliverables: string[]): string[] {
  return deliverables.map((d) => d.trim()).filter(Boolean);
}

export async function getCompaniesForScheduleAction() {
  return getAllCompanies();
}

export async function getOpportunitiesForScheduleAction(companyId: string) {
  if (!companyId) return [];
  const { data } = await getOpportunitiesFiltered({ pageSize: 100 });
  return data.filter((opp) => opp.company_id === companyId);
}

export async function getQuotesForScheduleAction(companyId: string) {
  if (!companyId) return [];
  const { data } = await getQuotesFiltered({}, { pageSize: 100 });
  return data.filter((quote) => quote.company_id === companyId);
}

export async function generateSchedulePreviewAction(
  startDate: string,
  deliveryDate: string,
  reviewRounds: number,
) {
  return generateScheduleData({ startDate, deliveryDate, reviewRounds });
}

export async function createScheduleAction(
  payloadJson: string,
): Promise<{ id?: string; error?: string }> {
  try {
    const payload = parsePayload(payloadJson);
    const scheduleData =
      payload.scheduleData.phases.length > 0
        ? payload.scheduleData
        : generateScheduleData({
            startDate: payload.startDate,
            deliveryDate: payload.deliveryDate,
            reviewRounds: payload.reviewRounds,
          });

    const schedule = await createScheduleRecord({
      company_id: payload.companyId || null,
      opportunity_id: payload.opportunityId || null,
      quote_id: payload.quoteId || null,
      project_id: payload.projectId || null,
      project_title: payload.projectTitle.trim(),
      start_date: payload.startDate,
      delivery_date: payload.deliveryDate,
      review_rounds: payload.reviewRounds,
      deliverables: mapDeliverables(payload.deliverables),
      notes: payload.notes.trim() || null,
      status: payload.status,
      current_version: 1,
      schedule_json: scheduleData,
    });

    await saveScheduleVersion(schedule.id, 1, scheduleData, "Initial schedule");

    revalidatePath("/production-schedules");
    revalidatePath("/");

    return { id: schedule.id };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Failed to create schedule.",
    };
  }
}

export async function updateScheduleAction(
  scheduleId: string,
  payloadJson: string,
): Promise<ScheduleActionState> {
  try {
    const payload = parsePayload(payloadJson);
    const existing = await getScheduleFullById(scheduleId);
    const nextVersion = existing.current_version + 1;

    await updateScheduleRecord(scheduleId, {
      company_id: payload.companyId || null,
      opportunity_id: payload.opportunityId || null,
      quote_id: payload.quoteId || null,
      project_id: payload.projectId || null,
      project_title: payload.projectTitle.trim(),
      start_date: payload.startDate,
      delivery_date: payload.deliveryDate,
      review_rounds: payload.reviewRounds,
      deliverables: mapDeliverables(payload.deliverables),
      notes: payload.notes.trim() || null,
      status: payload.status,
      current_version: nextVersion,
      schedule_json: payload.scheduleData,
    });

    await saveScheduleVersion(
      scheduleId,
      nextVersion,
      payload.scheduleData,
      "Schedule updated",
    );

    revalidatePath("/production-schedules");
    revalidatePath(`/production-schedules/${scheduleId}`);
    revalidatePath("/");

    return { success: "Schedule saved successfully." };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Failed to save schedule.",
    };
  }
}

export async function regenerateScheduleAction(
  scheduleId: string,
  payloadJson: string,
): Promise<ScheduleActionState> {
  try {
    const payload = parsePayload(payloadJson);
    const scheduleData = generateScheduleData({
      startDate: payload.startDate,
      deliveryDate: payload.deliveryDate,
      reviewRounds: payload.reviewRounds,
    });

    const updatedPayload = { ...payload, scheduleData };
    return updateScheduleAction(scheduleId, JSON.stringify(updatedPayload));
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Failed to regenerate schedule.",
    };
  }
}

export async function archiveScheduleAction(
  scheduleId: string,
): Promise<ScheduleActionState> {
  try {
    await archiveSchedule(scheduleId);
    revalidatePath("/production-schedules");
    revalidatePath("/");
    redirect("/production-schedules");
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Failed to archive schedule.",
    };
  }
}

export async function updateScheduleStatusAction(
  scheduleId: string,
  status: ScheduleStatus,
): Promise<ScheduleActionState> {
  try {
    await updateScheduleRecord(scheduleId, { status });
    revalidatePath("/production-schedules");
    revalidatePath(`/production-schedules/${scheduleId}`);
    revalidatePath("/");
    return { success: "Status updated." };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Failed to update status.",
    };
  }
}

export async function restoreScheduleVersionAction(
  scheduleId: string,
  version: number,
): Promise<ScheduleActionState> {
  try {
    const schedule = await getScheduleFullById(scheduleId);
    const target = schedule.versions.find((v) => v.version === version);

    if (!target) {
      return { error: "Version not found." };
    }

    const nextVersion = schedule.current_version + 1;
    const scheduleData = target.schedule_json as ScheduleFormDraft["scheduleData"];

    await updateScheduleRecord(scheduleId, {
      schedule_json: scheduleData,
      current_version: nextVersion,
    });

    await saveScheduleVersion(
      scheduleId,
      nextVersion,
      scheduleData,
      `Restored from version ${version}`,
    );

    revalidatePath(`/production-schedules/${scheduleId}`);

    return { success: `Restored version ${version}.` };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Failed to restore version.",
    };
  }
}
