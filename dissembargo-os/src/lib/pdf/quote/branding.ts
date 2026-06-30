/** Central branding config for quote PDFs — update here to refresh document styling. */

export const PDF_BRAND = {
  agencyName: "Dissembargo",
  tagline: "Creative Production Studio",
  email: "hello@dissembargo.com",
  website: "www.dissembargo.com",
  address: "London, United Kingdom",
  colors: {
    primary: "#18181b",
    accent: "#6366f1",
    accentLight: "#eef2ff",
    muted: "#71717a",
    border: "#e4e4e7",
    background: "#ffffff",
    surface: "#fafafa",
  },
  fonts: {
    heading: "Helvetica-Bold",
    body: "Helvetica",
    mono: "Courier",
  },
} as const;

export const DEFAULT_QUOTE_VALIDITY_DAYS = 30;

export const PDF_TERMS_AND_CONDITIONS = [
  "This quotation is valid until the expiry date stated above. Prices are quoted in GBP and exclude VAT unless otherwise stated.",
  "A 50% deposit is required to commence work. The remaining balance is due upon delivery of final assets, unless alternative payment terms are agreed in writing.",
  "Scope is limited to the deliverables listed in this document. Additional revisions, assets, or services outside the agreed scope will be quoted separately.",
  "Client-supplied materials must be cleared for use. Dissembargo is not liable for delays caused by incomplete briefs, feedback, or third-party dependencies.",
  "Final project files will be released upon receipt of full payment. Usage rights are granted as specified in the project agreement.",
  "Cancellation after project commencement may incur fees for work completed to date. Deposits are non-refundable once production has begun.",
  "Dissembargo retains the right to showcase completed work in its portfolio unless a confidentiality agreement is in place.",
];
