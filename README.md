# 🌿 ระบบการผลิตสมุนไพรไทยตามแนวทางปฏิบัติทางการเกษตรและเก็บเกี่ยวที่ดีของพืชสมุนไพร เพื่อยกระดับมาตรฐานสู่สากล (GACP)

## 🏛️ Thai Herbal GACP Certification Platform

**Department of Thai Traditional and Alternative Medicine (DTAM)**  
*Ministry of Public Health, Kingdom of Thailand*

ระบบรับรองมาตรฐาน GACP สำหรับสมุนไพรไทย ที่พัฒนาด้วยเทคโนโลยี Microservices Architecture เพื่อยกระดับการผลิตสมุนไพรไทยสู่มาตรฐานสากล

## 🏗️ สถาปัตยกรรมระบบ

### Microservices Architecture

```ascii
┌─────────────────────────────────────────────────────────────────┐
│                     API Gateway Layer                            │
│  ┌────────────────────────────────────────────────────────┐     │
│  │  Kong API Gateway + Nginx Proxy                       │     │
│  │  • JWT Authentication    • Rate Limiting              │     │
│  │  • CORS Management      • Request Logging             │     │
│  │  • Circuit Breaker      • Load Balancing             │     │
│  │  • Defense-in-Depth Security (5 Layers)             │     │
│  └────────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────┘
                              ↓↑ REST API / JSON
┌─────────────────────────────────────────────────────────────────┐
│                    Microservices Layer                           │
│  ┌────────────────┐ ┌────────────────┐ ┌────────────────┐      │
│  │ Core           │ │ Standards      │ │ Survey         │      │
│  │ Certification  │ │ Analysis       │ │ Management     │      │
│  │ Service        │ │ Service        │ │ Service        │      │
│  │ (Fastify)      │ │ (Node.js)      │ │ (Node.js)      │      │
│  │ Port: 3001     │ │ Port: 3002     │ │ Port: 3003     │      │
│  └────────────────┘ └────────────────┘ └────────────────┘      │
└─────────────────────────────────────────────────────────────────┘
                              ↓↑ Database Connections
┌─────────────────────────────────────────────────────────────────┐
│                      Data Layer                                  │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐   │
│  │  MongoDB   │ │   Redis    │ │Docker Vol. │ │ Audit Logs │   │
│  │ 6.0 + Auth │ │ 7-Alpine   │ │(File Store)│ │  (MongoDB) │   │
│  │Port: 27017 │ │Port: 6379  │ │ Persistent │ │ Collections│   │
│  └────────────┘ └────────────┘ └────────────┘ └────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## Core Services

### 1. Core Certification Service (Port 3001)
- **หน้าที่**: จัดการใบสมัคร, การรับรอง, การชำระเงิน
- **Features**:
  - Application Management
  - Payment Processing
  - Certificate Generation
  - Status Tracking
  - Document Management

### 2. Standards Analysis Service (Port 3002)
- **หน้าที่**: วิเคราะห์มาตรฐาน GACP และการประเมิน
- **Features**:
  - Standard Compliance Check
  - Risk Assessment
  - Quality Metrics
  - Audit Trail

### 3. Survey Management Service (Port 3003)
- **หน้าที่**: จัดการแบบสำรวจและการประเมิน
- **Features**:
  - Survey Creation
  - Response Collection
  - Analytics & Reporting
  - Notification System

## Security Architecture

### Defense-in-Depth (5 Layers)

1. **Network Security**
   - HTTPS/TLS 1.3
   - Security Headers (Helmet.js)
   - CORS Policy
   - Rate Limiting

2. **Application Security**
   - Input Validation & Sanitization
   - XSS Protection
   - CSRF Protection
   - SQL Injection Prevention

3. **Authentication & Authorization**
   - JWT with RS256
   - Role-Based Access Control (RBAC)
   - Token Blacklisting
   - Session Management

4. **Data Protection**
   - Field-level Encryption
   - Database Row Level Security (RLS)
   - PII Data Encryption
   - Audit Logging

5. **Monitoring & Response**
   - Real-time Monitoring
   - Security Event Logging
   - Intrusion Detection
   - Automated Response

## 🗄️ Database Design (MongoDB)

### Core Collections

- `users` - ข้อมูลผู้ใช้และสิทธิ์ (farmer, dtam, admin)
- `farms` - ข้อมูลฟาร์มและการปลูก
- `applications` - ใบสมัครรับรอง GACP
- `certificates` - ใบรับรองที่ออกแล้ว  
- `payments` - การชำระเงินและสถานะ
- `inspections` - การตรวจสอบและประเมิน
- `standards` - มาตรฐาน GACP และเกณฑ์

### Security Features

- MongoDB Authentication & Authorization
- Field-level encryption for PII data
- Audit trail collections with timestamps
- Index optimization for performance
- Connection pooling and rate limiting

## Getting Started

### Prerequisites

- Docker & Docker Compose
- Node.js 18+ LTS (สำหรับ development)  
- MongoDB 6.0+ (หรือใช้ Docker)
- Redis 7+ (หรือใช้ Docker)

### Installation

1. **Clone Repository**

```bash
git clone https://github.com/jonmaxmore/gacp-certify-flow.git
cd gacp-certify-flow
```

2. **Environment Setup**

```bash
cp .env.example .env
# แก้ไขค่า environment variables สำหรับ MongoDB และ Redis
```

3. **Start Services**

```bash
# Development mode with Docker
npm run dev

