import { Document, Page, View } from "@react-pdf/renderer";
import type { QuotePdfData } from "./types";
import { pdfStyles } from "./styles";
import {
  PdfBudgetBreakdown,
  PdfDeliverables,
  PdfFooter,
  PdfHeader,
  PdfMetaGrid,
  PdfNotes,
  PdfTerms,
  PdfTotals,
} from "./components";

interface QuotePdfDocumentProps {
  data: QuotePdfData;
}

export function QuotePdfDocument({ data }: QuotePdfDocumentProps) {
  return (
    <Document
      title={`${data.quoteNumber} — ${data.projectTitle}`}
      author={data.agencyName}
      subject="Project Quotation"
    >
      <Page size="A4" style={pdfStyles.page}>
        <View style={pdfStyles.headerBar} fixed />
        <PdfHeader data={data} />
        <PdfMetaGrid data={data} />
        <PdfDeliverables data={data} />
        <PdfBudgetBreakdown data={data} />
        <PdfTotals data={data} />
        <PdfNotes data={data} />
        <PdfTerms />
        <PdfFooter data={data} />
      </Page>
    </Document>
  );
}
