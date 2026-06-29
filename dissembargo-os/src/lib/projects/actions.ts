"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { getAllCompanies } from "@/lib/database/companies";
import { getContactsByCompanyId } from "@/lib/database/contacts";
import { ensureClientForCompany } from "@/lib/projects/create-from-quote";
import { getOpportunitiesFiltered } from "@/lib/database/opportunities";
import {
  archiveProject,
  createProjectFileRecord,
  createProjectNote,
  createProjectRecord,
  deleteProjectFileRecord,
  deleteProjectNote,
  getProjectFullById,
  saveProjectDeliverables,
  updateProjectNote,
  updateProjectRecord,
} from "@/lib/database/projects";
import { getQuotesFiltered } from "@/lib/database/quotes";
import { deleteFile, uploadFile } from "@/lib/storage";
import { assertAllowedMimeType } from "@/lib/storage/validation";
import type { ProjectPriority } from "@/types/database";
import {
  ALLOWED_FILE_TYPES,
  MAX_FILE_SIZE,
  type ProjectFormDraft,
} from "./constants";
import { createProjectFromQuote } from "./create-from-quote";

export type ProjectActionState = {
  error?: string;
  success?: string;
};

export type ProjectPayload = ProjectFormDraft;

function parsePayload(raw: string): ProjectPayload {
  const parsed = JSON.parse(raw) as ProjectPayload;

  if (!parsed.projectName?.trim()) {
    throw new Error("Project name is required.");
  }

  if (!parsed.companyId?.trim()) {
    throw new Error("Company is required.");
  }

  return parsed;
}

function mapProjectInput(payload: ProjectPayload, clientId: string) {
  return {
    client_id: clientId,
    company_id: payload.companyId,
    contact_id: payload.contactId || null,
    opportunity_id: payload.opportunityId || null,
    quote_id: payload.quoteId || null,
    project_name: payload.projectName.trim(),
    status: payload.status,
    start_date: payload.startDate || null,
    delivery_date: payload.deliveryDate || null,
    producer: payload.producer.trim() || null,
    team_members: payload.teamMembers.filter((m) => m.trim()),
    priority: payload.priority as ProjectPriority,
    budget: payload.budget || null,
    notes: payload.notes.trim() || null,
  };
}

export async function getCompaniesForProjectAction() {
  return getAllCompanies();
}

export async function getContactsForProjectAction(companyId: string) {
  if (!companyId) return [];
  return getContactsByCompanyId(companyId);
}

export async function getOpportunitiesForProjectAction(companyId: string) {
  if (!companyId) return [];
  const { data } = await getOpportunitiesFiltered({ pageSize: 100 });
  return data.filter((opp) => opp.company_id === companyId);
}

export async function getQuotesForProjectAction(companyId: string) {
  if (!companyId) return [];
  const { data } = await getQuotesFiltered({}, { pageSize: 100 });
  return data.filter((q) => q.company_id === companyId);
}

export async function createProjectAction(
  payloadJson: string,
): Promise<{ id?: string; error?: string }> {
  try {
    await requireUser();
    const payload = parsePayload(payloadJson);
    const clientId = await ensureClientForCompany(payload.companyId);
    const project = await createProjectRecord(mapProjectInput(payload, clientId));

    if (payload.quoteId) {
      const { updateQuoteRecord } = await import("@/lib/database/quotes");
      await updateQuoteRecord(payload.quoteId, { project_id: project.id });
    }

    revalidatePath("/projects");
    revalidatePath("/");
    revalidatePath(`/companies/${payload.companyId}`);

    return { id: project.id };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Failed to create project.",
    };
  }
}

export async function updateProjectAction(
  projectId: string,
  payloadJson: string,
): Promise<ProjectActionState> {
  try {
    await requireUser();
    const payload = parsePayload(payloadJson);
    const clientId = await ensureClientForCompany(payload.companyId);

    await updateProjectRecord(projectId, mapProjectInput(payload, clientId));

    revalidatePath("/projects");
    revalidatePath(`/projects/${projectId}`);
    revalidatePath("/");
    revalidatePath(`/companies/${payload.companyId}`);

    return { success: "Project saved successfully." };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Failed to save project.",
    };
  }
}

