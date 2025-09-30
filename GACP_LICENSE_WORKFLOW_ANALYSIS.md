# 🧭 GACP License Application - Complete Workflow Analysis

**Date**: September 30, 2025  
**System**: GACP Certification Platform  
**Scope**: Complete user journey for all 5 roles

## 🎯 Overview

ระบบการขอใบอนุญาต GACP ครอบคลุม 5 บทบาทหลัก:
- **Farmer** (เกษตรกร) - ผู้ขอใบอนุญาต
- **Reviewer** (ผู้ตรวจสอบเอกสาร) - ตรวจความครบถ้วน
- **Auditor** (ผู้ตรวจประเมิน) - ตรวจสอบภาคสนาม
- **Approver** (ผู้อนุมัติ) - ผอ./อธิบดี กรม
- **Finance** (การเงิน) - ติดตามการชำระเงิน

## 💰 Updated Payment Logic

| Payment | Purpose | Trigger/When | Notes |
|---------|---------|--------------|-------|
| **5,000 THB** | Document review fee | ครั้งแรก: หลัง Farmer ส่ง กทล.1 + Upload SOP/COA + Land Docs | เพื่อให้ Reviewer ตรวจเอกสารครบถ้วน |
| **5,000 THB** | Document review fee (3rd time) | หาก Farmer ถูก Reject เอกสาร 2 ครั้งก่อนหน้าและต้องแก้ไขครั้งที่ 3 | ระบบบังคับจ่ายก่อน Reviewer ตรวจครั้งที่ 3 |
| **25,000 THB** | Audit fee (online/onsite) | หาก Auditor ตรวจแล้ว Fail หรือ Doubt ต้องตรวจภาคสนาม | ระบบบังคับจ่ายก่อนตรวจซ้ำหรือ field audit |

## 🔄 Complete Workflow State Machine

```
SUBMITTED → PAYMENT_PENDING_1 → REVIEWING → [PASS/REJECT]
   ↓
REJECT_1 → FARMER_REVISION → REVIEWING → [PASS/REJECT]
   ↓
REJECT_2 → FARMER_REVISION → REVIEWING → [PASS/REJECT]
   ↓
REJECT_3 → PAYMENT_PENDING_2 → REVIEWING → [PASS]
   ↓
AUDITING → [PASS/FAIL/DOUBT]
   ↓
PASS → APPROVAL_PENDING → [APPROVED/REJECTED]
FAIL → PAYMENT_PENDING_3 → RE_AUDITING → [PASS]
DOUBT → FIELD_AUDIT_PENDING → PAYMENT_PENDING_3 → FIELD_AUDITING → [PASS]
   ↓
APPROVED → CERTIFICATE_GENERATED
REJECTED → REVISION_REQUIRED
```

## 👥 Role-Based User Journeys

### 1. 🌾 Farmer Journey

#### Happy Path (No Rejections)
```
1. Register/Login
2. Fill กทล.1 form
3. Upload SOP, COA, Land Documents
4. Pay 5,000 THB (Document Review Fee)
5. Wait for Review → APPROVED by Reviewer
6. Wait for Audit → PASSED by Auditor
7. Wait for Approval → APPROVED by Approver
8. Download Certificate
```

#### Path with Document Rejections
```
1-4. Same as Happy Path
5. Review → REJECTED (1st time) → Fix documents → Resubmit
6. Review → REJECTED (2nd time) → Fix documents → Resubmit
7. Review → REJECTED (3rd time) → Pay 5,000 THB → Resubmit
8. Review → APPROVED → Continue to Audit
9-11. Same as Happy Path steps 6-8
```

#### Path with Audit Failure
```
1-7. Same as above until Audit
8. Audit → FAILED → Pay 25,000 THB → Re-audit
9. Re-audit → PASSED → Continue to Approval
10-11. Same as Happy Path steps 7-8
```

#### Path with Audit Doubt
```
1-7. Same as above until Audit
8. Audit → DOUBT → Schedule Field Audit → Pay 25,000 THB
9. Field Audit → PASSED → Continue to Approval
10-11. Same as Happy Path steps 7-8
```

### 2. 📋 Reviewer Journey

```
Dashboard: Show applications pending review with rejection count

For each application:
1. Open application documents (กทล.1, SOP, COA, Land Docs)
2. Check completeness and compliance
3. Decision:
   - APPROVE → Forward to Auditor
   - REJECT → Send back to Farmer
     - If rejection count = 2 → Mark "Payment Required for 3rd Review"
     - Update rejection counter (1/2, 2/2)
4. Add review comments/feedback
5. Update application status
```

