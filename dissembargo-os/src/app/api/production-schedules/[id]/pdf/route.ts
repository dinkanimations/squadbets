import { NextResponse } from "next/server";
import { getScheduleFullById } from "@/lib/database/production-schedules";
import { generateSchedulePdfBuffer } from "@/lib/pdf/schedule/generate";
import {
  downloadSchedulePdfFromStorage,
  getSchedulePdfVersionById,
  uploadSchedulePdf,
} from "@/lib/pdf/schedule/storage";
import { getUser } from "@/lib/auth/session";

interface RouteContext {
  params: Promise<{ id: string }>;
}

function buildFilename(projectTitle: string, version?: number): string {
  const safeName = projectTitle.replace(/[^a-zA-Z0-9-_ ]/g, "").trim();
  return version
    ? `${safeName}-schedule-v${version}.pdf`
    : `${safeName}-schedule.pdf`;
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
    let filename = `schedule-${id}.pdf`;

    if (versionId) {
      const version = await getSchedulePdfVersionById(versionId);
      if (!version || version.schedule_id !== id) {
        return NextResponse.json({ error: "Version not found" }, { status: 404 });
      }
      buffer = await downloadSchedulePdfFromStorage(version.storage_path);
      const schedule = await getScheduleFullById(id);
      filename = buildFilename(schedule.project_title, version.version);
    } else if (preview) {
      const result = await generateSchedulePdfBuffer(id);
      buffer = result.buffer;
      filename = buildFilename(result.projectTitle);
    } else {
      const schedule = await getScheduleFullById(id);

      if (schedule.current_pdf_version_id && !save) {
        const version = await getSchedulePdfVersionById(
          schedule.current_pdf_version_id,
        );
        if (version) {
          buffer = await downloadSchedulePdfFromStorage(version.storage_path);
          filename = buildFilename(schedule.project_title, version.version);
        } else {
          const result = await generateSchedulePdfBuffer(id);
          buffer = result.buffer;
          filename = buildFilename(result.projectTitle);
        }
      } else {
        const result = await generateSchedulePdfBuffer(id);
        buffer = result.buffer;
        filename = buildFilename(result.projectTitle);

        if (save || download) {
          await uploadSchedulePdf(id, result.projectTitle, buffer);
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

    const result = await generateSchedulePdfBuffer(id);
    const version = await uploadSchedulePdf(
      id,
      result.projectTitle,
      result.buffer,
    );

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
