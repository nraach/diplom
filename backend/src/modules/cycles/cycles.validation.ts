import { z } from "zod";

export const createCycleSchema = z.object({
  deviceId: z.string().min(1),
  type: z.enum(["repair", "calibration"]),
  comment: z.string().optional().nullable()
});

export const updateCycleSchema = z.object({
  status: z
    .enum([
      "created",
      "in_progress",
      "sop_passed",
      "sop_failed",
      "depot_passed",
      "depot_failed",
      "ready_for_handover",
      "handed_over",
      "cancelled"
    ])
    .optional(),
  sopCheck: z.boolean().optional().nullable(),
  depotCheck: z.boolean().optional().nullable(),
  readyForHandover: z.boolean().optional(),
  comment: z.string().optional().nullable()
});

export const handoverCycleSchema = z.object({
  comment: z.string().optional().nullable()
});

export type CreateCycleInput = z.infer<typeof createCycleSchema>;
export type UpdateCycleInput = z.infer<typeof updateCycleSchema>;
export type HandoverCycleInput = z.infer<typeof handoverCycleSchema>;
