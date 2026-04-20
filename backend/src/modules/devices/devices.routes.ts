import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { requireRole } from "../../middleware/role.middleware";
import { validateBody } from "../../middleware/validation.middleware";
import { devicesController } from "./devices.controller";
import { uploadDevicePhoto } from "./devices.upload";
import { createDeviceSchema, updateDeviceSchema } from "./devices.validation";

export const devicesRoutes = Router();

devicesRoutes.use(authMiddleware);
devicesRoutes.get("/", devicesController.list);
devicesRoutes.post(
  "/upload-photo",
  requireRole("admin", "technical_specialist"),
  uploadDevicePhoto.single("photo"),
  devicesController.uploadPhoto
);
devicesRoutes.post("/", requireRole("admin", "technical_specialist"), validateBody(createDeviceSchema), devicesController.create);
devicesRoutes.get("/:id", devicesController.get);
devicesRoutes.patch("/:id", requireRole("admin"), validateBody(updateDeviceSchema), devicesController.update);
