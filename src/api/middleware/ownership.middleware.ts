import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../../shared/enums/user-role.enum';

/**
 * Resource Ownership Validation Middleware
 * Ensures users can only access their own resources
 * 
 * Requirements: 8.4, 8.5
 */

/**
 * Type definition for resource fetcher function
 * Used to retrieve a resource and check ownership
 */
export type ResourceFetcher<T> = (
  resourceId: string,
  req: Request
) => Promise<T | null>;

/**
 * Type definition for ownership checker function
 * Returns true if the user owns the resource
 */
export type OwnershipChecker<T> = (resource: T, userId: string) => boolean;

/**
 * Options for the ownership validation middleware
 */
export interface OwnershipOptions<T> {
  /** Parameter name containing the resource ID (default: 'id') */
  paramName?: string;
  /** Function to fetch the resource from database */
  fetchResource: ResourceFetcher<T>;
  /** Function to check if user owns the resource */
  checkOwnership: OwnershipChecker<T>;
  /** Roles that bypass ownership check (e.g., admin) */
  bypassRoles?: UserRole[];
  /** Custom error message */
  errorMessage?: string;
}

/**
 * Creates a middleware that validates resource ownership
 * 
 * @param options - Configuration options for ownership validation
 * @returns Express middleware function
 * 
 * @example
 * // Validate order ownership
 * router.get('/orders/:id', authMiddleware, validateOwnership({
 *   fetchResource: async (id) => orderRepository.findById(id),
 *   checkOwnership: (order, userId) => order.userId === userId,
 *   bypassRoles: [UserRole.ADMIN, UserRole.SUPPORT],
 * }), getOrderHandler);
 */
export const validateOwnership = <T>(options: OwnershipOptions<T>) => {
  const {
    paramName = 'id',
    fetchResource,
    checkOwnership,
    bypassRoles = [UserRole.ADMIN],
    errorMessage = 'You do not have permission to access this resource',
  } = options;

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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

      const userId = req.user.id;
      const userRole = req.user.role || UserRole.SELLER;

      // Check if user role bypasses ownership check
      if (bypassRoles.includes(userRole)) {
        next();
        return;
      }

      // Get resource ID from request parameters
      const resourceId = req.params[paramName];
      if (!resourceId) {
        res.status(400).json({
          success: false,
          error: `Resource ID parameter '${paramName}' is required`,
          code: 'MISSING_RESOURCE_ID',
        });
        return;
      }

      // Fetch the resource
      const resource = await fetchResource(resourceId, req);
      if (!resource) {
        res.status(404).json({
          success: false,
          error: 'Resource not found',
          code: 'RESOURCE_NOT_FOUND',
        });
        return;
      }

      // Check ownership
      if (!checkOwnership(resource, userId)) {
        res.status(403).json({
          success: false,
          error: errorMessage,
          code: 'OWNERSHIP_DENIED',
        });
        return;
      }

      // Attach resource to request for use in handler
      (req as any).resource = resource;
      next();
    } catch (error) {
      console.error('Ownership validation error:', error);
      res.status(500).json({
        success: false,
        error: 'Ownership validation failed',
        code: 'OWNERSHIP_CHECK_ERROR',
      });
    }
  };
};

/**
 * Simple ownership check for resources with userId field
 * @param userIdField - Name of the field containing the owner's user ID
 * @returns Ownership checker function
 */
export const createUserIdChecker = <T extends Record<string, any>>(
  userIdField: string = 'userId'
): OwnershipChecker<T> => {
  return (resource: T, userId: string): boolean => {
    return resource[userIdField] === userId;
  };
};

/**
 * Middleware that validates the user is accessing their own user resource
 * Used for routes like /users/:userId where userId must match authenticated user
 */
export const validateSelfAccess = (paramName: string = 'userId') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
          code: 'AUTH_REQUIRED',
        });
        return;
      }

      const userRole = req.user.role || UserRole.SELLER;

      // Admin and support can access any user's data
      if (userRole === UserRole.ADMIN || userRole === UserRole.SUPPORT) {
        next();
        return;
      }

      const requestedUserId = req.params[paramName];
      if (requestedUserId && requestedUserId !== req.user.id) {
        res.status(403).json({
          success: false,
          error: 'You can only access your own data',
          code: 'SELF_ACCESS_ONLY',
        });
        return;
      }

      next();
    } catch (error) {
      console.error('Self access validation error:', error);
      res.status(500).json({
        success: false,
        error: 'Access validation failed',
        code: 'ACCESS_CHECK_ERROR',
      });
    }
  };
};
