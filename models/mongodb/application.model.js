// models/mongodb/application.model.js
/**
 * GACP Application Model for MongoDB
 * Handles flexible form data for Thai herbal product applications
 */

const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

// Address schema for reusability
const AddressSchema = new mongoose.Schema({
  province: { type: String, required: true, index: true },
  district: { type: String, required: true },
  subdistrict: { type: String, required: true },
  postalCode: { type: String, required: true },
  fullAddress: { type: String, required: true },
  // GPS coordinates for geospatial queries
  coordinates: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      index: '2dsphere'
    }
  }
}, { _id: false });

// Cultivation site schema
const CultivationSiteSchema = new mongoose.Schema({
  address: AddressSchema,
  totalAreaRai: { type: Number, required: true, min: 0 },
  ownedOrRented: { 
    type: String, 
    enum: ['owned', 'rented', 'cooperative'], 
    required: true 
  },
  landDeedNumber: String,
  soilType: {
    type: String,
    enum: ['clay', 'sandy', 'loam', 'organic', 'mixed']
  },
  elevation: Number, // meters above sea level
  slope: {
    type: String,
    enum: ['flat', 'gentle', 'moderate', 'steep']
  }
}, { _id: false });

// Water source schema
const WaterSourceSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['well', 'river', 'canal', 'rainwater', 'municipal', 'other'],
    required: true
  },
  description: String,
  qualityTest: {
    documentId: String,
    testDate: Date,
    results: {
      ph: Number,
      salinity: Number,
      heavyMetals: Boolean,
      bacteria: Boolean,
      chemicals: Boolean
    }
  }
}, { _id: false });

