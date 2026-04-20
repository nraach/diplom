import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { requireRole } from "../../middleware/role.middleware";
import { auditController } from "./audit.controller";

export const auditRoutes = Router();

auditRoutes.use(authMiddleware, requireRole("admin"));
auditRoutes.get("/", auditController.list);
