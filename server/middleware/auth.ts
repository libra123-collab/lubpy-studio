import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Derive secure JWT secret from environment configuration
function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET || process.env.SESSION_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('FATAL SECURITY ERROR: JWT_SECRET or SESSION_SECRET environment variable is missing.');
    }
    return 'LUBPY_STUDIO_ENTERPRISE_JWT_KEY_2026';
  }
  return secret;
}

const JWT_SECRET = getJwtSecret();

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
}

export function generateToken(user: AuthenticatedUser): string {
  return jwt.sign(
    {
      id: user.id,
      uid: user.uid,
      name: user.name,
      email: user.email,
      role: user.role,
      isDepartmentHead: user.isDepartmentHead || false,
      department: user.department || '',
      departmentTitle: user.departmentTitle || '',
      status: user.status || 'active',
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  let token = req.cookies?.token;
  
  if (!token && req.headers.authorization) {
    const parts = req.headers.authorization.split(' ');
    if (parts.length === 2 && parts[0] === 'Bearer') {
      token = parts[1];
    }
  }

  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthenticatedUser;
    // If user is suspended, reject token
    if (decoded.status === 'suspended' || decoded.status === 'inactive') {
      return next();
    }
    req.user = decoded;
    next();
  } catch (err) {
    // Token expired or malformed
    next();
  }
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Vui lòng đăng nhập để tiếp tục thao tác.' },
    });
  }
  next();
}

export function requireRoles(...allowedRoles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Vui lòng đăng nhập để thực hiện tác vụ này.' },
      });
    }

    const currentRole = req.user.role.toUpperCase();

    // SUPER_ADMIN and ADMIN have global clearance
    if (currentRole === 'SUPER_ADMIN' || currentRole === 'ADMIN') {
      return next();
    }

    // Standardize role aliases
    const normalizedAllowed = allowedRoles.map(r => r.toUpperCase());
    const hasRole = normalizedAllowed.includes(currentRole);

    if (!hasRole) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Bạn không có quyền truy cập vào tài nguyên hoặc nghiệp vụ này.' },
      });
    }

    next();
  };
}

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
    error: { code: 'FORBIDDEN', message: 'Yêu cầu quyền Trưởng Ban / Trưởng Bộ Phận để thực hiện tác vụ này.' },
  });
}
