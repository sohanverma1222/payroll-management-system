import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  permissions: {
    canManageEmployees: boolean;
    canManagePayroll: boolean;
    canManageAttendance: boolean;
    canManageLeaves: boolean;
    canViewReports: boolean;
    canManageSettings: boolean;
  };
}

interface SidebarProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
}

interface MenuItem {
  id: string;
  label: string;
  icon: string;
  path: string;
  permission?: string;
  submenu?: MenuItem[];
}

const Sidebar: React.FC<SidebarProps> = ({ user, isOpen, onClose }) => {
  const location = useLocation();
  const { hasPermission } = useAuth();

  const menuItems: MenuItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: '📊',
      path: '/dashboard'
    },
    {
      id: 'employees',
      label: 'Employees',
      icon: '👥',
      path: '/employees',
      permission: 'employees',
      submenu: [
        { id: 'employee-list', label: 'Employee List', icon: '📋', path: '/employees' },
        { id: 'add-employee', label: 'Add Employee', icon: '➕', path: '/employees/add' },
        { id: 'departments', label: 'Departments', icon: '🏢', path: '/departments' }
      ]
    },
    {
      id: 'attendance',
      label: 'Attendance',
      icon: '⏰',
      path: '/attendance',
      permission: 'attendance',
      submenu: [
        { id: 'attendance-tracking', label: 'Attendance Tracking', icon: '📅', path: '/attendance' },
        { id: 'check-in-out', label: 'Check In/Out', icon: '🕐', path: '/attendance/check' },
        { id: 'attendance-reports', label: 'Reports', icon: '📊', path: '/attendance/reports' }
      ]
    },
    {
      id: 'leaves',
      label: 'Leave Management',
      icon: '🏖️',
      path: '/leaves',
      permission: 'leaves',
      submenu: [
        { id: 'leave-requests', label: 'Leave Requests', icon: '📝', path: '/leaves' },
        { id: 'apply-leave', label: 'Apply Leave', icon: '📄', path: '/leaves/apply' },
        { id: 'leave-calendar', label: 'Leave Calendar', icon: '📅', path: '/leaves/calendar' }
      ]
    },
    {
      id: 'payroll',
      label: 'Payroll',
      icon: '💰',
      path: '/payroll',
      permission: 'payroll',
      submenu: [
        { id: 'payroll-processing', label: 'Payroll Processing', icon: '🔄', path: '/payroll' },
        { id: 'salary-structure', label: 'Salary Structure', icon: '📋', path: '/payroll/salary' },
        { id: 'payslips', label: 'Payslips', icon: '📄', path: '/payroll/payslips' }
      ]
    },
    {
      id: 'reports',
      label: 'Reports & Analytics',
      icon: '📈',
      path: '/reports',
      permission: 'reports',
      submenu: [
        { id: 'employee-reports', label: 'Employee Reports', icon: '👥', path: '/reports/employees' },
        { id: 'payroll-reports', label: 'Payroll Reports', icon: '💰', path: '/reports/payroll' },
        { id: 'attendance-analytics', label: 'Attendance Analytics', icon: '📊', path: '/reports/attendance' }
      ]
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: '⚙️',
      path: '/settings',
      permission: 'settings',
      submenu: [
        { id: 'company-settings', label: 'Company Settings', icon: '🏢', path: '/settings/company' },
        { id: 'user-management', label: 'User Management', icon: '👤', path: '/settings/users' },
        { id: 'system-settings', label: 'System Settings', icon: '🔧', path: '/settings/system' }
      ]
    }
  ];

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const canAccessMenuItem = (item: MenuItem) => {
    if (!item.permission) return true;
    return hasPermission(item.permission);
  };

  const renderMenuItem = (item: MenuItem) => {
    if (!canAccessMenuItem(item)) return null;

    const hasSubmenu = item.submenu && item.submenu.length > 0;
    const isActiveItem = isActive(item.path);

    return (
      <li key={item.id} className={`sidebar-item ${isActiveItem ? 'active' : ''}`}>
        <Link 
          to={item.path}
          className="sidebar-link"
          onClick={onClose}
        >
          <span className="sidebar-icon">{item.icon}</span>
          <span className="sidebar-label">{item.label}</span>
          {hasSubmenu && <span className="submenu-arrow">▼</span>}
        </Link>
        
        {hasSubmenu && isActiveItem && (
          <ul className="sidebar-submenu">
            {item.submenu?.map(subItem => (
              <li key={subItem.id} className={`submenu-item ${isActive(subItem.path) ? 'active' : ''}`}>
                <Link 
                  to={subItem.path}
                  className="submenu-link"
                  onClick={onClose}
                >
                  <span className="submenu-icon">{subItem.icon}</span>
                  <span className="submenu-label">{subItem.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </li>
    );
  };

  return (
    <>
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div className="logo-icon">💼</div>
            <h2>Payroll</h2>
          </div>
          <button className="sidebar-close" onClick={onClose}>
            ✕
          </button>
        </div>
        
        <nav className="sidebar-nav">
          <ul className="sidebar-menu">
            {menuItems.map(renderMenuItem)}
          </ul>
        </nav>
        
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="user-avatar-small">
              {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
            </div>
            <div className="user-details">
              <div className="user-name-small">{user?.firstName} {user?.lastName}</div>
              <div className="user-role-small">{user?.role?.toUpperCase()}</div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;