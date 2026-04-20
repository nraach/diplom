import { z } from "zod";

export const updateUserRoleSchema = z.object({
  role: z.enum(["admin", "technical_specialist", "guest"])
});

export type UpdateUserRoleInput = z.infer<typeof updateUserRoleSchema>;
