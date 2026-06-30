import type { InboxItemType, Json } from "@/types/database";

export type PotentialOpportunityStatus =
  | "pending"
  | "accepted"
  | "dismissed"
  | "converted";

export type { InboxItemType };

export type PotentialOpportunity = {
  id: string;
  user_id: string;
  inbox_id: string;
  company_id: string | null;
  contact_id: string | null;
  opportunity_id: string | null;
  status: PotentialOpportunityStatus;
  item_type: InboxItemType;
  company_name: string;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  company_website: string | null;
  project_name: string | null;
  project_description: string | null;
  deliverables: string | null;
  estimated_budget: number | null;
  deadline: string | null;
  location: string | null;
  ai_summary: string;
  ai_confidence: number;
  ai_reasoning: string | null;
  extraction_json: Json;
  linked_opportunity_id: string | null;
  linked_quote_id: string | null;
  linked_project_id: string | null;
  created_at: string;
  updated_at: string;
};

export type PotentialOpportunityWithInbox = PotentialOpportunity & {
  inbox: {
    id: string;
    subject: string | null;
    sender_name: string | null;
    sender_email: string | null;
    date_received: string;
    body_plain: string | null;
    body_html: string | null;
    attachments: unknown;
    thread_id: string | null;
    is_read: boolean;
  };
  company: {
    id: string;
    company_name: string;
    website: string | null;
    logo_url: string | null;
  } | null;
};

export function isNewOpportunityItem(item: Pick<PotentialOpportunity, "item_type">) {
  return item.item_type === "new_opportunity";
}

export function isClientCommunicationItem(
  item: Pick<PotentialOpportunity, "item_type">,
) {
  return item.item_type === "client_communication";
}
