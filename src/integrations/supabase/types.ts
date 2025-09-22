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
          applicant_id: string
          application_number: string | null
          approved_at: string | null
          created_at: string | null
          id: string
          metadata: Json | null
          revision_count: number | null
          status: Database["public"]["Enums"]["application_status"] | null
          submitted_at: string | null
          updated_at: string | null
        }
        Insert: {
          applicant_id: string
          application_number?: string | null
          approved_at?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          revision_count?: number | null
          status?: Database["public"]["Enums"]["application_status"] | null
          submitted_at?: string | null
          updated_at?: string | null
        }
        Update: {
          applicant_id?: string
          application_number?: string | null
          approved_at?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          revision_count?: number | null
          status?: Database["public"]["Enums"]["application_status"] | null
          submitted_at?: string | null
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
          completed_at: string | null
          created_at: string | null
          id: string
          meeting_token: string | null
          notes: string | null
          recording_url: string | null
          report_data: Json | null
          scheduled_at: string | null
          started_at: string | null
          status: Database["public"]["Enums"]["assessment_status"] | null
          type: Database["public"]["Enums"]["assessment_type"]
        }
        Insert: {
          application_id: string
          auditor_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          meeting_token?: string | null
          notes?: string | null
          recording_url?: string | null
          report_data?: Json | null
          scheduled_at?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["assessment_status"] | null
          type: Database["public"]["Enums"]["assessment_type"]
        }
        Update: {
          application_id?: string
          auditor_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          meeting_token?: string | null
          notes?: string | null
          recording_url?: string | null
          report_data?: Json | null
          scheduled_at?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["assessment_status"] | null
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
          created_at: string | null
          details: Json | null
          id: string
          ip_address: unknown | null
          resource_id: string | null
          resource_type: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: unknown | null
          resource_id?: string | null
          resource_type: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: unknown | null
          resource_id?: string | null
          resource_type?: string
          user_agent?: string | null
          user_id?: string | null
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
          application_id: string
          certificate_number: string
          created_at: string | null
          expires_at: string | null
          id: string
          issued_at: string | null
          pdf_url: string | null
          qr_code_data: string | null
          revoked_at: string | null
          revoked_reason: string | null
        }
        Insert: {
          application_id: string
          certificate_number: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          issued_at?: string | null
          pdf_url?: string | null
          qr_code_data?: string | null
          revoked_at?: string | null
          revoked_reason?: string | null
        }
        Update: {
          application_id?: string
          certificate_number?: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          issued_at?: string | null
          pdf_url?: string | null
          qr_code_data?: string | null
          revoked_at?: string | null
          revoked_reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "certificates_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          application_id: string
          document_type: string
          file_name: string
          file_size: number | null
          file_type: string
          id: string
          s3_key: string
          uploaded_at: string | null
          verified: boolean | null
          virus_scan_status: string | null
        }
        Insert: {
          application_id: string
          document_type: string
          file_name: string
          file_size?: number | null
          file_type: string
          id?: string
          s3_key: string
          uploaded_at?: string | null
          verified?: boolean | null
          virus_scan_status?: string | null
        }
        Update: {
          application_id?: string
          document_type?: string
          file_name?: string
          file_size?: number | null
          file_type?: string
          id?: string
          s3_key?: string
          uploaded_at?: string | null
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
        ]
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
          id: string
          status: Database["public"]["Enums"]["payment_status"] | null
          updated_at: string | null
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
          id?: string
          status?: Database["public"]["Enums"]["payment_status"] | null
          updated_at?: string | null
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
          id?: string
          status?: Database["public"]["Enums"]["payment_status"] | null
          updated_at?: string | null
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
      profiles: {
        Row: {
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          is_active: boolean | null
          last_login_at: string | null
          organization_name: string | null
          password_hash: string | null
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          thai_id_number: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          full_name?: string | null
          id?: string
          is_active?: boolean | null
          last_login_at?: string | null
          organization_name?: string | null
          password_hash?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          thai_id_number?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          is_active?: boolean | null
          last_login_at?: string | null
          organization_name?: string | null
          password_hash?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          thai_id_number?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      reviews: {
        Row: {
          application_id: string
          comments: string | null
          created_at: string | null
          decision: string
          id: string
          reasons: string[] | null
          reviewer_id: string
        }
        Insert: {
          application_id: string
          comments?: string | null
          created_at?: string | null
          decision: string
          id?: string
          reasons?: string[] | null
          reviewer_id: string
        }
        Update: {
          application_id?: string
          comments?: string | null
          created_at?: string | null
          decision?: string
          id?: string
          reasons?: string[] | null
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_application_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_admin_stats: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      is_admin: {
        Args: { user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      application_status:
        | "DRAFT"
        | "SUBMITTED"
        | "UNDER_REVIEW"
        | "RETURNED"
        | "DOCS_APPROVED"
        | "AWAITING_ONSITE_PAYMENT"
        | "ONSITE_SCHEDULED"
        | "CERTIFIED"
        | "REVOKED"
      assessment_status: "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED"
      assessment_type: "ONLINE" | "ONSITE"
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
        "AWAITING_ONSITE_PAYMENT",
        "ONSITE_SCHEDULED",
        "CERTIFIED",
        "REVOKED",
      ],
      assessment_status: ["SCHEDULED", "IN_PROGRESS", "COMPLETED", "CANCELLED"],
      assessment_type: ["ONLINE", "ONSITE"],
      payment_status: ["PENDING", "COMPLETED", "FAILED", "REFUNDED"],
      user_role: ["applicant", "reviewer", "auditor", "admin"],
    },
  },
} as const
