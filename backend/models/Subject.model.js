const mongoose = require('mongoose');

const { programFieldValidator } = require('../utils/programValidator');

const SubjectSchema = new mongoose.Schema({
  subjectCode: {
    type: String,
    required: [true, 'Subject code is required'],
    unique: true,
    uppercase: true,
    trim: true
  },
  subjectName: {
    type: String,
    required: [true, 'Subject name is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  units: {
    type: Number,
    required: [true, 'Units are required'],
    min: 0,
    max: 12 // Increased to accommodate OJT/Practicum courses
  },
  lectureHours: {
    type: Number,
    required: true,
    min: 0
  },
  labHours: {
    type: Number,
    default: 0,
    min: 0
  },
  program: {
    type: String,
    required: [true, 'Program is required'],
    trim: true,
    // 'General' covers subjects shared across every program (e.g. GE courses)
    validate: programFieldValidator({ extraAllowed: ['General'] }),
  },
  yearLevel: {
    type: Number,
    required: [true, 'Year level is required'],
    min: 1,
    max: 4
  },
  semester: {
    type: Number,
    required: [true, 'Semester is required'],
    enum: [1, 2]
  },
  prerequisites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject'
  }],
  requiredQualifications: [{
    type: String,
    trim: true
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for faster queries
SubjectSchema.index({ program: 1, yearLevel: 1, semester: 1 });

module.exports = mongoose.model('Subject', SubjectSchema);
