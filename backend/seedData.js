const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '../.env' });

// Import models
const User = require('./models/User');
const Department = require('./models/Department');
const Employee = require('./models/Employee');
const SystemSettings = require('./models/SystemSettings');
const Attendance = require('./models/Attendance');
const Leave = require('./models/Leave');
const Payroll = require('./models/Payroll');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB Connected for seeding data');
  } catch (error) {
    console.error('Database connection failed:', error.message);
    process.exit(1);
  }
};

// Admin user for creating records
let adminUser;

const seedDepartments = async () => {
  console.log('🏢 Seeding Departments...');
  
  const departments = [
    {
      name: 'Human Resources',
      code: 'HR',
      description: 'Manages employee relations, recruitment, and organizational policies',
      email: 'hr@company.com',
      phone: '+1234567890',
      location: {
        building: 'Main Office',
        floor: '2nd Floor',
        room: '201',
        address: '123 Business Street',
        city: 'New York',
        state: 'NY',
        country: 'USA',
        zipCode: '10001'
      },
      budgetCode: 'HR001',
      costCenter: 'CC-HR',
      createdBy: adminUser._id
    },
    {
      name: 'Information Technology',
      code: 'IT',
      description: 'Manages technology infrastructure and software development',
      email: 'it@company.com',
      phone: '+1234567891',
      location: {
        building: 'Tech Center',
        floor: '3rd Floor',
        room: '301',
        address: '123 Business Street',
        city: 'New York',
        state: 'NY',
        country: 'USA',
        zipCode: '10001'
      },
      budgetCode: 'IT001',
      costCenter: 'CC-IT',
      createdBy: adminUser._id
    },
    {
      name: 'Finance & Accounting',
      code: 'FIN',
      description: 'Manages financial operations, budgeting, and accounting',
      email: 'finance@company.com',
      phone: '+1234567892',
      location: {
        building: 'Main Office',
        floor: '1st Floor',
        room: '101',
        address: '123 Business Street',
        city: 'New York',
        state: 'NY',
        country: 'USA',
        zipCode: '10001'
      },
      budgetCode: 'FIN001',
      costCenter: 'CC-FIN',
      createdBy: adminUser._id
    },
    {
      name: 'Marketing',
      code: 'MKT',
      description: 'Manages marketing campaigns, brand development, and customer engagement',
      email: 'marketing@company.com',
      phone: '+1234567893',
      location: {
        building: 'Creative Wing',
        floor: '2nd Floor',
        room: '201',
        address: '123 Business Street',
        city: 'New York',
        state: 'NY',
        country: 'USA',
        zipCode: '10001'
      },
      budgetCode: 'MKT001',
      costCenter: 'CC-MKT',
      createdBy: adminUser._id
    },
    {
      name: 'Sales',
      code: 'SAL',
      description: 'Manages sales operations, customer relationships, and revenue generation',
      email: 'sales@company.com',
      phone: '+1234567894',
      location: {
        building: 'Sales Center',
        floor: '1st Floor',
        room: '105',
        address: '123 Business Street',
        city: 'New York',
        state: 'NY',
        country: 'USA',
        zipCode: '10001'
      },
      budgetCode: 'SAL001',
      costCenter: 'CC-SAL',
      createdBy: adminUser._id
    }
  ];

  await Department.deleteMany({});
  const createdDepartments = await Department.insertMany(departments);
  console.log(`✅ Created ${createdDepartments.length} departments`);
  return createdDepartments;
};

