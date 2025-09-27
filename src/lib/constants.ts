// GACP System Constants & Configuration

// Role definitions with Thai labels and permissions
export const ROLE_CONFIG = {
  farmer: {
    label: 'เกษตรกร',
    description: 'ผู้ผลิตที่สมัครรับรองมาตรฐาน GACP',
    loginPortal: '/farmer/login',
    dashboardPath: '/farmer/dashboard',
    permissions: ['submit_application', 'view_own_data', 'upload_documents', 'make_payments']
  },
  reviewer: {
    label: 'ผู้ตรวจสอบเอกสาร',
    description: 'ตรวจสอบเอกสารและอนุมัติ/ปฏิเสธใบสมัคร',
    loginPortal: '/dept/login',
    dashboardPath: '/dept/dashboard/reviewer',
    permissions: ['review_applications', 'approve_reject', 'view_farmer_data', 'manage_queue']
  },
  auditor: {
    label: 'ผู้ประเมิน',
    description: 'ประเมินสถานที่จริงและออกผลการประเมิน',
    loginPortal: '/dept/login',
    dashboardPath: '/dept/dashboard/auditor',
    permissions: ['schedule_assessment', 'conduct_assessment', 'upload_reports', 'record_results']
  },
  admin: {
    label: 'แอดมิน',
    description: 'จัดการระบบและผู้ใช้งาน',
    loginPortal: '/dept/login',
    dashboardPath: '/dept/dashboard/admin',
    permissions: ['manage_users', 'view_analytics', 'manage_products', 'system_settings']
  },
  super_admin: {
    label: 'ซูปเปอร์แอดมิน',
    description: 'สิทธิ์เต็มในการจัดการระบบทั้งหมด',
    loginPortal: '/dept/login',
    dashboardPath: '/dept/dashboard/super_admin',
    permissions: ['full_access', 'override_decisions', 'backup_restore', 'audit_logs']
  },
  cs: {
    label: 'แผนกบริการลูกค้า',
    description: 'ตอบคำถามและให้บริการลูกค้า',
    loginPortal: '/dept/login',
    dashboardPath: '/dept/dashboard/cs',
    permissions: ['view_farmer_data', 'respond_tickets', 'live_chat', 'escalate_issues']
  },
  cms: {
    label: 'แผนกคอนเท้นดู CMS',
    description: 'จัดการเนื้อหาเว็บไซต์และประชาสัมพันธ์',
    loginPortal: '/dept/login',
    dashboardPath: '/dept/dashboard/cms',
    permissions: ['manage_content', 'publish_news', 'edit_pages', 'upload_media']
  }
} as const;

// Product categories for GACP certification
export const PRODUCT_CATEGORIES = {
  cannabis: {
    name: 'กัญชา',
    name_en: 'Cannabis',
    description: 'ผลิตภัณฑ์กัญชาทางการแพทย์',
    icon: '🌿',
    regulations: 'พระราชบัญญัติกัญชาและกัญชง พ.ศ. 2564',
    requirements: [
      'ใบอนุญาทปลูกกัญชา',
      'การแจ้งแปลงปลูก',
      'มาตรฐาน GACP กัญชา',
      'การควบคุมคุณภาพ THC'
    ]
  },
  kratom: {
    name: 'กระท่อม',
    name_en: 'Kratom',
    description: 'ใบกระท่อมทางการแพทย์แผนไทย',
    icon: '🍃',
    regulations: 'ประกาศกรมการแพทย์แผนไทยฯ เรื่องกระท่อม',
    requirements: [
      'ใบอนุญาตปลูกกระท่อม',
      'มาตรฐานการปลูกกระท่อม',
      'การควบคุมสารประกอบหลัก',
      'การเก็บรักษาและแปรรูป'
    ]
  },
  traditional_herbs: {
    name: 'สมุนไพรพื้นบ้าน',
    name_en: 'Traditional Herbs',
    description: 'สมุนไพรพื้นบ้านไทย',
    icon: '🌱',
    regulations: 'พระราชบัญญัติการแพทย์แผนไทย พ.ศ. 2542',
    requirements: [
      'การยืนยันสายพันธุ์',
      'มาตรฐานการปลูก',
      'การเก็บรักษาคุณภาพ',
      'ข้อมูลทางพฤกษศาสตร์'
    ]
  },
  medical_herbs: {
    name: 'สมุนไพรทางการแพทย์',
    name_en: 'Medical Herbs',
    description: 'สมุนไพรสำหรับใช้ทางการแพทย์',
    icon: '🌿',
    regulations: 'มาตรฐานยาแผนไทยและยาสมุนไพร',
    requirements: [
      'การวิเคราะห์สารสำคัญ',
      'มาตรฐานความปลอดภัย',
      'การควบคุมสารปนเปื้อน',
      'การทดสอบสรรพคุณ'
    ]
  }
} as const;

