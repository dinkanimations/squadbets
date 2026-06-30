export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type OpportunityStatus =
  | "new"
  | "contacted"
  | "quote_requested"
  | "quote_sent"
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
  | "planning"
  | "in_progress"
  | "waiting_for_client"
  | "rendering"
  | "review"
  | "complete"
  | "archived";

export type ProjectPriority = "low" | "medium" | "high" | "urgent";

export type UserRole =
  | "administrator"
  | "producer"
  | "creative_director"
  | "designer"
  | "freelancer"
  | "viewer";

export type TeamMemberStatus = "active" | "inactive";

export type QuoteStatus = "draft" | "sent" | "approved" | "rejected" | "expired";

export type DiscountType = "percentage" | "fixed";

export type ScheduleStatus = "draft" | "active" | "archived";

export type MilestoneType =
  | "kick_off"
  | "wip_review"
  | "client_feedback"
  | "client_approval"
  | "final_delivery";

export type AiEmailCategory =
  | "new_business_opportunity"
  | "existing_client"
  | "supplier"
  | "invoice"
  | "receipt"
  | "marketing"
  | "recruitment"
  | "newsletter"
  | "spam"
  | "password_reset"
  | "calendar"
  | "social_notification"
  | "internal"
  | "other";

export type InboxItemType = "new_opportunity" | "client_communication";

export type InboxReviewStatus =
  | "pending_review"
  | "approved"
  | "rejected"
  | "auto_created"
  | "ignored";

export type AiProcessingStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed";

export type StorageBucket =
  | "email-attachments"
  | "project-assets"
  | "documents";