const seedEmployees = async (departments) => {
  console.log('👥 Seeding Employees...');
  
  const employees = [
    // HR Department
    {
      employeeId: 'EMP001',
      firstName: 'Sarah',
      lastName: 'Johnson',
      email: 'sarah.johnson@company.com',
      phone: '+1234567801',
      emergencyContact: {
        name: 'Mike Johnson',
        relationship: 'Spouse',
        phone: '+1234567811'
      },
      dateOfBirth: new Date('1985-03-15'),
      gender: 'female',
      maritalStatus: 'married',
      nationality: 'American',
      address: {
        street: '456 Elm Street',
        city: 'New York',
        state: 'NY',
        country: 'USA',
        zipCode: '10002'
      },
      department: departments.find(d => d.code === 'HR')._id,
      position: 'HR Manager',
      employmentType: 'full-time',
      joiningDate: new Date('2020-01-15'),
      confirmationDate: new Date('2020-07-15'),
      salary: {
        basic: 75000,
        allowances: {
          transport: 2000,
          medical: 1500,
          housing: 8000
        },
        deductions: {
          tax: 15000,
          insurance: 2400,
          retirement: 4500
        }
      },
      bankDetails: {
        bankName: 'Chase Bank',
        accountNumber: '1234567890',
        routingNumber: '021000021',
        accountType: 'checking'
      },
      workSchedule: {
        type: 'standard',
        hoursPerWeek: 40,
        workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
      },
      createdBy: adminUser._id
    },
    // IT Department
    {
      employeeId: 'EMP002',
      firstName: 'Alex',
      lastName: 'Chen',
      email: 'alex.chen@company.com',
      phone: '+1234567802',
      emergencyContact: {
        name: 'Lisa Chen',
        relationship: 'Sister',
        phone: '+1234567812'
      },
      dateOfBirth: new Date('1990-07-22'),
      gender: 'male',
      maritalStatus: 'single',
      nationality: 'American',
      address: {
        street: '789 Oak Avenue',
        city: 'New York',
        state: 'NY',
        country: 'USA',
        zipCode: '10003'
      },
      department: departments.find(d => d.code === 'IT')._id,
      position: 'Senior Developer',
      employmentType: 'full-time',
      joiningDate: new Date('2021-03-01'),
      confirmationDate: new Date('2021-09-01'),
      salary: {
        basic: 85000,
        allowances: {
          transport: 2000,
          medical: 1500,
          tech: 1000
        },
        deductions: {
          tax: 17000,
          insurance: 2400,
          retirement: 5100
        }
      },
      bankDetails: {
        bankName: 'Bank of America',
        accountNumber: '0987654321',
        routingNumber: '011401533',
        accountType: 'checking'
      },
      workSchedule: {
        type: 'flexible',
        hoursPerWeek: 40,
        workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
      },
      createdBy: adminUser._id
    },
    // Finance Department
    {
      employeeId: 'EMP003',
      firstName: 'Maria',
      lastName: 'Rodriguez',
      email: 'maria.rodriguez@company.com',
      phone: '+1234567803',
      emergencyContact: {
        name: 'Carlos Rodriguez',
        relationship: 'Spouse',
        phone: '+1234567813'
      },
      dateOfBirth: new Date('1987-11-08'),
      gender: 'female',
      maritalStatus: 'married',
      nationality: 'American',
      address: {
        street: '321 Pine Street',
        city: 'New York',
        state: 'NY',
        country: 'USA',
        zipCode: '10004'
      },
      department: departments.find(d => d.code === 'FIN')._id,
      position: 'Financial Analyst',
      employmentType: 'full-time',
      joiningDate: new Date('2019-06-01'),
      confirmationDate: new Date('2019-12-01'),
      salary: {
        basic: 70000,
        allowances: {
          transport: 2000,
          medical: 1500,
          professional: 500
        },
        deductions: {
          tax: 14000,
          insurance: 2400,
          retirement: 4200
        }
      },
      bankDetails: {
        bankName: 'Wells Fargo',
        accountNumber: '1122334455',
        routingNumber: '121000248',
        accountType: 'checking'
      },
      workSchedule: {
        type: 'standard',
        hoursPerWeek: 40,
        workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
      },
      createdBy: adminUser._id
    },
    // Marketing Department
    {
      employeeId: 'EMP004',
      firstName: 'David',
      lastName: 'Wilson',
      email: 'david.wilson@company.com',
      phone: '+1234567804',
      emergencyContact: {
        name: 'Emma Wilson',
        relationship: 'Mother',
        phone: '+1234567814'
      },
      dateOfBirth: new Date('1992-04-12'),
      gender: 'male',
      maritalStatus: 'single',
      nationality: 'American',
      address: {
        street: '654 Maple Drive',
        city: 'New York',
        state: 'NY',
        country: 'USA',
        zipCode: '10005'
      },
      department: departments.find(d => d.code === 'MKT')._id,
      position: 'Marketing Specialist',
      employmentType: 'full-time',
      joiningDate: new Date('2022-01-15'),
      confirmationDate: new Date('2022-07-15'),
      salary: {
        basic: 65000,
        allowances: {
          transport: 2000,
          medical: 1500,
          creative: 800
        },
        deductions: {
          tax: 13000,
          insurance: 2400,
          retirement: 3900
        }
      },
      bankDetails: {
        bankName: 'Citibank',
        accountNumber: '5566778899',
        routingNumber: '021000089',
        accountType: 'checking'
      },
      workSchedule: {
        type: 'standard',
        hoursPerWeek: 40,
        workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
      },
      createdBy: adminUser._id
    },
    // Sales Department
    {
      employeeId: 'EMP005',
      firstName: 'Jennifer',
      lastName: 'Brown',
      email: 'jennifer.brown@company.com',
      phone: '+1234567805',
      emergencyContact: {
        name: 'Robert Brown',
        relationship: 'Father',
        phone: '+1234567815'
      },
      dateOfBirth: new Date('1988-09-25'),
      gender: 'female',
      maritalStatus: 'single',
      nationality: 'American',
      address: {
        street: '987 Cedar Lane',
        city: 'New York',
        state: 'NY',
        country: 'USA',
        zipCode: '10006'
      },
      department: departments.find(d => d.code === 'SAL')._id,
      position: 'Sales Representative',
      employmentType: 'full-time',
      joiningDate: new Date('2021-08-01'),
      confirmationDate: new Date('2022-02-01'),
      salary: {
        basic: 60000,
        allowances: {
          transport: 2000,
          medical: 1500,
          commission: 5000
        },
        deductions: {
          tax: 12000,
          insurance: 2400,
          retirement: 3600
        }
      },
      bankDetails: {
        bankName: 'TD Bank',
        accountNumber: '9988776655',
        routingNumber: '031101279',
        accountType: 'checking'
      },
      workSchedule: {
        type: 'standard',
        hoursPerWeek: 40,
        workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
      },
      createdBy: adminUser._id
    },
    // Additional IT Employee
    {
      employeeId: 'EMP006',
      firstName: 'Michael',
      lastName: 'Davis',
      email: 'michael.davis@company.com',
      phone: '+1234567806',
      emergencyContact: {
        name: 'Susan Davis',
        relationship: 'Wife',
        phone: '+1234567816'
      },
      dateOfBirth: new Date('1989-12-03'),
      gender: 'male',
      maritalStatus: 'married',
      nationality: 'American',
      address: {
        street: '147 Birch Street',
        city: 'New York',
        state: 'NY',
        country: 'USA',
        zipCode: '10007'
      },
      department: departments.find(d => d.code === 'IT')._id,
      position: 'DevOps Engineer',
      employmentType: 'full-time',
      joiningDate: new Date('2020-05-15'),
      confirmationDate: new Date('2020-11-15'),
      salary: {
        basic: 80000,
        allowances: {
          transport: 2000,
          medical: 1500,
          tech: 1200
        },
        deductions: {
          tax: 16000,
          insurance: 2400,
          retirement: 4800
        }
      },
      bankDetails: {
        bankName: 'JPMorgan Chase',
        accountNumber: '1357924680',
        routingNumber: '021000021',
        accountType: 'checking'
      },
      workSchedule: {
        type: 'flexible',
        hoursPerWeek: 40,
        workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
      },
      createdBy: adminUser._id
    }
  ];

  await Employee.deleteMany({});
  const createdEmployees = await Employee.insertMany(employees);
  console.log(`✅ Created ${createdEmployees.length} employees`);
  return createdEmployees;
};

