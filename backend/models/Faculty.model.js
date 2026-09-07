const mongoose = require('mongoose');

const FacultySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  employeeId: {
    type: String,
    required: [true, 'Employee ID is required'],
    unique: true,
    trim: true
  },
  department: {
    type: String,
    required: [true, 'Department is required'],
    enum: ['CoTE', 'Other'],
    default: 'CoTE'
  },
  position: {
    type: String,
    required: true,
    trim: true
  },
  employmentType: {
    type: String,
    required: true,
    enum: ['Regular', 'Part-time'],
    default: 'Regular'
  },
  qualifications: [{
    degree: {
      type: String,
      required: true
    },
    field: {
      type: String,
      required: true
    },
    institution: String,
    yearObtained: Number
  }],
  specializations: [{
    type: String,
    trim: true
  }],
  programs: [{
    type: String,
    trim: true
  }],
  teachingHistory: [{
    subjectCode: String,
    subjectName: String,
    semester: String,
    academicYear: String,
    program: String,
    rating: {
      type: Number,
      min: 0,
      max: 5
    }
  }],
  maxTeachingLoad: {
    type: Number,
    default: 24,
    min: 0,
    max: 40
  },
  currentLoad: {
    type: Number,
    default: 0,
    min: 0
  },
  preferredTimeSlots: [{
    day: {
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    },
    startTime: String,
    endTime: String
  }],
  unavailableTimeSlots: [{
    day: String,
    startTime: String,
    endTime: String,
    reason: String
  }],
  contactNumber: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for faster queries on specializations
FacultySchema.index({ 'specializations': 1 });

module.exports = mongoose.model('Faculty', FacultySchema);
