import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { isAuthDisabled } from "@/lib/auth/dev-bypass";

export type SupabaseServerClient = SupabaseClient<Database>;

export class DatabaseError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
  ) {
    super(message);
    this.name = "DatabaseError";
  }
}

export function handleDatabaseError(
  error: { message: string; code?: string } | null,
  context: string,
): never {
  if (error) {
    throw new DatabaseError(`${context}: ${error.message}`, error.code);
  }

  throw new DatabaseError(`${context}: Unknown database error`);
}

export function isMissingSchemaError(
  error: { message?: string; code?: string } | null,
): boolean {
  if (!error) return false;

  return (
    error.code === "PGRST205" ||
    error.code === "42P01" ||
    (error.message?.includes("Could not find the table") ?? false) ||
    (error.message?.includes("does not exist") ?? false)
  );
}

export async function withDevDbFallback<T>(
  operation: () => Promise<T>,
  fallback: T,
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (isAuthDisabled()) return fallback;
    throw error;
  }
}

export type PaginationOptions = {
  page?: number;
  pageSize?: number;
};

export function getPaginationRange({ page = 1, pageSize = 25 }: PaginationOptions) {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  return { from, to, page, pageSize };
}
