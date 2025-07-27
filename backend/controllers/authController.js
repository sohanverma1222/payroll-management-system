const { User, AuditLog } = require('../models');
const { generateToken } = require('../middleware/auth');
const { 
  successResponse, 
  errorResponse, 
  createdResponse, 
  unauthorizedResponse,
  badRequestResponse,
  notFoundResponse
} = require('../utils/response');

// Register a new user
const register = async (req, res) => {
  try {
    const { 
      firstName, 
      lastName, 
      email, 
      password, 
      phone, 
      role = 'employee',
      department,
      position 
    } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return badRequestResponse(res, 'User with this email already exists');
    }

    // Create new user
    const user = new User({
      firstName,
      lastName,
      email,
      password,
      phone,
      role,
      department,
      position,
      createdBy: req.user ? req.user._id : null
    });

    await user.save();

    // Generate token
    const token = generateToken(user);

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    // Log successful registration
    await AuditLog.createLog({
      user: user._id,
      action: 'register',
      resource: { type: 'user', id: user._id, name: user.fullName },
      request: {
        method: 'POST',
        url: req.originalUrl,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      },
      response: { statusCode: 201, message: 'User registered successfully' }
    });

    return createdResponse(res, {
      user: userResponse,
      token
    }, 'User registered successfully');

  } catch (error) {
    console.error('Registration error:', error);
    return errorResponse(res, 'Registration failed', 500);
  }
};

// Login user
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user and include password for comparison
    const user = await User.findOne({ email })
      .select('+password')
      .populate('department', 'name code');

    if (!user) {
      // Log failed login attempt
      await AuditLog.createLog({
        user: null,
        action: 'login_failed',
        resource: { type: 'user', id: null, name: email },
        request: {
          method: 'POST',
          url: req.originalUrl,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        },
        response: { statusCode: 401, message: 'Invalid credentials' },
        error: { message: 'User not found' }
      });

      return unauthorizedResponse(res, 'Invalid credentials');
    }

    // Check if account is locked
    if (user.isLocked) {
      await AuditLog.createLog({
        user: user._id,
        action: 'login_failed',
        resource: { type: 'user', id: user._id, name: user.fullName },
        request: {
          method: 'POST',
          url: req.originalUrl,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        },
        response: { statusCode: 401, message: 'Account locked' },
        error: { message: 'Account is locked due to too many failed attempts' }
      });

      return unauthorizedResponse(res, 'Account is locked due to too many failed attempts');
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      // Increment login attempts
      await user.incLoginAttempts();

      // Log failed login attempt
      await AuditLog.createLog({
        user: user._id,
        action: 'login_failed',
        resource: { type: 'user', id: user._id, name: user.fullName },
        request: {
          method: 'POST',
          url: req.originalUrl,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        },
        response: { statusCode: 401, message: 'Invalid credentials' },
        error: { message: 'Invalid password' }
      });

      return unauthorizedResponse(res, 'Invalid credentials');
    }

    // Check if account is active
    if (!user.isActive) {
      return unauthorizedResponse(res, 'Account is deactivated');
    }

    // Reset login attempts on successful login
    await user.resetLoginAttempts();

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = generateToken(user);

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    // Log successful login
    await AuditLog.createLog({
      user: user._id,
      action: 'login',
      resource: { type: 'user', id: user._id, name: user.fullName },
      request: {
        method: 'POST',
        url: req.originalUrl,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      },
      response: { statusCode: 200, message: 'Login successful' }
    });

    return successResponse(res, {
      user: userResponse,
      token
    }, 'Login successful');

  } catch (error) {
    console.error('Login error:', error);
    return errorResponse(res, 'Login failed', 500);
  }
};

// Logout user
const logout = async (req, res) => {
  try {
    // In a real application, you might want to blacklist the token
    // For now, we'll just log the logout action
    
    if (req.user) {
      await AuditLog.createLog({
        user: req.user._id,
        action: 'logout',
        resource: { type: 'user', id: req.user._id, name: req.user.fullName },
        request: {
          method: 'POST',
          url: req.originalUrl,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        },
        response: { statusCode: 200, message: 'Logout successful' }
      });
    }

    return successResponse(res, null, 'Logout successful');

  } catch (error) {
    console.error('Logout error:', error);
    return errorResponse(res, 'Logout failed', 500);
  }
};

// Get current user profile
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password')
      .populate('department', 'name code')
      .populate('employeeId', 'employeeId position');

    if (!user) {
      return notFoundResponse(res, 'User not found');
    }

    return successResponse(res, user, 'Profile retrieved successfully');

  } catch (error) {
    console.error('Get profile error:', error);
    return errorResponse(res, 'Failed to retrieve profile', 500);
  }
};

// Update user profile
const updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, phone, avatar } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return notFoundResponse(res, 'User not found');
    }

    // Update fields
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (phone) user.phone = phone;
    if (avatar) user.avatar = avatar;

    user.updatedBy = req.user._id;
    await user.save();

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    // Log profile update
    await AuditLog.createLog({
      user: req.user._id,
      action: 'profile_update',
      resource: { type: 'user', id: user._id, name: user.fullName },
      request: {
        method: 'PUT',
        url: req.originalUrl,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      },
      response: { statusCode: 200, message: 'Profile updated successfully' }
    });

    return successResponse(res, userResponse, 'Profile updated successfully');

  } catch (error) {
    console.error('Update profile error:', error);
    return errorResponse(res, 'Failed to update profile', 500);
  }
};

// Change password
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id).select('+password');
    if (!user) {
      return notFoundResponse(res, 'User not found');
    }

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return unauthorizedResponse(res, 'Current password is incorrect');
    }

    // Update password
    user.password = newPassword;
    user.updatedBy = req.user._id;
    await user.save();

    // Log password change
    await AuditLog.createLog({
      user: req.user._id,
      action: 'password_change',
      resource: { type: 'user', id: user._id, name: user.fullName },
      request: {
        method: 'POST',
        url: req.originalUrl,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      },
      response: { statusCode: 200, message: 'Password changed successfully' }
    });

    return successResponse(res, null, 'Password changed successfully');

  } catch (error) {
    console.error('Change password error:', error);
    return errorResponse(res, 'Failed to change password', 500);
  }
};

// Get user permissions
const getPermissions = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('role permissions');
    if (!user) {
      return notFoundResponse(res, 'User not found');
    }

    const permissions = {
      role: user.role,
      permissions: user.permissions || {},
      isAdmin: user.role === 'admin'
    };

    return successResponse(res, permissions, 'Permissions retrieved successfully');

  } catch (error) {
    console.error('Get permissions error:', error);
    return errorResponse(res, 'Failed to retrieve permissions', 500);
  }
};

// Refresh token
const refreshToken = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password')
      .populate('department', 'name code');

    if (!user || !user.isActive) {
      return unauthorizedResponse(res, 'User not found or inactive');
    }

    const token = generateToken(user);

    return successResponse(res, {
      user,
      token
    }, 'Token refreshed successfully');

  } catch (error) {
    console.error('Refresh token error:', error);
    return errorResponse(res, 'Failed to refresh token', 500);
  }
};

module.exports = {
  register,
  login,
  logout,
  getProfile,
  updateProfile,
  changePassword,
  getPermissions,
  refreshToken
};