export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type OpportunityStatus =
  | "new"
  | "reviewing"
  | "qualified"
  | "contacted"
  | "proposal_sent"
  | "won"
  | "lost"
  | "archived";

export type ClientStatus =
  | "prospect"
  | "onboarding"
  | "active"
  | "inactive"
  | "churned";

export type ProjectStatus =
  | "draft"
  | "active"
  | "on_hold"
  | "in_review"
  | "completed"
  | "cancelled";

export type QuoteStatus = "draft" | "sent" | "approved" | "rejected" | "expired";

export type StorageBucket =
  | "email-attachments"
  | "project-assets"
  | "documents";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          avatar_url: string | null;
          role: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          avatar_url?: string | null;
          role?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          role?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      companies: {
        Row: {
          id: string;
          company_name: string;
          website: string | null;
          industry: string | null;
          ai_summary: string | null;
          estimated_size: string | null;
          headquarters: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_name: string;
          website?: string | null;
          industry?: string | null;
          ai_summary?: string | null;
          estimated_size?: string | null;
          headquarters?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          company_name?: string;
          website?: string | null;
          industry?: string | null;
          ai_summary?: string | null;
          estimated_size?: string | null;
          headquarters?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      contacts: {
        Row: {
          id: string;
          company_id: string;
          full_name: string;
          email: string | null;
          phone: string | null;
          role: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          full_name: string;
          email?: string | null;
          phone?: string | null;
          role?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          full_name?: string;
          email?: string | null;
          phone?: string | null;
          role?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "contacts_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      opportunities: {
        Row: {
          id: string;
          company_id: string;
          contact_id: string | null;
          subject: string | null;
          email_body: string | null;
          ai_category: string | null;
          ai_confidence: number | null;
          opportunity_status: OpportunityStatus;
          estimated_budget: number | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          contact_id?: string | null;
          subject?: string | null;
          email_body?: string | null;
          ai_category?: string | null;
          ai_confidence?: number | null;
          opportunity_status?: OpportunityStatus;
          estimated_budget?: number | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          contact_id?: string | null;
          subject?: string | null;
          email_body?: string | null;
          ai_category?: string | null;
          ai_confidence?: number | null;
          opportunity_status?: OpportunityStatus;
          estimated_budget?: number | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "opportunities_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "opportunities_contact_id_fkey";
            columns: ["contact_id"];
            isOneToOne: false;
            referencedRelation: "contacts";
            referencedColumns: ["id"];
          },
        ];
      };
      clients: {
        Row: {
          id: string;
          company_id: string;
          client_status: ClientStatus;
          onboarding_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          client_status?: ClientStatus;
          onboarding_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          client_status?: ClientStatus;
          onboarding_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "clients_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: true;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      projects: {
        Row: {
          id: string;
          client_id: string;
          project_name: string;
          status: ProjectStatus;
          start_date: string | null;
          delivery_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          project_name: string;
          status?: ProjectStatus;
          start_date?: string | null;
          delivery_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          client_id?: string;
          project_name?: string;
          status?: ProjectStatus;
          start_date?: string | null;
          delivery_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "projects_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
        ];
      };
      quotes: {
        Row: {
          id: string;
          project_id: string;
          quote_status: QuoteStatus;
          subtotal: number;
          discount: number;
          total: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          quote_status?: QuoteStatus;
          subtotal?: number;
          discount?: number;
          total?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          quote_status?: QuoteStatus;
          subtotal?: number;
          discount?: number;
          total?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "quotes_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      production_schedules: {
        Row: {
          id: string;
          project_id: string;
          version: number;
          schedule_json: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          version?: number;
          schedule_json?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          version?: number;
          schedule_json?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "production_schedules_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      opportunity_status: OpportunityStatus;
      client_status: ClientStatus;
      project_status: ProjectStatus;
      quote_status: QuoteStatus;
    };
    CompositeTypes: Record<string, never>;
  };
}

// Convenience row types
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Company = Database["public"]["Tables"]["companies"]["Row"];
export type Contact = Database["public"]["Tables"]["contacts"]["Row"];
export type Opportunity = Database["public"]["Tables"]["opportunities"]["Row"];
export type Client = Database["public"]["Tables"]["clients"]["Row"];
export type Project = Database["public"]["Tables"]["projects"]["Row"];
export type Quote = Database["public"]["Tables"]["quotes"]["Row"];
export type ProductionSchedule =
  Database["public"]["Tables"]["production_schedules"]["Row"];

// Insert types
export type CompanyInsert = Database["public"]["Tables"]["companies"]["Insert"];
export type ContactInsert = Database["public"]["Tables"]["contacts"]["Insert"];
export type OpportunityInsert =
  Database["public"]["Tables"]["opportunities"]["Insert"];
export type ClientInsert = Database["public"]["Tables"]["clients"]["Insert"];
export type ProjectInsert = Database["public"]["Tables"]["projects"]["Insert"];
export type QuoteInsert = Database["public"]["Tables"]["quotes"]["Insert"];
export type ProductionScheduleInsert =
  Database["public"]["Tables"]["production_schedules"]["Insert"];

// Update types
export type CompanyUpdate = Database["public"]["Tables"]["companies"]["Update"];
export type ContactUpdate = Database["public"]["Tables"]["contacts"]["Update"];
export type OpportunityUpdate =
  Database["public"]["Tables"]["opportunities"]["Update"];
export type ClientUpdate = Database["public"]["Tables"]["clients"]["Update"];
export type ProjectUpdate = Database["public"]["Tables"]["projects"]["Update"];
export type QuoteUpdate = Database["public"]["Tables"]["quotes"]["Update"];
export type ProductionScheduleUpdate =
  Database["public"]["Tables"]["production_schedules"]["Update"];
