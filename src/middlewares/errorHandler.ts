import { Request, Response, NextFunction } from "express";

export type CustomError = Error & {
  status?: number;
}

/**
 * Crée et lance une erreur HTTP avec un code de statut et un message.
 * Remplace le pattern répétitif : new Error(); error.status = X; throw error;
 */
export function createHttpError(status: number, message: string): never {
  const error: CustomError = new Error(message);
  error.status = status;
  throw error;
}

const errorHandler = (
  err: CustomError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error("An error occurred:", err);

  const statusCode = err.status || 500;
  const message = err.message || "Internal Server Error";

  res.status(statusCode).json({
    status: statusCode,
    message: message,
  });
};

export default errorHandler;
