import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../../shared/enums/user-role.enum';

/**
 * Role-Based Access Control (RBAC) Middleware
 * Validates user roles against required permissions for routes
 * 
 * Requirements: 8.4, 8.5
 * 
 * Note: Express Request interface is extended in auth.middleware.ts
 */

/**
 * Middleware factory that creates a role-checking middleware
 * @param allowedRoles - Array of roles that are allowed to access the route
 * @returns Express middleware function
 * 
 * @example
 * // Allow only admins
 * router.get('/admin-only', authMiddleware, requireRoles([UserRole.ADMIN]), handler);
 * 
 * // Allow admins and support staff
 * router.get('/staff', authMiddleware, requireRoles([UserRole.ADMIN, UserRole.SUPPORT]), handler);
 */
export const requireRoles = (allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Check if user is authenticated
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
          code: 'AUTH_REQUIRED',
        });
        return;
      }

      // Get user role (default to seller if not specified)
      const userRole = req.user.role || UserRole.SELLER;

      // Check if user's role is in the allowed roles
      if (!allowedRoles.includes(userRole)) {
        res.status(403).json({
          success: false,
          error: 'Insufficient permissions',
          code: 'FORBIDDEN',
          requiredRoles: allowedRoles,
          userRole: userRole,
        });
        return;
      }

      next();
    } catch (error) {
      console.error('RBAC middleware error:', error);
      res.status(500).json({
        success: false,
        error: 'Authorization check failed',
        code: 'RBAC_ERROR',
      });
    }
  };
};

/**
 * Middleware that requires admin role
 * Shorthand for requireRoles([UserRole.ADMIN])
 */
export const requireAdmin = requireRoles([UserRole.ADMIN]);

/**
 * Middleware that requires admin or support role
 * Shorthand for requireRoles([UserRole.ADMIN, UserRole.SUPPORT])
 */
export const requireStaff = requireRoles([UserRole.ADMIN, UserRole.SUPPORT]);

/**
 * Middleware that allows any authenticated user (seller, admin, or support)
 * Shorthand for requireRoles([UserRole.SELLER, UserRole.ADMIN, UserRole.SUPPORT])
 */
export const requireAuthenticated = requireRoles([
  UserRole.SELLER,
  UserRole.ADMIN,
  UserRole.SUPPORT,
]);
