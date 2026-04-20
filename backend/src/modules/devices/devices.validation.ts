import { z } from "zod";

export const createDeviceSchema = z.object({
  serialNumber: z.string().min(1),
  name: z.string().min(1),
  category: z.string().optional().nullable(),
  photoUrl: z.string().optional().nullable(),
  description: z.string().optional().nullable()
});

export const updateDeviceSchema = createDeviceSchema.partial().extend({
  currentStatus: z
    .enum([
      "active",
      "in_repair",
      "in_calibration",
      "ready_for_handover",
      "handed_over",
      "needs_calibration",
      "written_off"
    ])
    .optional(),
  isWrittenOff: z.boolean().optional()
});

export type CreateDeviceInput = z.infer<typeof createDeviceSchema>;
export type UpdateDeviceInput = z.infer<typeof updateDeviceSchema>;
