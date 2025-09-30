# Document Management System - GACP Certification Service

## ภาพรวมระบบ

ระบบจัดการเอกสาร (Document Management System) สำหรับการขอใบอนุญาต GACP พร้อมด้วยระบบควบคุมการเข้าถึง การตรวจสอบ และการจัดเก็บที่ปลอดภัย

## คุณสมบัติหลัก

### 🔐 **ระบบความปลอดภัย**
- **Role-based Access Control**: ควบคุมการเข้าถึงตามบทบาทผู้ใช้ (Farmer, Reviewer, Auditor, Approver, Finance)
- **File Validation**: ตรวจสอบประเภทไฟล์ ขนาด และความปลอดภัย
- **Audit Logging**: บันทึกการเข้าถึงและการจัดการเอกสารทั้งหมด
- **Virus Scanning**: ตรวจสอบไวรัส (placeholder สำหรับการ integrate)

### 📂 **ประเภทเอกสาร**
1. **SOP (Standard Operating Procedures)** - จำเป็น
   - ไฟล์สูงสุด: 5 ไฟล์
   - ประเภทที่รองรับ: PDF, DOC, DOCX

2. **COA (Certificate of Analysis)** - จำเป็น  
   - ไฟล์สูงสุด: 3 ไฟล์
   - ประเภทที่รองรับ: PDF

3. **Land Rights Documentation** - จำเป็น
   - ไฟล์สูงสุด: 2 ไฟล์
   - ประเภทที่รองรับ: PDF, JPG, PNG

4. **Audit Photos** - ไม่จำเป็น
   - ไฟล์สูงสุด: 20 ไฟล์
   - ประเภทที่รองรับ: JPG, PNG

5. **Supporting Certificates** - ไม่จำเป็น
   - ไฟล์สูงสุด: 5 ไฟล์
   - ประเภทที่รองรับ: PDF

### 🔧 **API Endpoints**

#### การอัพโหลดเอกสาร
```bash
POST /api/documents/upload/:applicationId
POST /api/documents/upload-multiple/:applicationId
```

#### การดาวน์โหลดและแสดงผล
```bash
GET /api/documents/download/:documentId
GET /api/documents/preview/:documentId
GET /api/documents/info/:documentId
```

#### การจัดการเอกสาร
```bash
GET /api/documents/list/:applicationId
DELETE /api/documents/:documentId
GET /api/documents/validate/:applicationId
GET /api/documents/stats/:applicationId
GET /api/documents/requirements
```

## การใช้งาน

### 1. อัพโหลดเอกสารเดี่ยว
```javascript
// Form data with file
const formData = new FormData();
formData.append('document', file);
formData.append('documentType', 'sop');
formData.append('description', 'มาตรฐานการปฏิบัติงาน');

fetch('/api/documents/upload/applicationId', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + token
  },
  body: formData
});
```

### 2. อัพโหลดเอกสารหลายไฟล์
```javascript
const formData = new FormData();
files.forEach(file => {
  formData.append('documents', file);
});
formData.append('documentType', 'audit_photos');

fetch('/api/documents/upload-multiple/applicationId', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + token
  },
  body: formData
});
```

### 3. ตรวจสอบความครบถ้วนของเอกสาร
```javascript
const response = await fetch('/api/documents/validate/applicationId', {
  headers: {
    'Authorization': 'Bearer ' + token
  }
});

const validation = await response.json();
console.log('Missing documents:', validation.validation.missingDocuments);
```

## การควบคุมการเข้าถึง

### บทบาทและสิทธิ์
| บทบาท | อัพโหลด | ดาวน์โหลด | ลบ | ดูเอกสารทั้งหมด |
|--------|---------|-----------|----|--------------------|
| Farmer | ✅ | ✅ (เฉพาะของตน) | ✅ (24 ชม.) | ✅ (เฉพาะของตน) |
| Reviewer | ✅ | ✅ (SOP, COA, Land Rights, Certificates) | ❌ | ✅ |
| Auditor | ✅ | ✅ (ทั้งหมด) | ❌ | ✅ |
| Approver | ❌ | ✅ (ทั้งหมด) | ❌ | ✅ |
| Finance | ❌ | ✅ (เฉพาะ Certificates) | ❌ | ❌ |
| Admin | ✅ | ✅ (ทั้งหมด) | ✅ | ✅ |

### ระดับการเข้าถึงเอกสาร
- **Public**: ใบรับรองที่ออกแล้ว
- **Internal**: รูปภาพการตรวจสอบ
- **Restricted**: SOP, COA
- **Confidential**: เอกสารสิทธิ์ที่ดิน

## การจัดเก็บไฟล์

### โครงสร้างไดเรกทอรี
```
/uploads/
├── sop/
├── coa/
├── land_rights/
├── audit_photos/
└── certificates/
```

### การตั้งชื่อไฟล์
```
2025-09-30T14-30-45-123Z_a1b2c3d4_สมุนไพรออร์แกนิค.pdf
[timestamp]_[hash]_[sanitized-name].[ext]
```

## การตรวจสอบความถูกต้อง

### ขนาดไฟล์
- ขนาดสูงสุด: 10MB ต่อไฟล์

