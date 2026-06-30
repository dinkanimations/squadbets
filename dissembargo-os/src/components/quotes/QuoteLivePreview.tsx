"use client";

import type { QuotePdfData } from "@/lib/pdf/quote/types";
import { formatCurrency } from "@/lib/quotes/calculations";

interface QuoteLivePreviewProps {
  data: QuotePdfData;
}

export function QuoteLivePreview({ data }: QuoteLivePreviewProps) {
  const { brand } = data;

  return (
    <div className="sticky top-4 flex h-[calc(100vh-7rem)] flex-col rounded-xl border border-border bg-[#f4f4f5] shadow-sm">
      <div className="border-b border-border bg-card px-4 py-3">
        <h2 className="text-sm font-semibold text-foreground">Live PDF Preview</h2>
        <p className="text-xs text-muted">Updates instantly as you edit</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <article
          className="mx-auto min-h-full w-full max-w-[420px] bg-white p-6 text-[11px] leading-relaxed text-zinc-800 shadow-lg"
          style={{ fontFamily: "Helvetica, Arial, sans-serif" }}
        >
          <header className="mb-5 flex items-start justify-between gap-4 border-b border-zinc-200 pb-4">
            <div>
              <p
                className="text-base font-bold"
                style={{ color: brand.colors.primary }}
              >
                {data.agencyName}
              </p>
              <p className="text-[10px] text-zinc-500">{data.tagline}</p>
              <p className="mt-1 text-[9px] text-zinc-400">
                {data.email} · {data.website}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[9px] uppercase tracking-wide text-zinc-400">
                Quotation
              </p>
              <p
                className="text-sm font-bold"
                style={{ color: brand.colors.accent }}
              >
                {data.version}
              </p>
              <p className="text-[9px] text-zinc-400">{data.quoteNumber}</p>
            </div>
          </header>

          <div className="mb-5 grid grid-cols-2 gap-3 text-[10px]">
            <PreviewMeta label="Client" value={data.clientName} />
            <PreviewMeta label="Project" value={data.projectTitle} />
            <PreviewMeta label="Version" value={data.version} />
            <PreviewMeta label="Date" value={data.issueDate} />
            <PreviewMeta label="Valid Until" value={data.expiryDate} />
          </div>

          {data.deliverables.length > 0 && (
            <section className="mb-5">
              <h3
                className="mb-2 text-[10px] font-bold uppercase tracking-wide"
                style={{ color: brand.colors.primary }}
              >
                Deliverables
              </h3>
              <ul className="space-y-2">
                {data.deliverables.map((item, index) => (
                  <li key={`${item.title}-${index}`}>
                    <p className="font-semibold text-zinc-800">
                      {item.title}
                      {item.quantity > 1 ? ` × ${item.quantity}` : ""}
                    </p>
                    {item.description ? (
                      <p className="text-zinc-500">{item.description}</p>
                    ) : null}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {data.budgetSections.length > 0 && (
            <section className="mb-5">
              <h3
                className="mb-2 text-[10px] font-bold uppercase tracking-wide"
                style={{ color: brand.colors.primary }}
              >
                Budget Breakdown
              </h3>
              {data.budgetSections.map((section) => (
                <div key={section.name} className="mb-4">
                  <p
                    className="mb-1 text-[10px] font-semibold"
                    style={{ color: brand.colors.accent }}
                  >
                    {section.name}
                  </p>
                  <table className="mb-1 w-full text-[9px]">
                    <thead>
                      <tr className="border-b border-zinc-200 text-left text-zinc-400">
                        <th className="py-1 pr-2 font-medium">Role</th>
                        <th className="w-14 py-1 text-right font-medium">Rate</th>
                        <th className="w-10 py-1 text-right font-medium">Days</th>
                        <th className="w-14 py-1 text-right font-medium">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {section.lines.map((line, index) => (
                        <tr
                          key={`${line.description}-${index}`}
                          className={index % 2 === 1 ? "bg-zinc-50" : undefined}
                        >
                          <td className="py-1 pr-2">{line.description}</td>
                          <td className="py-1 text-right">
                            {formatCurrency(line.dayRate)}
                          </td>
                          <td className="py-1 text-right">{line.numDays}</td>
                          <td className="py-1 text-right font-medium">
                            {formatCurrency(line.total)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="flex justify-between text-[9px] font-medium text-zinc-600">
                    <span>Section Total</span>
                    <span>{formatCurrency(section.sectionTotal)}</span>
                  </div>
                </div>
              ))}
            </section>
          )}

          <section
            className="mb-5 rounded border p-3"
            style={{
              borderColor: brand.colors.border,
              backgroundColor: brand.colors.surface,
            }}
          >
            <div className="flex justify-between py-1 text-[10px]">
              <span>Subtotal</span>
              <span>{formatCurrency(data.subtotal)}</span>
            </div>
            {data.discountAmount > 0 ? (
              <div className="flex justify-between py-1 text-[10px]">
                <span>
                  Discount
                  {data.discountType === "percentage"
                    ? ` (${data.discountValue}%)`
                    : ""}
                </span>
                <span>−{formatCurrency(data.discountAmount)}</span>
              </div>
            ) : null}
            <div
              className="mt-1 flex justify-between border-t pt-2 text-[11px] font-bold"
              style={{ borderColor: brand.colors.border }}
            >
              <span>Grand Total</span>
              <span style={{ color: brand.colors.accent }}>
                {formatCurrency(data.grandTotal)}
              </span>
            </div>
          </section>

          {data.notes ? (
            <section className="mb-4 rounded border border-zinc-200 bg-zinc-50 p-3">
              <h3 className="mb-1 text-[10px] font-bold uppercase text-zinc-600">
                Notes
              </h3>
              <p className="whitespace-pre-wrap text-zinc-600">{data.notes}</p>
            </section>
          ) : null}

          <footer className="border-t border-zinc-200 pt-3 text-[8px] text-zinc-400">
            <p>{brand.footerText ?? `${data.agencyName} · ${data.email}`}</p>
            <p className="mt-1">{data.quoteNumber}</p>
          </footer>
        </article>
      </div>
    </div>
  );
}

function PreviewMeta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[9px] uppercase tracking-wide text-zinc-400">{label}</p>
      <p className="font-medium text-zinc-800">{value}</p>
    </div>
  );
}
