import type { KeyboardEvent } from "react";

export const SPREADSHEET_CELL_ATTR = "data-spreadsheet-cell";

export function focusAdjacentSpreadsheetCell(
  current: HTMLElement,
  direction: "next" | "prev",
) {
  const root =
    current.closest("[data-spreadsheet-root]") ?? document;
  const cells = root.querySelectorAll<HTMLElement>(
    `[${SPREADSHEET_CELL_ATTR}]`,
  );
  const list = Array.from(cells);
  const index = list.indexOf(current);
  if (index === -1) return;

  const nextIndex = direction === "next" ? index + 1 : index - 1;
  const target = list[nextIndex];
  if (!target) return;

  target.focus();
  if (target instanceof HTMLInputElement) {
    target.select();
  }
}

export function handleSpreadsheetKeyDown(
  event: KeyboardEvent<HTMLInputElement>,
  options?: { onEnter?: () => void },
) {
  if (event.key === "Tab") {
    event.preventDefault();
    focusAdjacentSpreadsheetCell(
      event.currentTarget,
      event.shiftKey ? "prev" : "next",
    );
    return;
  }

  if (event.key === "Enter") {
    event.preventDefault();
    if (options?.onEnter) {
      options.onEnter();
      return;
    }
    focusAdjacentSpreadsheetCell(event.currentTarget, "next");
  }
}

export const spreadsheetInputClass =
  "w-full rounded border border-transparent bg-transparent px-2 py-1.5 text-sm text-foreground placeholder:text-muted/50 focus:border-accent/40 focus:bg-surface-elevated focus:outline-none focus:ring-1 focus:ring-accent/20";
