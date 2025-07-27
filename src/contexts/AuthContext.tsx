import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService } from '../services/authService';

// Types
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
  department?: {
    _id: string;
    name: string;
    code: string;
  };
  position?: string;
  avatar?: string;
  isActive: boolean;
  isEmailVerified: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (userData: RegisterData) => Promise<void>;
  updateProfile: (profileData: Partial<User>) => Promise<void>;
  changePassword: (oldPassword: string, newPassword: string) => Promise<void>;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string) => boolean;
  refreshToken: () => Promise<void>;
}

interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
  department?: string;
  position?: string;
}

interface AuthProviderProps {
  children: ReactNode;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth provider component
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is authenticated
  const isAuthenticated = !!user && !!token;

  // Initialize auth on app load
  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedToken = localStorage.getItem('authToken');
        const storedUser = localStorage.getItem('authUser');

        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
          
          // Verify token is still valid
          try {
            await authService.verifyToken(storedToken);
          } catch (error) {
            // Token is invalid, clear auth
            localStorage.removeItem('authToken');
            localStorage.removeItem('authUser');
            setToken(null);
            setUser(null);
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        // Clear invalid stored data
        localStorage.removeItem('authToken');
        localStorage.removeItem('authUser');
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  // Login function
  const login = async (email: string, password: string): Promise<void> => {
    try {
      setIsLoading(true);
      const response = await authService.login(email, password);
      
      const { user: userData, token: userToken } = response.data as any;
      
      // Store in localStorage
      localStorage.setItem('authToken', userToken);
      localStorage.setItem('authUser', JSON.stringify(userData));
      
      // Update state
      setToken(userToken);
      setUser(userData);
      
    } catch (error: any) {
      console.error('Login error:', error);
      throw new Error(error.response?.data?.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    try {
      // Call logout endpoint (fire and forget)
      if (token) {
        authService.logout().catch(console.error);
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local state and storage
      localStorage.removeItem('authToken');
      localStorage.removeItem('authUser');
      setToken(null);
      setUser(null);
    }
  };

  // Register function
  const register = async (userData: RegisterData): Promise<void> => {
    try {
      setIsLoading(true);
      const response = await authService.register(userData);
      
      const { user: newUser, token: newToken } = response.data as any;
      
      // Store in localStorage
      localStorage.setItem('authToken', newToken);
      localStorage.setItem('authUser', JSON.stringify(newUser));
      
      // Update state
      setToken(newToken);
      setUser(newUser);
      
    } catch (error: any) {
      console.error('Registration error:', error);
      throw new Error(error.response?.data?.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Update profile function
  const updateProfile = async (profileData: Partial<User>): Promise<void> => {
    try {
      setIsLoading(true);
      const response = await authService.updateProfile(profileData);
      
      const updatedUser = response.data;
      
      // Update localStorage
      localStorage.setItem('authUser', JSON.stringify(updatedUser));
      
      // Update state
      setUser((updatedUser.data || updatedUser) as User);
      
    } catch (error: any) {
      console.error('Profile update error:', error);
      throw new Error(error.response?.data?.message || 'Profile update failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Change password function
  const changePassword = async (oldPassword: string, newPassword: string): Promise<void> => {
    try {
      setIsLoading(true);
      await authService.changePassword(oldPassword, newPassword);
    } catch (error: any) {
      console.error('Password change error:', error);
      throw new Error(error.response?.data?.message || 'Password change failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Check if user has specific permission
  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    
    // Admin has all permissions
    if (user.role === 'admin') return true;
    
    // Check specific permissions
    switch (permission) {
      case 'employees':
      case 'employee':
        return user.permissions.canManageEmployees;
      case 'payroll':
        return user.permissions.canManagePayroll;
      case 'attendance':
        return user.permissions.canManageAttendance;
      case 'leave':
      case 'leaves':
        return user.permissions.canManageLeaves;
      case 'reports':
        return user.permissions.canViewReports;
      case 'settings':
        return user.permissions.canManageSettings;
      case 'leave_approval':
        return user.role === 'hr' || user.role === 'manager';
      case 'payroll_admin':
      case 'payroll_approval':
        return ['hr', 'admin'].includes(user.role);
      case 'attendance_admin':
        return ['hr', 'admin'].includes(user.role);
      case 'admin':
        return user.role === 'admin';
      default:
        return false;
    }
  };

  // Check if user has specific role
  const hasRole = (role: string): boolean => {
    if (!user) return false;
    return user.role === role;
  };

  // Refresh token function
  const refreshToken = async (): Promise<void> => {
    try {
      const response = await authService.refreshToken();
      const { token: newToken, user: userData } = response.data as any;
      
      // Update localStorage
      localStorage.setItem('authToken', newToken);
      localStorage.setItem('authUser', JSON.stringify(userData));
      
      // Update state
      setToken(newToken);
      setUser(userData);
      
    } catch (error: any) {
      console.error('Token refresh error:', error);
      // If refresh fails, logout user
      logout();
      throw new Error('Session expired. Please login again.');
    }
  };

  // Context value
  const value: AuthContextType = {
    user,
    token,
    isAuthenticated,
    isLoading,
    login,
    logout,
    register,
    updateProfile,
    changePassword,
    hasPermission,
    hasRole,
    refreshToken
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Higher-order component for protected routes
export const withAuth = <P extends object>(
  Component: React.ComponentType<P>,
  requiredPermission?: string
) => {
  return function AuthenticatedComponent(props: P) {
    const { isAuthenticated, hasPermission, isLoading } = useAuth();

    if (isLoading) {
      return (
        <div className="App-loading">
          <div className="App-spinner"></div>
          <p>Loading...</p>
        </div>
      );
    }

    if (!isAuthenticated) {
      return (
        <div className="App-error">
          <h3>Authentication Required</h3>
          <p>Please login to access this page.</p>
        </div>
      );
    }

    if (requiredPermission && !hasPermission(requiredPermission)) {
      return (
        <div className="App-error">
          <h3>Access Denied</h3>
          <p>You don't have permission to access this resource.</p>
        </div>
      );
    }

    return <Component {...props} />;
  };
};

export default AuthContext;