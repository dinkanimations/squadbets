import { Document, Page, View } from "@react-pdf/renderer";
import type { SchedulePdfData } from "./types";
import { schedulePdfStyles } from "./styles";
import {
  PdfScheduleDeliverables,
  PdfScheduleFooter,
  PdfScheduleHeader,
  PdfScheduleMetaGrid,
  PdfScheduleNotes,
  PdfScheduleOverview,
  PdfScheduleTimeline,
} from "./components";

interface SchedulePdfDocumentProps {
  data: SchedulePdfData;
}

export function SchedulePdfDocument({ data }: SchedulePdfDocumentProps) {
  return (
    <Document
      title={`${data.projectTitle} — Production Schedule v${data.versionNumber}`}
      author={data.agencyName}
      subject="Production Schedule"
    >
      <Page size="A4" style={schedulePdfStyles.page}>
        <View style={schedulePdfStyles.headerBar} fixed />
        <PdfScheduleHeader data={data} />
        <PdfScheduleMetaGrid data={data} />
        <PdfScheduleOverview data={data} />
        <PdfScheduleTimeline data={data} />
        <PdfScheduleDeliverables data={data} />
        <PdfScheduleNotes data={data} />
        <PdfScheduleFooter data={data} />
      </Page>
    </Document>
  );
}
