const mongoose = require('mongoose');

// User Schema
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['farmer', 'dtam', 'admin'], required: true },
  fullName: { type: String, required: true },
  phoneNumber: { type: String },
  address: {
    address: String,
    subDistrict: String,
    district: String,
    province: String,
    postalCode: String
  },
  isActive: { type: Boolean, default: true },
  profilePicture: String,
  farmDetails: {
    farmName: String,
    farmSize: Number,
    farmLocation: {
      lat: Number,
      lng: Number
    },
    cropTypes: [String]
  }
}, {
  timestamps: true
});

// Farm Schema
const farmSchema = new mongoose.Schema({
  farmerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  farmName: { type: String, required: true },
  farmSize: { type: Number, required: true },
  location: {
    address: String,
    subDistrict: String,
    district: String,
    province: String,
    postalCode: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  cropTypes: [String],
  farmingMethods: [String],
  irrigationSystem: String,
  soilType: String,
  documents: [{
    documentType: String,
    fileName: String,
    filePath: String,
    uploadDate: Date
  }],
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true
});

// Certification Application Schema
const applicationSchema = new mongoose.Schema({
  applicationNumber: { type: String, required: true, unique: true },
  farmerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  farmId: { type: mongoose.Schema.Types.ObjectId, ref: 'Farm', required: true },
  applicationType: { type: String, enum: ['new', 'renewal'], required: true },
  status: { 
    type: String, 
    enum: ['draft', 'submitted', 'under_review', 'approved', 'rejected', 'expired'],
    default: 'draft'
  },
  standardType: { type: String, required: true },
  documents: [{
    documentType: String,
    fileName: String,
    filePath: String,
    uploadDate: Date,
    isRequired: Boolean,
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' }
  }],
  submissionDate: Date,
  reviewDate: Date,
  approvalDate: Date,
  expiryDate: Date,
  reviewNotes: String,
  dtamOfficer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  fees: {
    applicationFee: Number,
    inspectionFee: Number,
    certificateFee: Number,
    totalFee: Number,
    paidAmount: Number,
    paymentStatus: { type: String, enum: ['pending', 'paid', 'partial'], default: 'pending' }
  }
}, {
  timestamps: true
});

// Certificate Schema
const certificateSchema = new mongoose.Schema({
  certificateNumber: { type: String, required: true, unique: true },
  applicationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Application', required: true },
  farmerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  farmId: { type: mongoose.Schema.Types.ObjectId, ref: 'Farm', required: true },
  standardType: { type: String, required: true },
  issueDate: { type: Date, default: Date.now },
  expiryDate: { type: Date, required: true },
  status: { 
    type: String, 
    enum: ['active', 'expired', 'revoked', 'suspended'],
    default: 'active'
  },
  qrCode: String,
  digitalSignature: String,
  issuedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  certificateFile: {
    fileName: String,
    filePath: String
  }
}, {
  timestamps: true
});

// Payment Schema
const paymentSchema = new mongoose.Schema({
  paymentId: { type: String, required: true, unique: true },
  applicationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Application', required: true },
  payerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  paymentMethod: { type: String, enum: ['credit_card', 'bank_transfer', 'cash'], required: true },
  paymentStatus: { 
    type: String, 
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  transactionId: String,
  paymentDate: Date,
  refundDate: Date,
  refundAmount: Number,
  notes: String
}, {
  timestamps: true
});

// Inspection Schema
const inspectionSchema = new mongoose.Schema({
  inspectionId: { type: String, required: true, unique: true },
  applicationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Application', required: true },
  farmId: { type: mongoose.Schema.Types.ObjectId, ref: 'Farm', required: true },
  inspector: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  scheduledDate: { type: Date, required: true },
  actualDate: Date,
  status: { 
    type: String, 
    enum: ['scheduled', 'in_progress', 'completed', 'cancelled'],
    default: 'scheduled'
  },
  inspectionItems: [{
    category: String,
    item: String,
    status: { type: String, enum: ['pass', 'fail', 'not_applicable'] },
    notes: String,
    photos: [String]
  }],
  overallScore: Number,
  result: { type: String, enum: ['pass', 'fail', 'conditional_pass'] },
  reportFile: {
    fileName: String,
    filePath: String
  },
  notes: String
}, {
  timestamps: true
});

// Standard Schema
const standardSchema = new mongoose.Schema({
  standardCode: { type: String, required: true, unique: true },
  standardName: { type: String, required: true },
  version: { type: String, required: true },
  description: String,
  category: String,
  requirements: [{
    requirement: String,
    description: String,
    isRequired: Boolean,
    weight: Number
  }],
  inspectionCriteria: [{
    criteria: String,
    description: String,
    weight: Number
  }],
  fees: {
    applicationFee: Number,
    inspectionFee: Number,
    certificateFee: Number
  },
  validityPeriod: { type: Number, default: 365 }, // days
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true
});

// Create models
const User = mongoose.model('User', userSchema);
const Farm = mongoose.model('Farm', farmSchema);
const Application = mongoose.model('Application', applicationSchema);
const Certificate = mongoose.model('Certificate', certificateSchema);
const Payment = mongoose.model('Payment', paymentSchema);
const Inspection = mongoose.model('Inspection', inspectionSchema);
const Standard = mongoose.model('Standard', standardSchema);

module.exports = {
  User,
  Farm,
  Application,
  Certificate,
  Payment,
  Inspection,
  Standard
};