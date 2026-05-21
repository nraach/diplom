import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { requireRole } from "../../middleware/role.middleware";
import { validateBody } from "../../middleware/validation.middleware";
import { cyclesController } from "./cycles.controller";
import { createCycleSchema, handoverCycleSchema, updateCycleSchema } from "./cycles.validation";

export const cyclesRoutes = Router();

cyclesRoutes.use(authMiddleware);
cyclesRoutes.get("/", cyclesController.list);
cyclesRoutes.post("/", requireRole("admin", "technical_specialist"), validateBody(createCycleSchema), cyclesController.create);
cyclesRoutes.patch("/:id", requireRole("admin", "technical_specialist"), validateBody(updateCycleSchema), cyclesController.update);
cyclesRoutes.patch("/:id/handover", requireRole("admin", "technical_specialist"), validateBody(handoverCycleSchema), cyclesController.handover);
cyclesRoutes.delete("/:id", requireRole("admin"), cyclesController.remove);
