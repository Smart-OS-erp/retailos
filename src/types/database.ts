export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type OrganizationRole =
  | "org_owner"
  | "executive"
  | "merchandising_manager"
  | "store_manager"
  | "viewer";

export type MembershipStatus = "active" | "invited" | "suspended";

export type OnboardingStep =
  | "company_profile"
  | "first_location"
  | "brands"
  | "team"
  | "data_source";

export type OnboardingStepStatus =
  | "not_started"
  | "in_progress"
  | "completed"
  | "skipped";

export type EventScope = "organization" | "location";
export type EventDeliveryStatus =
  | "pending"
  | "processing"
  | "delivered"
  | "failed";

export type DataUploadType =
  | "sample"
  | "inventory_csv"
  | "sales_csv"
  | "product_csv"
  | "store_csv";
export type DataUploadStatus =
  | "received"
  | "parsed"
  | "validation_blocked"
  | "ready"
  | "consolidated"
  | "failed";
export type ValidationSeverity = "blocking" | "warning" | "info";
export type ValidationStatus = "pending" | "blocked" | "warning" | "valid";

export type Database = {
  public: {
    Tables: {
      app_users: {
        Row: {
          id: string;
          display_name: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          display_name?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      organizations: {
        Row: {
          id: string;
          name: string;
          slug: string;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          slug?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      memberships: {
        Row: {
          id: string;
          organization_id: string;
          user_id: string;
          role: OrganizationRole;
          status: MembershipStatus;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          user_id: string;
          role: OrganizationRole;
          status?: MembershipStatus;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          role?: OrganizationRole;
          status?: MembershipStatus;
          updated_at?: string;
        };
        Relationships: [];
      };
      audit_events: {
        Row: {
          id: string;
          organization_id: string;
          actor_user_id: string | null;
          action: string;
          target_type: string;
          target_id: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          actor_user_id?: string | null;
          action: string;
          target_type: string;
          target_id?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: never;
        Relationships: [];
      };
      locations: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          code: string;
          timezone: string;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          name: string;
          code: string;
          timezone?: string;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          code?: string;
          timezone?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      brands: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          code: string;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          name: string;
          code: string;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          code?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      location_assignments: {
        Row: {
          id: string;
          organization_id: string;
          location_id: string;
          membership_id: string;
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          location_id: string;
          membership_id: string;
          created_by: string;
          created_at?: string;
        };
        Update: never;
        Relationships: [];
      };
      onboarding_checklists: {
        Row: {
          id: string;
          organization_id: string;
          user_id: string;
          step: OnboardingStep;
          status: OnboardingStepStatus;
          completed_at: string | null;
          completed_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          user_id: string;
          step: OnboardingStep;
          status?: OnboardingStepStatus;
          completed_at?: string | null;
          completed_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          status?: OnboardingStepStatus;
          completed_at?: string | null;
          completed_by?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      event_log: {
        Row: {
          id: string;
          organization_id: string;
          location_id: string | null;
          scope: EventScope;
          event_type: string;
          aggregate_type: string;
          aggregate_id: string | null;
          payload: Json;
          idempotency_key: string | null;
          delivery_status: EventDeliveryStatus;
          delivery_attempts: number;
          available_at: string;
          delivered_at: string | null;
          last_error: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          location_id?: string | null;
          scope: EventScope;
          event_type: string;
          aggregate_type: string;
          aggregate_id?: string | null;
          payload?: Json;
          idempotency_key?: string | null;
          delivery_status?: EventDeliveryStatus;
          delivery_attempts?: number;
          available_at?: string;
          delivered_at?: string | null;
          last_error?: string | null;
          created_at?: string;
        };
        Update: never;
        Relationships: [];
      };
      entities: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          entity_type: "retailer" | "brand_owner";
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          name: string;
          entity_type?: "retailer" | "brand_owner";
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          entity_type?: "retailer" | "brand_owner";
          updated_at?: string;
        };
        Relationships: [];
      };
      categories: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          name: string;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: { name?: string; updated_at?: string };
        Relationships: [];
      };
      products: {
        Row: {
          id: string;
          organization_id: string;
          brand_id: string | null;
          category_id: string | null;
          name: string;
          style_code: string;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          brand_id?: string | null;
          category_id?: string | null;
          name: string;
          style_code: string;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          brand_id?: string | null;
          category_id?: string | null;
          name?: string;
          style_code?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      skus: {
        Row: {
          id: string;
          organization_id: string;
          product_id: string;
          sku_code: string;
          size: string | null;
          color: string | null;
          barcode: string | null;
          approved_unit_cost: number | null;
          currency_code: string | null;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          product_id: string;
          sku_code: string;
          size?: string | null;
          color?: string | null;
          barcode?: string | null;
          approved_unit_cost?: number | null;
          currency_code?: string | null;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          product_id?: string;
          sku_code?: string;
          size?: string | null;
          color?: string | null;
          barcode?: string | null;
          approved_unit_cost?: number | null;
          currency_code?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      data_uploads: {
        Row: {
          id: string;
          organization_id: string;
          upload_type: DataUploadType;
          file_name: string;
          content_sha256: string | null;
          byte_size: number;
          row_count: number;
          status: DataUploadStatus;
          warnings_accepted_at: string | null;
          warnings_accepted_by: string | null;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          upload_type: DataUploadType;
          file_name: string;
          content_sha256?: string | null;
          byte_size?: number;
          row_count?: number;
          status?: DataUploadStatus;
          warnings_accepted_at?: string | null;
          warnings_accepted_by?: string | null;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          row_count?: number;
          status?: DataUploadStatus;
          warnings_accepted_at?: string | null;
          warnings_accepted_by?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      raw_upload_rows: {
        Row: {
          id: string;
          organization_id: string;
          upload_id: string;
          row_number: number;
          payload: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          upload_id: string;
          row_number: number;
          payload: Json;
          created_at?: string;
        };
        Update: never;
        Relationships: [];
      };
      staging_inventory_rows: {
        Row: {
          id: string;
          organization_id: string;
          upload_id: string;
          raw_row_id: string;
          location_id: string | null;
          sku_code: string | null;
          product_name: string | null;
          location_code: string | null;
          on_hand_quantity: number | null;
          approved_unit_cost: number | null;
          currency_code: string | null;
          first_available_at: string | null;
          units_sold_90: number | null;
          units_sold_30: number | null;
          validation_status: ValidationStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          upload_id: string;
          raw_row_id: string;
          location_id?: string | null;
          sku_code?: string | null;
          product_name?: string | null;
          location_code?: string | null;
          on_hand_quantity?: number | null;
          approved_unit_cost?: number | null;
          currency_code?: string | null;
          first_available_at?: string | null;
          units_sold_90?: number | null;
          units_sold_30?: number | null;
          validation_status?: ValidationStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          location_id?: string | null;
          sku_code?: string | null;
          product_name?: string | null;
          location_code?: string | null;
          on_hand_quantity?: number | null;
          approved_unit_cost?: number | null;
          currency_code?: string | null;
          first_available_at?: string | null;
          units_sold_90?: number | null;
          units_sold_30?: number | null;
          validation_status?: ValidationStatus;
          updated_at?: string;
        };
        Relationships: [];
      };
      validation_issues: {
        Row: {
          id: string;
          organization_id: string;
          upload_id: string;
          staging_row_id: string | null;
          severity: ValidationSeverity;
          issue_code: string;
          message: string;
          accepted_at: string | null;
          accepted_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          upload_id: string;
          staging_row_id?: string | null;
          severity: ValidationSeverity;
          issue_code: string;
          message: string;
          accepted_at?: string | null;
          accepted_by?: string | null;
          created_at?: string;
        };
        Update: { accepted_at?: string | null; accepted_by?: string | null };
        Relationships: [];
      };
      inventory_snapshots: {
        Row: {
          id: string;
          organization_id: string;
          upload_id: string;
          observed_at: string;
          status: "approved" | "superseded";
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          upload_id: string;
          observed_at: string;
          status?: "approved" | "superseded";
          created_by: string;
          created_at?: string;
        };
        Update: never;
        Relationships: [];
      };
      inventory_positions: {
        Row: {
          id: string;
          organization_id: string;
          snapshot_id: string;
          sku_id: string;
          location_id: string;
          on_hand_quantity: number;
          approved_unit_cost: number | null;
          currency_code: string | null;
          first_available_at: string | null;
          units_sold_90: number | null;
          units_sold_30: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          snapshot_id: string;
          sku_id: string;
          location_id: string;
          on_hand_quantity: number;
          approved_unit_cost?: number | null;
          currency_code?: string | null;
          first_available_at?: string | null;
          units_sold_90?: number | null;
          units_sold_30?: number | null;
          created_at?: string;
        };
        Update: never;
        Relationships: [];
      };
      consolidation_runs: {
        Row: {
          id: string;
          organization_id: string;
          upload_id: string;
          source_sha256: string;
          approval_evidence_sha256: string;
          source_row_count: number;
          status: "completed" | "failed";
          snapshot_id: string | null;
          inserted_count: number;
          updated_count: number;
          excluded_count: number;
          approved_by: string;
          approved_at: string;
          completed_at: string | null;
          created_at: string;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      consolidation_items: {
        Row: {
          id: string;
          organization_id: string;
          consolidation_run_id: string;
          staging_row_id: string;
          sku_id: string;
          location_id: string;
          outcome: "inserted" | "updated";
          source_evidence: Json;
          created_at: string;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      intelligence_runs: {
        Row: {
          id: string;
          organization_id: string;
          snapshot_id: string;
          rule_version: string;
          status: "completed" | "failed";
          evaluated_at: string;
          created_by: string;
          created_at: string;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      inventory_risk_insights: {
        Row: {
          id: string;
          organization_id: string;
          intelligence_run_id: string;
          inventory_position_id: string;
          location_id: string;
          age_status: "known" | "unknown";
          age_days: number | null;
          age_band: "fresh" | "watch" | "aged" | "dead" | null;
          sales_status: "known" | "unknown";
          sales_trend:
            | "growing"
            | "stable"
            | "declining"
            | "new_activity"
            | "no_sales"
            | null;
          data_confidence_status: "known" | "suppressed";
          data_confidence_score: number;
          inventory_risk_status: "known" | "unknown" | "suppressed";
          inventory_risk_score: number | null;
          inventory_risk_band: "low" | "moderate" | "high" | "critical" | null;
          recovery_opportunity_status: "known" | "unknown" | "suppressed";
          recovery_opportunity_score: number | null;
          recovery_opportunity_band: "monitor" | "review" | "strong" | null;
          attention_priority_status: "known" | "unknown" | "suppressed";
          attention_priority_score: number | null;
          attention_priority_band: "low" | "medium" | "high" | "urgent" | null;
          inventory_value: number | null;
          currency_code: string | null;
          suppression_reason: string | null;
          rule_version: string;
          evidence: Json;
          caveats: Json;
          evaluated_at: string;
          created_at: string;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      recovery_opportunities: {
        Row: {
          id: string;
          organization_id: string;
          inventory_risk_insight_id: string;
          location_id: string;
          title: string;
          proposed_action:
            | "investigate"
            | "remediate"
            | "bundle"
            | "markdown"
            | "campaign"
            | "transfer";
          status: "open" | "dismissed" | "projectised";
          recovery_opportunity_score: number;
          recovery_opportunity_band: "review" | "strong";
          attention_priority_score: number;
          attention_priority_band: "low" | "medium" | "high" | "urgent";
          estimated_value: number;
          currency_code: string;
          rule_version: string;
          evidence: Json;
          caveats: Json;
          created_at: string;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      executive_briefings: {
        Row: {
          id: string;
          organization_id: string;
          intelligence_run_id: string;
          summary: Json;
          caveats: Json;
          rule_version: string;
          generated_at: string;
          created_at: string;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      action_cards: {
        Row: {
          id: string;
          organization_id: string;
          recovery_opportunity_id: string;
          location_id: string;
          title: string;
          proposed_action: string;
          priority_band: "low" | "medium" | "high" | "urgent";
          status: "open" | "dismissed" | "projectised";
          evidence: Json;
          created_at: string;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      recovery_projects: {
        Row: {
          id: string;
          organization_id: string;
          recovery_opportunity_id: string;
          location_id: string;
          name: string;
          status:
            | "draft"
            | "pending_approval"
            | "approved"
            | "in_progress"
            | "completed"
            | "cancelled";
          version: number;
          evidence_version: string;
          evidence_snapshot: Json;
          created_by: string;
          submitted_by: string | null;
          submitted_at: string | null;
          approved_by: string | null;
          approved_at: string | null;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      recovery_project_skus: {
        Row: {
          id: string;
          organization_id: string;
          recovery_project_id: string;
          inventory_position_id: string;
          sku_id: string;
          location_id: string;
          quantity: number;
          approved_unit_cost: number | null;
          currency_code: string | null;
          evidence: Json;
          created_at: string;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      recovery_project_tasks: {
        Row: {
          id: string;
          organization_id: string;
          recovery_project_id: string;
          location_id: string;
          title: string;
          status: "pending" | "in_progress" | "completed";
          version: number;
          assigned_membership_id: string | null;
          evidence: Json;
          created_by: string;
          completed_by: string | null;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      campaign_briefs: {
        Row: {
          id: string;
          organization_id: string;
          recovery_project_id: string;
          location_id: string;
          status: "draft" | "pending_approval" | "approved";
          version: number;
          content: Json;
          evidence_version: string;
          evidence_snapshot: Json;
          created_by: string;
          approved_by: string | null;
          approved_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      approval_records: {
        Row: {
          id: string;
          organization_id: string;
          recovery_project_id: string;
          campaign_brief_id: string | null;
          location_id: string;
          subject_type: "recovery_project" | "campaign_brief";
          subject_version: number;
          evidence_version: string;
          decision: "approved";
          decided_by: string;
          decided_at: string;
          created_at: string;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      sales_facts: {
        Row: {
          id: string;
          organization_id: string;
          upload_id: string;
          sku_id: string;
          location_id: string;
          sold_at: string;
          quantity: number;
          gross_amount: number | null;
          currency_code: string | null;
          source_record_key: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          upload_id: string;
          sku_id: string;
          location_id: string;
          sold_at: string;
          quantity: number;
          gross_amount?: number | null;
          currency_code?: string | null;
          source_record_key?: string | null;
          created_at?: string;
        };
        Update: never;
        Relationships: [];
      };
    };
    Views: {
      current_inventory_positions: {
        Row: {
          id: string;
          organization_id: string;
          snapshot_id: string;
          observed_at: string;
          sku_id: string;
          sku_code: string;
          product_id: string;
          product_name: string;
          brand_id: string | null;
          location_id: string;
          location_name: string;
          location_code: string;
          on_hand_quantity: number;
          approved_unit_cost: number | null;
          currency_code: string | null;
          first_available_at: string | null;
          units_sold_90: number | null;
          units_sold_30: number | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      create_organization: {
        Args: {
          organization_name: string;
          organization_slug: string;
        };
        Returns: string;
      };
      set_onboarding_step: {
        Args: {
          target_organization_id: string;
          target_step: OnboardingStep;
          target_status: OnboardingStepStatus;
        };
        Returns: undefined;
      };
      accept_inventory_upload_warnings: {
        Args: { target_upload_id: string };
        Returns: undefined;
      };
      consolidate_inventory_upload: {
        Args: {
          target_upload_id: string;
          expected_content_sha256: string;
        };
        Returns: string;
      };
      run_inventory_recovery_intelligence: {
        Args: Record<string, never>;
        Returns: string;
      };
      create_recovery_project: {
        Args: { target_opportunity_id: string };
        Returns: string;
      };
      submit_recovery_project: {
        Args: { target_project_id: string; expected_version: number };
        Returns: number;
      };
      approve_recovery_project: {
        Args: { target_project_id: string; expected_version: number };
        Returns: number;
      };
      approve_campaign_brief: {
        Args: { target_brief_id: string; expected_version: number };
        Returns: number;
      };
      set_recovery_task_status: {
        Args: {
          target_task_id: string;
          expected_version: number;
          target_status: string;
        };
        Returns: number;
      };
    };
    Enums: {
      membership_status: MembershipStatus;
      organization_role: OrganizationRole;
      onboarding_step: OnboardingStep;
      onboarding_step_status: OnboardingStepStatus;
      event_scope: EventScope;
      event_delivery_status: EventDeliveryStatus;
    };
    CompositeTypes: Record<string, never>;
  };
};
