# GACP Platform - โครงสร้างระบบ 5 ส่วนหลัก

## 📋 สรุปสิ่งที่ได้สร้างแล้ว

### 🏗️ สถาปัตยกรรมระบบ (Microservices Architecture)

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │  API Gateway    │    │  Load Balancer  │
│   (Vue.js)      │────│   (Express)     │────│     (Nginx)     │
│   Port: 8080    │    │   Port: 3000    │    │   Port: 80/443  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                ┌───────────────┼───────────────┐
                │               │               │
        ┌───────▼──────┐ ┌──────▼──────┐ ┌─────▼──────┐
        │ Auth Service │ │Certification│ │Survey Svc  │
        │  Port: 3001  │ │ Service     │ │Port: 3003  │
        │              │ │ Port: 3002  │ │            │
        └──────────────┘ └─────────────┘ └────────────┘
                │               │               │
        ┌───────▼──────┐ ┌──────▼──────┐ ┌─────▼──────┐
        │Standards Svc │ │Track & Trace│ │CMS Service │
        │ Port: 3004   │ │ Service     │ │Port: 3006  │
        │              │ │ Port: 3005  │ │            │
        └──────────────┘ └─────────────┘ └────────────┘
                │               │               │
        ┌───────▼──────┐ ┌──────▼──────┐ ┌─────▼──────┐
        │ PostgreSQL   │ │  MongoDB    │ │   Redis    │
        │ Port: 5432   │ │ Port: 27017 │ │Port: 6379  │
        └──────────────┘ └─────────────┘ └────────────┘
```

## 🔧 ระบบที่สร้างเสร็จแล้ว

### ✅ 1. Auth Service (ระบบล็อกอินส่วนกลาง)
- **Port**: 3001
- **Database**: PostgreSQL + Redis
- **Features**:
  - ลงทะเบียนผู้ใช้ (`POST /api/auth/register`)
  - เข้าสู่ระบบ (`POST /api/auth/login`)
  - ออกจากระบบ (`POST /api/auth/logout`)
  - ตรวจสอบ Token (`GET /api/auth/verify`)
  - จัดการโปรไฟล์ (`GET/PUT /api/users/profile`)
- **Security**: JWT + Redis Session, bcrypt, Rate limiting
- **User Types**: farmer, processor, distributor, inspector, admin

### ✅ 2. Certification Service (ระบบยื่นขอใบรับรองการปลูก)
- **Port**: 3002
- **Database**: MongoDB + PostgreSQL
- **Features**:
  - ดูรายการคำขอ (`GET /api/applications`)
  - สร้างคำขอใหม่ (`POST /api/applications`)
  - แก้ไขคำขอ (`PUT /api/applications/:id`)
  - ยื่นคำขอ (`POST /api/applications/:id/submit`)
  - ลบคำขอ (`DELETE /api/applications/:id`)
  - อัพโหลดเอกสาร (กำลังพัฒนา)
  - ดาวน์โหลดใบรับรอง (กำลังพัฒนา)

### ⏳ 3. Survey Service (ระบบทำแบบสอบถาม)
- **Port**: 3003
- **Database**: MongoDB
- **Status**: กำลังพัฒนา

### ⏳ 4. Standards Service (ระบบเปรียบเทียบมาตรฐาน)
- **Port**: 3004
- **Database**: PostgreSQL
- **Status**: กำลังพัฒนา

### ⏳ 5. Track & Trace Service (ระบบติดตามย้อนกลับ)
- **Port**: 3005
- **Database**: MongoDB + PostgreSQL
- **Status**: กำลังพัฒนา

### ⏳ 6. CMS Service (ระบบจัดการเนื้อหา)
- **Port**: 3006
- **Database**: MongoDB
- **Status**: กำลังพัฒนา

### ✅ 7. API Gateway
- **Port**: 3000
- **Features**:
  - Service routing และ load balancing
  - Rate limiting
  - Error handling
  - Request logging
  - Health checks

## 🗄️ ฐานข้อมูล

### PostgreSQL (Structured Data)
- **Auth Database**: Users, roles, sessions, audit logs
- **Standards Database**: GACP, WHO/FAO, Asian standards
- **Tracking Database**: Supply chain data

### MongoDB (Document Data)
- **Certification Database**: Applications, documents, certificates
- **Survey Database**: Surveys, responses, analytics
- **Tracking Database**: Product tracking, blockchain-like records
- **CMS Database**: Content, media files, website data

### Redis (Cache & Sessions)
- Session storage
- API response caching
- Rate limiting data

## 🚀 การรันระบบ

### การรันด้วย Docker Compose
```bash
# รันระบบทั้งหมด
docker-compose -f docker-compose.microservices.yml up -d

