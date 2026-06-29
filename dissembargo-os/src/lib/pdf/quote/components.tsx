import { Text, View } from "@react-pdf/renderer";
import type { QuotePdfData } from "./types";
import { formatPdfCurrency, pdfStyles } from "./styles";

export function PdfHeader({ data }: { data: QuotePdfData }) {
  return (
    <View style={pdfStyles.headerRow}>
      <View>
        <Text style={pdfStyles.agencyName}>{data.agencyName}</Text>
        <Text style={pdfStyles.agencyTagline}>{data.tagline}</Text>
        <Text style={{ fontSize: 8, color: data.brand.colors.muted, marginTop: 4 }}>
          {data.email} · {data.website}
        </Text>
      </View>
      <View style={{ alignItems: "flex-end" }}>
        <Text style={pdfStyles.quoteLabel}>Quotation</Text>
        <Text style={pdfStyles.quoteNumber}>{data.quoteNumber}</Text>
      </View>
    </View>
  );
}

export function PdfMetaGrid({ data }: { data: QuotePdfData }) {
  return (
    <View style={pdfStyles.metaGrid}>
      <View style={pdfStyles.metaItem}>
        <Text style={pdfStyles.metaLabel}>Client</Text>
        <Text style={pdfStyles.metaValue}>{data.clientName}</Text>
      </View>
      <View style={pdfStyles.metaItem}>
        <Text style={pdfStyles.metaLabel}>Project</Text>
        <Text style={pdfStyles.metaValue}>{data.projectTitle}</Text>
      </View>
      <View style={pdfStyles.metaItem}>
        <Text style={pdfStyles.metaLabel}>Date</Text>
        <Text style={pdfStyles.metaValue}>{data.issueDate}</Text>
      </View>
      <View style={pdfStyles.metaItem}>
        <Text style={pdfStyles.metaLabel}>Valid Until</Text>
        <Text style={pdfStyles.metaValue}>{data.expiryDate}</Text>
      </View>
    </View>
  );
}

export function PdfDeliverables({ data }: { data: QuotePdfData }) {
  if (data.deliverables.length === 0) return null;

  return (
    <View>
      <Text style={pdfStyles.sectionTitle}>Deliverables</Text>
      {data.deliverables.map((item, index) => (
        <View key={`${item.title}-${index}`} style={pdfStyles.deliverableItem}>
          <Text style={pdfStyles.deliverableTitle}>
            {item.title}
            {item.quantity > 1 ? ` × ${item.quantity}` : ""}
          </Text>
          {item.description ? (
            <Text style={pdfStyles.deliverableDesc}>{item.description}</Text>
          ) : null}
        </View>
      ))}
    </View>
  );
}

export function PdfBudgetBreakdown({ data }: { data: QuotePdfData }) {
  if (data.budgetSections.length === 0) return null;

  return (
    <View>
      <Text style={pdfStyles.sectionTitle}>Budget Breakdown</Text>
      {data.budgetSections.map((section) => (
        <View key={section.name} wrap={false}>
          <Text
            style={{
              fontFamily: data.brand.fonts.heading,
              fontSize: 10,
              marginBottom: 6,
              marginTop: 4,
              color: data.brand.colors.primary,
            }}
          >
            {section.name}
          </Text>

          <View style={pdfStyles.tableHeader}>
            <Text style={[pdfStyles.tableHeaderCell, pdfStyles.colDescription]}>
              Description
            </Text>
            <Text style={[pdfStyles.tableHeaderCell, pdfStyles.colRate]}>
              Day Rate
            </Text>
            <Text style={[pdfStyles.tableHeaderCell, pdfStyles.colDays]}>
              Days
            </Text>
            <Text style={[pdfStyles.tableHeaderCell, pdfStyles.colTotal]}>
              Total
            </Text>
          </View>

          {section.lines.map((line, index) => (
            <View
              key={`${line.description}-${index}`}
              style={[
                pdfStyles.tableRow,
                index % 2 === 1 ? pdfStyles.tableRowAlt : {},
              ]}
            >
              <Text style={pdfStyles.colDescription}>{line.description}</Text>
              <Text style={pdfStyles.colRate}>
                {formatPdfCurrency(line.dayRate)}
              </Text>
              <Text style={pdfStyles.colDays}>{line.numDays}</Text>
              <Text style={pdfStyles.colTotal}>
                {formatPdfCurrency(line.total)}
              </Text>
            </View>
          ))}

          <View style={pdfStyles.sectionTotalRow}>
            <Text style={pdfStyles.sectionTotalLabel}>Section Total</Text>
            <Text style={pdfStyles.sectionTotalValue}>
              {formatPdfCurrency(section.sectionTotal)}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}

export function PdfTotals({ data }: { data: QuotePdfData }) {
  const discountLabel =
    data.discountType === "percentage"
      ? `Discount (${data.discountValue}%)`
      : "Discount";

  return (
    <View style={pdfStyles.totalsBox} wrap={false}>
      <View style={pdfStyles.totalsRow}>
        <Text style={pdfStyles.totalsLabel}>Subtotal</Text>
        <Text style={pdfStyles.totalsValue}>
          {formatPdfCurrency(data.subtotal)}
        </Text>
      </View>
      {data.discountAmount > 0 ? (
        <View style={pdfStyles.totalsRow}>
          <Text style={pdfStyles.totalsLabel}>{discountLabel}</Text>
          <Text style={pdfStyles.totalsValue}>
            −{formatPdfCurrency(data.discountAmount)}
          </Text>
        </View>
      ) : null}
      <View style={pdfStyles.totalsRowGrand}>
        <Text style={pdfStyles.totalsLabelGrand}>Grand Total</Text>
        <Text style={pdfStyles.totalsValueGrand}>
          {formatPdfCurrency(data.grandTotal)}
        </Text>
      </View>
    </View>
  );
}

export function PdfNotes({ data }: { data: QuotePdfData }) {
  if (!data.notes?.trim()) return null;

  return (
    <View style={pdfStyles.notesBox}>
      <Text style={pdfStyles.sectionTitle}>Notes</Text>
      <Text style={pdfStyles.notesText}>{data.notes}</Text>
    </View>
  );
}

export function PdfTerms({ data }: { data: QuotePdfData }) {
  return (
    <View style={pdfStyles.termsSection} break>
      <Text style={pdfStyles.termsTitle}>Terms & Conditions</Text>
      {data.terms.map((term, index) => (
        <Text key={index} style={pdfStyles.termItem}>
          {index + 1}. {term}
        </Text>
      ))}
    </View>
  );
}

export function PdfFooter({ data }: { data: QuotePdfData }) {
  const footerLine =
    data.brand.footerText ?? `${data.agencyName} · ${data.email}`;

  return (
    <View style={pdfStyles.footer} fixed>
      <Text style={pdfStyles.footerText}>{footerLine}</Text>
      <Text style={pdfStyles.footerText}>{data.quoteNumber}</Text>
      <Text
        style={pdfStyles.footerText}
        render={({ pageNumber, totalPages }) =>
          `Page ${pageNumber} of ${totalPages}`
        }
      />
    </View>
  );
}