export type CompanyStatus = "active" | "archived";

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
          logo_url: string | null;
          products: string[];
          services: string[];
          key_markets: string[];
          target_customers: string[];
          creative_opportunities: string[];
          suggested_services: string[];
          executive_summary: string | null;
          internal_notes: string | null;
          status: CompanyStatus;
          is_existing_client: boolean;
          website_candidates: Json;
          website_pending_selection: boolean;
          ai_research_cached_at: string | null;
          ai_research_raw: Json | null;
          normalized_name: string | null;
          website_domain: string | null;
          manual_overrides: Json;
          last_contact_at: string | null;
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
          logo_url?: string | null;
          products?: string[];
          services?: string[];
          key_markets?: string[];
          target_customers?: string[];
          creative_opportunities?: string[];
          suggested_services?: string[];
          executive_summary?: string | null;
          internal_notes?: string | null;
          status?: CompanyStatus;
          is_existing_client?: boolean;
          website_candidates?: Json;
          website_pending_selection?: boolean;
          ai_research_cached_at?: string | null;
          ai_research_raw?: Json | null;
          normalized_name?: string | null;
          website_domain?: string | null;
          manual_overrides?: Json;
          last_contact_at?: string | null;
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
          logo_url?: string | null;
          products?: string[];
          services?: string[];
          key_markets?: string[];
          target_customers?: string[];
          creative_opportunities?: string[];
          suggested_services?: string[];
          executive_summary?: string | null;
          internal_notes?: string | null;
          status?: CompanyStatus;
          is_existing_client?: boolean;
          website_candidates?: Json;
          website_pending_selection?: boolean;
          ai_research_cached_at?: string | null;
          ai_research_raw?: Json | null;
          normalized_name?: string | null;
          website_domain?: string | null;
          manual_overrides?: Json;
          last_contact_at?: string | null;
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
          requested_deliverables: string | null;
          notes: string | null;
          inbox_id: string | null;
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
          requested_deliverables?: string | null;
          notes?: string | null;
          inbox_id?: string | null;
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
          requested_deliverables?: string | null;
          notes?: string | null;
          inbox_id?: string | null;
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
          company_id: string | null;
          contact_id: string | null;
          opportunity_id: string | null;
          quote_id: string | null;
          project_name: string;
          status: ProjectStatus;
          start_date: string | null;
          delivery_date: string | null;
          producer: string | null;
          team_members: string[];
          priority: ProjectPriority;
          budget: number | null;
          notes: string | null;
          progress: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          company_id?: string | null;
          contact_id?: string | null;
          opportunity_id?: string | null;
          quote_id?: string | null;
          project_name: string;
          status?: ProjectStatus;
          start_date?: string | null;
          delivery_date?: string | null;
          producer?: string | null;
          team_members?: string[];
          priority?: ProjectPriority;
          budget?: number | null;
          notes?: string | null;
          progress?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          client_id?: string;
          company_id?: string | null;
          contact_id?: string | null;
          opportunity_id?: string | null;
          quote_id?: string | null;
          project_name?: string;
          status?: ProjectStatus;
          start_date?: string | null;
          delivery_date?: string | null;
          producer?: string | null;
          team_members?: string[];
          priority?: ProjectPriority;
          budget?: number | null;
          notes?: string | null;
          progress?: number;
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
          {
            foreignKeyName: "projects_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "projects_contact_id_fkey";
            columns: ["contact_id"];
            isOneToOne: false;
            referencedRelation: "contacts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "projects_opportunity_id_fkey";
            columns: ["opportunity_id"];
            isOneToOne: false;
            referencedRelation: "opportunities";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "projects_quote_id_fkey";
            columns: ["quote_id"];
            isOneToOne: false;
            referencedRelation: "quotes";
            referencedColumns: ["id"];
          },
        ];
      };
      project_deliverables: {
        Row: {
          id: string;
          project_id: string;
          title: string;
          description: string | null;
          is_complete: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          title: string;
          description?: string | null;
          is_complete?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          title?: string;
          description?: string | null;
          is_complete?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "project_deliverables_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      project_notes: {
        Row: {
          id: string;
          project_id: string;
          content: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          content: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          content?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "project_notes_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      project_files: {
        Row: {
          id: string;
          project_id: string;
          file_name: string;
          storage_path: string;
          mime_type: string | null;
          file_size: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          file_name: string;
          storage_path: string;
          mime_type?: string | null;
          file_size?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          file_name?: string;
          storage_path?: string;
          mime_type?: string | null;
          file_size?: number | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "project_files_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      app_settings: {
        Row: {
          id: string;
          company_name: string;
          company_logo_url: string | null;
          company_address: string | null;
          company_email: string | null;
          company_phone: string | null;
          website: string | null;
          default_currency: string;
          timezone: string;
          default_language: string;
          quote_validity_days: number;
          default_budget_sections: Json;
          default_day_rates: Json;
          default_discount_type: DiscountType;
          default_discount_value: number;
          default_terms: Json;
          default_phases: Json;
          phase_weights: Json;
          default_milestones: Json;
          default_review_rounds: number;
          default_schedule_duration_days: number;
          working_days: Json;
          company_holidays: Json;
          email_signature: string | null;
          pdf_header_logo_url: string | null;
          pdf_footer_text: string | null;
          pdf_tagline: string | null;
          pdf_colors: Json;
          notify_email: boolean;
          notify_deadlines: boolean;
          notify_quote_approval: boolean;
          notify_client_feedback: boolean;
          notify_ai_processing: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_name?: string;
          company_logo_url?: string | null;
          company_address?: string | null;
          company_email?: string | null;
          company_phone?: string | null;
          website?: string | null;
          default_currency?: string;
          timezone?: string;
          default_language?: string;
          quote_validity_days?: number;
          default_budget_sections?: Json;
          default_day_rates?: Json;
          default_discount_type?: DiscountType;
          default_discount_value?: number;
          default_terms?: Json;
          default_phases?: Json;
          phase_weights?: Json;
          default_milestones?: Json;
          default_review_rounds?: number;
          default_schedule_duration_days?: number;
          working_days?: Json;
          company_holidays?: Json;
          email_signature?: string | null;
          pdf_header_logo_url?: string | null;
          pdf_footer_text?: string | null;
          pdf_tagline?: string | null;
          pdf_colors?: Json;
          notify_email?: boolean;
          notify_deadlines?: boolean;
          notify_quote_approval?: boolean;
          notify_client_feedback?: boolean;
          notify_ai_processing?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          company_name?: string;
          company_logo_url?: string | null;
          company_address?: string | null;
          company_email?: string | null;
          company_phone?: string | null;
          website?: string | null;
          default_currency?: string;
          timezone?: string;
          default_language?: string;
          quote_validity_days?: number;
          default_budget_sections?: Json;
          default_day_rates?: Json;
          default_discount_type?: DiscountType;
          default_discount_value?: number;
          default_terms?: Json;
          default_phases?: Json;
          phase_weights?: Json;
          default_milestones?: Json;
          default_review_rounds?: number;
          default_schedule_duration_days?: number;
          working_days?: Json;
          company_holidays?: Json;
          email_signature?: string | null;
          pdf_header_logo_url?: string | null;
          pdf_footer_text?: string | null;
          pdf_tagline?: string | null;
          pdf_colors?: Json;
          notify_email?: boolean;
          notify_deadlines?: boolean;
          notify_quote_approval?: boolean;
          notify_client_feedback?: boolean;
          notify_ai_processing?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      team_members: {
        Row: {
          id: string;
          name: string;
          email: string;
          job_title: string | null;
          day_rate: number | null;
          department: string | null;
          avatar_url: string | null;
          status: TeamMemberStatus;
          role: UserRole;
          profile_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          email: string;
          job_title?: string | null;
          day_rate?: number | null;
          department?: string | null;
          avatar_url?: string | null;
          status?: TeamMemberStatus;
          role?: UserRole;
          profile_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string;
          job_title?: string | null;
          day_rate?: number | null;
          department?: string | null;
          avatar_url?: string | null;
          status?: TeamMemberStatus;
          role?: UserRole;
          profile_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "team_members_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      quotes: {
        Row: {
          id: string;
          project_id: string | null;
          quote_number: string;
          company_id: string | null;
          contact_id: string | null;
          opportunity_id: string | null;
          project_title: string | null;
          client_name: string | null;
          version: string | null;
          notes: string | null;
          quote_status: QuoteStatus;
          subtotal: number;
          discount: number;
          discount_type: DiscountType;
          discount_value: number;
          total: number;
          is_archived: boolean;
          expiry_date: string | null;
          current_pdf_version_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id?: string | null;
          quote_number: string;
          company_id?: string | null;
          contact_id?: string | null;
          opportunity_id?: string | null;
          project_title?: string | null;
          client_name?: string | null;
          version?: string | null;
          notes?: string | null;
          quote_status?: QuoteStatus;
          subtotal?: number;
          discount?: number;
          discount_type?: DiscountType;
          discount_value?: number;
          total?: number;
          is_archived?: boolean;
          expiry_date?: string | null;
          current_pdf_version_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string | null;
          quote_number?: string;
          company_id?: string | null;
          contact_id?: string | null;
          opportunity_id?: string | null;
          project_title?: string | null;
          client_name?: string | null;
          version?: string | null;
          notes?: string | null;
          quote_status?: QuoteStatus;
          subtotal?: number;
          discount?: number;
          discount_type?: DiscountType;
          discount_value?: number;
          total?: number;
          is_archived?: boolean;
          expiry_date?: string | null;
          current_pdf_version_id?: string | null;
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
          {
            foreignKeyName: "quotes_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "quotes_contact_id_fkey";
            columns: ["contact_id"];
            isOneToOne: false;
            referencedRelation: "contacts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "quotes_opportunity_id_fkey";
            columns: ["opportunity_id"];
            isOneToOne: false;
            referencedRelation: "opportunities";
            referencedColumns: ["id"];
          },
        ];
      };
      quote_deliverables: {
        Row: {
          id: string;
          quote_id: string;
          title: string;
          description: string | null;
          quantity: number;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          quote_id: string;
          title?: string;
          description?: string | null;
          quantity?: number;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          quote_id?: string;
          title?: string;
          description?: string | null;
          quantity?: number;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "quote_deliverables_quote_id_fkey";
            columns: ["quote_id"];
            isOneToOne: false;
            referencedRelation: "quotes";
            referencedColumns: ["id"];
          },
        ];
      };
      quote_budget_sections: {
        Row: {
          id: string;
          quote_id: string;
          name: string;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          quote_id: string;
          name: string;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          quote_id?: string;
          name?: string;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "quote_budget_sections_quote_id_fkey";
            columns: ["quote_id"];
            isOneToOne: false;
            referencedRelation: "quotes";
            referencedColumns: ["id"];
          },
        ];
      };
      quote_budget_line_items: {
        Row: {
          id: string;
          section_id: string;
          description: string;
          day_rate: number;
          num_days: number;
          total_cost: number;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          section_id: string;
          description?: string;
          day_rate?: number;
          num_days?: number;
          total_cost?: number;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          section_id?: string;
          description?: string;
          day_rate?: number;
          num_days?: number;
          total_cost?: number;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "quote_budget_line_items_section_id_fkey";
            columns: ["section_id"];
            isOneToOne: false;
            referencedRelation: "quote_budget_sections";
            referencedColumns: ["id"];
          },
        ];
      };
      quote_pdf_versions: {
        Row: {
          id: string;
          quote_id: string;
          version: number;
          storage_path: string;
          file_size: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          quote_id: string;
          version: number;
          storage_path: string;
          file_size?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          quote_id?: string;
          version?: number;
          storage_path?: string;
          file_size?: number | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "quote_pdf_versions_quote_id_fkey";
            columns: ["quote_id"];
            isOneToOne: false;
            referencedRelation: "quotes";
            referencedColumns: ["id"];
          },
        ];
      };
      production_schedules: {
        Row: {
          id: string;
          project_id: string | null;
          company_id: string | null;
          opportunity_id: string | null;
          quote_id: string | null;
          project_title: string;
          start_date: string | null;
          delivery_date: string | null;
          review_rounds: number;
          deliverables: string[];
          notes: string | null;
          status: ScheduleStatus;
          current_version: number;
          current_pdf_version_id: string | null;
          schedule_json: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id?: string | null;
          company_id?: string | null;
          opportunity_id?: string | null;
          quote_id?: string | null;
          project_title?: string;
          start_date?: string | null;
          delivery_date?: string | null;
          review_rounds?: number;
          deliverables?: string[];
          notes?: string | null;
          status?: ScheduleStatus;
          current_version?: number;
          current_pdf_version_id?: string | null;
          schedule_json?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string | null;
          company_id?: string | null;
          opportunity_id?: string | null;
          quote_id?: string | null;
          project_title?: string;
          start_date?: string | null;
          delivery_date?: string | null;
          review_rounds?: number;
          deliverables?: string[];
          notes?: string | null;
          status?: ScheduleStatus;
          current_version?: number;
          current_pdf_version_id?: string | null;
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
          {
            foreignKeyName: "production_schedules_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "production_schedules_opportunity_id_fkey";
            columns: ["opportunity_id"];
            isOneToOne: false;
            referencedRelation: "opportunities";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "production_schedules_quote_id_fkey";
            columns: ["quote_id"];
            isOneToOne: false;
            referencedRelation: "quotes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "production_schedules_current_pdf_version_id_fkey";
            columns: ["current_pdf_version_id"];
            isOneToOne: false;
            referencedRelation: "production_schedule_pdf_versions";
            referencedColumns: ["id"];
          },
        ];
      };
      production_schedule_pdf_versions: {
        Row: {
          id: string;
          schedule_id: string;
          version: number;
          storage_path: string;
          file_size: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          schedule_id: string;
          version: number;
          storage_path: string;
          file_size?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          schedule_id?: string;
          version?: number;
          storage_path?: string;
          file_size?: number | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "production_schedule_pdf_versions_schedule_id_fkey";
            columns: ["schedule_id"];
            isOneToOne: false;
            referencedRelation: "production_schedules";
            referencedColumns: ["id"];
          },
        ];
      };
      production_schedule_versions: {
        Row: {
          id: string;
          schedule_id: string;
          version: number;
          schedule_json: Json;
          change_note: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          schedule_id: string;
          version: number;
          schedule_json?: Json;
          change_note?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          schedule_id?: string;
          version?: number;
          schedule_json?: Json;
          change_note?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "production_schedule_versions_schedule_id_fkey";
            columns: ["schedule_id"];
            isOneToOne: false;
            referencedRelation: "production_schedules";
            referencedColumns: ["id"];
          },
        ];
      };
      gmail_connections: {
        Row: {
          id: string;
          user_id: string;
          gmail_address: string;
          access_token: string;
          refresh_token: string;
          token_expiry: string | null;
          history_id: string | null;
          historical_import_page_token: string | null;
          last_sync_at: string | null;
          last_sync_status: string;
          last_sync_error: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          gmail_address: string;
          access_token: string;
          refresh_token: string;
          token_expiry?: string | null;
          history_id?: string | null;
          historical_import_page_token?: string | null;
          last_sync_at?: string | null;
          last_sync_status?: string;
          last_sync_error?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          gmail_address?: string;
          access_token?: string;
          refresh_token?: string;
          token_expiry?: string | null;
          history_id?: string | null;
          historical_import_page_token?: string | null;
          last_sync_at?: string | null;
          last_sync_status?: string;
          last_sync_error?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      inbox: {
        Row: {
          id: string;
          user_id: string;
          gmail_message_id: string;
          thread_id: string | null;
          gmail_connection_id: string | null;
          subject: string | null;
          sender_name: string | null;
          sender_email: string | null;
          recipient: string | null;
          date_received: string;
          body_plain: string | null;
          body_html: string | null;
          attachments: Json;
          is_read: boolean;
          imported_at: string;
          created_at: string;
          ai_category: AiEmailCategory | null;
          ai_confidence: number | null;
          ai_summary: string | null;
          ai_reasoning: string | null;
          ai_signature: string | null;
          ai_processed_at: string | null;
          ai_processing_status: AiProcessingStatus;
          ai_processing_error: string | null;
          review_status: InboxReviewStatus | null;
          opportunity_id: string | null;
          company_id: string | null;
          linked_quote_id: string | null;
          linked_project_id: string | null;
          detected_company_name: string | null;
          detected_website: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          gmail_message_id: string;
          thread_id?: string | null;
          gmail_connection_id?: string | null;
          subject?: string | null;
          sender_name?: string | null;
          sender_email?: string | null;
          recipient?: string | null;
          date_received: string;
          body_plain?: string | null;
          body_html?: string | null;
          attachments?: Json;
          is_read?: boolean;
          imported_at?: string;
          created_at?: string;
          ai_category?: AiEmailCategory | null;
          ai_confidence?: number | null;
          ai_summary?: string | null;
          ai_reasoning?: string | null;
          ai_signature?: string | null;
          ai_processed_at?: string | null;
          ai_processing_status?: AiProcessingStatus;
          ai_processing_error?: string | null;
          review_status?: InboxReviewStatus | null;
          opportunity_id?: string | null;
          company_id?: string | null;
          linked_quote_id?: string | null;
          linked_project_id?: string | null;
          detected_company_name?: string | null;
          detected_website?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          gmail_message_id?: string;
          thread_id?: string | null;
          gmail_connection_id?: string | null;
          subject?: string | null;
          sender_name?: string | null;
          sender_email?: string | null;
          recipient?: string | null;
          date_received?: string;
          body_plain?: string | null;
          body_html?: string | null;
          attachments?: Json;
          is_read?: boolean;
          imported_at?: string;
          created_at?: string;
          ai_category?: AiEmailCategory | null;
          ai_confidence?: number | null;
          ai_summary?: string | null;
          ai_reasoning?: string | null;
          ai_signature?: string | null;
          ai_processed_at?: string | null;
          ai_processing_status?: AiProcessingStatus;
          ai_processing_error?: string | null;
          review_status?: InboxReviewStatus | null;
          opportunity_id?: string | null;
          company_id?: string | null;
          linked_quote_id?: string | null;
          linked_project_id?: string | null;
          detected_company_name?: string | null;
          detected_website?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "inbox_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      potential_opportunities: {
        Row: {
          id: string;
          user_id: string;
          inbox_id: string;
          company_id: string | null;
          contact_id: string | null;
          opportunity_id: string | null;
          status: "pending" | "accepted" | "dismissed";
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
        Insert: {
          id?: string;
          user_id: string;
          inbox_id: string;
          company_id?: string | null;
          contact_id?: string | null;
          opportunity_id?: string | null;
          status?: "pending" | "accepted" | "dismissed";
          item_type?: InboxItemType;
          company_name: string;
          contact_name?: string | null;
          contact_email?: string | null;
          contact_phone?: string | null;
          company_website?: string | null;
          project_name?: string | null;
          project_description?: string | null;
          deliverables?: string | null;
          estimated_budget?: number | null;
          deadline?: string | null;
          location?: string | null;
          ai_summary: string;
          ai_confidence: number;
          ai_reasoning?: string | null;
          extraction_json?: Json;
          linked_opportunity_id?: string | null;
          linked_quote_id?: string | null;
          linked_project_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          inbox_id?: string;
          company_id?: string | null;
          contact_id?: string | null;
          opportunity_id?: string | null;
          status?: "pending" | "accepted" | "dismissed";
          item_type?: InboxItemType;
          company_name?: string;
          contact_name?: string | null;
          contact_email?: string | null;
          contact_phone?: string | null;
          company_website?: string | null;
          project_name?: string | null;
          project_description?: string | null;
          deliverables?: string | null;
          estimated_budget?: number | null;
          deadline?: string | null;
          location?: string | null;
          ai_summary?: string;
          ai_confidence?: number;
          ai_reasoning?: string | null;
          extraction_json?: Json;
          linked_opportunity_id?: string | null;
          linked_quote_id?: string | null;
          linked_project_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "potential_opportunities_inbox_id_fkey";
            columns: ["inbox_id"];
            isOneToOne: true;
            referencedRelation: "inbox";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "potential_opportunities_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "potential_opportunities_contact_id_fkey";
            columns: ["contact_id"];
            isOneToOne: false;
            referencedRelation: "contacts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "potential_opportunities_opportunity_id_fkey";
            columns: ["opportunity_id"];
            isOneToOne: false;
            referencedRelation: "opportunities";
            referencedColumns: ["id"];
          },
        ];
      };
      ai_classification_logs: {
        Row: {
          id: string;
          inbox_id: string;
          user_id: string;
          ai_category: AiEmailCategory | null;
          ai_confidence: number | null;
          ai_summary: string | null;
          ai_reasoning: string | null;
          model: string;
          prompt_version: string;
          raw_response: Json | null;
          action_taken: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          inbox_id: string;
          user_id: string;
          ai_category?: AiEmailCategory | null;
          ai_confidence?: number | null;
          ai_summary?: string | null;
          ai_reasoning?: string | null;
          model: string;
          prompt_version?: string;
          raw_response?: Json | null;
          action_taken: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          inbox_id?: string;
          user_id?: string;
          ai_category?: AiEmailCategory | null;
          ai_confidence?: number | null;
          ai_summary?: string | null;
          ai_reasoning?: string | null;
          model?: string;
          prompt_version?: string;
          raw_response?: Json | null;
          action_taken?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      ai_classification_feedback: {
        Row: {
          id: string;
          inbox_id: string;
          user_id: string;
          original_category: AiEmailCategory | null;
          corrected_category: AiEmailCategory | null;
          original_confidence: number | null;
          feedback_action: string;
          company_name_override: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          inbox_id: string;
          user_id: string;
          original_category?: AiEmailCategory | null;
          corrected_category?: AiEmailCategory | null;
          original_confidence?: number | null;
          feedback_action: string;
          company_name_override?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          inbox_id?: string;
          user_id?: string;
          original_category?: AiEmailCategory | null;
          corrected_category?: AiEmailCategory | null;
          original_confidence?: number | null;
          feedback_action?: string;
          company_name_override?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      generate_quote_number: {
        Args: Record<string, never>;
        Returns: string;
      };
    };
    Enums: {
      opportunity_status: OpportunityStatus;
      client_status: ClientStatus;
      project_status: ProjectStatus;
      project_priority: ProjectPriority;
      user_role: UserRole;
      team_member_status: TeamMemberStatus;
      quote_status: QuoteStatus;
      discount_type: DiscountType;
      schedule_status: ScheduleStatus;
      ai_email_category: AiEmailCategory;
      inbox_review_status: InboxReviewStatus;
      ai_processing_status: AiProcessingStatus;
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
export type ProjectDeliverable =
  Database["public"]["Tables"]["project_deliverables"]["Row"];
export type ProjectNote = Database["public"]["Tables"]["project_notes"]["Row"];
export type ProjectFile = Database["public"]["Tables"]["project_files"]["Row"];
export type AppSettings = Database["public"]["Tables"]["app_settings"]["Row"];
export type TeamMember = Database["public"]["Tables"]["team_members"]["Row"];
export type Quote = Database["public"]["Tables"]["quotes"]["Row"];
export type QuoteDeliverable =
  Database["public"]["Tables"]["quote_deliverables"]["Row"];
export type QuoteBudgetSection =
  Database["public"]["Tables"]["quote_budget_sections"]["Row"];
export type QuoteBudgetLineItem =
  Database["public"]["Tables"]["quote_budget_line_items"]["Row"];
export type QuotePdfVersion =
  Database["public"]["Tables"]["quote_pdf_versions"]["Row"];
export type ProductionSchedule =
  Database["public"]["Tables"]["production_schedules"]["Row"];
export type ProductionScheduleVersion =
  Database["public"]["Tables"]["production_schedule_versions"]["Row"];
export type ProductionSchedulePdfVersion =
  Database["public"]["Tables"]["production_schedule_pdf_versions"]["Row"];
export type GmailConnection =
  Database["public"]["Tables"]["gmail_connections"]["Row"];
export type InboxEmail = Database["public"]["Tables"]["inbox"]["Row"];

export type InboxAttachment = {
  filename: string;
  mimeType: string;
  size: number;
  attachmentId: string;
};

// Insert types
export type CompanyInsert = Database["public"]["Tables"]["companies"]["Insert"];
export type ContactInsert = Database["public"]["Tables"]["contacts"]["Insert"];
export type OpportunityInsert =
  Database["public"]["Tables"]["opportunities"]["Insert"];
export type ClientInsert = Database["public"]["Tables"]["clients"]["Insert"];
export type ProjectInsert = Database["public"]["Tables"]["projects"]["Insert"];
export type ProjectDeliverableInsert =
  Database["public"]["Tables"]["project_deliverables"]["Insert"];
export type ProjectNoteInsert =
  Database["public"]["Tables"]["project_notes"]["Insert"];
export type ProjectFileInsert =
  Database["public"]["Tables"]["project_files"]["Insert"];
export type AppSettingsInsert =
  Database["public"]["Tables"]["app_settings"]["Insert"];
export type TeamMemberInsert =
  Database["public"]["Tables"]["team_members"]["Insert"];
export type QuoteInsert = Database["public"]["Tables"]["quotes"]["Insert"];
export type QuoteDeliverableInsert =
  Database["public"]["Tables"]["quote_deliverables"]["Insert"];
export type QuoteBudgetSectionInsert =
  Database["public"]["Tables"]["quote_budget_sections"]["Insert"];
export type QuoteBudgetLineItemInsert =
  Database["public"]["Tables"]["quote_budget_line_items"]["Insert"];
export type QuotePdfVersionInsert =
  Database["public"]["Tables"]["quote_pdf_versions"]["Insert"];
export type ProductionScheduleInsert =
  Database["public"]["Tables"]["production_schedules"]["Insert"];
export type ProductionScheduleVersionInsert =
  Database["public"]["Tables"]["production_schedule_versions"]["Insert"];
export type ProductionSchedulePdfVersionInsert =
  Database["public"]["Tables"]["production_schedule_pdf_versions"]["Insert"];
export type GmailConnectionInsert =
  Database["public"]["Tables"]["gmail_connections"]["Insert"];
export type InboxEmailInsert = Database["public"]["Tables"]["inbox"]["Insert"];

// Update types
export type CompanyUpdate = Database["public"]["Tables"]["companies"]["Update"];
export type ContactUpdate = Database["public"]["Tables"]["contacts"]["Update"];
export type OpportunityUpdate =
  Database["public"]["Tables"]["opportunities"]["Update"];
export type ClientUpdate = Database["public"]["Tables"]["clients"]["Update"];
export type ProjectUpdate = Database["public"]["Tables"]["projects"]["Update"];
export type ProjectDeliverableUpdate =
  Database["public"]["Tables"]["project_deliverables"]["Update"];
export type ProjectNoteUpdate =
  Database["public"]["Tables"]["project_notes"]["Update"];
export type ProjectFileUpdate =
  Database["public"]["Tables"]["project_files"]["Update"];
export type AppSettingsUpdate =
  Database["public"]["Tables"]["app_settings"]["Update"];
export type TeamMemberUpdate =
  Database["public"]["Tables"]["team_members"]["Update"];
export type QuoteUpdate = Database["public"]["Tables"]["quotes"]["Update"];
export type QuoteDeliverableUpdate =
  Database["public"]["Tables"]["quote_deliverables"]["Update"];
export type QuoteBudgetSectionUpdate =
  Database["public"]["Tables"]["quote_budget_sections"]["Update"];
export type QuoteBudgetLineItemUpdate =
  Database["public"]["Tables"]["quote_budget_line_items"]["Update"];
export type QuotePdfVersionUpdate =
  Database["public"]["Tables"]["quote_pdf_versions"]["Update"];
export type ProductionScheduleUpdate =
  Database["public"]["Tables"]["production_schedules"]["Update"];
export type ProductionScheduleVersionUpdate =
  Database["public"]["Tables"]["production_schedule_versions"]["Update"];
export type ProductionSchedulePdfVersionUpdate =
  Database["public"]["Tables"]["production_schedule_pdf_versions"]["Update"];
export type GmailConnectionUpdate =
  Database["public"]["Tables"]["gmail_connections"]["Update"];
export type InboxEmailUpdate = Database["public"]["Tables"]["inbox"]["Update"];