// Application workflow steps
export const WORKFLOW_STEPS = {
  1: { name: 'สมัครสมาชิก', description: 'ลงทะเบียนและสร้างบัญชี' },
  2: { name: 'ทำแบบทดสอบ', description: 'ทดสอบความรู้ GACP' },
  3: { name: 'ส่งเอกสาร', description: 'อัปโหลดเอกสารประกอบ' },
  4: { name: 'ชำระค่าตรวจเอกสาร', description: 'ชำระเงิน 5,000 บาท' },
  5: { name: 'ตรวจสอบเอกสาร', description: 'เจ้าหน้าที่ตรวจสอบ' },
  6: { name: 'ชำระค่าประเมิน', description: 'ชำระเงิน 25,000 บาท' },
  7: { name: 'นัดหมายประเมิน', description: 'กำหนดวันเวลาประเมิน' },
  8: { name: 'ประเมินออนไลน์/ออนไซต์', description: 'ตรวจประเมินสถานที่จริง' },
  9: { name: 'ออกใบรับรอง', description: 'ได้รับใบรับรอง GACP' }
} as const;

// Payment milestones and amounts
export const PAYMENT_MILESTONES = {
  1: { name: 'ค่าตรวจเอกสาร', amount: 5000, description: 'ค่าธรรมเนียมการตรวจสอบเอกสาร' },
  2: { name: 'ค่าประเมิน', amount: 25000, description: 'ค่าธรรมเนียมการประเมินออนไซต์' },
  3: { name: 'ค่าออกใบรับรอง', amount: 2000, description: 'ค่าธรรมเนียมการออกใบรับรอง' }
} as const;

// PDPA compliance texts
export const PDPA_TEXTS = {
  consent_registration: {
    th: `เราจะเก็บรวบรวม ใช้ หรือเปิดเผยข้อมูลส่วนบุคคลของท่านเพื่อวัตถุประสงค์ในการดำเนินการขอรับรองมาตรฐาน GACP เท่านั้น ข้อมูลจะถูกเก็บรักษาอย่างปลอดภัยตามมาตรฐานสากล และจะไม่ถูกเปิดเผยแก่บุคคลที่สามโดยไม่ได้รับความยินยอมจากท่าน ยกเว้นกรณีที่กฎหมายกำหนด`,
    en: `We will collect, use, or disclose your personal data solely for the purpose of GACP certification process. Your data will be securely stored according to international standards and will not be disclosed to third parties without your consent, except as required by law.`
  },
  consent_data_processing: {
    th: `ข้าพเจ้ายินยอมให้กรมการแพทย์แผนไทยและหน่วยงานที่เกี่ยวข้องดำเนินการประมวลผลข้อมูลส่วนบุคคลเพื่อการตรวจสอบคุณสมบัติ การประเมินมาตรฐาน และการออกใบรับรองตามกระบวนการ GACP`,
    en: `I consent to the Department of Thai Traditional Medicine and related agencies processing my personal data for qualification verification, standard assessment, and certification issuance under the GACP process.`
  }
} as const;

// Thai regulations compliance
export const THAI_REGULATIONS = {
  department: 'กรมการแพทย์แผนไทยและการแพทย์ทางเลือก กระทรวงสาธารณสุข',
  act: 'พระราชบัญญัติการแพทย์แผนไทย พ.ศ. 2542',
  standards: [
    'มาตรฐานการปฏิบัติทางการเกษตรที่ดีสำหรับยาสมุนไพร (GACP)',
    'ประกาศกระทรวงสาธารณสุข เรื่อง หลักเกณฑ์การรับรองมาตรฐาน GACP',
    'แนวทางปฏิบัติสำหรับการรับรองระบบ GACP'
  ],
  compliance_requirements: [
    'การเก็บรักษาข้อมูลตามพระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562',
    'การรายงานผลการตรวจสอบต่อหน่วยงานราชการ',
    'การปฏิบัติตามหลักเกณฑ์ความปลอดภัยของข้อมูล',
    'การควบคุมการเข้าถึงข้อมูลสำคัญ'
  ]
} as const;