export async function archiveProjectAction(
  projectId: string,
): Promise<ProjectActionState> {
  try {
    await requireUser();
    await archiveProject(projectId);
    revalidatePath("/projects");
    revalidatePath("/");
    redirect("/projects");
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Failed to archive project.",
    };
  }
}

export async function createProjectFromQuoteAction(
  quoteId: string,
): Promise<{ id?: string; error?: string }> {
  try {
    await requireUser();
    const project = await createProjectFromQuote(quoteId);

    revalidatePath("/projects");
    revalidatePath(`/quotes/${quoteId}`);
    revalidatePath("/");

    return { id: project.id };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Failed to create project from quote.",
    };
  }
}

export type DeliverablePayload = {
  id?: string;
  title: string;
  description: string;
  isComplete: boolean;
};

export async function saveProjectDeliverablesAction(
  projectId: string,
  deliverablesJson: string,
): Promise<ProjectActionState> {
  try {
    await requireUser();
    const items = JSON.parse(deliverablesJson) as DeliverablePayload[];

    await saveProjectDeliverables(
      projectId,
      items
        .filter((item) => item.title.trim())
        .map((item, index) => ({
          title: item.title.trim(),
          description: item.description.trim() || null,
          is_complete: item.isComplete,
          sort_order: index,
        })),
    );

    revalidatePath(`/projects/${projectId}`);
    revalidatePath("/");

    return { success: "Deliverables saved." };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Failed to save deliverables.",
    };
  }
}

export async function addProjectNoteAction(
  projectId: string,
  content: string,
): Promise<ProjectActionState> {
  try {
    await requireUser();
    if (!content.trim()) throw new Error("Note cannot be empty.");
    await createProjectNote(projectId, content.trim());
    revalidatePath(`/projects/${projectId}`);
    return { success: "Note added." };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Failed to add note.",
    };
  }
}

export async function updateProjectNoteAction(
  projectId: string,
  noteId: string,
  content: string,
): Promise<ProjectActionState> {
  try {
    await requireUser();
    if (!content.trim()) throw new Error("Note cannot be empty.");
    await updateProjectNote(noteId, content.trim());
    revalidatePath(`/projects/${projectId}`);
    return { success: "Note updated." };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Failed to update note.",
    };
  }
}

export async function deleteProjectNoteAction(
  projectId: string,
  noteId: string,
): Promise<ProjectActionState> {
  try {
    await requireUser();
    await deleteProjectNote(noteId);
    revalidatePath(`/projects/${projectId}`);
    return { success: "Note deleted." };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Failed to delete note.",
    };
  }
}

export async function uploadProjectFileAction(
  projectId: string,
  formData: FormData,
): Promise<ProjectActionState> {
  try {
    await requireUser();
    const file = formData.get("file");

    if (!(file instanceof File) || file.size === 0) {
      throw new Error("No file selected.");
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new Error("File exceeds maximum size of 100 MB.");
    }

    assertAllowedMimeType(file, ALLOWED_FILE_TYPES);

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const storagePath = `${projectId}/${crypto.randomUUID()}-${safeName}`;

    await uploadFile("project-assets", storagePath, file, {
      contentType: file.type || undefined,
    });

    await createProjectFileRecord({
      project_id: projectId,
      file_name: file.name,
      storage_path: storagePath,
      mime_type: file.type || null,
      file_size: file.size,
    });

    revalidatePath(`/projects/${projectId}`);

    return { success: "File uploaded." };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Failed to upload file.",
    };
  }
}

export async function deleteProjectFileAction(
  projectId: string,
  fileId: string,
): Promise<ProjectActionState> {
  try {
    await requireUser();
    const storagePath = await deleteProjectFileRecord(fileId);

    if (storagePath) {
      await deleteFile("project-assets", storagePath);
    }

    revalidatePath(`/projects/${projectId}`);

    return { success: "File deleted." };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Failed to delete file.",
    };
  }
}

export async function getProjectDownloadUrlAction(storagePath: string) {
  const { getSignedUrl } = await import("@/lib/storage");
  return getSignedUrl("project-assets", storagePath);
}

export async function getProjectFullAction(projectId: string) {
  return getProjectFullById(projectId);
}
