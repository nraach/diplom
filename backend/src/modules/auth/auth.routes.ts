import { Router } from "express";
import { createRateLimit } from "../../middleware/rate-limit.middleware";
import { validateBody } from "../../middleware/validation.middleware";
import { authController } from "./auth.controller";
import { loginSchema, registerSchema } from "./auth.validation";

export const authRoutes = Router();

const registerRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  keyPrefix: "auth-register",
  message: "Слишком много попыток регистрации. Повторите позже."
});

const loginRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  keyPrefix: "auth-login",
  message: "Слишком много попыток входа. Повторите позже."
});

authRoutes.post("/register", registerRateLimit, validateBody(registerSchema), authController.register);
authRoutes.post("/login", loginRateLimit, validateBody(loginSchema), authController.login);
