// MongoDB initialization script for GACP certification system
// This script creates indexes and initial data

// Switch to the gacp_db database
db = db.getSiblingDB('gacp_db');

// Create users collection indexes
db.users.createIndex({ "email": 1 }, { unique: true });
db.users.createIndex({ "role": 1 });
db.users.createIndex({ "isActive": 1 });

// Create farms collection indexes
db.farms.createIndex({ "farmerId": 1 });
db.farms.createIndex({ "location.coordinates": "2dsphere" });
db.farms.createIndex({ "isActive": 1 });

// Create applications collection indexes
db.applications.createIndex({ "applicationNumber": 1 }, { unique: true });
db.applications.createIndex({ "farmerId": 1 });
db.applications.createIndex({ "farmId": 1 });
db.applications.createIndex({ "status": 1 });
db.applications.createIndex({ "submissionDate": 1 });
db.applications.createIndex({ "standardType": 1 });

// Create certificates collection indexes
db.certificates.createIndex({ "certificateNumber": 1 }, { unique: true });
db.certificates.createIndex({ "applicationId": 1 });
db.certificates.createIndex({ "farmerId": 1 });
db.certificates.createIndex({ "status": 1 });
db.certificates.createIndex({ "expiryDate": 1 });

// Create payments collection indexes
db.payments.createIndex({ "paymentId": 1 }, { unique: true });
db.payments.createIndex({ "applicationId": 1 });
db.payments.createIndex({ "payerId": 1 });
db.payments.createIndex({ "paymentStatus": 1 });
db.payments.createIndex({ "paymentDate": 1 });

// Create inspections collection indexes
db.inspections.createIndex({ "inspectionId": 1 }, { unique: true });
db.inspections.createIndex({ "applicationId": 1 });
db.inspections.createIndex({ "farmId": 1 });
db.inspections.createIndex({ "inspector": 1 });
db.inspections.createIndex({ "scheduledDate": 1 });
db.inspections.createIndex({ "status": 1 });

// Create standards collection indexes
db.standards.createIndex({ "standardCode": 1 }, { unique: true });
db.standards.createIndex({ "isActive": 1 });
db.standards.createIndex({ "category": 1 });

// Insert initial GACP standards
db.standards.insertMany([
  {
    standardCode: "GACP-VEGETABLE-2024",
    standardName: "Good Agricultural Certification Practice for Vegetables",
    version: "2024.1",
    description: "Comprehensive standards for vegetable farming practices ensuring food safety and quality",
    category: "vegetables",
    requirements: [
      {
        requirement: "Water Quality Management",
        description: "Proper water source testing and irrigation management",
        isRequired: true,
        weight: 20
      },
      {
        requirement: "Soil Management",
        description: "Soil testing, fertilizer application, and pH management",
        isRequired: true,
        weight: 15
      },
      {
        requirement: "Pest Control",
        description: "Integrated pest management and safe pesticide use",
        isRequired: true,
        weight: 25
      },
      {
        requirement: "Harvest and Post-Harvest Handling",
        description: "Proper harvesting techniques and storage practices",
        isRequired: true,
        weight: 20
      },
      {
        requirement: "Record Keeping",
        description: "Maintenance of farming activity records",
        isRequired: true,
        weight: 20
      }
    ],
    inspectionCriteria: [
      {
        criteria: "Water source certification",
        description: "Valid water quality test results",
        weight: 15
      },
      {
        criteria: "Field inspection",
        description: "Physical inspection of farming practices",
        weight: 40
      },
      {
        criteria: "Documentation review",
        description: "Review of farming records and certifications",
        weight: 25
      },
      {
        criteria: "Product sampling",
        description: "Testing of harvested products",
        weight: 20
      }
    ],
    fees: {
      applicationFee: 5000,
      inspectionFee: 8000,
      certificateFee: 3000
    },
    validityPeriod: 365,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    standardCode: "GACP-FRUIT-2024",
    standardName: "Good Agricultural Certification Practice for Fruits",
    version: "2024.1",
    description: "Comprehensive standards for fruit farming practices ensuring food safety and quality",
    category: "fruits",
    requirements: [
      {
        requirement: "Orchard Management",
        description: "Proper tree spacing, pruning, and maintenance",
        isRequired: true,
        weight: 20
      },
      {
        requirement: "Water and Irrigation",
        description: "Efficient water management and irrigation systems",
        isRequired: true,
        weight: 18
      },
      {
        requirement: "Fertilization Program",
        description: "Balanced nutrition and organic matter management",
        isRequired: true,
        weight: 15
      },
      {
        requirement: "Disease and Pest Management",
        description: "Integrated approach to pest and disease control",
        isRequired: true,
        weight: 22
      },
      {
        requirement: "Harvest Timing and Handling",
        description: "Optimal harvest timing and post-harvest care",
        isRequired: true,
        weight: 25
      }
    ],
    inspectionCriteria: [
      {
        criteria: "Orchard layout assessment",
        description: "Evaluation of tree arrangement and maintenance",
        weight: 20
      },
      {
        criteria: "Irrigation system inspection",
        description: "Review of water delivery and management",
        weight: 20
      },
      {
        criteria: "Pest management evaluation",
        description: "Assessment of IPM practices",
        weight: 30
      },
      {
        criteria: "Harvest and storage review",
        description: "Evaluation of post-harvest handling",
        weight: 30
      }
    ],
    fees: {
      applicationFee: 6000,
      inspectionFee: 10000,
      certificateFee: 4000
    },
    validityPeriod: 365,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
]);

// Create an admin user
db.users.insertOne({
  email: "admin@gacp.go.th",
  password: "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewSGFhP8KOhUo6qe", // hashed password: admin123
  role: "admin",
  fullName: "System Administrator",
  phoneNumber: "02-123-4567",
  address: {
    address: "Department of Agriculture",
    subDistrict: "Chatuchak",
    district: "Chatuchak",
    province: "Bangkok",
    postalCode: "10900"
  },
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date()
});

// Create a DTAM officer
db.users.insertOne({
  email: "dtam@gacp.go.th",
  password: "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewSGFhP8KOhUo6qe", // hashed password: dtam123
  role: "dtam",
  fullName: "DTAM Officer",
  phoneNumber: "02-123-4568",
  address: {
    address: "Department of Agriculture",
    subDistrict: "Chatuchak",
    district: "Chatuchak",
    province: "Bangkok",
    postalCode: "10900"
  },
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date()
});

print("MongoDB initialization completed successfully!");
print("- Created indexes for all collections");
print("- Inserted GACP standards for vegetables and fruits");
print("- Created admin and DTAM users");
print("- Default admin email: admin@gacp.go.th, password: admin123");
print("- Default DTAM email: dtam@gacp.go.th, password: dtam123");