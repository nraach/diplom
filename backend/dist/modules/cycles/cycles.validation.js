"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handoverCycleSchema = exports.updateCycleSchema = exports.createCycleSchema = void 0;
const zod_1 = require("zod");
exports.createCycleSchema = zod_1.z.object({
    deviceId: zod_1.z.string().min(1),
    type: zod_1.z.enum(["repair", "calibration"]),
    comment: zod_1.z.string().optional().nullable()
});
exports.updateCycleSchema = zod_1.z.object({
    status: zod_1.z
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
    sopCheck: zod_1.z.boolean().optional().nullable(),
    depotCheck: zod_1.z.boolean().optional().nullable(),
    readyForHandover: zod_1.z.boolean().optional(),
    comment: zod_1.z.string().optional().nullable()
});
exports.handoverCycleSchema = zod_1.z.object({
    comment: zod_1.z.string().optional().nullable()
});