# ดู logs
docker-compose -f docker-compose.microservices.yml logs -f

# หยุดระบบ
docker-compose -f docker-compose.microservices.yml down
```

### การรันแยกส่วน (Development)
```bash
# 1. เริ่ม databases
docker-compose up postgres mongodb redis -d

# 2. เริ่ม auth service
cd microservices/auth-service
npm install
npm run dev

# 3. เริ่ม certification service
cd microservices/certification-service
npm install
npm run dev

# 4. เริ่ม api gateway
cd api-gateway
npm install
npm run dev
```

## 🔐 Environment Variables

แต่ละ service มีไฟล์ `.env.example` ที่แสดงตัวแปรที่ต้องการ:

### Auth Service
- JWT_SECRET, DB credentials, Redis settings

### Certification Service  
- MongoDB URI, Auth service URL, Upload settings

### API Gateway
- Service URLs, CORS settings, Rate limits

## 📊 การทดสอบ API

### Health Checks
```bash
# API Gateway
curl http://localhost:3000/health

# Auth Service
curl http://localhost:3001/health

# Certification Service
curl http://localhost:3002/health
```

### Authentication Flow
```bash
# 1. Register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "farmer@example.com",
    "password": "Password123!",
    "firstName": "สมชาย",
    "lastName": "ใจดี",
    "phoneNumber": "0812345678",
    "organizationType": "farmer"
  }'

# 2. Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "farmer@example.com",
    "password": "Password123!"
  }'

# 3. Use token for other APIs
curl -X GET http://localhost:3000/api/certification/applications \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 📁 โครงสร้างไฟล์

```
/workspaces/gacp-certify-flow/
├── microservices/
│   ├── auth-service/           ✅ สมบูรณ์
│   │   ├── src/
│   │   ├── database/
│   │   ├── Dockerfile
│   │   └── package.json
│   ├── certification-service/  ✅ สมบูรณ์
│   │   ├── src/
│   │   ├── Dockerfile
│   │   └── package.json
│   ├── survey-service/         ⏳ รอพัฒนา
│   ├── standards-service/      ⏳ รอพัฒนา
│   ├── track-trace-service/    ⏳ รอพัฒนา
│   └── cms-service/           ⏳ รอพัฒนา
├── api-gateway/               ✅ สมบูรณ์
├── frontend/                  ⏳ รอพัฒนา
├── docker-compose.microservices.yml ✅ สมบูรณ์
└── README.md
```

## 🎯 ขั้นตอนถัดไป

1. **สร้าง Survey Service** - ระบบทำแบบสอบถาม
2. **สร้าง Standards Service** - ระบบเปรียบเทียบมาตรฐาน
3. **สร้าง Track & Trace Service** - ระบบติดตามย้อนกลับ
4. **สร้าง CMS Service** - ระบบจัดการเนื้อหา
5. **สร้าง Frontend** - หน้าเว็บสำหรับผู้ใช้
6. **เพิ่มฟีเจอร์ขั้นสูง** - File upload, Payment, Notifications

## 🔒 Security Features

- JWT Authentication with Redis sessions
- Password hashing with bcrypt
- Rate limiting
- CORS protection
- Input validation
- SQL injection protection
- XSS protection with Helmet

## 📈 Monitoring & Logging

- Winston logging for all services
- Request/response logging in API Gateway
- Error tracking and stack traces
- Health check endpoints
- Performance monitoring ready

ระบบนี้พร้อมสำหรับการพัฒนาต่อและสามารถขยายได้ตามความต้องการ 🚀