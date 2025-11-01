// JWT-based Authentication for Admin Panel
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { NextRequest, NextResponse } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-here';
const JWT_EXPIRES_IN = '24h';

export interface AdminUser {
  id: string;
  email: string;
  name?: string;
  role: string;
}

export interface AuthResult {
  success: boolean;
  data?: {
    user: AdminUser;
    token: string;
  };
  error?: string;
}

// Generate JWT token
export const generateToken = (user: AdminUser): string => {
  return jwt.sign(
    { 
      id: user.id, 
      email: user.email, 
      role: user.role 
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

// Verify JWT token
export const verifyToken = (token: string): AdminUser | null => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role
    };
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
};

// Verify admin token (alias for verifyToken)
export const verifyAdminToken = verifyToken;

// Hash password
export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
};

// Verify password
export const verifyPassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  return await bcrypt.compare(password, hashedPassword);
};

// Admin authentication (server-side only)
export const authenticateAdmin = async (email: string, password: string): Promise<AuthResult> => {
  if (typeof window !== 'undefined') {
    return { success: false, error: 'Authentication only available on server side' };
  }
  
  try {
    // Development mode - bypass authentication
    if (process.env.NODE_ENV === 'development') {
      const token = generateToken({
        id: '1',
        email: email,
        name: 'Admin',
        role: 'admin'
      });

      return {
        success: true,
        data: {
          user: {
            id: '1',
            email: email,
            name: 'Admin',
            role: 'admin'
          },
          token
        }
      };
    }

    return { success: false, error: 'Production authentication not configured' };
  } catch (error) {
    console.error('Authentication error:', error);
    return { success: false, error: 'Authentication failed' };
  }
};

// Create admin user (for initial setup) - server-side only
export const createAdminUser = async (email: string, password: string, name?: string): Promise<AuthResult> => {
  if (typeof window !== 'undefined') {
    return { success: false, error: 'User creation only available on server side' };
  }
  
  try {
    // Development mode - bypass user creation
    if (process.env.NODE_ENV === 'development') {
      const token = generateToken({
        id: '1',
        email: email,
        name: name || 'Admin',
        role: 'admin'
      });

      return {
        success: true,
        data: {
          user: {
            id: '1',
            email: email,
            name: name || 'Admin',
            role: 'admin'
          },
          token
        }
      };
    }

    return { success: false, error: 'Production user creation not configured' };
  } catch (error) {
    console.error('User creation error:', error);
    return { success: false, error: 'User creation failed' };
  }
};


// Rate limiting helper
const loginAttempts = new Map<string, { count: number; lastAttempt: number }>();
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

export const checkRateLimit = (identifier: string): { allowed: boolean; remainingAttempts: number; lockoutTime?: number } => {
  const now = Date.now();
  const attempts = loginAttempts.get(identifier);

  if (!attempts) {
    return { allowed: true, remainingAttempts: MAX_ATTEMPTS };
  }

  // Check if lockout period has expired
  if (now - attempts.lastAttempt > LOCKOUT_DURATION) {
    loginAttempts.delete(identifier);
    return { allowed: true, remainingAttempts: MAX_ATTEMPTS };
  }

  // Check if max attempts reached
  if (attempts.count >= MAX_ATTEMPTS) {
    const lockoutTime = LOCKOUT_DURATION - (now - attempts.lastAttempt);
    return { allowed: false, remainingAttempts: 0, lockoutTime };
  }

  return { 
    allowed: true, 
    remainingAttempts: MAX_ATTEMPTS - attempts.count 
  };
};

export const recordLoginAttempt = (identifier: string, success: boolean): void => {
  const now = Date.now();
  
  if (success) {
    // Clear attempts on successful login
    loginAttempts.delete(identifier);
  } else {
    const attempts = loginAttempts.get(identifier) || { count: 0, lastAttempt: now };
    attempts.count++;
    attempts.lastAttempt = now;
    loginAttempts.set(identifier, attempts);
  }
};

// Middleware for protecting admin routes (server-side only)
export const requireAuth = (handler: any) => {
  return async (request: NextRequest) => {
    if (typeof window !== 'undefined') {
      return NextResponse.json({ 
        success: false, 
        error: 'Auth middleware only available on server side' 
      }, { status: 500 });
    }
    try {
      const token = request.headers.get('authorization')?.replace('Bearer ', '') || 
                   request.cookies?.get('admin_token')?.value;

      if (!token) {
        return NextResponse.json({ 
          success: false, 
          error: 'Authentication required' 
        }, { status: 401 });
      }

      const user = verifyToken(token);
      if (!user) {
        return NextResponse.json({ 
          success: false, 
          error: 'Invalid token' 
        }, { status: 401 });
      }

      // Add user to request object
      (request as any).user = user;
      return handler(request);
    } catch (error) {
      console.error('Auth middleware error:', error);
      return NextResponse.json({ 
        success: false, 
        error: 'Authentication error' 
      }, { status: 500 });
    }
  };
};

// Session management
export class SessionManager {
  private static sessions = new Map<string, { user: AdminUser; expires: number }>();

  static createSession(user: AdminUser, token: string): void {
    const expires = Date.now() + (24 * 60 * 60 * 1000); // 24 hours
    this.sessions.set(token, { user, expires });
  }

  static getSession(token: string): AdminUser | null {
    const session = this.sessions.get(token);
    
    if (!session) {
      return null;
    }

    // Check if session expired
    if (Date.now() > session.expires) {
      this.sessions.delete(token);
      return null;
    }

    return session.user;
  }

  static destroySession(token: string): void {
    this.sessions.delete(token);
  }

  static cleanExpiredSessions(): void {
    const now = Date.now();
    for (const [token, session] of this.sessions.entries()) {
      if (now > session.expires) {
        this.sessions.delete(token);
      }
    }
  }
}

// Clean expired sessions every hour
if (typeof window === 'undefined') {
  setInterval(() => {
    SessionManager.cleanExpiredSessions();
  }, 60 * 60 * 1000);
}

// requireAdmin helper for API routes
export async function requireAdmin(request: NextRequest): Promise<{ success: boolean; user?: AdminUser; error?: string }> {
  try {
    // Development mode - bypass authentication
    if (process.env.NODE_ENV === 'development') {
      console.log('⚠️ Development mode: Admin auth bypassed');
      return { 
        success: true, 
        user: {
          id: '1',
          email: 'admin@tolgademir.org',
          name: 'Admin',
          role: 'admin'
        }
      };
    }

    const token = request.headers.get('authorization')?.replace('Bearer ', '') || 
                 request.cookies?.get('admin_token')?.value;

    if (!token) {
      return { success: false, error: 'Authentication required' };
    }

    const user = verifyToken(token);
    if (!user) {
      return { success: false, error: 'Invalid token' };
    }

    return { success: true, user };
  } catch (error) {
    console.error('Admin auth error:', error);
    return { success: false, error: 'Authentication error' };
  }
}

export default {
  authenticateAdmin,
  createAdminUser,
  verifyToken,
  generateToken,
  hashPassword,
  verifyPassword,
  checkRateLimit,
  recordLoginAttempt,
  requireAuth,
  requireAdmin,
  SessionManager
};
