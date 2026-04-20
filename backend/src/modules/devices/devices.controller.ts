import { NextFunction, Request, Response } from "express";
import { AuthenticatedRequest } from "../../middleware/auth.middleware";
import { AppError } from "../../utils/errors";
import { devicesService } from "./devices.service";

export const devicesController = {
  async list(_req: Request, res: Response, next: NextFunction) {
    try {
      res.json(await devicesService.list());
    } catch (error) {
      next(error);
    }
  },

  async get(req: Request, res: Response, next: NextFunction) {
    try {
      res.json(await devicesService.get(req.params.id));
    } catch (error) {
      next(error);
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await devicesService.create(req.body, (req as AuthenticatedRequest).user.id);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  },

  uploadPhoto(req: Request, res: Response, next: NextFunction) {
    try {
      const file = req.file;

      if (!file) {
        throw new AppError(400, "Файл не был загружен");
      }

      res.status(201).json({
        photoUrl: `/uploads/${file.filename}`
      });
    } catch (error) {
      next(error);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await devicesService.update(req.params.id, req.body, (req as AuthenticatedRequest).user.id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
};
