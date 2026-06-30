import { renderToBuffer } from "@react-pdf/renderer";
import { getQuoteFullById } from "@/lib/database/quotes";
import { buildQuotePdfData } from "./build-pdf-data";
import { QuotePdfDocument } from "./QuotePdfDocument";
import type { QuotePdfData } from "./types";

export async function generateQuotePdfBuffer(
  quoteId: string,
): Promise<{ buffer: Buffer; data: QuotePdfData; quoteNumber: string }> {
  const quote = await getQuoteFullById(quoteId);
  const data = await buildQuotePdfData(quote);
  const buffer = await renderToBuffer(<QuotePdfDocument data={data} />);

  return {
    buffer: Buffer.from(buffer),
    data,
    quoteNumber: quote.quote_number,
  };
}

export async function generateQuotePdfFromData(
  data: QuotePdfData,
): Promise<Buffer> {
  const buffer = await renderToBuffer(<QuotePdfDocument data={data} />);
  return Buffer.from(buffer);
}
