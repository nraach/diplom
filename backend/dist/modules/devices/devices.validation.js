"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateDeviceSchema = exports.createDeviceSchema = void 0;
const zod_1 = require("zod");
exports.createDeviceSchema = zod_1.z.object({
    serialNumber: zod_1.z.string().min(1),
    name: zod_1.z.string().min(1),
    category: zod_1.z.string().optional().nullable(),
    photoUrl: zod_1.z.string().optional().nullable(),
    description: zod_1.z.string().optional().nullable()
});
exports.updateDeviceSchema = exports.createDeviceSchema.partial().extend({
    currentStatus: zod_1.z
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
    isWrittenOff: zod_1.z.boolean().optional()
});
