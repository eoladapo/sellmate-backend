/**
 * User roles for RBAC (Role-Based Access Control)
 * Based on design document security specifications
 */
export enum UserRole {
  /** Standard user with full access to their own data */
  SELLER = 'seller',
  /** Platform administrator with elevated privileges */
  ADMIN = 'admin',
  /** Support staff with read-only access to user data */
  SUPPORT = 'support',
}

/**
 * Default role for new users
 */
export const DEFAULT_USER_ROLE = UserRole.SELLER;