### 3. 🔍 Auditor Journey

```
Dashboard: Show applications forwarded by Reviewer

For each application:
1. Review bundled documents from Reviewer
2. Schedule Audit (Online/Onsite)
3. Conduct Audit
4. Record Audit Results:
   - PASS → Forward to Reviewer for bundling to Approver
   - FAIL → Require Farmer to pay 25,000 THB before re-audit
   - DOUBT → Schedule field audit → Require 25,000 THB payment
5. Update audit trail and comments
```

### 4. ✅ Approver Journey

```
Dashboard: Show applications "ready for approval" from Reviewer

For each application:
1. Review complete package:
   - Original application (กทล.1)
   - All documents (SOP, COA, Land)
   - Reviewer's assessment
   - Auditor's report and findings
2. Decision:
   - APPROVE → Generate Certificate (PDF + QR + Digital Sign)
   - REJECT → Send back to Reviewer with reasons
3. All decisions logged in Audit Trail (ISO/PDPA compliance)
```

### 5. 💰 Finance Journey

```
Dashboard: Monitor all payments (Read-only)

Payment Categories:
1. Document Review Fees:
   - 5,000 THB (Initial submission)
   - 5,000 THB (3rd review after 2 rejections)
2. Audit Fees:
   - 25,000 THB (Re-audit after failure)
   - 25,000 THB (Field audit after doubt)

Functions:
- Track payment status (Pending/Completed)
- Generate payment reports
- Monitor payment gateway transactions
- NO approval/rejection authority
```

## 📊 Scenario Cases with Payment Logic

### Case 1: Perfect Application (No Issues)
```
Farmer → Submit + Pay 5,000 → Reviewer PASS → Auditor PASS → Approver APPROVE → Certificate
Total Cost: 5,000 THB
Timeline: ~2-4 weeks
```

### Case 2: Document Issues (2 Rejections)
```
Farmer → Submit + Pay 5,000 → Reviewer REJECT (1st) → Farmer Fix → 
Reviewer REJECT (2nd) → Farmer Fix → Reviewer PASS → Auditor PASS → Approver APPROVE → Certificate
Total Cost: 5,000 THB
Timeline: ~4-6 weeks
```

### Case 3: Document Issues (3+ Rejections)
```
Farmer → Submit + Pay 5,000 → Reviewer REJECT (1st) → Farmer Fix → 
Reviewer REJECT (2nd) → Farmer Fix → Reviewer REJECT (3rd) → 
Farmer Pay 5,000 + Fix → Reviewer PASS → Auditor PASS → Approver APPROVE → Certificate
Total Cost: 10,000 THB
Timeline: ~6-8 weeks
```

### Case 4: Audit Failure
```
Farmer → Submit + Pay 5,000 → Reviewer PASS → Auditor FAIL → 
Farmer Pay 25,000 → Re-audit PASS → Approver APPROVE → Certificate
Total Cost: 30,000 THB
Timeline: ~6-10 weeks
```

### Case 5: Audit Doubt → Field Audit
```
Farmer → Submit + Pay 5,000 → Reviewer PASS → Auditor DOUBT → 
Farmer Pay 25,000 → Field Audit PASS → Approver APPROVE → Certificate
Total Cost: 30,000 THB
Timeline: ~8-12 weeks
```

### Case 6: Approver Rejection
```
Farmer → Submit + Pay 5,000 → Reviewer PASS → Auditor PASS → 
Approver REJECT → Back to Reviewer → Correct → Resubmit → Approver APPROVE → Certificate
Total Cost: 5,000 THB + time
Timeline: ~6-8 weeks
```

### Case 7: Maximum Complexity
```
Farmer → Submit + Pay 5,000 → Reviewer REJECT (1st) → Fix → REJECT (2nd) → Fix → 
REJECT (3rd) → Pay 5,000 → PASS → Auditor FAIL → Pay 25,000 → Re-audit PASS → 
Approver REJECT → Fix → Approver APPROVE → Certificate
Total Cost: 35,000 THB
Timeline: ~12-16 weeks
```

## 🎭 Dashboard Requirements by Role

