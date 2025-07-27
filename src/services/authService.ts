import axios, { AxiosResponse } from 'axios';

// API base URL
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If token is expired, try to refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshResponse = await authService.refreshToken();
        const newToken = (refreshResponse.data as any).token;
        
        // Update token in localStorage
        localStorage.setItem('authToken', newToken);
        
        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(originalRequest);
        
      } catch (refreshError) {
        // Refresh failed, logout user
        localStorage.removeItem('authToken');
        localStorage.removeItem('authUser');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

// Types
// interface LoginData {
//   email: string;
//   password: string;
// }

interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
  department?: string;
  position?: string;
}

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  permissions: any;
  department?: any;
  position?: string;
  avatar?: string;
  isActive: boolean;
  isEmailVerified: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    token: string;
  };
}

interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
}

// Auth service class
class AuthService {
  // Login user
  async login(email: string, password: string): Promise<AxiosResponse<AuthResponse>> {
    const response = await apiClient.post('/auth/login', { email, password });
    return response;
  }

  // Register user
  async register(userData: RegisterData): Promise<AxiosResponse<AuthResponse>> {
    const response = await apiClient.post('/auth/register', userData);
    return response;
  }

  // Logout user
  async logout(): Promise<AxiosResponse<ApiResponse>> {
    const response = await apiClient.post('/auth/logout');
    return response;
  }

  // Verify token
  async verifyToken(token: string): Promise<AxiosResponse<ApiResponse<User>>> {
    const response = await apiClient.get('/auth/verify', {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response;
  }

  // Get current user profile
  async getProfile(): Promise<AxiosResponse<ApiResponse<User>>> {
    const response = await apiClient.get('/auth/profile');
    return response;
  }

  // Update user profile
  async updateProfile(profileData: Partial<User>): Promise<AxiosResponse<ApiResponse<User>>> {
    const response = await apiClient.put('/auth/profile', profileData);
    return response;
  }

  // Change password
  async changePassword(oldPassword: string, newPassword: string): Promise<AxiosResponse<ApiResponse>> {
    const response = await apiClient.put('/auth/password', {
      currentPassword: oldPassword,
      password: newPassword
    });
    return response;
  }

  // Refresh token
  async refreshToken(): Promise<AxiosResponse<AuthResponse>> {
    const response = await apiClient.post('/auth/refresh');
    return response;
  }

  // Forgot password
  async forgotPassword(email: string): Promise<AxiosResponse<ApiResponse>> {
    const response = await apiClient.post('/auth/forgot-password', { email });
    return response;
  }

  // Reset password
  async resetPassword(token: string, newPassword: string): Promise<AxiosResponse<ApiResponse>> {
    const response = await apiClient.post('/auth/reset-password', {
      token,
      password: newPassword
    });
    return response;
  }

  // Request email verification
  async requestEmailVerification(): Promise<AxiosResponse<ApiResponse>> {
    const response = await apiClient.post('/auth/verify-email/request');
    return response;
  }

  // Verify email
  async verifyEmail(token: string): Promise<AxiosResponse<ApiResponse>> {
    const response = await apiClient.post('/auth/verify-email', { token });
    return response;
  }

  // Get user permissions
  async getPermissions(): Promise<AxiosResponse<ApiResponse<any>>> {
    const response = await apiClient.get('/auth/permissions');
    return response;
  }

  // Check if user has specific permission
  async hasPermission(permission: string): Promise<boolean> {
    try {
      const response = await apiClient.get(`/auth/permissions/${permission}`);
      return response.data.data.hasPermission;
    } catch (error) {
      return false;
    }
  }

  // Get user roles
  async getRoles(): Promise<AxiosResponse<ApiResponse<any>>> {
    const response = await apiClient.get('/auth/roles');
    return response;
  }

  // Update user roles (admin only)
  async updateUserRoles(userId: string, roles: string[]): Promise<AxiosResponse<ApiResponse>> {
    const response = await apiClient.put(`/auth/users/${userId}/roles`, { roles });
    return response;
  }

  // Get all users (admin only)
  async getUsers(params?: any): Promise<AxiosResponse<ApiResponse<any>>> {
    const response = await apiClient.get('/auth/users', { params });
    return response;
  }

  // Get user by ID
  async getUserById(userId: string): Promise<AxiosResponse<ApiResponse<User>>> {
    const response = await apiClient.get(`/auth/users/${userId}`);
    return response;
  }

  // Update user (admin only)
  async updateUser(userId: string, userData: Partial<User>): Promise<AxiosResponse<ApiResponse<User>>> {
    const response = await apiClient.put(`/auth/users/${userId}`, userData);
    return response;
  }

  // Delete user (admin only)
  async deleteUser(userId: string): Promise<AxiosResponse<ApiResponse>> {
    const response = await apiClient.delete(`/auth/users/${userId}`);
    return response;
  }

  // Activate/deactivate user
  async toggleUserStatus(userId: string, isActive: boolean): Promise<AxiosResponse<ApiResponse>> {
    const response = await apiClient.put(`/auth/users/${userId}/status`, { isActive });
    return response;
  }

  // Get user session info
  async getSessionInfo(): Promise<AxiosResponse<ApiResponse<any>>> {
    const response = await apiClient.get('/auth/session');
    return response;
  }

  // End all sessions except current
  async endAllSessions(): Promise<AxiosResponse<ApiResponse>> {
    const response = await apiClient.post('/auth/sessions/end-all');
    return response;
  }

  // Get audit log for user
  async getUserAuditLog(userId?: string, params?: any): Promise<AxiosResponse<ApiResponse<any>>> {
    const url = userId ? `/auth/users/${userId}/audit` : '/auth/audit';
    const response = await apiClient.get(url, { params });
    return response;
  }
}

// Export singleton instance
export const authService = new AuthService();
export default authService;