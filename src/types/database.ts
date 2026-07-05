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
    };
    Views: Record<string, never>;
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
