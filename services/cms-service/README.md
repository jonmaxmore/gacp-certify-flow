# GACP CMS Service

## Overview
Content Management System for GACP (Good Agricultural and Collection Practices) platform providing multilingual content management, GACP-specific documentation, and herbal database content.

## Features

### 🌟 Core Features
- **Content Management**: Create, edit, and publish articles, guides, standards, and documentation
- **Multilingual Support**: Thai, English, Chinese, Myanmar, and Khmer language support
- **Media Management**: Image and document upload with automatic optimization
- **Page Management**: Dynamic page creation with customizable templates
- **Menu Management**: Hierarchical navigation menus
- **Search & Filter**: Full-text search with category and tag filtering

### 🌿 GACP-Specific Features
- **Standards Documentation**: GACP compliance standards with structured content
- **Guidelines Management**: Step-by-step implementation guides
- **Documentation Repository**: Process documentation and forms
- **Herbal Database**: Cannabis and traditional herb information
- **Compliance Templates**: Pre-built content templates for GACP requirements

### 🔧 Technical Features
- **Markdown Processing**: Enhanced markdown with GACP-specific elements
- **SEO Optimization**: Automated meta tags and structured data
- **Content Analytics**: Reading time, word count, and engagement metrics
- **Audit Logging**: Complete audit trail for all content operations
- **Content Validation**: GACP compliance validation rules

## Installation

### Prerequisites
- Node.js 18+ LTS
- MongoDB 5.0+
- Redis 6.0+ (for caching)

### Setup
```bash
# Install dependencies
cd services/cms-service
npm install

# Create environment file
cp .env.example .env

# Configure environment variables
nano .env

# Start the service
npm start

# Development mode with auto-reload
npm run dev
```

### Environment Variables
```env
# Server Configuration
CMS_PORT=4008
NODE_ENV=development

# Database Configuration
MONGODB_URL=mongodb://localhost:27017
MONGODB_DB_NAME=gacp_cms

# File Upload Configuration
UPLOAD_MAX_SIZE=10485760
UPLOAD_ALLOWED_TYPES=image/jpeg,image/png,image/gif,image/webp,application/pdf

# Security Configuration
ALLOWED_ORIGINS=http://localhost:3000,https://gacp.go.th
JWT_SECRET=your-jwt-secret-key

# External Services
SITE_URL=https://gacp.go.th
PAPERTRAIL_HOST=logs.papertrailapp.com
PAPERTRAIL_PORT=12345

# Logging Configuration
LOG_LEVEL=info
```

## API Documentation

### Content Management

#### Create Content
```http
POST /api/content
Content-Type: application/json

{
  "title": "GACP Cannabis Guidelines",
  "content": "# Introduction\n\nThis guide covers...",
  "type": "guide",
  "category": "gacp",
  "language": "th",
  "author": "Department of Agriculture",
  "tags": ["cannabis", "guidelines", "gacp"],
  "meta": {
    "description": "Comprehensive cannabis cultivation guidelines",
    "keywords": ["cannabis", "cultivation", "gacp", "standards"]
  }
}
```

#### Get Content List
```http
GET /api/content?type=guide&category=gacp&language=th&page=1&limit=20
```

#### Get Content by ID
```http
GET /api/content/{id}
```

#### Update Content
```http
PUT /api/content/{id}
Content-Type: application/json

{
  "title": "Updated Title",
  "content": "Updated content...",
  "status": "published"
}
```

#### Publish/Unpublish Content
```http
POST /api/content/{id}/publish
POST /api/content/{id}/unpublish
```

### Media Management

#### Upload Media
```http
POST /api/media/upload
Content-Type: multipart/form-data

file: [binary data]
```

#### Get Media List
```http
GET /api/media?type=image&page=1&limit=20
```

### GACP Specific Endpoints

#### Get GACP Standards
```http
GET /api/gacp/standards?language=th
```

#### Get GACP Guidelines
```http
GET /api/gacp/guidelines?language=th
```

#### Get GACP Documentation
```http
GET /api/gacp/documentation?language=th
```

#### Get Herbal Database
```http
GET /api/herbal/database?category=cannabis&language=th
```

### Search and Filter

#### Search Content
```http
GET /api/search?query=cannabis&type=guide&language=th
```

#### Get Categories
```http
GET /api/categories?language=th
```

## Content Types

### Standard
GACP compliance standards with mandatory requirements
- **Structure**: Introduction, Scope, Definitions, Requirements, Implementation, Verification
- **Required Fields**: version, effective_date, review_date
- **Compliance Level**: Mandatory

### Guide
Step-by-step implementation guides
- **Structure**: Overview, Background, Step-by-step, Examples, Best Practices
- **Required Fields**: target_audience, difficulty_level
- **Compliance Level**: Recommended

### Documentation
Process documentation and forms
- **Structure**: Purpose, Procedure, Requirements, Forms, Timeline
- **Required Fields**: process_owner, last_updated
- **Compliance Level**: Informational

### Article
General articles and herbal database content
- **Structure**: Flexible content structure
- **Categories**: herbal-cannabis, herbal-traditional, research
- **Compliance Level**: Informational

## Multilingual Support

