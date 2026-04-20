import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { dashboardController } from "./dashboard.controller";

export const dashboardRoutes = Router();

dashboardRoutes.use(authMiddleware);
dashboardRoutes.get("/", dashboardController.getSummary);
