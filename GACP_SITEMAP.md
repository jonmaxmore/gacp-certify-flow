# GACP Platform - Complete Site Structure & Navigation

## Site Map Overview

```
GACP Platform
├── Public Section (ไม่ต้องล็อกอิน)
│   ├── Homepage (/) - หน้าแรก
│   ├── About Us (/about) - เกี่ยวกับเรา
│   ├── News & Events (/news) - ข่าวสารและกิจกรรม
│   ├── Online Services (/services) - บริการออนไลน์
│   ├── Contact (/contact) - ติดต่อเรา
│   ├── Certificate Verification (/verify-certificate) - ตรวจสอบใบรับรอง
│   ├── Login (/login) - เข้าสู่ระบบ
│   └── Register (/register) - สมัครสมาชิก
│
├── Applicant Dashboard (/applicant) - เกษตรกร
│   ├── Dashboard (/applicant/dashboard) - แดชบอร์ด
│   ├── Applications (/applicant/applications) - ใบสมัคร
│   │   ├── New Application (/applicant/application/new)
│   │   └── Edit Application (/applicant/application/:id/edit)
│   ├── Payments (/applicant/payments) - การชำระเงิน
│   ├── Assessments (/applicant/schedule) - การประเมิน
│   ├── Certificates (/applicant/certificates) - ใบรับรอง
│   └── Account Settings (/applicant/settings) - ตั้งค่าบัญชี
│
├── Reviewer Dashboard (/reviewer) - เจ้าหน้าที่ตรวจเอกสาร
│   ├── Dashboard (/reviewer/dashboard) - แดชบอร์ด
│   ├── Review Queue (/reviewer/queue) - คิวตรวจสอบ
│   ├── Review Detail (/reviewer/review/:id) - รายละเอียดการตรวจสอบ
│   └── Assessment Scheduling (/reviewer/assessments) - จัดตารางประเมิน
│
├── Auditor Dashboard (/auditor) - เจ้าหน้าที่ประเมิน
│   ├── Dashboard (/auditor/dashboard) - แดชบอร์ด
│   ├── Assessment Management (/auditor/assessments) - จัดการการประเมิน
│   ├── Assessment Calendar (/auditor/calendar) - ปฏิทินการประเมิน
│   ├── Online Assessment (/auditor/assessment/:id) - ประเมินออนไลน์
│   └── Assessment Report (/auditor/report/:id) - รายงานการประเมิน
│
└── Admin Dashboard (/admin) - ผู้ดูแลระบบ
    ├── Dashboard (/admin/dashboard) - แดชบอร์ด
    ├── Product Management (/admin/products) - จัดการสินค้า
    ├── User Management (/admin/users) - จัดการผู้ใช้
    ├── News Management (/admin/news) - จัดการข่าวสาร
    ├── Application History (/admin/applications) - ประวัติใบสมัคร
    ├── Platform Analytics (/admin/analytics) - วิเคราะห์แพลตฟอร์ม
    ├── Certificate Management (/admin/certificates) - จัดการใบรับรอง
    └── System Settings (/admin/settings) - ตั้งค่าระบบ
```

## Navigation Structure

### Public Navigation
- **Top Navigation**: Logo, Language Switcher, Login Button
- **Main Menu**: Home, About, News, Services, Contact
- **Footer**: Contact Info, Terms, Privacy Policy

### Authenticated Navigation (Role-based)
- **Sidebar Navigation**: Role-specific menu items
- **Top Bar**: User Profile, Notifications, Language Switcher, Logout
- **Breadcrumbs**: Current page location

## User Flow by Role

### 1. Applicant (เกษตรกร) Flow
```
Register → Login → Dashboard → New Application → Document Upload → Payment → 
Assessment Scheduling → Assessment → Certificate Issuance
```

### 2. Reviewer (เจ้าหน้าที่ตรวจเอกสาร) Flow
```
Login → Dashboard → Review Queue → Document Review → Approve/Reject → 
Assessment Scheduling
```

### 3. Auditor (เจ้าหน้าที่ประเมิน) Flow
```
Login → Dashboard → Assessment Calendar → Conduct Assessment → 
Submit Report → Certificate Approval
```

### 4. Admin (ผู้ดูแลระบบ) Flow
```
Login → Dashboard → System Management → User Management → 
Content Management → Analytics → Settings
```

## Technical Structure

### Component Architecture
```
src/
├── components/
│   ├── layout/
│   │   ├── PublicLayout.tsx
│   │   ├── DashboardLayout.tsx
│   │   └── MainNavigation.tsx
│   ├── navigation/
│   │   ├── PublicNavigation.tsx
│   │   ├── Sidebar.tsx
│   │   └── Breadcrumbs.tsx
│   ├── auth/
│   │   ├── ProtectedRoute.tsx
│   │   └── RoleGuard.tsx
│   └── routes/
│       ├── PublicRoutes.tsx
│       ├── ApplicantRoutes.tsx
│       ├── ReviewerRoutes.tsx
│       ├── AuditorRoutes.tsx
│       └── AdminRoutes.tsx
│
├── pages/
│   ├── public/
│   │   ├── HomePage.tsx
│   │   ├── AboutPage.tsx
│   │   ├── NewsPage.tsx
│   │   ├── ServicesPage.tsx
│   │   └── ContactPage.tsx
│   ├── auth/
│   │   ├── LoginPage.tsx
│   │   └── RegisterPage.tsx
│   ├── applicant/
│   ├── reviewer/
│   ├── auditor/
│   └── admin/
│
└── hooks/
    ├── useAuth.ts
    ├── useNavigation.ts
    └── usePermissions.ts
```

## Security & Permissions

### Route Protection
- **Public Routes**: Accessible to all users
- **Protected Routes**: Require authentication
- **Role-based Routes**: Require specific user roles
- **Permission-based Access**: Granular permissions within roles

### Navigation Guard
- Automatic redirection based on user role
- Hide/show menu items based on permissions
- Breadcrumb generation based on current route

## Mobile Responsiveness

### Navigation Patterns
- **Desktop**: Full sidebar + top navigation
- **Tablet**: Collapsible sidebar + top navigation
- **Mobile**: Bottom navigation + hamburger menu

### Breakpoints
- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px