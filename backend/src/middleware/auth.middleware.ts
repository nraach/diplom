import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { UserRole, UserStatus } from "@prisma/client";
import { env } from "../config/env";
import { prisma } from "../prisma/client";
import { AppError } from "../utils/errors";

export type AuthUser = {
  id: string;
  role: UserRole;
  status: UserStatus;
};

export type AuthenticatedRequest = Request & {
  user: AuthUser;
};

type JwtPayload = {
  userId: string;
};

export async function authMiddleware(req: Request, _res: Response, next: NextFunction) {
  const authorization = req.header("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return next(new AppError(401, "Требуется токен авторизации"));
  }

  try {
    const token = authorization.slice("Bearer ".length);
    const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, role: true, status: true }
    });

    if (!user) {
      return next(new AppError(401, "Пользователь не найден"));
    }

    if (user.status !== "active") {
      return next(new AppError(403, "Пользователь не активен"));
    }

    (req as AuthenticatedRequest).user = user;
    return next();
  } catch (error) {
    return next(new AppError(401, "Недействительный токен авторизации"));
  }
}