// Main Application Schema
const ApplicationSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: () => uuidv4()
  },
  
  // Application identification
  applicationCode: {
    type: String,
    unique: true,
    required: true,
    index: true,
    match: /^GACP-\d{13}-[A-Z0-9]{9}$/
  },
  
  // References to PostgreSQL
  userId: {
    type: String,
    required: true,
    index: true
  },
  
  productId: {
    type: String,
    required: true,
    index: true
  },
  
  // Application status
  status: {
    type: String,
    enum: [
      'draft', 'pending_initial_payment', 'pending_review',
      'review_passed', 'resubmission_required', 'pending_audit_payment',
      'pending_audit_visit', 'audit_scheduled', 'audit_completed',
      'pending_final_approval', 'approved', 'rejected', 'expired'
    ],
    default: 'draft',
    index: true
  },
  
  // Flexible form data - MongoDB's strength
  formData: {
    // Applicant Information
    applicantType: {
      type: String,
      enum: ['individual', 'company', 'cooperative', 'group'],
      required: true
    },
    
    businessRegistration: {
      businessName: String,
      taxId: { type: String, index: true },
      registrationNumber: String,
      businessType: {
        type: String,
        enum: ['sole_proprietorship', 'partnership', 'limited_company', 'cooperative']
      }
    },
    
    contactPerson: {
      fullName: { type: String, required: true },
      position: String,
      nationalId: String, // Will be encrypted
      phoneNumber: { type: String, required: true },
      email: { type: String, required: true },
      lineId: String
    },
    
    // Cultivation details
    cultivationSites: [CultivationSiteSchema],
    
    // Water and soil information
    waterSources: [WaterSourceSchema],
    
    soilAnalysis: {
      documentId: String,
      testDate: Date,
      results: {
        ph: Number,
        organicMatter: Number,
        nitrogen: Number,
        phosphorus: Number,
        potassium: Number,
        heavyMetals: {
          lead: Number,
          cadmium: Number,
          mercury: Number,
          arsenic: Number
        }
      }
    },
    
    // Herbal product details
    herbalProducts: [{
      scientificName: { type: String, required: true },
      commonName: { type: String, required: true },
      thaiName: { type: String, required: true },
      partUsed: {
        type: [String],
        enum: ['root', 'stem', 'leaf', 'flower', 'fruit', 'seed', 'bark', 'whole_plant']
      },
      cultivationMethod: {
        type: String,
        enum: ['organic', 'conventional', 'integrated', 'traditional']
      },
      plannedProductionKg: { type: Number, min: 0 },
      harvestSeason: {
        type: String,
        enum: ['year_round', 'dry_season', 'rainy_season', 'cool_season']
      }
    }],
    
    // Farming practices
    farmingPractices: {
      seedSource: {
        type: String,
        enum: ['own_production', 'certified_supplier', 'government_source', 'local_market']
      },
      fertilizers: [{
        type: {
          type: String,
          enum: ['organic', 'chemical', 'bio_fertilizer', 'compost']
        },
        name: String,
        registrationNumber: String,
        applicationRate: String,
        frequency: String
      }],
      pesticides: [{
        type: {
          type: String,
          enum: ['botanical', 'biological', 'chemical', 'none']
        },
        name: String,
        registrationNumber: String,
        activeIngredient: String,
        applicationMethod: String,
        preharvest_interval: Number
      }],
      weedControl: {
        method: {
          type: String,
          enum: ['mechanical', 'cultural', 'chemical', 'integrated']
        },
        description: String
      }
    },
    
    // Post-harvest handling
    postHarvest: {
      harvestingMethod: {
        type: String,
        enum: ['manual', 'mechanical', 'combined']
      },
      primaryProcessing: {
        washing: Boolean,
        drying: {
          method: {
            type: String,
            enum: ['sun_drying', 'shade_drying', 'oven_drying', 'freeze_drying']
          },
          temperature: Number,
          duration: Number
        },
        storage: {
          type: {
            type: String,
            enum: ['warehouse', 'cold_storage', 'ambient', 'controlled_atmosphere']
          },
          containers: [String],
          pest_control: String
        }
      },
      qualityControl: {
        moisture_content: Number,
        foreign_matter: Number,
        microbial_testing: Boolean,
        pesticide_residue: Boolean
      }
    },
    
    // Record keeping
    recordKeeping: {
      cultivation_records: Boolean,
      harvest_records: Boolean,
      processing_records: Boolean,
      sales_records: Boolean,
      training_records: Boolean
    },
    
    // Regional specific fields (flexible schema advantage)
    regionalData: mongoose.Schema.Types.Mixed,
    
    // Additional attachments
    attachments: [{
      type: {
        type: String,
        enum: [
          'land_deed', 'business_registration', 'water_test',
          'soil_test', 'cultivation_map', 'photos', 'other'
        ]
      },
      filename: String,
      fileId: String,
      uploadDate: { type: Date, default: Date.now },
      description: String
    }]
  },
  
  // Validation and scoring
  scores: {
    completeness: { type: Number, min: 0, max: 100, default: 0 },
    documentation: { type: Number, min: 0, max: 100, default: 0 },
    compliance: { type: Number, min: 0, max: 100, default: 0 },
    overall: { type: Number, min: 0, max: 100, default: 0 }
  },
  
  // Important timestamps
  submittedAt: Date,
  reviewedAt: Date,
  auditScheduledAt: Date,
  auditCompletedAt: Date,
  approvedAt: Date,
  rejectedAt: Date,
  expiresAt: Date,
  
  // Staff assignments (references to PostgreSQL user IDs)
  assignments: {
    reviewerId: String,
    auditorId: String,
    approvedBy: String,
    regionalOfficer: String
  },
  
  // Comments and feedback
  comments: {
    reviewer: String,
    auditor: String,
    approval: String,
    rejection: String,
    resubmission: String
  },
  
  // Metadata for tracking
  metadata: {
    ipAddress: String,
    userAgent: String,
    source: {
      type: String,
      enum: ['web', 'mobile', 'api', 'import']
    },
    version: { type: String, default: '2.0' },
    language: { type: String, default: 'th' },
    submissionMethod: {
      type: String,
      enum: ['online', 'paper_digitized', 'mobile_app']
    }
  },
  
  // Access control (MongoDB level)
  _acl: {
    owner: String,
    readers: [String],
    writers: [String],
    admins: [String]
  }
}, {
  timestamps: true,
  collection: 'gacp_applications',
  versionKey: '__v'
});

