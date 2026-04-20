import { NextFunction, Request, Response } from "express";
import { auditService } from "./audit.service";

export const auditController = {
  async list(_req: Request, res: Response, next: NextFunction) {
    try {
      res.json(await auditService.list());
    } catch (error) {
      next(error);
    }
  }
};
