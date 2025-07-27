const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: [true, 'Department name is required'],
    trim: true,
    unique: true,
    maxlength: [100, 'Department name cannot exceed 100 characters']
  },
  code: {
    type: String,
    required: [true, 'Department code is required'],
    trim: true,
    unique: true,
    uppercase: true,
    maxlength: [10, 'Department code cannot exceed 10 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  
  // Department Structure
  parentDepartment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    default: null
  },
  level: {
    type: Number,
    default: 1,
    min: 1,
    max: 10
  },
  
  // Department Head
  head: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    default: null
  },
  
  // Contact Information
  email: {
    type: String,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  phone: {
    type: String,
    trim: true,
    match: [/^[\+]?[1-9][\d]{0,15}$/, 'Please enter a valid phone number']
  },
  extension: {
    type: String,
    trim: true
  },
  
  // Location
  location: {
    building: String,
    floor: String,
    room: String,
    address: String,
    city: String,
    state: String,
    country: String,
    zipCode: String
  },
  
  // Budget and Cost Center
  budgetCode: {
    type: String,
    trim: true,
    uppercase: true
  },
  costCenter: {
    type: String,
    trim: true,
    uppercase: true
  },
  
  // Status and Settings
  isActive: {
    type: Boolean,
    default: true
  },
  allowOvertime: {
    type: Boolean,
    default: true
  },
  defaultWorkingHours: {
    type: Number,
    default: 8,
    min: 1,
    max: 24
  },
  
  // Working Schedule
  workingDays: {
    type: [String],
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    default: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
  },
  workingHours: {
    start: {
      type: String,
      default: '09:00'
    },
    end: {
      type: String,
      default: '17:00'
    },
    breakDuration: {
      type: Number,
      default: 60, // minutes
      min: 0
    }
  },
  
  // Metadata
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for employee count
departmentSchema.virtual('employeeCount', {
  ref: 'Employee',
  localField: '_id',
  foreignField: 'department',
  count: true
});

// Virtual for sub-departments
departmentSchema.virtual('subDepartments', {
  ref: 'Department',
  localField: '_id',
  foreignField: 'parentDepartment'
});

// Virtual for full department path
departmentSchema.virtual('fullPath').get(function() {
  // This will be populated when needed
  return this.name;
});

// Pre-save middleware to calculate department level
departmentSchema.pre('save', async function(next) {
  if (this.parentDepartment) {
    try {
      const parent = await this.constructor.findById(this.parentDepartment);
      if (parent) {
        this.level = parent.level + 1;
      }
    } catch (error) {
      return next(error);
    }
  }
  next();
});

// Pre-remove middleware to handle sub-departments
departmentSchema.pre('remove', async function(next) {
  try {
    // Check if department has sub-departments
    const subDepartments = await this.constructor.find({ parentDepartment: this._id });
    if (subDepartments.length > 0) {
      return next(new Error('Cannot delete department with sub-departments'));
    }
    
    // Check if department has employees
    const Employee = mongoose.model('Employee');
    const employees = await Employee.find({ department: this._id });
    if (employees.length > 0) {
      return next(new Error('Cannot delete department with employees'));
    }
    
    next();
  } catch (error) {
    next(error);
  }
});

// Method to get department hierarchy
departmentSchema.methods.getHierarchy = async function() {
  const hierarchy = [];
  let current = this;
  
  while (current) {
    hierarchy.unshift({
      _id: current._id,
      name: current.name,
      code: current.code,
      level: current.level
    });
    
    if (current.parentDepartment) {
      current = await this.constructor.findById(current.parentDepartment);
    } else {
      current = null;
    }
  }
  
  return hierarchy;
};

// Method to get all sub-departments recursively
departmentSchema.methods.getAllSubDepartments = async function() {
  const subDepartments = [];
  
  const findSubDepartments = async (parentId) => {
    const subs = await this.constructor.find({ parentDepartment: parentId });
    for (const sub of subs) {
      subDepartments.push(sub);
      await findSubDepartments(sub._id);
    }
  };
  
  await findSubDepartments(this._id);
  return subDepartments;
};

// Indexes for better performance
departmentSchema.index({ name: 1 });
departmentSchema.index({ code: 1 });
departmentSchema.index({ parentDepartment: 1 });
departmentSchema.index({ head: 1 });
departmentSchema.index({ isActive: 1 });

module.exports = mongoose.model('Department', departmentSchema);