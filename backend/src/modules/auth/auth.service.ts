import jwt from "jsonwebtoken";
import { env } from "../../config/env";
import { AppError } from "../../utils/errors";
import { comparePassword, hashPassword } from "../../utils/password";
import { createAuditLog, toAuditValue } from "../../utils/audit";
import { findUserByEmail, createPendingUser } from "./auth.repository";
import { LoginInput, RegisterInput } from "./auth.validation";

export const authService = {
  async register(input: RegisterInput) {
    const existingUser = await findUserByEmail(input.email);

    if (existingUser) {
      throw new AppError(409, "Email уже зарегистрирован");
    }

    const passwordHash = await hashPassword(input.password);
    const user = await createPendingUser(input, passwordHash);

    await createAuditLog({
      userId: user.id,
      entityType: "user",
      entityId: user.id,
      action: "register",
      newValue: toAuditValue(toSafeUser(user))
    });

    return { user: toSafeUser(user) };
  },

  async login(input: LoginInput) {
    const user = await findUserByEmail(input.email);

    if (!user) {
      throw new AppError(401, "Неверный email или пароль");
    }

    const passwordMatches = await comparePassword(input.password, user.passwordHash);

    if (!passwordMatches) {
      throw new AppError(401, "Неверный email или пароль");
    }

    if (user.status !== "active") {
      throw new AppError(403, "Пользователь не активен");
    }

    await createAuditLog({
      userId: user.id,
      entityType: "user",
      entityId: user.id,
      action: "login",
      newValue: toAuditValue({ email: user.email })
    });

    const signOptions: jwt.SignOptions = {
      expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"]
    };

    return {
      token: jwt.sign({ userId: user.id }, env.JWT_SECRET, signOptions),
      user: toSafeUser(user)
    };
  }
};

function toSafeUser(user: {
  id: string;
  fullName: string;
  email: string;
  role: string;
  status: string;
  createdAt: Date;
}) {
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    status: user.status,
    createdAt: user.createdAt
  };
}
