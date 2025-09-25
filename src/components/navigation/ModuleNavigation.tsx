import React from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { 
  FileText, 
  CreditCard, 
  Calendar, 
  Award, 
  Settings, 
  BookOpen, 
  GraduationCap, 
  FolderOpen, 
  Bell, 
  Users, 
  BarChart3, 
  Shield, 
  Eye,
  ClipboardCheck,
  Building2,
  Database,
  MessageSquare,
  PlusCircle,
  List,
  Search,
  TrendingUp,
  UserCheck,
  FileCheck,
  DollarSign,
  Clock,
  Home
} from 'lucide-react';

export interface ModuleItem {
  id: string;
  title: string;
  icon: React.ComponentType<any>;
  path: string;
  roles: string[];
  badge?: string;
  description?: string;
  isNew?: boolean;
}

export interface ModuleGroup {
  id: string;
  title: string;
  modules: ModuleItem[];
  roles: string[];
}

export const getModuleNavigation = (): ModuleGroup[] => [
  {
    id: 'main',
    title: 'หลัก',
    roles: ['applicant', 'reviewer', 'auditor', 'admin'],
    modules: [
      {
        id: 'dashboard',
        title: 'แดชบอร์ด',
        icon: Home,
        path: '/dashboard',
        roles: ['applicant', 'reviewer', 'auditor', 'admin'],
        description: 'ภาพรวมของระบบ'
      }
    ]
  },
  {
    id: 'applications',
    title: 'การสมัคร',
    roles: ['applicant', 'reviewer', 'auditor', 'admin'],
    modules: [
      {
        id: 'new-application',
        title: 'สร้างใบสมัครใหม่',
        icon: PlusCircle,
        path: '/application/new',
        roles: ['applicant'],
        description: 'เริ่มต้นการสมัครรับรอง GACP'
      },
      {
        id: 'applications-list',
        title: 'รายการใบสมัคร',
        icon: List,
        path: '/applications',
        roles: ['applicant', 'reviewer', 'auditor', 'admin'],
        description: 'ดูรายการใบสมัครทั้งหมด'
      },
      {
        id: 'review-queue',
        title: 'คิวการตรวจสอบ',
        icon: Eye,
        path: '/queue',
        roles: ['reviewer'],
        badge: 'new',
        description: 'ใบสมัครที่รอการตรวจสอบ'
      }
    ]
  },
  {
    id: 'learning',
    title: 'การเรียนรู้',
    roles: ['applicant', 'reviewer', 'auditor', 'admin'],
    modules: [
      {
        id: 'knowledge-test',
        title: 'แบบทดสอบความรู้',
        icon: GraduationCap,
        path: '/knowledge-test',
        roles: ['applicant'],
        description: 'ทดสอบความรู้เกี่ยวกับ GACP'
      },
      {
        id: 'elearning',
        title: 'E-Learning',
        icon: BookOpen,
        path: '/elearning',
        roles: ['applicant', 'reviewer', 'auditor', 'admin'],
        description: 'เนื้อหาการเรียนรู้ออนไลน์'
      },
      {
        id: 'cms',
        title: 'จัดการเนื้อหา',
        icon: FileText,
        path: '/cms',
        roles: ['admin'],
        description: 'จัดการเนื้อหาการเรียนรู้'
      }
    ]
  },
  {
    id: 'documents',
    title: 'เอกสาร',
    roles: ['applicant', 'reviewer', 'auditor', 'admin'],
    modules: [
      {
        id: 'document-manager',
        title: 'จัดการเอกสาร',
        icon: FolderOpen,
        path: '/documents',
        roles: ['applicant', 'reviewer', 'auditor', 'admin'],
        description: 'อัปโหลดและจัดการเอกสาร'
      },
      {
        id: 'document-review',
        title: 'ตรวจสอบเอกสาร',
        icon: FileCheck,
        path: '/review',
        roles: ['reviewer'],
        description: 'ตรวจสอบเอกสารจากผู้สมัคร'
      }
    ]
  },
  {
    id: 'payments',
    title: 'การชำระเงิน',
    roles: ['applicant', 'reviewer', 'auditor', 'admin'],
    modules: [
      {
        id: 'payments',
        title: 'การชำระเงิน',
        icon: CreditCard,
        path: '/payments',
        roles: ['applicant'],
        description: 'ชำระค่าธรรมเนียมต่างๆ'
      },
      {
        id: 'payment-management',
        title: 'จัดการการชำระเงิน',
        icon: DollarSign,
        path: '/payment-management',
        roles: ['admin'],
        description: 'จัดการและตรวจสอบการชำระเงิน'
      }
    ]
  },
  {
    id: 'assessments',
    title: 'การประเมิน',
    roles: ['applicant', 'auditor', 'admin'],
    modules: [
      {
        id: 'schedule',
        title: 'กำหนดการประเมิน',
        icon: Calendar,
        path: '/schedule',
        roles: ['applicant', 'auditor'],
        description: 'จัดตารางการประเมิน'
      },
      {
        id: 'assessments',
        title: 'การประเมิน',
        icon: ClipboardCheck,
        path: '/assessments',
        roles: ['auditor', 'admin'],
        description: 'ดำเนินการประเมิน'
      },
      {
        id: 'assessment-calendar',
        title: 'ปฏิทินการประเมิน',
        icon: Calendar,
        path: '/assessment-calendar',
        roles: ['auditor'],
        description: 'ดูปฏิทินการประเมิน'
      }
    ]
  },
  {
    id: 'certificates',
    title: 'ใบรับรอง',
    roles: ['applicant', 'admin'],
    modules: [
      {
        id: 'certificates',
        title: 'ใบรับรองของฉัน',
        icon: Award,
        path: '/certificates',
        roles: ['applicant'],
        description: 'ดูและดาวน์โหลดใบรับรอง'
      },
      {
        id: 'certificate-management',
        title: 'จัดการใบรับรอง',
        icon: Award,
        path: '/certificate-management',
        roles: ['admin'],
        description: 'จัดการใบรับรองทั้งหมด'
      }
    ]
  },
  {
    id: 'communication',
    title: 'การสื่อสาร',
    roles: ['applicant', 'reviewer', 'auditor', 'admin'],
    modules: [
      {
        id: 'notifications',
        title: 'การแจ้งเตือน',
        icon: Bell,
        path: '/notifications',
        roles: ['applicant', 'reviewer', 'auditor', 'admin'],
        description: 'ดูการแจ้งเตือนทั้งหมด'
      },
      {
        id: 'ai-chatbot',
        title: 'ผู้ช่วย AI',
        icon: MessageSquare,
        path: '/chatbot',
        roles: ['applicant', 'reviewer', 'auditor', 'admin'],
        isNew: true,
        description: 'สอบถามข้อมูลกับผู้ช่วย AI'
      }
    ]
  },
  {
    id: 'management',
    title: 'การจัดการ',
    roles: ['admin'],
    modules: [
      {
        id: 'user-management',
        title: 'จัดการผู้ใช้',
        icon: Users,
        path: '/user-management',
        roles: ['admin'],
        description: 'จัดการบัญชีผู้ใช้'
      },
      {
        id: 'product-management',
        title: 'จัดการผลิตภัณฑ์',
        icon: Building2,
        path: '/product-management',
        roles: ['admin'],
        description: 'จัดการประเภทการรับรอง'
      },
      {
        id: 'system-settings',
        title: 'ตั้งค่าระบบ',
        icon: Settings,
        path: '/system-settings',
        roles: ['admin'],
        description: 'การตั้งค่าระบบทั่วไป'
      }
    ]
  },
  {
    id: 'analytics',
    title: 'รายงานและการวิเคราะห์',
    roles: ['admin'],
    modules: [
      {
        id: 'platform-analytics',
        title: 'การวิเคราะห์แพลตฟอร์ม',
        icon: BarChart3,
        path: '/platform-analytics',
        roles: ['admin'],
        description: 'สถิติการใช้งานระบบ'
      },
      {
        id: 'system-analysis',
        title: 'วิเคราะห์ระบบ',
        icon: TrendingUp,
        path: '/system-analysis',
        roles: ['admin'],
        description: 'รายงานการวิเคราะห์ระบบ'
      }
    ]
  },
  {
    id: 'security',
    title: 'ความปลอดภัย',
    roles: ['admin'],
    modules: [
      {
        id: 'security-monitor',
        title: 'ตรวจสอบความปลอดภัย',
        icon: Shield,
        path: '/security',
        roles: ['admin'],
        description: 'ติดตามความปลอดภัยของระบบ'
      },
      {
        id: 'audit-logs',
        title: 'บันทึกการตรวจสอบ',
        icon: Database,
        path: '/audit-logs',
        roles: ['admin'],
        description: 'ดูประวัติการใช้งานระบบ'
      }
    ]
  },
  {
    id: 'account',
    title: 'บัญชี',
    roles: ['applicant', 'reviewer', 'auditor', 'admin'],
    modules: [
      {
        id: 'account-settings',
        title: 'ตั้งค่าบัญชี',
        icon: UserCheck,
        path: '/settings',
        roles: ['applicant', 'reviewer', 'auditor', 'admin'],
        description: 'จัดการข้อมูลส่วนตัว'
      }
    ]
  }
];

export const getModulesForRole = (role: string): ModuleGroup[] => {
  return getModuleNavigation()
    .map(group => ({
      ...group,
      modules: group.modules.filter(module => module.roles.includes(role))
    }))
    .filter(group => group.roles.includes(role) && group.modules.length > 0);
};

export const getModuleByPath = (path: string): ModuleItem | undefined => {
  const allModules = getModuleNavigation().flatMap(group => group.modules);
  return allModules.find(module => path.startsWith(module.path));
};