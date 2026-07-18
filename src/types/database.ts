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
export type IntegrationConnectorDepth = "manual" | "scaffold" | "mvp" | "api";
export type IntegrationCredentialStatus =
  | "missing"
  | "configured"
  | "not_required"
  | "expired"
  | "revoked";
export type IntegrationSourceSystem =
  | "manual_file"
  | "shopify"
  | "woocommerce"
  | "google_sheets"
  | "pos_erp"
  | "custom_backend"
  | "import_api";
export type DataSourceStatus =
  | "draft"
  | "configuration_required"
  | "connected"
  | "syncing"
  | "paused"
  | "disabled"
  | "error";
export type SyncJobTrigger = "manual" | "scheduled" | "webhook" | "api";
export type SyncJobStatus =
  | "queued"
  | "running"
  | "succeeded"
  | "partially_succeeded"
  | "failed"
  | "cancelled";
export type ExternalRecordStatus =
  | "received"
  | "mapped"
  | "validation_blocked"
  | "normalized"
  | "ignored"
  | "error";
export type ExternalRecordNormalizationRunStatus = "completed" | "failed";
export type IntelligenceRecalculationRunStatus =
  | "completed"
  | "skipped"
  | "failed";
export type IntelligenceRecalculationSourceType =
  | "inventory_consolidation"
  | "external_record_approval";
export type IntelligenceRecalculationSourceRecordType =
  | "product_master"
  | "store_master"
  | "sales_history";
export type WebhookEventStatus =
  | "received"
  | "verified"
  | "processed"
  | "failed"
  | "ignored";
export type ImportApiCredentialStatus = "active" | "revoked" | "expired";
export type ImportApiIdempotencyStatus =
  | "reserved"
  | "completed"
  | "failed"
  | "expired";

export type StockAdjustmentStatus =
  | "pending_approval"
  | "approved"
  | "rejected"
  | "cancelled"
  | "executed"
  | "reversed";
export type TransferRequestStatus =
  | "pending_approval"
  | "approved"
  | "rejected"
  | "cancelled"
  | "picking"
  | "dispatched"
  | "in_transit"
  | "partially_received"
  | "received"
  | "exception";
export type InventoryMovementType =
  | "adjustment"
  | "transfer_out"
  | "transfer_in"
  | "count_correction";
export type InventoryMovementSourceType =
  | "stock_adjustment"
  | "transfer_request"
  | "stock_count";
export type TransferDiscrepancyStatus = "open" | "resolved" | "dismissed";
export type TransferDiscrepancyType = "short_receipt" | "damaged_in_transit";
export type StockCountStatus =
  | "submitted"
  | "reviewed"
  | "closed"
  | "cancelled";
export type ReconciliationIssueStatus = "open" | "resolved" | "dismissed";
export type StockWatchStatus =
  | "out_of_stock"
  | "low_stock"
  | "overstock"
  | "in_transit"
  | "healthy";
