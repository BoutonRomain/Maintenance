import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { CustomError } from './errorHandler';
import { checkPermission } from './roleMiddleware';

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: number;
    login: string;
    role: string;
  };
}

export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      const error: CustomError = new Error('Aucun token fourni');
      error.status = 401;
      throw error;
    }

    const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : authHeader;
    const decoded = authService.verifyToken(token);

    req.user = decoded;
    next();
  } catch (error) {
    next(error);
  }
}

export function roleMiddleware(allowedRoles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        const error: CustomError = new Error('Authentification requise');
        error.status = 401;
        throw error;
      }

      if (!allowedRoles.includes(req.user.role)) {
        const error: CustomError = new Error('Permissions insuffisantes');
        error.status = 403;
        throw error;
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

export function expressAuthentication(request: Request, securityName: string, scopes?: string[]): Promise<any> {
  return new Promise((resolve, reject) => {
    if (securityName === 'jwt') {
      const authHeader = request.headers.authorization;

      if (!authHeader) {
        reject(new Error('Aucun token fourni'));
        return;
      }

      const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : authHeader;

      try {
        const decoded = authService.verifyToken(token);

        if (scopes !== undefined && scopes.length > 0) {
          const userRole = decoded.role;

          for (const scope of scopes) {
            const [resource, action] = scope.split(':');

            if (!checkPermission(userRole, resource as any, action as any)) {
              reject(new Error(`Permissions insuffisantes : ${scope}`));
              return;
            }
          }
        }

        resolve(decoded);
      } catch (error) {
        reject(error);
      }
    } else {
      reject(new Error('Schéma de sécurité inconnu'));
    }
  });
}