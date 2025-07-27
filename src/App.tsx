import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import AppLayout from './components/Layout/AppLayout';
import './App.css';
import './styles/Auth.css';

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }
  
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

// Public Route Component (redirect to dashboard if already authenticated)
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }
  
  return !isAuthenticated ? <>{children}</> : <Navigate to="/dashboard" replace />;
};

// Landing Page Component
const LandingPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  
  return (
    <div className="landing-container">
      <div className="landing-content">
        <div className="landing-header">
          <div className="auth-logo">
            <div className="logo-icon">💼</div>
            <h1>Payroll Management System</h1>
          </div>
          <p className="landing-subtitle">
            Comprehensive payroll solution for modern businesses
          </p>
        </div>
        
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">👥</div>
            <h3>Employee Management</h3>
            <p>Manage employee profiles, departments, and organizational structure</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">⏰</div>
            <h3>Attendance Tracking</h3>
            <p>Track employee attendance with check-in/out functionality</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🏖️</div>
            <h3>Leave Management</h3>
            <p>Handle leave requests, approvals, and balance tracking</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">💰</div>
            <h3>Payroll Generation</h3>
            <p>Automated payroll calculations and payslip generation</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <h3>Reports & Analytics</h3>
            <p>Comprehensive reporting and data visualization</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">⚙️</div>
            <h3>System Settings</h3>
            <p>Configure system preferences and user roles</p>
          </div>
        </div>
        
        <div className="landing-actions">
          {isAuthenticated ? (
            <button className="btn-primary" onClick={() => window.location.href = '/dashboard'}>
              Go to Dashboard
            </button>
          ) : (
            <>
              <button className="btn-primary" onClick={() => window.location.href = '/login'}>
                Get Started
              </button>
              <button className="btn-outline" onClick={() => window.location.href = '/register'}>
                Sign Up
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// Placeholder Page Component
const PlaceholderPage: React.FC<{ title: string }> = ({ title }) => {
  return (
    <div className="placeholder-page">
      <div className="placeholder-content">
        <h1>{title}</h1>
        <p>This page is under construction and will be implemented in upcoming tasks.</p>
        <div className="placeholder-features">
          <h3>Coming Soon:</h3>
          <ul>
            <li>Full functionality for {title}</li>
            <li>Modern UI with data tables</li>
            <li>Real-time updates</li>
            <li>Export capabilities</li>
            <li>Advanced filtering and search</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

// Dashboard Page Component
const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  
  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <div className="dashboard-title">
          <h1>Dashboard</h1>
          <p>Welcome back, {user?.firstName} {user?.lastName}!</p>
        </div>
      </div>
      
      <div className="dashboard-content">
        <div className="stats-grid">
          <div className="stat-card">
            <h3>Total Employees</h3>
            <p className="stat-number">245</p>
            <span className="stat-label">Active users</span>
          </div>
          <div className="stat-card">
            <h3>Present Today</h3>
            <p className="stat-number success">238</p>
            <span className="stat-label">Checked in</span>
          </div>
          <div className="stat-card">
            <h3>On Leave</h3>
            <p className="stat-number danger">7</p>
            <span className="stat-label">Away today</span>
          </div>
          <div className="stat-card">
            <h3>Monthly Payroll</h3>
            <p className="stat-number primary">$125,000</p>
            <span className="stat-label">This month</span>
          </div>
        </div>
        
        <div className="dashboard-info">
          <div className="info-card">
            <h3>Quick Actions</h3>
            <div className="action-buttons">
              <button className="btn-primary">Add Employee</button>
              <button className="btn-outline">Generate Payroll</button>
              <button className="btn-outline">View Reports</button>
            </div>
          </div>
          
          <div className="info-card">
            <h3>Your Profile</h3>
            <div className="profile-info">
              <p><strong>Role:</strong> {user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'N/A'}</p>
              <p><strong>Email:</strong> {user?.email}</p>
              <p><strong>Department:</strong> {user?.department?.name || 'N/A'}</p>
              <p><strong>Position:</strong> {user?.position || 'N/A'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="App">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            } />
            <Route path="/register" element={
              <PublicRoute>
                <Register />
              </PublicRoute>
            } />
            
            {/* Protected Routes with Layout */}
            <Route path="/*" element={
              <ProtectedRoute>
                <AppLayout>
                  <Routes>
                    <Route path="dashboard" element={<DashboardPage />} />
                    <Route path="employees" element={<PlaceholderPage title="Employees" />} />
                    <Route path="employees/add" element={<PlaceholderPage title="Add Employee" />} />
                    <Route path="departments" element={<PlaceholderPage title="Departments" />} />
                    <Route path="attendance" element={<PlaceholderPage title="Attendance" />} />
                    <Route path="attendance/check" element={<PlaceholderPage title="Check In/Out" />} />
                    <Route path="attendance/reports" element={<PlaceholderPage title="Attendance Reports" />} />
                    <Route path="leaves" element={<PlaceholderPage title="Leave Management" />} />
                    <Route path="leaves/apply" element={<PlaceholderPage title="Apply Leave" />} />
                    <Route path="leaves/calendar" element={<PlaceholderPage title="Leave Calendar" />} />
                    <Route path="payroll" element={<PlaceholderPage title="Payroll" />} />
                    <Route path="payroll/salary" element={<PlaceholderPage title="Salary Structure" />} />
                    <Route path="payroll/payslips" element={<PlaceholderPage title="Payslips" />} />
                    <Route path="reports" element={<PlaceholderPage title="Reports" />} />
                    <Route path="reports/employees" element={<PlaceholderPage title="Employee Reports" />} />
                    <Route path="reports/payroll" element={<PlaceholderPage title="Payroll Reports" />} />
                    <Route path="reports/attendance" element={<PlaceholderPage title="Attendance Analytics" />} />
                    <Route path="settings" element={<PlaceholderPage title="Settings" />} />
                    <Route path="settings/company" element={<PlaceholderPage title="Company Settings" />} />
                    <Route path="settings/users" element={<PlaceholderPage title="User Management" />} />
                    <Route path="settings/system" element={<PlaceholderPage title="System Settings" />} />
                    <Route path="profile" element={<PlaceholderPage title="My Profile" />} />
                    <Route path="help" element={<PlaceholderPage title="Help & Support" />} />
                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                  </Routes>
                </AppLayout>
              </ProtectedRoute>
            } />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;