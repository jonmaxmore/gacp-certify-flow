// Core system types for GACP certification platform

export type UserRole = 
  | 'farmer'           // เกษตรกร - Submits applications, pays fees, tracks progress
  | 'reviewer'         // ผู้ตรวจสอบเอกสาร - Reviews documents, approve/reject
  | 'auditor'          // ผู้ประเมิน - Conducts assessments, records results  
  | 'admin'            // แอดมิน - User management, system monitoring
  | 'super_admin'      // ซูปเปอร์แอดมิน - Full system access, overrides
  | 'cs'               // แผนกบริการลูกค้า - Customer support, view-only
  | 'cms';             // แผนกคอนเท้นดู CMS - Content management

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  phone?: string;
  organization_name?: string;
  thai_id_number?: string;
  address?: string;
  preferred_language?: 'th' | 'en';
  is_active: boolean;
  created_at: string;
  updated_at: string;
  last_login_at?: string;
}

export interface Product {
  id: string;
  name: string;
  name_en: string;
  category: 'cannabis' | 'kratom' | 'traditional_herbs' | 'medical_herbs';
  description: string;
  description_en: string;
  requirements: string[];
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Application {
  id: string;
  application_number: string;
  applicant_id: string;
  product_id: string;
  status: ApplicationStatus;
  workflow_status: WorkflowStatus;
  farm_name: string;
  farm_address: string;
  farm_coordinates?: string;
  farm_area_rai?: number;
  farm_area_ngan?: number;
  farm_area_wah?: number;
  crop_types: string[];
  cultivation_methods: string[];
  expected_yield?: string;
  staff_count?: number;
  training_completed: boolean;
  training_date?: string;
  revision_count: number;
  max_free_revisions: number;
  reviewer_comments?: string;
  submitted_at?: string;
  approved_at?: string;
  created_at: string;
  updated_at: string;
}

export type ApplicationStatus = 
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'CERTIFIED'
  | 'EXPIRED'
  | 'REVOKED';

export type WorkflowStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'PAYMENT_PENDING_REVIEW'
  | 'PAYMENT_CONFIRMED_REVIEW'
  | 'UNDER_REVIEW'
  | 'REVISION_REQUESTED'
  | 'REJECTED_PAYMENT_REQUIRED'
  | 'REVIEW_APPROVED'
  | 'PAYMENT_PENDING_ASSESSMENT'
  | 'PAYMENT_CONFIRMED_ASSESSMENT'
  | 'ONLINE_ASSESSMENT_SCHEDULED'
  | 'ONLINE_ASSESSMENT_IN_PROGRESS'
  | 'ONLINE_ASSESSMENT_COMPLETED'
  | 'ONSITE_ASSESSMENT_SCHEDULED'
  | 'ONSITE_ASSESSMENT_IN_PROGRESS'
  | 'ONSITE_ASSESSMENT_COMPLETED'
  | 'CERTIFIED'
  | 'REJECTED'
  | 'EXPIRED'
  | 'REVOKED';

export interface Payment {
  id: string;
  application_id: string;
  milestone: number; // 1=review, 2=assessment, 3=certificate
  amount: number;
  currency: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  due_date: string;
  paid_at?: string;
  payment_method?: string;
  gateway_payment_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Assessment {
  id: string;
  application_id: string;
  auditor_id: string;
  type: 'ONLINE' | 'ONSITE';
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  scheduled_at: string;
  started_at?: string;
  completed_at?: string;
  meeting_url?: string;
  onsite_address?: string;
  passed?: boolean;
  score?: number;
  criteria_scores?: Record<string, number>;
  result_summary?: string;
  detailed_report?: string;
  evidence_urls?: string[];
  created_at: string;
  updated_at: string;
}

export interface Certificate {
  id: string;
  certificate_number: string;
  application_id: string;
  applicant_name: string;
  organization_name?: string;
  farm_name: string;
  farm_address: string;
  crop_types: string[];
  valid_from: string;
  expires_at: string;
  is_active: boolean;
  verification_code: string;
  verification_url: string;
  pdf_url?: string;
  qr_code_data: string;
  issued_at: string;
  revoked_at?: string;
  revoked_by?: string;
  revoked_reason?: string;
}

export interface PDPAConsent {
  id: string;
  user_id: string;
  consent_type: 'registration' | 'data_processing' | 'marketing' | 'cookies';
  consent_given: boolean;
  consent_text: string;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
  updated_at: string;
}

export interface CMSContent {
  id: string;
  title: string;
  title_en: string;
  content: string;
  content_en: string;
  type: 'news' | 'announcement' | 'page' | 'banner';
  status: 'draft' | 'published' | 'archived';
  featured: boolean;
  image_url?: string;
  slug: string;
  meta_description?: string;
  meta_keywords?: string;
  author_id: string;
  published_at?: string;
  created_at: string;
  updated_at: string;
}