const seedAttendanceRecords = async (employees) => {
  console.log('📅 Seeding Attendance Records...');
  
  const attendanceRecords = [];
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  
  // Create attendance for last 30 days
  for (let day = 1; day <= 30; day++) {
    const date = new Date(currentYear, currentMonth, today.getDate() - day);
    
    // Skip weekends
    if (date.getDay() === 0 || date.getDay() === 6) continue;
    
    employees.forEach((employee, index) => {
      // 90% attendance rate
      if (Math.random() > 0.1) {
        const checkInTime = new Date(date);
        checkInTime.setHours(9 + Math.floor(Math.random() * 2), Math.floor(Math.random() * 60));
        
        const checkOutTime = new Date(checkInTime);
        checkOutTime.setHours(checkInTime.getHours() + 8 + Math.floor(Math.random() * 2), Math.floor(Math.random() * 60));
        
        const totalHours = (checkOutTime - checkInTime) / (1000 * 60 * 60);
        const workingHours = Math.max(0, totalHours - 1); // Subtract 1 hour for break
        const overtimeHours = Math.max(0, workingHours - 8);
        
        // Get day of week
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const dayOfWeek = dayNames[date.getDay()];
        
        // Check if late (after 9:30 AM)
        const scheduledStart = new Date(date);
        scheduledStart.setHours(9, 30, 0, 0);
        const isLate = checkInTime > scheduledStart;
        const lateBy = isLate ? Math.round((checkInTime - scheduledStart) / (1000 * 60)) : 0;
        
        attendanceRecords.push({
          employee: employee._id,
          date: date,
          year: date.getFullYear(),
          month: date.getMonth() + 1,
          dayOfWeek: dayOfWeek,
          checkIn: {
            time: checkInTime,
            location: 'Office',
            ipAddress: `192.168.1.${Math.floor(Math.random() * 254) + 1}`
          },
          checkOut: {
            time: checkOutTime,
            location: 'Office',
            ipAddress: `192.168.1.${Math.floor(Math.random() * 254) + 1}`
          },
          totalHours: Math.round(totalHours * 100) / 100,
          workingHours: Math.round(workingHours * 100) / 100,
          overtimeHours: Math.round(overtimeHours * 100) / 100,
          totalBreakTime: 60, // 1 hour break
          status: workingHours >= 8 ? 'present' : workingHours >= 4 ? 'half-day' : 'present',
          isLate: isLate,
          lateBy: lateBy,
          createdBy: adminUser._id
        });
      }
    });
  }
  
  await Attendance.deleteMany({});
  const createdRecords = await Attendance.insertMany(attendanceRecords);
  console.log(`✅ Created ${createdRecords.length} attendance records`);
  return createdRecords;
};