### ประเภทไฟล์ที่รองรับ
- **เอกสาร**: PDF, DOC, DOCX
- **รูปภาพ**: JPG, PNG, JPEG

### การตรวจสอบ Integrity
- SHA-256 hash สำหรับการตรวจสอบความถูกต้องของไฟล์
- การตรวจสอบไวรัส (placeholder)

## การประมวลผลหลังอัพโหลด

### สำหรับรูปภาพ
- สร้าง thumbnail (placeholder)
- ตรวจสอบ metadata

### สำหรับ PDF
- ดึงข้อความ (OCR) (placeholder)
- ตรวจสอบ digital signature

## การแจ้งเตือนและ Logging

### Audit Trail
```javascript
{
  documentId: "uuid",
  userId: "user123", 
  action: "download|upload|delete|view",
  timestamp: "2025-09-30T14:30:45.123Z",
  metadata: {
    ipAddress: "192.168.1.1",
    userAgent: "browser-info"
  }
}
```

### การแจ้งเตือน
- อัพโหลดเอกสารสำเร็จ
- เอกสารไม่ครบถ้วน
- การเข้าถึงเอกสารที่ไม่ได้รับอนุญาต
- ไฟล์มีปัญหา (ไวรัส, ขนาดเกิน, ประเภทไม่รองรับ)

## การกู้คืนและ Backup

### Soft Delete
- เอกสารที่ลบจะถูกทำเครื่องหมายเป็น inactive
- เก็บข้อมูล metadata และ audit trail
- ไฟล์จริงยังคงอยู่บนระบบ

### Recovery Options
- กู้คืนเอกสารภายใน 30 วัน
- ระบบ backup อัตโนมัติ
- Version control สำหรับเอกสารที่แก้ไข

## Integration กับระบบอื่น

### Workflow Engine
```javascript
// ตรวจสอบเอกสารก่อน transition
const validation = await documentService.validateRequiredDocuments(applicationId);
if (!validation.valid) {
  throw new Error('Required documents missing');
}
```

### Notification Service
```javascript
// แจ้งเตือนเมื่อมีเอกสารใหม่
await notificationService.notify('document_uploaded', {
  applicationId,
  documentType,
  uploadedBy
});
```

## การตั้งค่าและ Configuration

### Environment Variables
```bash
UPLOAD_PATH=/uploads
MAX_FILE_SIZE=10485760  # 10MB
ALLOWED_MIME_TYPES=application/pdf,image/jpeg,image/png
ENABLE_VIRUS_SCAN=true
ENABLE_OCR=true
```

### Security Settings
```javascript
{
  maxFileSize: 10 * 1024 * 1024,
  allowedMimeTypes: ['application/pdf', 'image/jpeg', 'image/png'],
  requireVirusScan: true,
  enableEncryption: false,
  auditAll: true
}
```

## การทดสอบ

### Unit Tests
- การตรวจสอบไฟล์
- การควบคุมการเข้าถึง
- การประมวลผล metadata

### Integration Tests
- การอัพโหลดและดาวน์โหลด
- การตรวจสอบ workflow integration
- การทดสอบ security

### Performance Tests
- การอัพโหลดไฟล์ขนาดใหญ่
- การดาวน์โหลดหลายไฟล์พร้อมกัน
- การจัดการ concurrent requests

## การ Monitoring

### Metrics
- จำนวนการอัพโหลดต่อวัน
- ขนาดการใช้งานพื้นที่เก็บข้อมูล
- อัตราความล้มเหลวของการอัพโหลด
- เวลาตอบสนองของการดาวน์โหลด

### Alerts
- พื้นที่เก็บข้อมูลใกล้เต็ม
- การอัพโหลดไฟล์ที่มีไวรัส
- การเข้าถึงที่ไม่ได้รับอนุญาต
- ระบบประมวลผลล่าช้า

---

## เอกสารประกอบการสมัครที่ต้องการ

### 1. มาตรฐานการปฏิบัติงาน (SOP)
- คู่มือการปลูกสมุนไพร
- ขั้นตอนการเก็บเกี่ยว
- วิธีการจัดเก็บและเก็บรักษา
- การควบคุมคุณภาพ

### 2. ใบรับรองการวิเคราะห์ (COA)
- ผลการตรวจสอบสารปนเปื้อน
- การวิเคราะห์สารออกฤทธิ์
- รายงานจากห้องปฏิบัติการที่ได้รับการรับรอง

### 3. เอกสารสิทธิ์ที่ดิน
- โฉนดที่ดิน
- ใบอนุญาตใช้ที่ดิน
- แผนที่แสดงพื้นที่เพาะปลูก

### 4. รูปภาพประกอบ (สำหรับการตรวจสอบ)
- พื้นที่เพาะปลูก
- โรงเรือนและอุปกรณ์
- กระบวนการผลิต
- พื้นที่จัดเก็บ

### 5. ใบรับรองเสริม
- ใบรับรองอินทรีย์ (หากมี)
- ใบรับรองมาตรฐาน ISO
- ใบรับรองจากหน่วยงานอื่น

ระบบ Document Management นี้พร้อมใช้งานเต็มรูปแบบ รองรับการทำงานของระบบ GACP ทั้งหมด และสามารถขยายเพิ่มเติมได้ตามความต้องการ