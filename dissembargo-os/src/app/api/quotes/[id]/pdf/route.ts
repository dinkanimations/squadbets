import { NextResponse } from "next/server";
import { getQuoteFullById } from "@/lib/database/quotes";
import { generateQuotePdfBuffer } from "@/lib/pdf/quote/generate";
import {
  downloadQuotePdfFromStorage,
  getQuotePdfVersionById,
  uploadQuotePdf,
} from "@/lib/pdf/quote/storage";
import { getUser } from "@/lib/auth/session";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const { searchParams } = new URL(request.url);
  const preview = searchParams.get("preview") === "1";
  const download = searchParams.get("download") === "1";
  const versionId = searchParams.get("version");
  const save = searchParams.get("save") === "1";

  try {
    const { user } = await getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let buffer: Buffer;
    let filename = `quote-${id}.pdf`;

    if (versionId) {
      const version = await getQuotePdfVersionById(versionId);
      if (!version || version.quote_id !== id) {
        return NextResponse.json({ error: "Version not found" }, { status: 404 });
      }
      buffer = await downloadQuotePdfFromStorage(version.storage_path);
      filename = `quote-${id}-v${version.version}.pdf`;
    } else if (preview) {
      const result = await generateQuotePdfBuffer(id);
      buffer = result.buffer;
      filename = `${result.quoteNumber}.pdf`;
    } else {
      const quote = await getQuoteFullById(id);

      if (quote.current_pdf_version_id && !save) {
        const version = await getQuotePdfVersionById(quote.current_pdf_version_id);
        if (version) {
          buffer = await downloadQuotePdfFromStorage(version.storage_path);
          filename = `${quote.quote_number}-v${version.version}.pdf`;
        } else {
          const result = await generateQuotePdfBuffer(id);
          buffer = result.buffer;
          filename = `${result.quoteNumber}.pdf`;
        }
      } else {
        const result = await generateQuotePdfBuffer(id);
        buffer = result.buffer;
        filename = `${result.quoteNumber}.pdf`;

        if (save || download) {
          await uploadQuotePdf(id, result.quoteNumber, buffer);
        }
      }
    }

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${filename}"`,
        "Cache-Control": preview ? "no-store" : "private, max-age=3600",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to generate PDF",
      },
      { status: 500 },
    );
  }
}

export async function POST(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  try {
    const { user } = await getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await generateQuotePdfBuffer(id);
    const version = await uploadQuotePdf(id, result.quoteNumber, result.buffer);

    return NextResponse.json({
      success: true,
      versionId: version.id,
      version: version.version,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to regenerate PDF",
      },
      { status: 500 },
    );
  }
}
