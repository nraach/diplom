import { z } from "zod";

const optionalTextField = z.preprocess((value) => {
  if (typeof value !== "string") {
    return value;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}, z.string().optional().nullable());

const optionalDateField = z.preprocess((value) => {
  if (typeof value !== "string") {
    return value;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}, z.string().optional().nullable());

const requiredTextField = z
  .string()
  .trim()
  .min(1, "Поле обязательно для заполнения");

export const createCycleSchema = z.object({
  deviceId: z.string().min(1),
  type: z.enum(["repair", "calibration"]),
  depotName: requiredTextField,
  receivedAt: optionalDateField,
  checkedAt: optionalDateField,
  sopCheckedAt: optionalDateField,
  diagnosis: optionalTextField,
  workPerformed: optionalTextField,
  serviceNotes: optionalTextField,
  depotCheckedAt: optionalDateField,
  equipmentNotes: optionalTextField,
  finalConclusion: optionalTextField,
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
      "handed_over"
    ])
    .optional(),
  sopCheck: z.boolean().optional().nullable(),
  depotCheck: z.boolean().optional().nullable(),
  readyForHandover: z.boolean().optional(),
  receivedAt: optionalDateField,
  checkedAt: optionalDateField,
  sopCheckedAt: optionalDateField,
  depotCheckedAt: optionalDateField,
  diagnosis: optionalTextField,
  workPerformed: optionalTextField,
  serviceNotes: optionalTextField,
  depotName: optionalTextField,
  equipmentNotes: optionalTextField,
  finalConclusion: optionalTextField,
  comment: z.string().optional().nullable()
});

export const handoverCycleSchema = z.object({
  comment: z.string().optional().nullable()
});

export type CreateCycleInput = z.infer<typeof createCycleSchema>;
export type UpdateCycleInput = z.infer<typeof updateCycleSchema>;
export type HandoverCycleInput = z.infer<typeof handoverCycleSchema>;
