# GACP Certificate Generation System Documentation

## Overview

The GACP Certificate Generation System is a comprehensive digital certificate management solution for generating, managing, and verifying Good Agricultural and Collection Practices (GACP) certificates. The system provides secure PDF certificate generation with QR codes, digital signatures, and public verification capabilities.

## Features

### Core Functionality
- **PDF Certificate Generation**: Professional PDF certificates with Thai and English content
- **QR Code Integration**: Embedded QR codes for instant verification
- **Digital Signatures**: RSA-based digital signatures for authenticity
- **Public Verification**: Web-based certificate verification system
- **Multi-language Support**: Thai and English content
- **Security Features**: Tamper-evident design with encryption

### Certificate Management
- **Automatic Generation**: Triggered when applications are approved
- **Download System**: Secure certificate download with access control
- **Verification API**: Public API for certificate authenticity checking
- **Search & Statistics**: Admin tools for certificate management
- **User Dashboard**: Personal certificate portfolio for users

## System Architecture

### Components

1. **CertificateGenerationService.js**
   - Core service for certificate generation
   - PDF creation with PDFKit library
   - QR code generation with qrcode library
   - Digital signature implementation
   - File system management

2. **Certificate API Routes (/api/certificates/)**
   - `/generate/:applicationId` - Generate new certificate
   - `/download/:certificateNumber` - Download certificate PDF
   - `/verify/:certificateNumber` - Verify certificate authenticity
   - `/info/:certificateNumber` - Get certificate information
   - `/user/:userId` - Get user's certificates
   - `/search` - Search certificates (admin)
   - `/stats` - Certificate statistics (admin)

3. **Public Verification System**
   - Web-based verification interface
   - QR code scanning support
   - Real-time authenticity checking
   - Mobile-responsive design

## Technical Implementation

### Dependencies

```json
{
  "pdfkit": "^0.13.0",
  "qrcode": "^1.5.3",
  "crypto": "built-in",
  "fs": "built-in",
  "express": "^4.18.0"
}
```

### Certificate Structure

#### PDF Layout
- **Header Section**: Government logo, issuing authority information
- **Title Section**: Certificate title in Thai and English
- **Body Section**: Certificate holder information and scope
- **Details Section**: Certification details, dates, and audit information
- **Signature Section**: Official signatures and approval information
- **Security Section**: QR code, digital signature, and verification URL
- **Footer Section**: Legal disclaimer and generation timestamp

#### Certificate Data Schema
```javascript
{
  certificateNumber: "GACP2567071A2B3C",
  issueDate: "2024-01-15T00:00:00Z",
  expiryDate: "2027-01-15T00:00:00Z",
  holderName: "นางสาวสมใจ ใจดี",
  businessName: "สวนสมุนไพรใจดี",
  scope: "การปลูกและผลิตสมุนไพรตามมาตรฐาน GACP",
  verificationUrl: "https://gacp.doa.go.th/verify/GACP2567071A2B3C",
  digitalSignature: "base64EncodedSignature...",
  qrCode: "jsonStringWithVerificationData"
}
```

### Security Features

#### Digital Signatures
- **Algorithm**: SHA256withRSA
- **Key Size**: 2048-bit RSA keys
- **Signature Process**: 
  1. Hash certificate core data using SHA256
  2. Sign hash with private key
  3. Embed signature in certificate
  4. Store public key for verification

#### QR Code Content
```javascript
{
  certificateNumber: "GACP2567071A2B3C",
  holderName: "นางสาวสมใจ ใจดี",
  issueDate: "2024-01-15T00:00:00Z",
  expiryDate: "2027-01-15T00:00:00Z",
  verificationUrl: "https://gacp.doa.go.th/verify/GACP2567071A2B3C",
  hash: "sha256HashOfCertificateData"
}
```

#### Security Measures
- **Tamper Detection**: Digital signature verification
- **Data Integrity**: SHA256 hashing
- **Access Control**: Role-based permissions
- **Audit Logging**: Complete operation logging
- **File Protection**: Secure file storage with access controls

## API Documentation

### Generate Certificate

**POST** `/api/certificates/generate/:applicationId`

**Authorization**: Approver, Admin roles required

**Parameters**:
- `applicationId` (path): Application ID to generate certificate for

**Request Body**:
```javascript
{
  "options": {
    "regenerate": false,
    "reason": "Initial generation"
  }
}
```

**Response**:
```javascript
{
  "success": true,
  "message": "Certificate generated successfully",
  "data": {
    "certificateNumber": "GACP2567071A2B3C",
    "filePath": "/certificates/GACP2567071A2B3C.pdf",
    "downloadUrl": "/api/certificates/download/GACP2567071A2B3C",
    "verificationUrl": "/verify/GACP2567071A2B3C",
    "issueDate": "2024-01-15T00:00:00Z",
    "expiryDate": "2027-01-15T00:00:00Z"
  }
}
```

