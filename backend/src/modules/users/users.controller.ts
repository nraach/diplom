import { NextFunction, Request, Response } from "express";
import { AuthenticatedRequest } from "../../middleware/auth.middleware";
import { usersService } from "./users.service";

export const usersController = {
  async list(_req: Request, res: Response, next: NextFunction) {
    try {
      res.json(await usersService.list());
    } catch (error) {
      next(error);
    }
  },

  async approve(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await usersService.approve(req.params.id, (req as AuthenticatedRequest).user.id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  async block(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await usersService.block(req.params.id, (req as AuthenticatedRequest).user.id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  async changeRole(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await usersService.changeRole(req.params.id, req.body.role, (req as AuthenticatedRequest).user.id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
};
