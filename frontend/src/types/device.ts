import { ServiceCycle } from "./cycle";

export type DeviceStatus =
  | "active"
  | "in_repair"
  | "in_calibration"
  | "ready_for_handover"
  | "handed_over"
  | "needs_calibration"
  | "written_off";

export type Device = {
  id: string;
  serialNumber: string;
  name: string;
  category: string | null;
  photoUrl: string | null;
  description: string | null;
  currentStatus: DeviceStatus;
  isWrittenOff: boolean;
  createdAt: string;
  updatedAt: string;
  serviceCycles: ServiceCycle[];
  needsCalibrationWarning: boolean;
};

export type CreateDeviceInput = {
  serialNumber: string;
  name: string;
  category?: string | null;
  photoUrl?: string | null;
  description?: string | null;
};

export type UpdateDeviceInput = Partial<CreateDeviceInput> & {
  currentStatus?: DeviceStatus;
  isWrittenOff?: boolean;
};