### Download Certificate

**GET** `/api/certificates/download/:certificateNumber`

**Authorization**: Public access with valid certificate number

**Parameters**:
- `certificateNumber` (path): Certificate number to download

**Response**: PDF file stream with appropriate headers

### Verify Certificate

**GET** `/api/certificates/verify/:certificateNumber`

**Authorization**: Public access

**Parameters**:
- `certificateNumber` (path): Certificate number to verify

**Response**:
```javascript
{
  "success": true,
  "data": {
    "valid": true,
    "certificateNumber": "GACP2567071A2B3C",
    "holderName": "นางสาวสมใจ ใจดี",
    "businessName": "สวนสมุนไพรใจดี",
    "issueDate": "2024-01-15T00:00:00Z",
    "expiryDate": "2027-01-15T00:00:00Z",
    "scope": "การปลูกและผลิตสมุนไพรตามมาตรฐาน GACP",
    "issuingAuthority": "กรมวิชาการเกษตร กระทรวงเกษตรและสหกรณ์",
    "digitalSignatureValid": true,
    "applicationNumber": "GACP2024-001234"
  }
}
```

### Get User Certificates

**GET** `/api/certificates/user/:userId`

**Authorization**: User can access own certificates, admin can access all

**Parameters**:
- `userId` (path): User ID to get certificates for

**Response**:
```javascript
{
  "success": true,
  "data": [
    {
      "certificateNumber": "GACP2567071A2B3C",
      "applicationNumber": "GACP2024-001234",
      "holderName": "นางสาวสมใจ ใจดี",
      "businessName": "สวนสมุนไพรใจดี",
      "scope": "การปลูกและผลิตสมุนไพรตามมาตรฐาน GACP",
      "issueDate": "2024-01-15T00:00:00Z",
      "expiryDate": "2027-01-15T00:00:00Z",
      "status": "valid",
      "downloadUrl": "/api/certificates/download/GACP2567071A2B3C"
    }
  ],
  "count": 1
}
```

### Search Certificates (Admin)

**GET** `/api/certificates/search`

**Authorization**: Admin role required

**Query Parameters**:
- `search` (string): Search term for certificate number or holder name
- `status` (string): Filter by certificate status
- `dateFrom` (date): Start date for issue date filter
- `dateTo` (date): End date for issue date filter
- `page` (number): Page number for pagination (default: 1)
- `limit` (number): Results per page (default: 10)

**Response**:
```javascript
{
  "success": true,
  "data": [
    {
      "certificateNumber": "GACP2567071A2B3C",
      "applicationNumber": "GACP2024-001234",
      "holderName": "นางสาวสมใจ ใจดี",
      "businessName": "สวนสมุนไพรใจดี",
      "scope": "การปลูกและผลิตสมุนไพรตามมาตรฐาน GACP",
      "issueDate": "2024-01-15T00:00:00Z",
      "expiryDate": "2027-01-15T00:00:00Z",
      "status": "valid"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "pages": 1
  }
}
```

### Certificate Statistics (Admin)

**GET** `/api/certificates/stats`

**Authorization**: Admin role required

**Response**:
```javascript
{
  "success": true,
  "data": {
    "overview": {
      "totalCertificates": 150,
      "recentCertificates": 12,
      "expiredCertificates": 5,
      "expiringSoon": 8
    },
    "monthly": [
      {
        "year": 2024,
        "month": 1,
        "count": 12
      }
    ]
  }
}
```

## Configuration

### Environment Variables

```bash
# Certificate Configuration
CERTIFICATE_PATH=/certificates
TEMPLATE_PATH=/templates
PUBLIC_KEY_PATH=/keys/public.pem
PRIVATE_KEY_PATH=/keys/private.pem
BASE_URL=https://gacp.doa.go.th

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/gacp_certification

# Security Configuration
JWT_SECRET=your_jwt_secret_here
BCRYPT_ROUNDS=12

# File Upload Configuration
MAX_FILE_SIZE=10485760  # 10MB
UPLOAD_PATH=/uploads

# Email Configuration (for notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

### Directory Structure

```
/certificates/                 # Generated certificate PDFs
/templates/                    # Certificate templates (if any)
/keys/                        # RSA key pair for digital signatures
  ├── public.pem             # Public key for verification
  └── private.pem            # Private key for signing
