import { NextFunction, Request, Response } from "express";
import { AuthenticatedRequest } from "../../middleware/auth.middleware";
import { cyclesService } from "./cycles.service";

export const cyclesController = {
  async list(_req: Request, res: Response, next: NextFunction) {
    try {
      res.json(await cyclesService.list());
    } catch (error) {
      next(error);
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await cyclesService.create(req.body, (req as AuthenticatedRequest).user.id);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await cyclesService.update(req.params.id, req.body, (req as AuthenticatedRequest).user.id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  async handover(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await cyclesService.handover(req.params.id, req.body, (req as AuthenticatedRequest).user.id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
};
