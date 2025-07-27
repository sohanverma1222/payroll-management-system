# Payroll Management System

A comprehensive full-stack payroll management web application built with React, Node.js, and MongoDB.

## Features

- **Employee Management**: Complete employee profile management with department organization
- **Attendance Tracking**: Real-time check-in/check-out functionality with comprehensive tracking
- **Leave Management**: Leave application, approval workflow, and balance tracking
- **Payroll Generation**: Automated payroll calculations with payslip generation
- **Reports & Analytics**: Comprehensive reporting dashboard with data visualization
- **System Settings**: Admin panel for user roles and system configuration

## Tech Stack

### Frontend
- React 18 with TypeScript
- React Router for navigation
- Tailwind CSS for styling
- Axios for API communication
- Recharts for data visualization
- React Hot Toast for notifications

### Backend
- Node.js with Express framework
- MongoDB with Mongoose ODM
- JWT for authentication
- Bcrypt for password hashing
- Express Rate Limiting for security
- CORS and Helmet for security headers

### Database
- MongoDB with dedicated collections for:
  - Users and Authentication
  - Employee Management
  - Attendance Records
  - Leave Management
  - Payroll Data
  - System Settings

## Design System

- **Primary Color**: #3B82F6 (Blue)
- **Secondary Color**: #6366F1 (Indigo)
- **Success Color**: #10B981 (Green)
- **Danger Color**: #EF4444 (Red)
- **Typography**: Inter/Poppins fonts
- **Design**: Light mode with 12px rounded corners and soft shadows

## Getting Started

### Prerequisites
- Node.js 16+
- MongoDB running on localhost:27017

### Installation

1. Install dependencies:
```bash
npm install
cd backend && npm install
```

2. Set up environment variables:
```bash
# Copy .env.example to .env and configure
cp .env.example .env
```

3. Start development servers:
```bash
# Frontend on port 3000
npm start

# Backend on port 5000
npm run server

# Or run both concurrently
npm run dev
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/profile` - Get user profile

### Employee Management
- `GET /api/employees` - Get all employees
- `POST /api/employees` - Create employee
- `GET /api/employees/:id` - Get employee by ID
- `PUT /api/employees/:id` - Update employee
- `DELETE /api/employees/:id` - Delete employee

### Attendance
- `GET /api/attendance` - Get attendance records
- `POST /api/attendance/checkin` - Check-in employee
- `POST /api/attendance/checkout` - Check-out employee

### Leave Management
- `GET /api/leave` - Get leave requests
- `POST /api/leave` - Submit leave request
- `PUT /api/leave/:id/approve` - Approve leave request
- `PUT /api/leave/:id/reject` - Reject leave request

### Payroll
- `GET /api/payroll` - Get payroll records
- `POST /api/payroll/generate` - Generate payroll
- `GET /api/payroll/payslip/:id` - Get payslip

### Reports
- `GET /api/reports/dashboard` - Dashboard statistics
- `GET /api/reports/attendance` - Attendance reports
- `GET /api/reports/payroll` - Payroll reports

### Settings
- `GET /api/settings` - Get system settings
- `PUT /api/settings` - Update system settings

## Project Structure

```
├── public/                 # Static assets
├── src/                   # React frontend source
│   ├── components/        # Reusable components
│   ├── pages/            # Page components
│   ├── contexts/         # React contexts
│   ├── hooks/            # Custom hooks
│   ├── services/         # API services
│   └── utils/            # Utility functions
├── backend/              # Node.js backend
│   ├── controllers/      # Route controllers
│   ├── models/           # Database models
│   ├── routes/           # API routes
│   ├── middleware/       # Custom middleware
│   └── utils/            # Backend utilities
└── README.md
```

## Development Status

✅ **Completed:**
- Project initialization and setup
- MongoDB connection and configuration
- Basic API route structure
- Frontend routing and basic components
- Tailwind CSS configuration
- Development environment setup

🚧 **In Progress:**
- Database schema design
- Authentication system
- Employee management module

📋 **Planned:**
- Complete UI component library
- Attendance tracking system
- Leave management system
- Payroll generation engine
- Reports and analytics
- Mobile responsiveness
- Security implementation
- Testing and quality assurance

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License.