// Compound indexes for performance
ApplicationSchema.index({ userId: 1, status: 1 });
ApplicationSchema.index({ submittedAt: -1 });
ApplicationSchema.index({ 'formData.cultivationSites.address.coordinates': '2dsphere' });
ApplicationSchema.index({ applicationCode: 1, status: 1 });
ApplicationSchema.index({ 'formData.applicantType': 1, status: 1 });
ApplicationSchema.index({ 'formData.cultivationSites.address.province': 1 });

// Text search index
ApplicationSchema.index({
  applicationCode: 'text',
  'formData.contactPerson.fullName': 'text',
  'formData.businessRegistration.businessName': 'text',
  'formData.herbalProducts.commonName': 'text',
  'formData.herbalProducts.thaiName': 'text'
});

// Virtual fields
ApplicationSchema.virtual('statusHistory', {
  ref: 'ApplicationStatusHistory',
  localField: '_id',
  foreignField: 'applicationId'
});

ApplicationSchema.virtual('totalCultivationArea').get(function() {
  return this.formData.cultivationSites.reduce((total, site) => {
    return total + (site.totalAreaRai || 0);
  }, 0);
});

// Instance methods
ApplicationSchema.methods.toPublicJSON = function() {
  const obj = this.toObject();
  // Remove sensitive fields
  delete obj.metadata.ipAddress;
  delete obj.formData.contactPerson.nationalId;
  delete obj.__v;
  return obj;
};

ApplicationSchema.methods.canRead = function(userId, userRole) {
  if (userRole === 'super_admin') return true;
  if (this._acl.owner === userId) return true;
  if (this._acl.readers.includes(userId)) return true;
  if (this._acl.admins.includes(userId)) return true;
  return false;
};

ApplicationSchema.methods.canWrite = function(userId, userRole) {
  if (userRole === 'super_admin') return true;
  if (this._acl.owner === userId) return true;
  if (this._acl.writers.includes(userId)) return true;
  if (this._acl.admins.includes(userId)) return true;
  return false;
};

// Static methods
ApplicationSchema.statics.findNearby = function(coordinates, maxDistanceKm = 10) {
  return this.find({
    'formData.cultivationSites.address.coordinates': {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: coordinates
        },
        $maxDistance: maxDistanceKm * 1000 // Convert to meters
      }
    }
  });
};

ApplicationSchema.statics.getStatsByProvince = function() {
  return this.aggregate([
    {
      $group: {
        _id: '$formData.cultivationSites.address.province',
        total: { $sum: 1 },
        approved: {
          $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] }
        },
        pending: {
          $sum: { $cond: [{ $in: ['$status', ['draft', 'pending_review', 'review_passed']] }, 1, 0] }
        }
      }
    },
    { $sort: { total: -1 } }
  ]);
};

// Middleware
ApplicationSchema.pre('save', async function(next) {
  // Calculate completeness score
  if (this.isNew || this.isModified('formData')) {
    this.scores.completeness = this.calculateCompleteness();
  }
  
  // Set ACL for new documents
  if (this.isNew) {
    this._acl = {
      owner: this.userId,
      readers: [this.userId],
      writers: [this.userId],
      admins: []
    };
  }
  
  next();
});

ApplicationSchema.methods.calculateCompleteness = function() {
  const requiredFields = [
    'formData.applicantType',
    'formData.contactPerson.fullName',
    'formData.contactPerson.phoneNumber',
    'formData.contactPerson.email',
    'formData.cultivationSites.0.address.province',
    'formData.cultivationSites.0.totalAreaRai',
    'formData.waterSources.0.type',
    'formData.herbalProducts.0.scientificName',
    'formData.herbalProducts.0.commonName'
  ];
  
  let completed = 0;
  
  for (const field of requiredFields) {
    const value = field.split('.').reduce((obj, key) => {
      if (obj && typeof obj === 'object') {
        return key.match(/^\d+$/) ? obj[parseInt(key)] : obj[key];
      }
      return undefined;
    }, this);
    
    if (value !== undefined && value !== null && value !== '') {
      completed++;
    }
  }
  
  return Math.round((completed / requiredFields.length) * 100);
};

module.exports = mongoose.model('Application', ApplicationSchema);