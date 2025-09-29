# MongoDB Migration Summary

## Overview
The GACP Certification System has been successfully migrated from PostgreSQL to MongoDB. This document outlines the changes made and how to get started with the new architecture.

## Key Changes

### 1. Database Migration
- **From**: PostgreSQL 15 with SQL queries
- **To**: MongoDB 6.3 with Mongoose ODM
- **Connection**: MongoDB authentication with admin user
- **URI Format**: `mongodb://admin:password@mongodb:27017/gacp_db?authSource=admin`

### 2. Data Models
Created comprehensive Mongoose schemas for:
- **Users**: Farmers, DTAM officers, administrators
- **Farms**: Farm information and geographic data
- **Applications**: Certification applications with status tracking
- **Certificates**: Issued certificates with digital signatures
- **Payments**: Payment processing and tracking
- **Inspections**: Field inspection records and results
- **Standards**: GACP standards and requirements

### 3. Service Updates
- Updated `services/core-certification/src/index.js` to use MongoDB
- Replaced SQL queries with Mongoose operations
- Maintained all existing API endpoints
- Added proper error handling for MongoDB operations

### 4. Infrastructure Updates
- Updated `docker-compose.yml` to use MongoDB container
- Added MongoDB initialization scripts in `mongo-init/`
- Created indexes for optimal query performance
- Added health checks for MongoDB connectivity

## Database Schema

### Collections Overview
```
├── users                 # User accounts (farmers, DTAM, admin)
├── farms                 # Farm information and locations
├── applications          # Certification applications
├── certificates          # Issued certificates
├── payments              # Payment records
├── inspections           # Inspection reports
└── standards             # GACP standards and criteria
```

### Key Indexes
- Email uniqueness for users
- Geographic indexing for farm locations
- Application number uniqueness
- Certificate number uniqueness
- Payment tracking by application
- Status-based filtering

## Getting Started

### 1. Environment Setup
Copy the environment template:
```bash
cp .env.example .env
```

Update the following variables:
```bash
MONGO_PASSWORD=your_secure_mongo_password
REDIS_PASSWORD=your_secure_redis_password  
JWT_SECRET=your_super_secret_jwt_key
```

### 2. Start the System
```bash
# Build and start all services
npm run dev

# Or manually with docker-compose
docker-compose up -d
```

### 3. Verify Setup
Check service health:
```bash
# MongoDB health
curl http://localhost:3001/health

# View logs
npm run logs
```

### 4. Default Credentials
The system includes default users:

**Administrator:**
- Email: `admin@gacp.go.th`
- Password: `admin123`

**DTAM Officer:**
- Email: `dtam@gacp.go.th`
- Password: `dtam123`

## API Endpoints (Unchanged)
All existing API endpoints remain the same:
- `POST /api/v1/applications` - Create application
- `POST /api/v1/applications/:id/submit` - Submit for review
- `GET /api/v1/applications/:id/status` - Get application status
- `GET /health` - Health check

## Migration Benefits

### Performance
- Faster queries with optimized indexes
- Better handling of complex nested data
- Improved scalability for large datasets

### Development
- Cleaner data models with Mongoose schemas
- Built-in validation and middleware
- Better handling of JSON documents

### Operations
- Simplified backup and restore procedures
- Better clustering and replication options
- Built-in horizontal scaling capabilities

## Troubleshooting

### Common Issues

1. **MongoDB Connection Failed**
   ```bash
   # Check MongoDB container status
   docker-compose ps mongodb
   
   # View MongoDB logs
   docker-compose logs mongodb
   ```

2. **Authentication Errors**
   ```bash
   # Verify environment variables
   docker-compose exec core-certification env | grep MONGO
   ```

3. **Missing Collections**
   ```bash
   # Re-run initialization scripts
   docker-compose down
   docker-compose up -d mongodb
   # Wait for MongoDB to be ready, then:
   docker-compose up -d
   ```

### Health Check Commands
```bash
# Check all services
docker-compose ps

# Test API connectivity
curl http://localhost:3001/health

# Check MongoDB directly
docker-compose exec mongodb mongosh -u admin -p
```

## Next Steps

1. **Frontend Integration**: Update frontend applications to work with new API responses
2. **Data Migration**: If migrating existing data, create migration scripts
3. **Monitoring**: Set up MongoDB monitoring and alerting
4. **Backup Strategy**: Implement regular MongoDB backup procedures

## File Structure
```
/workspaces/gacp-certify-flow/
├── services/core-certification/
│   ├── src/
│   │   ├── index.js           # Main service with MongoDB
│   │   └── models/index.js    # Mongoose schemas
│   └── package.json           # MongoDB dependencies
├── mongo-init/
│   └── 01-init-db.js         # Database initialization
├── docker-compose.yml        # MongoDB container config
├── package.json              # Updated dependencies
└── .env.example              # MongoDB environment template
```

The MongoDB migration is now complete and the system is ready for use with improved performance and scalability.