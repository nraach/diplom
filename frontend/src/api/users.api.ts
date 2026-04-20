import { User, UserRole } from "../types/user";
import { apiRequest } from "./client";

export const usersApi = {
  list() {
    return apiRequest<User[]>("/users");
  },

  approve(id: string) {
    return apiRequest<User>(`/users/${id}/approve`, { method: "PATCH" });
  },

  block(id: string) {
    return apiRequest<User>(`/users/${id}/block`, { method: "PATCH" });
  },

  changeRole(id: string, role: UserRole) {
    return apiRequest<User>(`/users/${id}/role`, {
      method: "PATCH",
      body: JSON.stringify({ role })
    });
  }
};
