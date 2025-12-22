/**
 * Controller Binding Utility
 * Provides clean syntax for binding DI-resolved controllers to routes
 */
import { Request, Response, NextFunction, RequestHandler } from 'express';
import { container } from '../../di';
import { InjectionToken } from 'tsyringe';

/**
 * Binds a controller method to a route handler, resolving the controller from DI
 * 
 * Usage:
 *   router.get('/dashboard', authMiddleware, bind(TOKENS.AnalyticsController, 'getDashboardMetrics'))
 * 
 * @param token - The DI token for the controller
 * @param method - The method name to call on the controller
 */
export function bind<T extends object>(
  token: InjectionToken<T>,
  method: keyof T
): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    const controller = container.resolve<T>(token);
    const handler = controller[method];
    if (typeof handler === 'function') {
      return (handler as Function).call(controller, req, res, next);
    }
    throw new Error(`Method ${String(method)} is not a function on controller`);
  };
}
