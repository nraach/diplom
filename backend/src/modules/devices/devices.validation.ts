import { z } from "zod";

const deviceCustomAttributeSchema = z.object({
  label: z.string().trim().min(1),
  value: z.string().trim().min(1)
});

export const createDeviceSchema = z.object({
  serialNumber: z.string().min(1),
  name: z.string().min(1),
  category: z.string().optional().nullable(),
  photoUrl: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  calibrationIntervalDays: z.number().int().min(1).max(3650).optional().nullable(),
  customAttributes: z.array(deviceCustomAttributeSchema).max(24).optional()
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
