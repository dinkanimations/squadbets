import { ScheduleBuilder } from "@/components/production-schedules/ScheduleBuilder";
import { getCompaniesForScheduleAction } from "@/lib/production-schedules/actions";

export default async function NewSchedulePage() {
  const companies = await getCompaniesForScheduleAction();

  return <ScheduleBuilder mode="create" companies={companies} />;
}
