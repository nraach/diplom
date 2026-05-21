import { NextFunction, Request, Response } from "express";
import { dashboardService } from "./dashboard.service";

export const dashboardController = {
  async getSummary(_req: Request, res: Response, next: NextFunction) {
    try {
      res.json(await dashboardService.getSummary());
    } catch (error) {
      next(error);
    }
  }
};