### Supported Languages
- **Thai (th)**: Primary language, full RTL support
- **English (en)**: Secondary language
- **Chinese (zh)**: Traditional and Simplified
- **Myanmar (my)**: Burmese script support
- **Khmer (km)**: Cambodian script support

### Translation Workflow
1. Create content in primary language (Thai)
2. Use translation API or manual translation
3. Store translations linked to original content
4. Serve appropriate language based on user preference

## Content Processing

### Markdown Extensions
- **GACP Warnings**: `[WARNING] Important safety information`
- **GACP Notes**: `[NOTE] Additional information`
- **GACP Important**: `[IMPORTANT] Critical information`
- **Auto-generated TOC**: Automatic table of contents from headings
- **Step Numbering**: Automatic step numbering in guides

### SEO Features
- Automatic meta tag generation
- Schema.org structured data
- OpenGraph and Twitter Card support
- Sitemap generation
- Canonical URL management

## Database Schema

### Content Collection
```javascript
{
  id: "uuid",
  title: "string",
  content: "text",
  htmlContent: "html",
  type: "enum",
  category: "string",
  slug: "string",
  language: "string",
  status: "enum",
  author: "string",
  tags: ["string"],
  meta: {
    description: "string",
    keywords: ["string"],
    readingTime: "number"
  },
  seo: {
    title: "string",
    description: "string",
    keywords: "string"
  },
  views: "number",
  likes: "number",
  createdAt: "date",
  updatedAt: "date",
  publishedAt: "date"
}
```

### Media Collection
```javascript
{
  id: "uuid",
  filename: "string",
  originalName: "string",
  mimetype: "string",
  size: "number",
  url: "string",
  thumbnailUrl: "string",
  dimensions: {
    width: "number",
    height: "number"
  },
  alt: "string",
  caption: "string",
  uploadedAt: "date"
}
```

## Security Features

### Input Validation
- Joi schema validation for all endpoints
- File type and size restrictions
- Content sanitization
- XSS protection

### Access Control
- Role-based access control (RBAC)
- Content-level permissions
- API rate limiting
- CORS configuration

### Audit Logging
- Complete audit trail for all operations
- User action tracking
- Security event logging
- Performance monitoring

## Performance Optimization

### Caching Strategy
- Redis caching for frequently accessed content
- CDN integration for media files
- Database query optimization
- Response compression

### Media Optimization
- Automatic image resizing and compression
- Thumbnail generation
- WebP format conversion
- Lazy loading support

## Monitoring and Logging

### Health Checks
```http
GET /health
```

Response:
```json
{
  "status": "healthy",
  "service": "GACP CMS Service",
  "timestamp": "2024-01-20T10:30:00Z",
  "version": "1.0.0",
  "database": "connected",
  "uptime": "2h 15m 30s"
}
```

### Log Levels
- **DEBUG**: Detailed application flow
- **INFO**: General information and audit events
- **WARN**: Warning conditions and performance issues
- **ERROR**: Error conditions requiring attention

### Metrics
- Request/response times
- Database operation performance
- Memory and CPU usage
- Content engagement metrics

## Integration

### GACP Platform Integration
- Authentication via JWT tokens
- User role synchronization
- Content permission inheritance
- Audit log aggregation

### External Services
- Email notifications for content workflow
- Search engine integration
- Analytics tracking
- Backup and archival services

## Development

### Project Structure
```
services/cms-service/
├── src/
│   ├── index.js              # Main application entry point
│   ├── models/
│   │   └── schemas.js        # Data validation schemas
│   └── utils/
│       ├── contentProcessor.js # Content processing utilities
│       └── logger.js         # Logging configuration
├── logs/                     # Application logs
├── uploads/                  # Uploaded media files
├── package.json              # Dependencies and scripts
└── README.md                # This file
```

### Testing
```bash
# Run tests
npm test

# Run with coverage
npm run test:coverage

# Run linting
npm run lint

# Run type checking
npm run type-check
```

### Contributing
1. Follow Thai government coding standards
2. Write comprehensive tests for new features
3. Update documentation for API changes
4. Ensure GACP compliance for all content features
5. Test multilingual functionality thoroughly

## Deployment

### Docker Deployment
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 4008
CMD ["npm", "start"]
```

### Kubernetes Deployment
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: gacp-cms-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: gacp-cms-service
  template:
    spec:
      containers:
      - name: cms-service
        image: gacp/cms-service:latest
        ports:
        - containerPort: 4008
        env:
        - name: MONGODB_URL
          valueFrom:
            secretKeyRef:
              name: gacp-secrets
              key: mongodb-url
```

## Support

### Documentation
- API Documentation: `/api/docs`
- User Guide: Available in CMS interface
- Developer Guide: This README

### Contact
- **Team**: GACP Platform Development Team
- **Department**: กรมวิชาการเกษตร (Department of Agriculture)
- **Support**: gacp-support@doa.go.th

---

## Changelog

### Version 1.0.0 (2024-01-20)
- Initial release with core CMS functionality
- Multilingual support for 5 languages
- GACP-specific content templates and validation
- Media management with optimization
- Comprehensive audit logging
- SEO optimization features
- Performance monitoring and health checks