export type StockWatchSeverity = "high" | "medium" | "low" | "info";

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
      intelligence_recalculation_runs: {
        Row: {
          id: string;
          organization_id: string;
          source_type: IntelligenceRecalculationSourceType;
          source_id: string;
          source_record_type: IntelligenceRecalculationSourceRecordType | null;
          trigger_mode: "automatic";
          status: IntelligenceRecalculationRunStatus;
          intelligence_run_id: string | null;
          reason: string | null;
          metadata: Json;
          requested_by: string;
          requested_at: string;
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
      copilot_activity_log: {
        Row: {
          id: string;
          organization_id: string;
          user_id: string;
          question_category: string;
          subject_id: string | null;
          response_status:
            | "answered"
            | "insufficient_evidence"
            | "refused";
          response_summary: string;
          citations: Json;
          rule_version: string;
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
      integration_providers: {
        Row: {
          id: string;
          provider_key: string;
          display_name: string;
          source_system: IntegrationSourceSystem;
          default_connector_depth: IntegrationConnectorDepth;
          default_credential_status: IntegrationCredentialStatus;
          supports_manual_sync: boolean;
          supports_webhooks: boolean;
          is_enabled: boolean;
          help_text: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          provider_key: string;
          display_name: string;
          source_system: IntegrationSourceSystem;
          default_connector_depth: IntegrationConnectorDepth;
          default_credential_status: IntegrationCredentialStatus;
          supports_manual_sync?: boolean;
          supports_webhooks?: boolean;
          is_enabled?: boolean;
          help_text: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          display_name?: string;
          default_connector_depth?: IntegrationConnectorDepth;
          default_credential_status?: IntegrationCredentialStatus;
          supports_manual_sync?: boolean;
          supports_webhooks?: boolean;
          is_enabled?: boolean;
          help_text?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      data_sources: {
        Row: {
          id: string;
          organization_id: string;
          provider_id: string;
          name: string;
          source_key: string;
          connector_depth: IntegrationConnectorDepth;
          status: DataSourceStatus;
          credential_status: IntegrationCredentialStatus;
          connection_metadata: Json;
          last_sync_requested_at: string | null;
          last_successful_sync_at: string | null;
          last_error_at: string | null;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          provider_id: string;
          name: string;
          source_key: string;
          connector_depth: IntegrationConnectorDepth;
          status?: DataSourceStatus;
          credential_status?: IntegrationCredentialStatus;
          connection_metadata?: Json;
          last_sync_requested_at?: string | null;
          last_successful_sync_at?: string | null;
          last_error_at?: string | null;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          status?: DataSourceStatus;
          credential_status?: IntegrationCredentialStatus;
          connection_metadata?: Json;
          last_sync_requested_at?: string | null;
          last_successful_sync_at?: string | null;
          last_error_at?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      data_source_sync_schedules: {
        Row: {
          id: string;
          organization_id: string;
          data_source_id: string;
          status: "enabled" | "paused";
          interval_minutes: number;
          next_run_at: string;
          locked_until: string | null;
          last_enqueued_at: string | null;
          last_sync_job_id: string | null;
          failure_count: number;
          run_as_user_id: string;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          data_source_id: string;
          status?: "enabled" | "paused";
          interval_minutes?: number;
          next_run_at?: string;
          locked_until?: string | null;
          last_enqueued_at?: string | null;
          last_sync_job_id?: string | null;
          failure_count?: number;
          run_as_user_id?: string;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          status?: "enabled" | "paused";
          interval_minutes?: number;
          next_run_at?: string;
          locked_until?: string | null;
          last_enqueued_at?: string | null;
          last_sync_job_id?: string | null;
          failure_count?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      external_record_approval_runs: {
        Row: {
          id: string;
          organization_id: string;
          upload_id: string;
          record_type: "product_master" | "store_master" | "sales_history";
          source_sha256: string;
          source_row_count: number;
          inserted_count: number;
          updated_count: number;
          status: "completed";
          approved_by: string;
          approved_at: string;
          created_at: string;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      sync_jobs: {
        Row: {
          id: string;
          organization_id: string;
          data_source_id: string;
          trigger: SyncJobTrigger;
          status: SyncJobStatus;
          idempotency_key: string | null;
          requested_by: string | null;
          attempt_count: number;
          started_at: string | null;
          finished_at: string | null;
          error_summary: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          data_source_id: string;
          trigger: SyncJobTrigger;
          status?: SyncJobStatus;
          idempotency_key?: string | null;
          requested_by?: string | null;
          attempt_count?: number;
          started_at?: string | null;
          finished_at?: string | null;
          error_summary?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          status?: SyncJobStatus;
          attempt_count?: number;
          started_at?: string | null;
          finished_at?: string | null;
          error_summary?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      external_records: {
        Row: {
          id: string;
          organization_id: string;
          data_source_id: string;
          sync_job_id: string | null;
          location_id: string | null;
          record_type: string;
          source_record_key: string;
          source_updated_at: string | null;
          payload: Json;
          payload_hash: string;
          status: ExternalRecordStatus;
          received_by: string | null;
          received_at: string;
          normalized_at: string | null;
        };
        Insert: {
          id?: string;
          organization_id: string;
          data_source_id: string;
          sync_job_id?: string | null;
          location_id?: string | null;
          record_type: string;
          source_record_key: string;
          source_updated_at?: string | null;
          payload: Json;
          payload_hash: string;
          status?: ExternalRecordStatus;
          received_by?: string | null;
          received_at?: string;
          normalized_at?: string | null;
        };
        Update: {
          status?: ExternalRecordStatus;
          normalized_at?: string | null;
        };
        Relationships: [];
      };
      external_record_normalization_runs: {
        Row: {
          id: string;
          organization_id: string;
          data_source_id: string;
          sync_job_id: string;
          upload_id: string;
          status: ExternalRecordNormalizationRunStatus;
          external_record_count: number;
          normalized_count: number;
          validation_blocked_count: number;
          warning_count: number;
          created_by: string;
          created_at: string;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          organization_id: string;
          data_source_id: string;
          sync_job_id: string;
          upload_id: string;
          status: ExternalRecordNormalizationRunStatus;
          external_record_count: number;
          normalized_count?: number;
          validation_blocked_count?: number;
          warning_count?: number;
          created_by: string;
          created_at?: string;
          completed_at?: string | null;
        };
        Update: never;
        Relationships: [];
      };
      sync_errors: {
        Row: {
          id: string;
          organization_id: string;
          sync_job_id: string;
          external_record_id: string | null;
          severity: "warning" | "error" | "critical";
          error_code: string;
          message: string;
          retryable: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          sync_job_id: string;
          external_record_id?: string | null;
          severity?: "warning" | "error" | "critical";
          error_code: string;
          message: string;
          retryable?: boolean;
          created_at?: string;
        };
        Update: never;
        Relationships: [];
      };
      webhook_events: {
        Row: {
          id: string;
          organization_id: string;
          data_source_id: string;
          provider_event_id: string;
          event_type: string;
          payload: Json;
          signature_verified: boolean;
          status: WebhookEventStatus;
          received_at: string;
          processed_at: string | null;
          error_summary: string | null;
        };
        Insert: {
          id?: string;
          organization_id: string;
          data_source_id: string;
          provider_event_id: string;
          event_type: string;
          payload: Json;
          signature_verified?: boolean;
          status?: WebhookEventStatus;
          received_at?: string;
          processed_at?: string | null;
          error_summary?: string | null;
        };
        Update: {
          status?: WebhookEventStatus;
          processed_at?: string | null;
          error_summary?: string | null;
        };
        Relationships: [];
      };
      import_api_credentials: {
        Row: {
          id: string;
          organization_id: string;
          data_source_id: string;
          label: string;
          token_prefix: string;
          token_hash: string;
          hash_algorithm: "hmac-sha256";
          status: ImportApiCredentialStatus;
          created_by: string;
          expires_at: string | null;
          last_used_at: string | null;
          revoked_at: string | null;
          revoked_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          data_source_id: string;
          label: string;
          token_prefix: string;
          token_hash: string;
          hash_algorithm?: "hmac-sha256";
          status?: ImportApiCredentialStatus;
          created_by: string;
          expires_at?: string | null;
          last_used_at?: string | null;
          revoked_at?: string | null;
          revoked_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          label?: string;
          status?: ImportApiCredentialStatus;
          last_used_at?: string | null;
          revoked_at?: string | null;
          revoked_by?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      import_api_idempotency_keys: {
        Row: {
          id: string;
          organization_id: string;
          data_source_id: string;
          credential_id: string;
          idempotency_key: string;
          request_hash: string;
          status: ImportApiIdempotencyStatus;
          sync_job_id: string | null;
          response_summary: Json;
          first_seen_at: string;
          last_seen_at: string;
          expires_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          data_source_id: string;
          credential_id: string;
          idempotency_key: string;
          request_hash: string;
          status?: ImportApiIdempotencyStatus;
          sync_job_id?: string | null;
          response_summary?: Json;
          first_seen_at?: string;
          last_seen_at?: string;
          expires_at?: string;
        };
        Update: {
          status?: ImportApiIdempotencyStatus;
          sync_job_id?: string | null;
          response_summary?: Json;
          last_seen_at?: string;
        };
        Relationships: [];
      };
      import_api_rate_limit_events: {
        Row: {
          id: string;
          organization_id: string;
          data_source_id: string;
          credential_id: string;
          limit_name: string;
          window_started_at: string;
          window_seconds: number;
          request_count: number;
          blocked_count: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          data_source_id: string;
          credential_id: string;
          limit_name: string;
          window_started_at: string;
          window_seconds: number;
          request_count?: number;
          blocked_count?: number;
          created_at?: string;
        };
        Update: {
          request_count?: number;
          blocked_count?: number;
        };
        Relationships: [];
      };
      inventory_movements: {
        Row: {
          id: string;
          organization_id: string;
          sku_id: string;
          location_id: string;
          movement_type: InventoryMovementType;
          source_type: InventoryMovementSourceType;
          source_id: string;
          quantity_delta: number;
          quantity_before: number | null;
          quantity_after: number | null;
          unit_cost: number | null;
          currency_code: string | null;
          occurred_at: string;
          reason: string | null;
          idempotency_key: string | null;
          correlation_id: string;
          reverses_movement_id: string | null;
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          sku_id: string;
          location_id: string;
          movement_type: InventoryMovementType;
          source_type: InventoryMovementSourceType;
          source_id: string;
          quantity_delta: number;
          quantity_before?: number | null;
          quantity_after?: number | null;
          unit_cost?: number | null;
          currency_code?: string | null;
          occurred_at?: string;
          reason?: string | null;
          idempotency_key?: string | null;
          correlation_id?: string;
          reverses_movement_id?: string | null;
          created_by: string;
          created_at?: string;
        };
        Update: never;
        Relationships: [];
      };
      stock_adjustments: {
        Row: {
          id: string;
          organization_id: string;
          location_id: string;
          status: StockAdjustmentStatus;
          reason: string;
          requested_by: string;
          approved_by: string | null;
          rejected_by: string | null;
          executed_by: string | null;
          reversed_by: string | null;
          submitted_at: string;
          approved_at: string | null;
          rejected_at: string | null;
          executed_at: string | null;
          reversed_at: string | null;
          rejection_reason: string | null;
          reversal_reason: string | null;
          correlation_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          location_id: string;
          status?: StockAdjustmentStatus;
          reason: string;
          requested_by: string;
          approved_by?: string | null;
          rejected_by?: string | null;
          executed_by?: string | null;
          reversed_by?: string | null;
          submitted_at?: string;
          approved_at?: string | null;
          rejected_at?: string | null;
          executed_at?: string | null;
          reversed_at?: string | null;
          rejection_reason?: string | null;
          reversal_reason?: string | null;
          correlation_id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          status?: StockAdjustmentStatus;
          approved_by?: string | null;
          rejected_by?: string | null;
          executed_by?: string | null;
          reversed_by?: string | null;
          approved_at?: string | null;
          rejected_at?: string | null;
          executed_at?: string | null;
          reversed_at?: string | null;
          rejection_reason?: string | null;
          reversal_reason?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      stock_adjustment_items: {
        Row: {
          id: string;
          organization_id: string;
          stock_adjustment_id: string;
          sku_id: string;
          quantity_delta: number;
          reason: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          stock_adjustment_id: string;
          sku_id: string;
          quantity_delta: number;
          reason?: string | null;
          created_at?: string;
        };
        Update: never;
        Relationships: [];
      };
      transfer_requests: {
        Row: {
          id: string;
          organization_id: string;
          origin_location_id: string;
          destination_location_id: string;
          status: TransferRequestStatus;
          reason: string;
          requested_by: string;
          approved_by: string | null;
          rejected_by: string | null;
          dispatched_by: string | null;
          received_by: string | null;
          submitted_at: string;
          approved_at: string | null;
          rejected_at: string | null;
          dispatched_at: string | null;
          received_at: string | null;
          rejection_reason: string | null;
          correlation_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          origin_location_id: string;
          destination_location_id: string;
          status?: TransferRequestStatus;
          reason: string;
          requested_by: string;
          approved_by?: string | null;
          rejected_by?: string | null;
          dispatched_by?: string | null;
          received_by?: string | null;
          submitted_at?: string;
          approved_at?: string | null;
          rejected_at?: string | null;
          dispatched_at?: string | null;
          received_at?: string | null;
          rejection_reason?: string | null;
          correlation_id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          status?: TransferRequestStatus;
          approved_by?: string | null;
          rejected_by?: string | null;
          dispatched_by?: string | null;
          received_by?: string | null;
          approved_at?: string | null;
          rejected_at?: string | null;
          dispatched_at?: string | null;
          received_at?: string | null;
          rejection_reason?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      transfer_items: {
        Row: {
          id: string;
          organization_id: string;
          transfer_request_id: string;
          sku_id: string;
          requested_quantity: number;
          approved_quantity: number | null;
          dispatched_quantity: number;
          received_quantity: number;
          damaged_quantity: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          transfer_request_id: string;
          sku_id: string;
          requested_quantity: number;
          approved_quantity?: number | null;
          dispatched_quantity?: number;
          received_quantity?: number;
          damaged_quantity?: number;
          created_at?: string;
        };
        Update: {
          approved_quantity?: number | null;
          dispatched_quantity?: number;
          received_quantity?: number;
          damaged_quantity?: number;
        };
        Relationships: [];
      };
      stock_counts: {
        Row: {
          id: string;
          organization_id: string;
          location_id: string;
          status: StockCountStatus;
          counted_at: string;
          submitted_by: string;
          reviewed_by: string | null;
          reviewed_at: string | null;
          review_notes: string | null;
          closed_by: string | null;
          closed_at: string | null;
          closure_notes: string | null;
          correction_idempotency_key: string | null;
          correlation_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          location_id: string;
          status?: StockCountStatus;
          counted_at: string;
          submitted_by: string;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          review_notes?: string | null;
          closed_by?: string | null;
          closed_at?: string | null;
          closure_notes?: string | null;
          correction_idempotency_key?: string | null;
          correlation_id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          status?: StockCountStatus;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          review_notes?: string | null;
          closed_by?: string | null;
          closed_at?: string | null;
          closure_notes?: string | null;
          correction_idempotency_key?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      stock_count_items: {
        Row: {
          id: string;
          organization_id: string;
          stock_count_id: string;
          sku_id: string;
          expected_quantity: number;
          counted_quantity: number;
          variance_quantity: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          stock_count_id: string;
          sku_id: string;
          expected_quantity: number;
          counted_quantity: number;
          created_at?: string;
        };
        Update: never;
        Relationships: [];
      };
      reconciliation_issues: {
        Row: {
          id: string;
          organization_id: string;
          stock_count_id: string;
          stock_count_item_id: string;
          location_id: string;
          sku_id: string;
          issue_type: "stock_variance";
          severity: "low" | "medium" | "high";
          status: ReconciliationIssueStatus;
          variance_quantity: number;
          created_by: string;
          created_at: string;
          resolved_by: string | null;
          resolved_at: string | null;
          resolution_note: string | null;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      inventory_operation_idempotency_keys: {
        Row: {
          id: string;
          organization_id: string;
          operation_type: string;
          source_id: string;
          idempotency_key: string;
          result: Json;
          created_by: string;
          created_at: string;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      transfer_discrepancies: {
        Row: {
          id: string;
          organization_id: string;
          transfer_request_id: string;
          transfer_item_id: string;
          sku_id: string;
          discrepancy_type: TransferDiscrepancyType;
          expected_quantity: number;
          received_quantity: number;
          damaged_quantity: number;
          variance_quantity: number;
          status: TransferDiscrepancyStatus;
          created_by: string;
          created_at: string;
          resolved_by: string | null;
          resolved_at: string | null;
        };
        Insert: never;
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
      current_inventory_balances: {
        Row: {
          inventory_position_id: string;
          organization_id: string;
          sku_id: string;
          sku_code: string;
          barcode: string | null;
          product_id: string;
          product_name: string;
          brand_id: string | null;
          location_id: string;
          location_name: string;
          location_code: string;
          snapshot_on_hand_quantity: number;
          movement_delta: number;
          on_hand_quantity: number;
          reserved_quantity: number;
          available_quantity: number;
          in_transit_quantity: number;
          damaged_quantity: number;
          quarantined_quantity: number;
          approved_unit_cost: number | null;
          currency_code: string | null;
          observed_at: string;
          first_available_at: string | null;
          units_sold_90: number | null;
          units_sold_30: number | null;
          last_movement_id: string | null;
          last_movement_at: string | null;
        };
        Relationships: [];
      };
      inventory_stock_watchlist: {
        Row: {
          organization_id: string;
          sku_id: string;
          sku_code: string;
          barcode: string | null;
          product_id: string;
          product_name: string;
          location_id: string;
          location_name: string;
          location_code: string;
          on_hand_quantity: number;
          available_quantity: number;
          reserved_quantity: number;
          in_transit_quantity: number;
          units_sold_30: number | null;
          units_sold_90: number | null;
          approved_unit_cost: number | null;
          currency_code: string | null;
          watch_status: StockWatchStatus;
          severity: StockWatchSeverity;
          evidence_summary: string;
          calculated_at: string;
        };
        Relationships: [];
      };
      inventory_lookup_items: {
        Row: {
          organization_id: string;
          sku_id: string;
          sku_code: string;
          barcode: string | null;
          product_id: string;
          product_name: string;
          location_id: string;
          location_name: string;
          location_code: string;
          on_hand_quantity: number;
          available_quantity: number;
          reserved_quantity: number;
          in_transit_quantity: number;
          approved_unit_cost: number | null;
          currency_code: string | null;
          last_movement_at: string | null;
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
      get_retail_copilot_answer: {
        Args: {
          question_category: string;
          target_subject_id?: string | null;
        };
        Returns: Json;
      };
      create_data_source: {
        Args: {
          target_organization_id: string;
          target_provider_key: string;
          target_name: string;
          requested_connector_depth?: IntegrationConnectorDepth | null;
        };
        Returns: string;
      };
      enqueue_data_source_sync: {
        Args: {
          target_data_source_id: string;
          target_idempotency_key?: string | null;
        };
        Returns: string;
      };
      create_import_api_credential: {
        Args: {
          target_data_source_id: string;
          target_label: string;
          target_token_prefix: string;
          target_token_hash: string;
          target_expires_at?: string | null;
        };
        Returns: string;
      };
      revoke_import_api_credential: {
        Args: {
          target_credential_id: string;
        };
        Returns: undefined;
      };
      normalize_external_records: {
        Args: {
          target_sync_job_id: string;
        };
        Returns: string;
      };
      approve_product_master_records: {
        Args: {
          target_upload_id: string;
          expected_content_sha256: string;
        };
        Returns: string;
      };
      approve_store_master_records: {
        Args: {
          target_upload_id: string;
          expected_content_sha256: string;
        };
        Returns: string;
      };
      approve_sales_history_records: {
        Args: {
          target_upload_id: string;
          expected_content_sha256: string;
        };
        Returns: string;
      };
      create_stock_adjustment: {
        Args: {
          target_location_id: string;
          target_reason: string;
          target_items: Json;
        };
        Returns: string;
      };
      approve_stock_adjustment: {
        Args: { target_adjustment_id: string };
        Returns: string;
      };
      reject_stock_adjustment: {
        Args: {
          target_adjustment_id: string;
          target_rejection_reason?: string | null;
        };
        Returns: string;
      };
      execute_stock_adjustment: {
        Args: {
          target_adjustment_id: string;
          target_idempotency_key: string;
        };
        Returns: string;
      };
      reverse_stock_adjustment: {
        Args: {
          target_adjustment_id: string;
          target_reversal_reason: string;
          target_idempotency_key: string;
        };
        Returns: string;
      };
      create_transfer_request: {
        Args: {
          origin_location_id: string;
          destination_location_id: string;
          target_reason: string;
          target_items: Json;
        };
        Returns: string;
      };
      approve_transfer_request: {
        Args: { target_transfer_id: string };
        Returns: string;
      };
      reject_transfer_request: {
        Args: {
          target_transfer_id: string;
          target_rejection_reason?: string | null;
        };
        Returns: string;
      };
      dispatch_transfer_request: {
        Args: {
          target_transfer_id: string;
          target_idempotency_key: string;
        };
        Returns: string;
      };
      receive_transfer_request: {
        Args: {
          target_transfer_id: string;
          target_receipts: Json;
          target_idempotency_key: string;
        };
        Returns: string;
      };
      submit_stock_count: {
        Args: {
          target_location_id: string;
          target_counted_at: string;
          target_items: Json;
        };
        Returns: string;
      };
      review_stock_count: {
        Args: {
          target_stock_count_id: string;
          target_review_notes?: string | null;
        };
        Returns: string;
      };
      close_stock_count: {
        Args: {
          target_stock_count_id: string;
          target_issue_decisions?: Json;
          target_create_corrections?: boolean;
          target_idempotency_key?: string | null;
          target_closure_notes?: string | null;
        };
        Returns: string;
      };
      search_inventory_items: {
        Args: {
          search_term: string;
          target_location_id?: string | null;
          result_limit?: number;
        };
        Returns: {
          location_id: string;
          location_name: string;
          product_name: string;
          sku_code: string;
          sku_id: string;
          barcode: string | null;
          on_hand_quantity: number;
        }[];
      };
    };
    Enums: {
      membership_status: MembershipStatus;
      organization_role: OrganizationRole;
      onboarding_step: OnboardingStep;
      onboarding_step_status: OnboardingStepStatus;
      event_scope: EventScope;
      event_delivery_status: EventDeliveryStatus;
      integration_connector_depth: IntegrationConnectorDepth;
      integration_credential_status: IntegrationCredentialStatus;
      data_source_status: DataSourceStatus;
      sync_job_trigger: SyncJobTrigger;
      sync_job_status: SyncJobStatus;
      external_record_status: ExternalRecordStatus;
      webhook_event_status: WebhookEventStatus;
      import_api_credential_status: ImportApiCredentialStatus;
      import_api_idempotency_status: ImportApiIdempotencyStatus;
    };
    CompositeTypes: Record<string, never>;
  };
};