const seedLeaveRecords = async (employees) => {
  console.log('🏖️ Seeding Leave Records...');
  
  const leaveRecords = [];
  const leaveTypes = ['annual', 'sick', 'casual', 'maternity', 'paternity', 'compassionate', 'study', 'unpaid'];
  
  employees.forEach((employee, index) => {
    // Each employee has 1-3 leave records
    const numLeaves = Math.floor(Math.random() * 3) + 1;
    
    for (let i = 0; i < numLeaves; i++) {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + Math.floor(Math.random() * 90) - 45); // ±45 days from today
      
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + Math.floor(Math.random() * 5) + 1); // 1-5 days
      
      const daysDifference = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
      const selectedLeaveType = leaveTypes[Math.floor(Math.random() * leaveTypes.length)];
      const statusOptions = ['approved', 'pending', 'rejected'];
      const selectedStatus = statusOptions[Math.floor(Math.random() * 3)];
      
      // Calculate leave balance (simplified)
      const currentBalance = 20 + Math.floor(Math.random() * 10); // 20-30 days
      const balanceBefore = currentBalance;
      const balanceAfter = selectedStatus === 'approved' ? Math.max(0, balanceBefore - daysDifference) : balanceBefore;
      
      const leaveRecord = {
        employee: employee._id,
        leaveType: selectedLeaveType,
        startDate: startDate,
        endDate: endDate,
        days: daysDifference,
        reason: `${selectedLeaveType} leave request - Personal matters that require time off`,
        status: selectedStatus,
        year: startDate.getFullYear(),
        month: startDate.getMonth() + 1,
        balanceImpact: {
          before: balanceBefore,
          after: balanceAfter
        },
        appliedDate: new Date(startDate.getTime() - (Math.floor(Math.random() * 7) + 1) * 24 * 60 * 60 * 1000),
        createdBy: adminUser._id
      };
      
      // Add approval workflow
      if (selectedStatus === 'approved') {
        leaveRecord.approvalWorkflow = [{
          approver: adminUser._id,
          level: 1,
          status: 'approved',
          comments: 'Leave approved',
          actionDate: new Date()
        }];
        leaveRecord.approvedBy = adminUser._id;
        leaveRecord.approvalDate = new Date();
      } else if (selectedStatus === 'rejected') {
        leaveRecord.approvalWorkflow = [{
          approver: adminUser._id,
          level: 1,
          status: 'rejected',
          comments: 'Leave rejected due to operational requirements',
          actionDate: new Date()
        }];
        leaveRecord.rejectionReason = 'Operational requirements during the requested period';
      } else {
        leaveRecord.approvalWorkflow = [{
          approver: adminUser._id,
          level: 1,
          status: 'pending'
        }];
      }
      
      leaveRecords.push(leaveRecord);
    }
  });
  
  await Leave.deleteMany({});
  const createdRecords = await Leave.insertMany(leaveRecords);
  console.log(`✅ Created ${createdRecords.length} leave records`);
  return createdRecords;
};