/uploads/                     # Temporary file uploads
/logs/                       # Application logs
```

## Public Verification System

### Web Interface

The system provides a web-based verification interface accessible at:
- `/verify/:certificateNumber` - Public verification page
- Responsive design for mobile and desktop
- Thai language interface with English support
- Real-time verification results
- Download links for valid certificates

### QR Code Scanning

Users can scan QR codes on certificates to:
1. Instantly verify certificate authenticity
2. View certificate details
3. Download original certificate PDF
4. Check current validity status

### Verification Process

1. **Certificate Number Input**: Users enter certificate number
2. **Database Lookup**: System searches for certificate in database
3. **Signature Verification**: Digital signature is validated
4. **Expiry Check**: Certificate validity period is verified
5. **Result Display**: Verification result with certificate details

## Integration Points

### Workflow Engine Integration

The certificate generation system integrates with the workflow engine:

```javascript
// Automatic generation when application approved
workflowEngine.on('application_approved', async (applicationData) => {
  try {
    const result = await certificateService.generateCertificate(applicationData);
    await notificationService.sendCertificateGenerated(applicationData, result);
  } catch (error) {
    logger.error('Auto certificate generation failed', { error });
  }
});
```

### Notification System Integration

Certificate events trigger notifications:
- Certificate generated successfully
- Certificate download notifications
- Certificate expiry warnings
- Verification attempt logs

### Document Management Integration

Certificates are registered with the document management system:
- Automatic document indexing
- Version control for regenerated certificates
- Access control inheritance
- Audit trail maintenance

## Security Considerations

### Data Protection
- Certificate data encryption at rest
- Secure key storage and management
- Access logging and monitoring
- GDPR/PDPA compliance measures

### Signature Security
- RSA 2048-bit key pairs
- Secure key generation and storage
- Regular key rotation procedures
- Hardware security module integration (future)

### File Security
- Secure file storage with access controls
- Anti-tampering measures
- Backup and recovery procedures
- Virus scanning for uploaded files

## Error Handling

### Common Error Scenarios

1. **Application Not Found**: Returns 404 with clear message
2. **Application Not Approved**: Returns 400 with status explanation
3. **Certificate Already Exists**: Returns 400 with existing certificate info
4. **File Generation Failed**: Returns 500 with error logging
5. **Key Pair Missing**: Automatic generation or clear error message
6. **Storage Issues**: Graceful failure with retry mechanisms

### Error Response Format

```javascript
{
  "success": false,
  "message": "Human-readable error message",
  "error": "Technical error details (development only)",
  "errorCode": "CERT_GENERATION_FAILED",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## Monitoring and Logging

### Key Metrics
- Certificate generation success rate
- Average generation time
- Verification requests per day
- Download statistics
- Error rates by type

### Log Events
- Certificate generation attempts and results
- Verification requests and outcomes
- Download events with user tracking
- Security events and anomalies
- System performance metrics

### Alerts
- Certificate generation failures
- Signature verification failures
- High error rates
- Storage space warnings
- Key expiry notifications

## Testing

### Unit Tests
- Certificate data preparation
- PDF generation functionality
- QR code generation
- Digital signature creation and verification
- Data validation and sanitization

### Integration Tests
- End-to-end certificate generation
- API endpoint testing
- Database integration testing
- File system operations
- Security feature testing

### Performance Tests
- Certificate generation under load
- PDF rendering performance
- Concurrent download handling
- Database query optimization
- Memory usage monitoring

## Future Enhancements

### Planned Features
1. **Batch Certificate Generation**: Generate multiple certificates simultaneously
2. **Certificate Templates**: Customizable certificate layouts
3. **Multi-language Support**: Additional language options
4. **Mobile App Integration**: Native mobile verification app
5. **Blockchain Integration**: Immutable certificate records
6. **Advanced Analytics**: Detailed usage and trend analysis

### Technical Improvements
1. **Performance Optimization**: Faster PDF generation
2. **Scalability Enhancements**: Horizontal scaling support
3. **Security Hardening**: Advanced encryption methods
4. **Accessibility Features**: Screen reader support
5. **API Rate Limiting**: Advanced rate limiting and throttling

## Maintenance

### Regular Tasks
- Key rotation procedures
- Certificate cleanup (expired certificates)
- Log rotation and archiving
- Performance monitoring
- Security audits

### Backup Procedures
- Daily certificate database backups
- Key pair backup and recovery
- Generated certificate file backups
- Configuration backup
- Disaster recovery testing

## Conclusion

The GACP Certificate Generation System provides a comprehensive, secure, and user-friendly solution for managing digital certificates. With robust security features, public verification capabilities, and seamless integration with the broader GACP system, it ensures the integrity and authenticity of agricultural certification processes.

The system is designed to be scalable, maintainable, and compliant with modern security standards while providing an excellent user experience for both certificate holders and verifiers.