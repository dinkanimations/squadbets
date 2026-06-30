import { renderToBuffer } from "@react-pdf/renderer";
import { getScheduleFullById } from "@/lib/database/production-schedules";
import { buildSchedulePdfData } from "./build-pdf-data";
import { SchedulePdfDocument } from "./SchedulePdfDocument";
import type { SchedulePdfData } from "./types";

export async function generateSchedulePdfBuffer(
  scheduleId: string,
): Promise<{
  buffer: Buffer;
  data: SchedulePdfData;
  projectTitle: string;
}> {
  const schedule = await getScheduleFullById(scheduleId);
  const data = await buildSchedulePdfData(schedule);
  const buffer = await renderToBuffer(<SchedulePdfDocument data={data} />);

  return {
    buffer: Buffer.from(buffer),
    data,
    projectTitle: schedule.project_title,
  };
}

export async function generateSchedulePdfFromData(
  data: SchedulePdfData,
): Promise<Buffer> {
  const buffer = await renderToBuffer(<SchedulePdfDocument data={data} />);
  return Buffer.from(buffer);
}