# Production mode
npm run build
npm start
```

4. **MongoDB Initialization**

```bash
# MongoDB จะ initialize อัตโนมัติผ่าน Docker
# ข้อมูล initial setup ใน mongo-init/01-init-db.js
docker-compose logs mongodb
```

### Development Commands

```bash
# Start all services with Docker
npm run dev

# View container logs  
npm run logs

# Stop all services
npm run stop

# Build production images
npm run build

# Run tests
npm test
```

## API Endpoints

### Core Certification Service
- `POST /api/v1/applications` - สร้างใบสมัคร
- `GET /api/v1/applications/:id` - ดูข้อมูลใบสมัคร
- `POST /api/v1/applications/:id/submit` - ส่งใบสมัคร
- `GET /api/v1/payments/:id` - ข้อมูลการชำระเงิน

### Standards Analysis Service
- `POST /api/v1/standards/analyze` - วิเคราะห์มาตรฐาน
- `GET /api/v1/standards/compliance` - ตรวจสอบการปฏิบัติตาม

### Survey Management Service
- `POST /api/v1/surveys` - สร้างแบบสำรวจ
- `GET /api/v1/surveys/:id` - ดูแบบสำรวจ
- `POST /api/v1/surveys/:id/responses` - บันทึกคำตอบ

## Monitoring & Observability

### Health Checks
- `/health` - Service health status
- `/metrics` - Prometheus metrics
- `/ready` - Readiness probe

### Logging
- Structured JSON logging
- Elasticsearch integration
- Real-time log streaming
- Error tracking

### Metrics
- Application performance
- Business metrics
- Security events
- Resource utilization

## Deployment

### Production Deployment
```bash
# Build images
docker-compose -f docker-compose.prod.yml build

# Deploy to production
docker-compose -f docker-compose.prod.yml up -d
```

### Environment Variables
```bash
# Database
DB_HOST=postgres
DB_PASSWORD=your_secure_password
REDIS_PASSWORD=your_redis_password

# JWT Keys
JWT_PUBLIC_KEY=path/to/public.key
JWT_PRIVATE_KEY=path/to/private.key

# External Services
ELASTICSEARCH_URL=http://elasticsearch:9200
OMISE_SECRET_KEY=your_omise_key
```

## 🧪 Testing

### Unit Tests

```bash
npm test
```

### Service Integration Tests

```bash
npm run test:integration
```

### API Load Testing

```bash
npm run test:load
```

## 📞 Support & Contact

**กรมการแพทย์แผนไทยและการแพทย์ทางเลือก (DTAM)**  
*กระทรวงสาธารณสุข ราชอาณาจักรไทย*

- 🌐 **Website**: [https://dtam.moph.go.th](https://dtam.moph.go.th)
- 📧 **Email**: <gacp@dtam.moph.go.th>
- 📞 **Tel**: 02-590-4000 ต่อ 4200-4299
- 📍 **Address**: ถนนติวานนท์ ตำบลตลาดขวัญ อำเภอเมือง นนทบุรี 11000

### 🤝 Research Partners

- **มหาวิทยาลัยราชภัฏสวนสุนันทา**
- **บริษัท พรีดิกทีฟ เอไอ โซลูชัน จำกัด** - AI & Machine Learning Solutions

## 📜 License

Copyright (c) 2025 Department of Thai Traditional and Alternative Medicine (DTAM)  
Ministry of Public Health, Kingdom of Thailand

## Property Notice

This project is property of the Royal Thai Government

---

### 🔧 Technical Development

**Developed by**: Premierprime Co., Ltd.  
**For any technical issues**: [GitHub Issues](https://github.com/jonmaxmore/gacp-certify-flow/issues)
