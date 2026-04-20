import { DashboardResponse } from "../types/dashboard";
import { apiRequest } from "./client";

export const dashboardApi = {
  getSummary() {
    return apiRequest<DashboardResponse>("/dashboard");
  }
};
