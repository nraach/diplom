import { UserRole } from "@prisma/client";
import { AppError } from "../../utils/errors";
import { createAuditLog, toAuditValue } from "../../utils/audit";
import { findUserById, listUsers, updateUserRole, updateUserStatus } from "./users.repository";

export const usersService = {
  list() {
    return listUsers();
  },

  async approve(id: string, actorUserId: string) {
    const user = await findUserById(id);

    if (!user) {
      throw new AppError(404, "Пользователь не найден");
    }

    const updatedUser = await updateUserStatus(id, "active");

    await createAuditLog({
      userId: actorUserId,
      entityType: "user",
      entityId: id,
      action: "approve_user",
      oldValue: toAuditValue({ status: user.status }),
      newValue: toAuditValue({ status: updatedUser.status })
    });

    return updatedUser;
  },

  async block(id: string, actorUserId: string) {
    const user = await findUserById(id);

    if (!user) {
      throw new AppError(404, "Пользователь не найден");
    }

    const updatedUser = await updateUserStatus(id, "blocked");

    await createAuditLog({
      userId: actorUserId,
      entityType: "user",
      entityId: id,
      action: "block_user",
      oldValue: toAuditValue({ status: user.status }),
      newValue: toAuditValue({ status: updatedUser.status })
    });

    return updatedUser;
  },

  async changeRole(id: string, role: UserRole, actorUserId: string) {
    const user = await findUserById(id);

    if (!user) {
      throw new AppError(404, "Пользователь не найден");
    }

    const updatedUser = await updateUserRole(id, role);

    await createAuditLog({
      userId: actorUserId,
      entityType: "user",
      entityId: id,
      action: "change_user_role",
      oldValue: toAuditValue({ role: user.role }),
      newValue: toAuditValue({ role: updatedUser.role })
    });

    return updatedUser;
  }
};
