import { CreateDeviceInput, Device, UpdateDeviceInput } from "../types/device";
import { apiRequest } from "./client";

export const devicesApi = {
  list() {
    return apiRequest<Device[]>("/devices");
  },

  get(id: string) {
    return apiRequest<Device>(`/devices/${id}`);
  },

  create(input: CreateDeviceInput) {
    return apiRequest<Device>("/devices", {
      method: "POST",
      body: JSON.stringify(input)
    });
  },

  update(id: string, input: UpdateDeviceInput) {
    return apiRequest<Device>(`/devices/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input)
    });
  },

  uploadPhoto(file: File) {
    const formData = new FormData();
    formData.append("photo", file);

    return apiRequest<{ photoUrl: string }>("/devices/upload-photo", {
      method: "POST",
      body: formData
    });
  }
};
