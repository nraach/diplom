import { CreateCycleInput, HandoverInput, ServiceCycle, UpdateCycleInput } from "../types/cycle";
import { apiRequest } from "./client";

export const cyclesApi = {
  list() {
    return apiRequest<ServiceCycle[]>("/cycles");
  },

  create(input: CreateCycleInput) {
    return apiRequest<ServiceCycle>("/cycles", {
      method: "POST",
      body: JSON.stringify(input)
    });
  },

  update(id: string, input: UpdateCycleInput) {
    return apiRequest<ServiceCycle>(`/cycles/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input)
    });
  },

  handover(id: string, input: HandoverInput) {
    return apiRequest<ServiceCycle>(`/cycles/${id}/handover`, {
      method: "PATCH",
      body: JSON.stringify(input)
    });
  },

  remove(id: string) {
    return apiRequest<void>(`/cycles/${id}`, {
      method: "DELETE"
    });
  }
};
