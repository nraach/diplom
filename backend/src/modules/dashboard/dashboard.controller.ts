import { NextFunction, Request, Response } from "express";
import { AuthenticatedRequest } from "../../middleware/auth.middleware";
import { dashboardService } from "./dashboard.service";

export const dashboardController = {
  async getSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const { role } = (req as AuthenticatedRequest).user;
      res.json(await dashboardService.getSummary(role));
    } catch (error) {
      next(error);
    }
  }
};