### 🌾 Farmer Dashboard
- **Application Status Widget**: Current stage with progress bar
- **Payment Section**: 
  - 5,000 THB (Initial): Auto-required after document submission
  - 5,000 THB (3rd Review): Enabled when reject count = 2
  - 25,000 THB (Audit): Enabled after audit fail/doubt
- **Document Section**: Upload/view SOP, COA, Land documents
- **Rejection Counter**: Show "Rejected 1/2 times" with feedback
- **Certificate Download**: Available after approval

### 📋 Reviewer Dashboard
- **Pending Reviews Queue**: Applications waiting for review
- **Rejection Counter**: Show per application (0/2, 1/2, 2/2)
- **Payment Status**: Show if 3rd review requires payment
- **Review History**: Previous rejections and reasons
- **Bulk Actions**: Approve/reject multiple applications

### 🔍 Auditor Dashboard
- **Scheduled Audits**: Calendar view of upcoming audits
- **Audit Queue**: Applications ready for audit
- **Audit History**: Previous audit results
- **Field Audit Tracker**: Special audits requiring site visits
- **Payment Requirements**: Flag applications needing audit fees

### ✅ Approver Dashboard
- **Approval Queue**: Complete packages ready for final decision
- **Document Viewer**: Integrated viewer for all documents
- **Audit Reports**: Complete audit findings
- **Decision History**: Audit trail of all approvals/rejections
- **Certificate Generator**: Tools for digital signing

### 💰 Finance Dashboard
- **Payment Overview**: Total collections by type
- **Transaction Log**: All payment gateway records
- **Pending Payments**: Applications waiting for payment
- **Revenue Reports**: Monthly/quarterly financial reports
- **Payment Analytics**: Success rates and patterns

## 🔧 Technical Implementation Requirements

### Database Schema Additions
```sql
-- Applications table updates
ALTER TABLE applications ADD COLUMN rejection_count INTEGER DEFAULT 0;
ALTER TABLE applications ADD COLUMN total_payments DECIMAL(10,2) DEFAULT 0;
ALTER TABLE applications ADD COLUMN current_stage VARCHAR(50);

-- Payments table
CREATE TABLE payments (
  id UUID PRIMARY KEY,
  application_id UUID REFERENCES applications(id),
  amount DECIMAL(10,2) NOT NULL,
  payment_type VARCHAR(20), -- 'document_review', 'audit_fee'
  payment_reason VARCHAR(50), -- 'initial', '3rd_review', 'audit_fail', 'field_audit'
  status VARCHAR(20), -- 'pending', 'completed', 'failed'
  gateway_transaction_id VARCHAR(100),
  paid_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Workflow states
CREATE TABLE workflow_states (
  id UUID PRIMARY KEY,
  application_id UUID REFERENCES applications(id),
  from_state VARCHAR(50),
  to_state VARCHAR(50),
  actor_id UUID,
  actor_role VARCHAR(20),
  reason TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Role Permissions Matrix
```
Action                  | Farmer | Reviewer | Auditor | Approver | Finance
------------------------|--------|----------|---------|----------|--------
Submit Application     |   ✅   |    ❌    |   ❌    |    ❌    |   ❌
Upload Documents       |   ✅   |    ❌    |   ❌    |    ❌    |   ❌
Make Payments          |   ✅   |    ❌    |   ❌    |    ❌    |   ❌
Review Documents       |   ❌   |    ✅    |   ❌    |    ❌    |   ❌
Schedule Audits        |   ❌   |    ❌    |   ✅    |    ❌    |   ❌
Conduct Audits         |   ❌   |    ❌    |   ✅    |    ❌    |   ❌
Final Approval         |   ❌   |    ❌    |   ❌    |    ✅    |   ❌
Generate Certificates  |   ❌   |    ❌    |   ❌    |    ✅    |   ❌
View Payments          |   ✅   |    ❌    |   ❌    |    ❌    |   ✅
Process Refunds        |   ❌   |    ❌    |   ❌    |    ❌    |   ✅
```

## 📬 Notification Requirements

### Automated Notifications
- **Payment Required**: When 3rd review or audit fees are due
- **Status Updates**: Application moves between stages
- **Deadline Reminders**: For pending actions
- **Approval/Rejection**: Final decisions with certificates

### Notification Channels
- **Email**: Official notifications
- **SMS**: Urgent payments and deadlines
- **In-App**: Dashboard notifications
- **LINE Notify**: Optional for Thai users

---

**This analysis provides the complete foundation for implementing the GACP License Application system with all payment scenarios and user journeys.**