const seedPayrollRecords = async (employees) => {
  console.log('💰 Seeding Payroll Records...');
  
  const payrollRecords = [];
  const currentDate = new Date();
  
  // Create payroll for last 3 months
  for (let monthOffset = 0; monthOffset < 3; monthOffset++) {
    const payrollMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - monthOffset, 1);
    
    employees.forEach((employee) => {
      const basicSalary = employee.salary.basic;
      const allowances = employee.salary.allowances;
      const deductions = employee.salary.deductions;
      
      // Calculate totals
      const totalAllowances = Object.values(allowances).reduce((sum, val) => sum + val, 0);
      const totalDeductions = Object.values(deductions).reduce((sum, val) => sum + val, 0);
      const grossSalary = basicSalary + totalAllowances;
      const netSalary = grossSalary - totalDeductions;
      
      // Working days and hours for the month
      const expectedWorkingDays = 22; // Standard working days in a month
      const actualWorkingDays = expectedWorkingDays - Math.floor(Math.random() * 2); // 0-2 days absent
      const expectedHours = expectedWorkingDays * 8;
      const actualHours = actualWorkingDays * 8 + Math.floor(Math.random() * 20); // Some overtime
      const overtimeHours = Math.max(0, actualHours - expectedHours);
      
      // Payment status based on month offset
      const status = monthOffset === 0 ? 'paid' : monthOffset === 1 ? 'approved' : 'calculated';
      
      payrollRecords.push({
        employee: employee._id,
        payrollPeriod: {
          year: payrollMonth.getFullYear(),
          month: payrollMonth.getMonth() + 1,
          startDate: new Date(payrollMonth),
          endDate: new Date(payrollMonth.getFullYear(), payrollMonth.getMonth() + 1, 0)
        },
        salaryStructure: {
          basic: basicSalary,
          allowances: {
            house: allowances.housing || 0,
            transport: allowances.transport || 0,
            medical: allowances.medical || 0,
            meal: 0,
            communication: 0,
            overtime: overtimeHours * (basicSalary / expectedHours),
            bonus: monthOffset === 0 ? Math.floor(Math.random() * 5000) : 0,
            commission: 0,
            other: 0
          },
          currency: 'USD'
        },
        workingDays: {
          expected: expectedWorkingDays,
          actual: actualWorkingDays,
          absent: expectedWorkingDays - actualWorkingDays,
          onLeave: Math.floor(Math.random() * 2)
        },
        workingHours: {
          expected: expectedHours,
          actual: actualHours,
          overtime: overtimeHours,
          overtimeRate: 1.5
        },
        deductions: {
          tax: deductions.tax || 0,
          socialSecurity: 0,
          insurance: deductions.insurance || 0,
          providentFund: deductions.retirement || 0,
          loanRepayment: 0,
          advance: 0,
          lateFine: Math.floor(Math.random() * 100),
          absentDeduction: (expectedWorkingDays - actualWorkingDays) * (basicSalary / expectedWorkingDays),
          other: 0
        },
        calculations: {
          grossSalary: grossSalary,
          totalAllowances: totalAllowances,
          totalDeductions: totalDeductions,
          netSalary: netSalary,
          dailyRate: basicSalary / expectedWorkingDays,
          hourlyRate: basicSalary / expectedHours
        },
        taxDetails: {
          taxableIncome: grossSalary,
          taxBracket: '15%',
          taxRate: 15,
          taxExemptions: 0,
          previousTaxPaid: 0
        },
        leaveDetails: {
          totalLeaves: Math.floor(Math.random() * 3),
          paidLeaves: Math.floor(Math.random() * 2),
          unpaidLeaves: 0,
          leaveDeduction: 0
        },
        status: status,
        approvalWorkflow: {
          calculatedBy: adminUser._id,
          calculatedDate: new Date(),
          approvedBy: status === 'paid' || status === 'approved' ? adminUser._id : null,
          approvalDate: status === 'paid' || status === 'approved' ? new Date() : null,
          paidBy: status === 'paid' ? adminUser._id : null,
          paidDate: status === 'paid' ? new Date() : null
        },
        paymentDetails: {
          paymentMethod: 'bank-transfer',
          bankAccount: {
            accountNumber: employee.bankDetails?.accountNumber || '1234567890',
            bankName: employee.bankDetails?.bankName || 'Default Bank',
            routingNumber: employee.bankDetails?.routingNumber || '021000021'
          },
          transactionId: status === 'paid' ? `TXN${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}` : null,
          paymentDate: status === 'paid' ? new Date() : null,
          paymentReference: status === 'paid' ? `PAY${payrollMonth.getFullYear()}${String(payrollMonth.getMonth() + 1).padStart(2, '0')}` : null
        },
        createdBy: adminUser._id
      });
    });
  }
  
  await Payroll.deleteMany({});
  const createdRecords = await Payroll.insertMany(payrollRecords);
  console.log(`✅ Created ${createdRecords.length} payroll records`);
  return createdRecords;
};

