const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  applicationId: {
    type: String,
    unique: true,
    required: true
  },
  userId: {
    type: String,
    required: true,
    index: true
  },
  applicantInfo: {
    organizationName: {
      type: String,
      required: true
    },
    ownerName: {
      type: String,
      required: true
    },
    contactEmail: {
      type: String,
      required: true
    },
    contactPhone: {
      type: String,
      required: true
    },
    address: {
      street: String,
      district: String,
      province: String,
      postalCode: String,
      country: { type: String, default: 'Thailand' }
    },
    taxId: String,
    businessLicense: String
  },
  farmInfo: {
    farmName: {
      type: String,
      required: true
    },
    farmArea: {
      type: Number,
      required: true // in rai
    },
    location: {
      coordinates: {
        type: [Number], // [longitude, latitude]
        index: '2dsphere'
      },
      address: {
        street: String,
        district: String,
        province: String,
        postalCode: String
      }
    },
    soilType: String,
    waterSource: String,
    irrigationSystem: String
  },
  cropInfo: {
    crops: [{
      scientificName: {
        type: String,
        required: true
      },
      commonName: {
        type: String,
        required: true
      },
      variety: String,
      plantingArea: Number, // in rai
      expectedYield: Number,
      harvestSeason: String,
      usedFor: {
        type: String,
        enum: ['medicine', 'food', 'cosmetic', 'other'],
        required: true
      }
    }],
    totalCropArea: Number
  },
  gacpCompliance: {
    qualityManagementSystem: {
      hasQMS: { type: Boolean, default: false },
      description: String
    },
    soilManagement: {
      soilTesting: { type: Boolean, default: false },
      organicMatter: { type: Boolean, default: false },
      erosionControl: { type: Boolean, default: false }
    },
    seedManagement: {
      seedSource: String,
      seedTreatment: String,
      seedStorage: String
    },
    cropManagement: {
      pestManagement: {
        hasIPM: { type: Boolean, default: false },
        pesticideUse: String,
        biologicalControl: { type: Boolean, default: false }
      },
      fertilization: {
        organicFertilizer: { type: Boolean, default: false },
        chemicalFertilizer: String,
        nutrientManagement: String
      },
      irrigation: {
        waterQuality: String,
        irrigationSchedule: String
      }
    },
    harvestManagement: {
      harvestTiming: String,
      harvestMethod: String,
      postHarvestHandling: String
    },
    documentation: {
      recordKeeping: { type: Boolean, default: false },
      traceability: { type: Boolean, default: false }
    }
  },
  documents: [{
    documentType: {
      type: String,
      enum: [
        'farm_map',
        'land_ownership',
        'water_analysis',
        'soil_analysis',
        'seed_certificate',
        'pesticide_records',
        'fertilizer_records',
        'harvest_records',
        'storage_facility',
        'business_license',
        'other'
      ],
      required: true
    },
    fileName: {
      type: String,
      required: true
    },
    filePath: {
      type: String,
      required: true
    },
    fileSize: Number,
    mimeType: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    },
    verified: {
      type: Boolean,
      default: false
    },
    verifiedBy: String,
    verifiedAt: Date,
    comments: String
  }],
  status: {
    type: String,
    enum: [
      'draft',           // ร่าง
      'submitted',       // ยื่นแล้ว
      'under_review',    // กำลังตรวจสอบ
      'inspection_scheduled', // นัดตรวจ
      'inspection_completed', // ตรวจเสร็จ
      'approved',        // อนุมัติ
      'rejected',        // ปฏิเสธ
      'revision_required' // ต้องแก้ไข
    ],
    default: 'draft'
  },
  reviewProcess: {
    documentReview: {
      reviewedBy: String,
      reviewedAt: Date,
      status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'revision_required']
      },
      comments: String
    },
    fieldInspection: {
      inspectorId: String,
      scheduledDate: Date,
      completedDate: Date,
      inspectionReport: {
        overallScore: Number,
        criteriaScores: [{
          criteria: String,
          score: Number,
          maxScore: Number,
          comments: String
        }],
        recommendations: String,
        photos: [String]
      },
      status: {
        type: String,
        enum: ['pending', 'scheduled', 'completed', 'failed']
      }
    },
    finalReview: {
      reviewedBy: String,
      reviewedAt: Date,
      decision: {
        type: String,
        enum: ['approved', 'rejected']
      },
      comments: String
    }
  },
  certificateInfo: {
    certificateNumber: String,
    issuedDate: Date,
    expiryDate: Date,
    certificateLevel: {
      type: String,
      enum: ['basic', 'standard', 'premium']
    }
  },
  fees: {
    applicationFee: {
      type: Number,
      default: 0
    },
    inspectionFee: {
      type: Number,
      default: 0
    },
    certificateFee: {
      type: Number,
      default: 0
    },
    totalFee: {
      type: Number,
      default: 0
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'refunded'],
      default: 'pending'
    },
    paymentDate: Date,
    paymentMethod: String,
    paymentReference: String
  },
  submittedAt: Date,
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes
applicationSchema.index({ userId: 1, status: 1 });
applicationSchema.index({ 'applicantInfo.organizationName': 'text' });
applicationSchema.index({ createdAt: -1 });

// Pre-save middleware to generate application ID
applicationSchema.pre('save', async function(next) {
  if (!this.applicationId) {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const count = await mongoose.model('Application').countDocuments({
      createdAt: {
        $gte: new Date(year, new Date().getMonth(), 1),
        $lt: new Date(year, new Date().getMonth() + 1, 1)
      }
    });
    
    this.applicationId = `GACP${year}${month}${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

// Virtual for application age
applicationSchema.virtual('applicationAge').get(function() {
  return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24));
});

// Method to calculate total fees
applicationSchema.methods.calculateFees = function() {
  const baseFee = 5000; // Base application fee
  const inspectionFee = this.farmInfo.farmArea * 500; // 500 baht per rai
  const certificateFee = 2000;
  
  this.fees.applicationFee = baseFee;
  this.fees.inspectionFee = inspectionFee;
  this.fees.certificateFee = certificateFee;
  this.fees.totalFee = baseFee + inspectionFee + certificateFee;
  
  return this.fees.totalFee;
};

module.exports = mongoose.model('Application', applicationSchema);