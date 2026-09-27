import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Derive secure JWT secret from environment configuration
export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET || process.env.SESSION_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('FATAL SECURITY ERROR: JWT_SECRET or SESSION_SECRET environment variable is missing in production environment.');
    }
    return 'LUBPY_STUDIO_ENTERPRISE_DEV_JWT_KEY_2026';
  }
  return secret;
}

export const JWT_SECRET = getJwtSecret();

export interface AuthenticatedUser {
  id: number;
  uid: string;
  name: string;
  email: string;
  role: string;
  isDepartmentHead?: boolean;
  department?: string;
  departmentTitle?: string;
  status?: string;
}

export interface AuthRequest extends Request {
  user?: AuthenticatedUser;
  authError?: {
    code: string;
    message: string;
  };
}

export function generateToken(user: AuthenticatedUser): string {
  return jwt.sign(
    {
      id: user.id,
      uid: user.uid,
      name: user.name,
      email: user.email,
      role: user.role,
      isDepartmentHead: !!user.isDepartmentHead,
      department: user.department || '',
      departmentTitle: user.departmentTitle || '',
      status: user.status || 'active',
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

/**
 * Pipeline Step 1: Authentication Middleware
 * Extracts and verifies token from Cookie or Bearer header, attaches user to request
 */
export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  let token: string | undefined = req.cookies?.token;

  if (!token && req.headers.authorization) {
    const parts = req.headers.authorization.split(' ');
    if (parts.length === 2 && parts[0] === 'Bearer') {
      token = parts[1];
    }
  }

  if (!token) {
    // No token provided; proceed without user context
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthenticatedUser;

    // Check account status
    if (decoded.status === 'suspended' || decoded.status === 'inactive') {
      req.authError = {
        code: 'ACCOUNT_DISABLED',
        message: 'Tài khoản của bạn đã bị khóa hoặc tạm ngưng hoạt động. Vui lòng liên hệ Admin.',
      };
      return next();
    }

    req.user = decoded;
    next();
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      req.authError = {
        code: 'TOKEN_EXPIRED',
        message: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
      };
    } else {
      req.authError = {
        code: 'INVALID_TOKEN',
        message: 'Mã xác thực không hợp lệ hoặc đã bị thay đổi.',
      };
    }
    next();
  }
}

/**
 * Pipeline Step 2: Require Authentication Middleware
 */
export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    const code = req.authError?.code || 'UNAUTHORIZED';
    const message = req.authError?.message || 'Vui lòng đăng nhập để tiếp tục thao tác.';
    return res.status(401).json({
      success: false,
      error: { code, message },
    });
  }
  next();
}

/**
 * Pipeline Step 3: Role-based Authorization Middleware
 */
export function requireRoles(...allowedRoles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      const code = req.authError?.code || 'UNAUTHORIZED';
      const message = req.authError?.message || 'Vui lòng đăng nhập để thực hiện tác vụ này.';
      return res.status(401).json({
        success: false,
        error: { code, message },
      });
    }

    const currentRole = req.user.role.toUpperCase();

    // SUPER_ADMIN and ADMIN have global clearance across all endpoints
    if (currentRole === 'SUPER_ADMIN' || currentRole === 'ADMIN') {
      return next();
    }

    const normalizedAllowed = allowedRoles.map(r => r.toUpperCase());
    const hasRole = normalizedAllowed.includes(currentRole);

    if (!hasRole) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Bạn không có quyền truy cập vào tài nguyên hoặc nghiệp vụ này.',
        },
      });
    }

    next();
  };
}

/**
 * Pipeline Step 4: Department Head Clearance Middleware
 */
export function requireDepartmentHead(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Vui lòng đăng nhập.' },
    });
  }

  const currentRole = req.user.role.toUpperCase();
  if (currentRole === 'SUPER_ADMIN' || currentRole === 'ADMIN' || req.user.isDepartmentHead) {
    return next();
  }

  return res.status(403).json({
    success: false,
    error: {
      code: 'FORBIDDEN',
      message: 'Yêu cầu quyền Trưởng Ban / Trưởng Bộ Phận để thực hiện tác vụ này.',
    },
  });
}