const seedData = async () => {
  try {
    console.log('🌱 Starting database seeding...');
    
    await connectDB();
    
    // Get or create admin user
    adminUser = await User.findOne({ email: 'admin@company.com' });
    if (!adminUser) {
      adminUser = new User({
        firstName: 'System',
        lastName: 'Admin',
        email: 'admin@company.com',
        password: 'admin123', // This will be hashed by pre-save middleware
        role: 'admin',
        permissions: {
          canManageEmployees: true,
          canManageAttendance: true,
          canManageLeave: true,
          canManagePayroll: true,
          canViewReports: true,
          canManageSettings: true,
          // Route-specific permissions
          attendance: true,
          attendance_admin: true,
          leave: true,
          leave_admin: true,
          payroll: true,
          payroll_admin: true,
          reports: true,
          settings: true,
          employees: true,
          employees_admin: true
        }
      });
      await adminUser.save();
      console.log('✅ Created admin user');
    }
    
    // Seed data in order
    const departments = await seedDepartments();
    const employees = await seedEmployees(departments);
    const attendanceRecords = await seedAttendanceRecords(employees);
    const leaveRecords = await seedLeaveRecords(employees);
    const payrollRecords = await seedPayrollRecords(employees);
    
    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   👥 ${employees.length} Employees`);
    console.log(`   🏢 ${departments.length} Departments`);
    console.log(`   📅 ${attendanceRecords.length} Attendance Records`);
    console.log(`   🏖️ ${leaveRecords.length} Leave Records`);
    console.log(`   💰 ${payrollRecords.length} Payroll Records`);
    console.log('\n🔐 Admin Login:');
    console.log(`   Email: admin@company.com`);
    console.log(`   Password: admin123`);
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

// Run the seeding
seedData();