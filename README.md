# GACP Certification System - Microservices Architecture

## Overview

GACP (Good Agricultural and Collection Practices) Certification System เป็นระบบรับรองมาตรฐานการปลูกและเก็บรวบรวมพืชสมุนไพรที่ออกแบบด้วยสถาปัตยกรรมแบบ Microservices เพื่อรองรับการทำงานในระดับ Enterprise

## สถาปัตยกรรมระบบ

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Frontend Layer (Presentation)                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ Farmer Portal│  │  DTAM Portal │  │ Public Portal│          │
│  │ (React/Next) │  │ (React/Next) │  │ (Next.js SSR)│          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                              ↓↑ HTTPS/REST API
┌─────────────────────────────────────────────────────────────────┐
│                      API Gateway Layer                           │
│  ┌────────────────────────────────────────────────────────┐     │
│  │  Kong API Gateway with Plugins:                        │     │
│  │  • JWT Authentication  • Rate Limiting                 │     │
│  │  • CORS Management    • Request/Response Logging       │     │
│  │  • Circuit Breaker    • Load Balancing               │     │
│  └────────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────┘
                              ↓↑ Internal Services
┌─────────────────────────────────────────────────────────────────┐
│                    Microservices Layer                           │
│  ┌────────────────┐ ┌────────────────┐ ┌────────────────┐      │
│  │ Core           │ │ Standards      │ │ Survey         │      │
│  │ Certification  │ │ Analysis       │ │ Management     │      │
│  │ Service        │ │ Service        │ │ Service        │      │
│  └────────────────┘ └────────────────┘ └────────────────┘      │
└─────────────────────────────────────────────────────────────────┘
                              ↓↑ Database Layer
┌─────────────────────────────────────────────────────────────────┐
│                      Data Layer                                  │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐   │
│  │ PostgreSQL │ │   Redis    │ │ File Store │ │ Audit Logs │   │
│  │ (Primary)  │ │  (Cache)   │ │ (MinIO/S3) │ │(Elasticsearch)│   │
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

## Database Design

### Core Tables
- `user_profiles` - ข้อมูลผู้ใช้และสิทธิ์
- `gacp_applications` - ใบสมัครรับรอง
- `products` - ข้อมูลผลิตภัณฑ์สมุนไพร
- `payments` - การชำระเงิน
- `certificates` - ใบรับรอง
- `audit_logs` - บันทึกการตรวจสอบ

### Security Features
- Row Level Security (RLS) policies
- Encrypted PII fields
- Audit trail for all operations
- Materialized views for performance

## Getting Started

### Prerequisites
- Docker & Docker Compose
- Node.js 18+ (for development)
- PostgreSQL 15+
- Redis 7+

### Installation

1. **Clone Repository**
```bash
git clone https://github.com/jonmaxmore/gacp-certify-flow.git
cd gacp-certify-flow
```

2. **Environment Setup**
```bash
cp .env.example .env
# แก้ไขค่า environment variables
```

3. **Start Services**
```bash
# Development mode
npm run dev

# Production mode
npm run build
npm start
```

4. **Database Migration**
```bash
npm run migrate
npm run seed
```

### Development Commands

```bash
# Start all services
npm run dev

# View logs
npm run logs

# Stop all services
npm stop

# Run tests
npm test

# Security audit
npm run security:audit

# Generate documentation
npm run docs
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

## Testing

### Unit Tests
```bash
npm test
```

### Integration Tests
```bash
npm run test:integration
```

### Load Testing
```bash
npm run test:load
```

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

สำหรับการสนับสนุนและคำถาม:
- Email: support@dtam.go.th
- Documentation: [https://docs.gacp.dtam.go.th](https://docs.gacp.dtam.go.th)
- Issues: [GitHub Issues](https://github.com/jonmaxmore/gacp-certify-flow/issues)