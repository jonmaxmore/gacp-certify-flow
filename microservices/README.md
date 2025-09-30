# GACP Platform Microservices Architecture

## โครงสร้างระบบ 5 ส่วนหลัก

### 1. 🔐 Auth Service (ระบบล็อกอินส่วนกลาง)
- **Port**: 3001
- **Database**: PostgreSQL + Redis
- **Function**: JWT authentication, Session management, User roles

### 2. 📋 Certification Service (ระบบยื่นขอใบรับรองการปลูก)
- **Port**: 3002
- **Database**: PostgreSQL + MongoDB
- **Function**: Application submission, Document management, Certificate issuance

### 3. 📊 Survey Service (ระบบทำแบบสอบถาม)
- **Port**: 3003
- **Database**: MongoDB
- **Function**: Survey creation, Response collection, Analytics

### 4. 📏 Standards Service (ระบบเปรียบเทียบมาตรฐาน)
- **Port**: 3004
- **Database**: PostgreSQL
- **Function**: GACP vs WHO/FAO/Asian standards comparison

### 5. 🔍 Track & Trace Service (ระบบติดตามย้อนกลับ)
- **Port**: 3005
- **Database**: MongoDB + PostgreSQL
- **Function**: Product tracking, Supply chain monitoring

### 6. 🌐 CMS Service (ระบบจัดการเนื้อหาและ Multimedia)
- **Port**: 3006
- **Database**: MongoDB
- **Function**: Content management, File storage, Website display

## 🚪 API Gateway
- **Port**: 3000
- **Function**: Route management, Load balancing, Authentication middleware

## 🖥️ Frontend
- **Technology**: React/Vue.js
- **Function**: User interfaces for all 5 systems

## 🗄️ Databases
- **PostgreSQL**: Structured data (users, certifications, standards)
- **MongoDB**: Unstructured data (surveys, content, tracking)
- **Redis**: Sessions, caching

## 🔧 Shared Components
- Authentication middleware
- Database connections
- Common utilities
- Logging system