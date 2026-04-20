import { NextFunction, Request, Response } from "express";
import { UserRole } from "@prisma/client";
import { AuthenticatedRequest } from "./auth.middleware";
import { AppError } from "../utils/errors";

export function requireRole(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const user = (req as AuthenticatedRequest).user;

    if (!user || !roles.includes(user.role)) {
      return next(new AppError(403, "Доступ запрещен"));
    }

    return next();
  };
}
