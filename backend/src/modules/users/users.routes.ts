import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { requireRole } from "../../middleware/role.middleware";
import { validateBody } from "../../middleware/validation.middleware";
import { usersController } from "./users.controller";
import { updateUserRoleSchema } from "./users.validation";

export const usersRoutes = Router();

usersRoutes.use(authMiddleware, requireRole("admin"));
usersRoutes.get("/", usersController.list);
usersRoutes.patch("/:id/approve", usersController.approve);
usersRoutes.patch("/:id/block", usersController.block);
usersRoutes.patch("/:id/role", validateBody(updateUserRoleSchema), usersController.changeRole);
