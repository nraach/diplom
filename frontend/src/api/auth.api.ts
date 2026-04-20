import { AuthResponse, LoginInput, RegisterInput, RegisterResponse } from "../types/auth";
import { apiRequest } from "./client";

export const authApi = {
  register(input: RegisterInput) {
    return apiRequest<RegisterResponse>("/auth/register", {
      method: "POST",
      auth: false,
      body: JSON.stringify(input)
    });
  },

  login(input: LoginInput) {
    return apiRequest<AuthResponse>("/auth/login", {
      method: "POST",
      auth: false,
      body: JSON.stringify(input)
    });
  }
};
