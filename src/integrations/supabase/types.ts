export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      applications: {
        Row: {
          applicant_address: string | null
          applicant_email: string | null
          applicant_id: string
          applicant_id_number: string | null
          applicant_name: string | null
          applicant_phone: string | null
          application_number: string | null
          approved_at: string | null
          created_at: string | null
          crop_types: string[] | null
          cultivation_methods: string[] | null
          expected_yield: string | null
          farm_address: string | null
          farm_area_ngan: number | null
          farm_area_rai: number | null
          farm_area_wah: number | null
          farm_coordinates: string | null
          farm_name: string | null
          id: string
          metadata: Json | null
          organization_name: string | null
          organization_registration: string | null
          representative_name: string | null
          representative_position: string | null
          responsible_person: string | null
          reviewer_comments: string | null
          revision_count: number | null
          revision_reason: string | null
          staff_count: number | null
          status: Database["public"]["Enums"]["application_status"] | null
          submitted_at: string | null
          training_completed: boolean | null
          training_date: string | null
          updated_at: string | null
        }
        Insert: {
          applicant_address?: string | null
          applicant_email?: string | null
          applicant_id: string
          applicant_id_number?: string | null
          applicant_name?: string | null
          applicant_phone?: string | null
          application_number?: string | null
          approved_at?: string | null
          created_at?: string | null
          crop_types?: string[] | null
          cultivation_methods?: string[] | null
          expected_yield?: string | null
          farm_address?: string | null
          farm_area_ngan?: number | null
          farm_area_rai?: number | null
          farm_area_wah?: number | null
          farm_coordinates?: string | null
          farm_name?: string | null
          id?: string
          metadata?: Json | null
          organization_name?: string | null
          organization_registration?: string | null
          representative_name?: string | null
          representative_position?: string | null
          responsible_person?: string | null
          reviewer_comments?: string | null
          revision_count?: number | null
          revision_reason?: string | null
          staff_count?: number | null
          status?: Database["public"]["Enums"]["application_status"] | null
          submitted_at?: string | null
          training_completed?: boolean | null
          training_date?: string | null
          updated_at?: string | null
        }
        Update: {
          applicant_address?: string | null
          applicant_email?: string | null
          applicant_id?: string
          applicant_id_number?: string | null
          applicant_name?: string | null
          applicant_phone?: string | null
          application_number?: string | null
          approved_at?: string | null
          created_at?: string | null
          crop_types?: string[] | null
          cultivation_methods?: string[] | null
          expected_yield?: string | null
          farm_address?: string | null
          farm_area_ngan?: number | null
          farm_area_rai?: number | null
          farm_area_wah?: number | null
          farm_coordinates?: string | null
          farm_name?: string | null
          id?: string
          metadata?: Json | null
          organization_name?: string | null
          organization_registration?: string | null
          representative_name?: string | null
          representative_position?: string | null
          responsible_person?: string | null
          reviewer_comments?: string | null
          revision_count?: number | null
          revision_reason?: string | null
          staff_count?: number | null
          status?: Database["public"]["Enums"]["application_status"] | null
          submitted_at?: string | null
          training_completed?: boolean | null
          training_date?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "applications_applicant_id_fkey"
            columns: ["applicant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      assessments: {
        Row: {
          application_id: string
          auditor_id: string | null
          checklist_data: Json | null
          completed_at: string | null
          created_at: string | null
          criteria_scores: Json | null
          detailed_report: string | null
          duration_minutes: number | null
          evidence_urls: string[] | null
          id: string
          meeting_token: string | null
          meeting_url: string | null
          notes: string | null
          onsite_address: string | null
          onsite_photos: string[] | null
          passed: boolean | null
          recording_duration: number | null
          recording_url: string | null
          report_pdf_url: string | null
          result_summary: string | null
          scheduled_at: string | null
          score: number | null
          screenshots_urls: string[] | null
          started_at: string | null
          status: Database["public"]["Enums"]["assessment_status"] | null
          travel_notes: string | null
          type: Database["public"]["Enums"]["assessment_type"]
        }
        Insert: {
          application_id: string
          auditor_id?: string | null
          checklist_data?: Json | null
          completed_at?: string | null
          created_at?: string | null
          criteria_scores?: Json | null
          detailed_report?: string | null
          duration_minutes?: number | null
          evidence_urls?: string[] | null
          id?: string
          meeting_token?: string | null
          meeting_url?: string | null
          notes?: string | null
          onsite_address?: string | null
          onsite_photos?: string[] | null
          passed?: boolean | null
          recording_duration?: number | null
          recording_url?: string | null
          report_pdf_url?: string | null
          result_summary?: string | null
          scheduled_at?: string | null
          score?: number | null
          screenshots_urls?: string[] | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["assessment_status"] | null
          travel_notes?: string | null
          type: Database["public"]["Enums"]["assessment_type"]
        }
        Update: {
          application_id?: string
          auditor_id?: string | null
          checklist_data?: Json | null
          completed_at?: string | null
          created_at?: string | null
          criteria_scores?: Json | null
          detailed_report?: string | null
          duration_minutes?: number | null
          evidence_urls?: string[] | null
          id?: string
          meeting_token?: string | null
          meeting_url?: string | null
          notes?: string | null
          onsite_address?: string | null
          onsite_photos?: string[] | null
          passed?: boolean | null
          recording_duration?: number | null
          recording_url?: string | null
          report_pdf_url?: string | null
          result_summary?: string | null
          scheduled_at?: string | null
          score?: number | null
          screenshots_urls?: string[] | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["assessment_status"] | null
          travel_notes?: string | null
          type?: Database["public"]["Enums"]["assessment_type"]
        }
        Relationships: [
          {
            foreignKeyName: "assessments_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessments_auditor_id_fkey"
            columns: ["auditor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          application_number: string | null
          details: Json | null
          error_message: string | null
          id: string
          ip_address: unknown | null
          new_values: Json | null
          old_values: Json | null
          outcome: string | null
          resource_id: string | null
          resource_type: string
          session_id: string | null
          timestamp: string | null
          user_agent: string | null
          user_email: string | null
          user_id: string | null
          user_role: Database["public"]["Enums"]["user_role"] | null
        }
        Insert: {
          action: string
          application_number?: string | null
          details?: Json | null
          error_message?: string | null
          id?: string
          ip_address?: unknown | null
          new_values?: Json | null
          old_values?: Json | null
          outcome?: string | null
          resource_id?: string | null
          resource_type: string
          session_id?: string | null
          timestamp?: string | null
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
          user_role?: Database["public"]["Enums"]["user_role"] | null
        }
        Update: {
          action?: string
          application_number?: string | null
          details?: Json | null
          error_message?: string | null
          id?: string
          ip_address?: unknown | null
          new_values?: Json | null
          old_values?: Json | null
          outcome?: string | null
          resource_id?: string | null
          resource_type?: string
          session_id?: string | null
          timestamp?: string | null
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
          user_role?: Database["public"]["Enums"]["user_role"] | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      certificates: {
        Row: {
          applicant_name: string
          application_id: string
          certificate_number: string
          created_at: string | null
          crop_types: string[] | null
          expires_at: string
          farm_address: string | null
          farm_name: string | null
          id: string
          is_active: boolean | null
          issued_at: string | null
          organization_name: string | null
          pdf_url: string | null
          qr_code_data: string | null
          qr_code_image_url: string | null
          revoked_at: string | null
          revoked_by: string | null
          revoked_reason: string | null
          valid_from: string
          validity_period_months: number | null
          verification_code: string | null
          verification_url: string | null
        }
        Insert: {
          applicant_name: string
          application_id: string
          certificate_number: string
          created_at?: string | null
          crop_types?: string[] | null
          expires_at: string
          farm_address?: string | null
          farm_name?: string | null
          id?: string
          is_active?: boolean | null
          issued_at?: string | null
          organization_name?: string | null
          pdf_url?: string | null
          qr_code_data?: string | null
          qr_code_image_url?: string | null
          revoked_at?: string | null
          revoked_by?: string | null
          revoked_reason?: string | null
          valid_from: string
          validity_period_months?: number | null
          verification_code?: string | null
          verification_url?: string | null
        }
        Update: {
          applicant_name?: string
          application_id?: string
          certificate_number?: string
          created_at?: string | null
          crop_types?: string[] | null
          expires_at?: string
          farm_address?: string | null
          farm_name?: string | null
          id?: string
          is_active?: boolean | null
          issued_at?: string | null
          organization_name?: string | null
          pdf_url?: string | null
          qr_code_data?: string | null
          qr_code_image_url?: string | null
          revoked_at?: string | null
          revoked_by?: string | null
          revoked_reason?: string | null
          valid_from?: string
          validity_period_months?: number | null
          verification_code?: string | null
          verification_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "certificates_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificates_revoked_by_fkey"
            columns: ["revoked_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          application_id: string
          document_type: Database["public"]["Enums"]["document_type"]
          file_name: string
          file_size: number | null
          id: string
          mime_type: string | null
          reviewer_notes: string | null
          s3_key: string
          s3_url: string | null
          uploaded_at: string | null
          uploaded_by: string | null
          verified: boolean | null
          virus_scan_status: string | null
        }
        Insert: {
          application_id: string
          document_type: Database["public"]["Enums"]["document_type"]
          file_name: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          reviewer_notes?: string | null
          s3_key: string
          s3_url?: string | null
          uploaded_at?: string | null
          uploaded_by?: string | null
          verified?: boolean | null
          virus_scan_status?: string | null
        }
        Update: {
          application_id?: string
          document_type?: Database["public"]["Enums"]["document_type"]
          file_name?: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          reviewer_notes?: string | null
          s3_key?: string
          s3_url?: string | null
          uploaded_at?: string | null
          uploaded_by?: string | null
          verified?: boolean | null
          virus_scan_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          action_label: string | null
          action_url: string | null
          created_at: string
          id: string
          message: string
          priority: string
          read: boolean
          related_id: string | null
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          action_label?: string | null
          action_url?: string | null
          created_at?: string
          id?: string
          message: string
          priority?: string
          read?: boolean
          related_id?: string | null
          title: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          action_label?: string | null
          action_url?: string | null
          created_at?: string
          id?: string
          message?: string
          priority?: string
          read?: boolean
          related_id?: string | null
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          application_id: string
          checkout_url: string | null
          created_at: string | null
          currency: string | null
          gateway_name: string | null
          gateway_payment_id: string | null
          gateway_session_id: string | null
          id: string
          milestone: number
          paid_at: string | null
          payment_method: string | null
          receipt_url: string | null
          status: Database["public"]["Enums"]["payment_status"] | null
          updated_at: string | null
          webhook_data: Json | null
          webhook_received_at: string | null
        }
        Insert: {
          amount: number
          application_id: string
          checkout_url?: string | null
          created_at?: string | null
          currency?: string | null
          gateway_name?: string | null
          gateway_payment_id?: string | null
          gateway_session_id?: string | null
          id?: string
          milestone: number
          paid_at?: string | null
          payment_method?: string | null
          receipt_url?: string | null
          status?: Database["public"]["Enums"]["payment_status"] | null
          updated_at?: string | null
          webhook_data?: Json | null
          webhook_received_at?: string | null
        }
        Update: {
          amount?: number
          application_id?: string
          checkout_url?: string | null
          created_at?: string | null
          currency?: string | null
          gateway_name?: string | null
          gateway_payment_id?: string | null
          gateway_session_id?: string | null
          id?: string
          milestone?: number
          paid_at?: string | null
          payment_method?: string | null
          receipt_url?: string | null
          status?: Database["public"]["Enums"]["payment_status"] | null
          updated_at?: string | null
          webhook_data?: Json | null
          webhook_received_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      pricing_tiers: {
        Row: {
          assessment_fee: number | null
          certificate_fee: number | null
          created_at: string | null
          description: string | null
          features: Json | null
          id: string
          is_active: boolean | null
          is_default: boolean | null
          max_farm_area: number | null
          name: string
          price: number
          product_id: string | null
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          assessment_fee?: number | null
          certificate_fee?: number | null
          created_at?: string | null
          description?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          max_farm_area?: number | null
          name: string
          price: number
          product_id?: string | null
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          assessment_fee?: number | null
          certificate_fee?: number | null
          created_at?: string | null
          description?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          max_farm_area?: number | null
          name?: string
          price?: number
          product_id?: string | null
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pricing_tiers_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_categories: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      products: {
        Row: {
          assessment_type: string | null
          category_id: string | null
          created_at: string | null
          currency: string | null
          description: string | null
          duration_days: number | null
          features: Json | null
          id: string
          is_active: boolean | null
          metadata: Json | null
          name: string
          price: number
          requirements: Json | null
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          assessment_type?: string | null
          category_id?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          duration_days?: number | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          name: string
          price?: number
          requirements?: Json | null
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          assessment_type?: string | null
          category_id?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          duration_days?: number | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          name?: string
          price?: number
          requirements?: Json | null
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          created_at: string | null
          email: string
          full_name: string
          id: string
          is_active: boolean | null
          last_login_at: string | null
          organization_name: string | null
          phone: string | null
          preferred_language: string | null
          role: Database["public"]["Enums"]["user_role"]
          thai_id_number: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          email: string
          full_name: string
          id?: string
          is_active?: boolean | null
          last_login_at?: string | null
          organization_name?: string | null
          phone?: string | null
          preferred_language?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          thai_id_number?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string | null
          email?: string
          full_name?: string
          id?: string
          is_active?: boolean | null
          last_login_at?: string | null
          organization_name?: string | null
          phone?: string | null
          preferred_language?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          thai_id_number?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          action_type: string
          attempt_count: number | null
          blocked_until: string | null
          created_at: string | null
          id: string
          identifier: string
          window_start: string | null
        }
        Insert: {
          action_type: string
          attempt_count?: number | null
          blocked_until?: string | null
          created_at?: string | null
          id?: string
          identifier: string
          window_start?: string | null
        }
        Update: {
          action_type?: string
          attempt_count?: number | null
          blocked_until?: string | null
          created_at?: string | null
          id?: string
          identifier?: string
          window_start?: string | null
        }
        Relationships: []
      }
      reviews: {
        Row: {
          application_id: string
          checklist_items: Json | null
          comments: string | null
          created_at: string | null
          decision: string
          id: string
          internal_notes: string | null
          reasons: string[] | null
          required_documents: Json | null
          review_duration_minutes: number | null
          reviewer_id: string
        }
        Insert: {
          application_id: string
          checklist_items?: Json | null
          comments?: string | null
          created_at?: string | null
          decision: string
          id?: string
          internal_notes?: string | null
          reasons?: string[] | null
          required_documents?: Json | null
          review_duration_minutes?: number | null
          reviewer_id: string
        }
        Update: {
          application_id?: string
          checklist_items?: Json | null
          comments?: string | null
          created_at?: string | null
          decision?: string
          id?: string
          internal_notes?: string | null
          reasons?: string[] | null
          required_documents?: Json | null
          review_duration_minutes?: number | null
          reviewer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      system_config: {
        Row: {
          description: string | null
          id: string
          key: string
          updated_at: string | null
          updated_by: string | null
          value: Json
        }
        Insert: {
          description?: string | null
          id?: string
          key: string
          updated_at?: string | null
          updated_by?: string | null
          value: Json
        }
        Update: {
          description?: string | null
          id?: string
          key?: string
          updated_at?: string | null
          updated_by?: string | null
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "system_config_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_access_application_sensitive_data: {
        Args: { app_id: string }
        Returns: boolean
      }
      check_rate_limit: {
        Args: {
          action_type_val: string
          identifier_val: string
          max_attempts?: number
          window_minutes?: number
        }
        Returns: boolean
      }
      generate_application_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_certificate_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_admin_stats: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_identity_verification_status: {
        Args: { target_user_id: string }
        Returns: Json
      }
      get_safe_profile: {
        Args: { target_user_id?: string }
        Returns: Json
      }
      is_admin: {
        Args: { user_id: string }
        Returns: boolean
      }
      log_audit_event: {
        Args: {
          p_action: string
          p_details?: Json
          p_new_values?: Json
          p_old_values?: Json
          p_resource_id?: string
          p_resource_type: string
          p_user_id: string
        }
        Returns: string
      }
      log_auth_failure: {
        Args: { email_attempt: string; failure_reason: string }
        Returns: undefined
      }
      log_security_event: {
        Args: {
          p_details?: Json
          p_event_type: string
          p_severity?: string
          p_user_id: string
        }
        Returns: string
      }
      update_application_status: {
        Args: {
          p_application_id: string
          p_comments?: string
          p_new_status: Database["public"]["Enums"]["application_status"]
          p_user_id: string
        }
        Returns: boolean
      }
      update_user_role: {
        Args: {
          new_role: Database["public"]["Enums"]["user_role"]
          target_user_id: string
        }
        Returns: boolean
      }
      verify_certificate: {
        Args: { cert_number: string }
        Returns: Json
      }
      verify_identity_access: {
        Args: { target_user_id: string }
        Returns: Json
      }
    }
    Enums: {
      application_status:
        | "DRAFT"
        | "SUBMITTED"
        | "UNDER_REVIEW"
        | "RETURNED"
        | "DOCS_APPROVED"
        | "PAYMENT_PENDING"
        | "ONLINE_SCHEDULED"
        | "ONLINE_COMPLETED"
        | "ONSITE_SCHEDULED"
        | "ONSITE_COMPLETED"
        | "CERTIFIED"
        | "REVOKED"
      assessment_status: "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED"
      assessment_type: "ONLINE" | "ONSITE"
      document_type:
        | "GTL1_FORM"
        | "COA_CERTIFICATE"
        | "FARM_MAP"
        | "PHOTOS"
        | "TRAINING_RECORDS"
        | "BUSINESS_LICENSE"
        | "ID_CARD"
        | "STAFF_LIST"
        | "SOP_DOCUMENTS"
        | "OTHER"
      payment_status: "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED"
      user_role: "applicant" | "reviewer" | "auditor" | "admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      application_status: [
        "DRAFT",
        "SUBMITTED",
        "UNDER_REVIEW",
        "RETURNED",
        "DOCS_APPROVED",
        "PAYMENT_PENDING",
        "ONLINE_SCHEDULED",
        "ONLINE_COMPLETED",
        "ONSITE_SCHEDULED",
        "ONSITE_COMPLETED",
        "CERTIFIED",
        "REVOKED",
      ],
      assessment_status: ["SCHEDULED", "IN_PROGRESS", "COMPLETED", "CANCELLED"],
      assessment_type: ["ONLINE", "ONSITE"],
      document_type: [
        "GTL1_FORM",
        "COA_CERTIFICATE",
        "FARM_MAP",
        "PHOTOS",
        "TRAINING_RECORDS",
        "BUSINESS_LICENSE",
        "ID_CARD",
        "STAFF_LIST",
        "SOP_DOCUMENTS",
        "OTHER",
      ],
      payment_status: ["PENDING", "COMPLETED", "FAILED", "REFUNDED"],
      user_role: ["applicant", "reviewer", "auditor", "admin"],
    },
  },
} as const
