import { AuditLog } from "./audit";
import { ServiceCycle } from "./cycle";
import { DeviceStatus } from "./device";
import { User } from "./user";

export type DashboardSummary = {
  totalDevices: number;
  inRepair: number;
  inCalibration: number;
  readyForHandover: number;
  handedOver: number;
  needsCalibrationWarning: number;
};

export type DashboardDeviceUpdate = {
  id: string;
  serialNumber: string;
  name: string;
  currentStatus: DeviceStatus;
  needsCalibrationWarning: boolean;
  updatedAt: string;
};

export type DashboardActiveCycle = ServiceCycle & {
  device?: {
    id: string;
    serialNumber: string;
    name: string;
  };
  createdBy?: Pick<User, "id" | "fullName" | "email">;
};

export type DashboardResponse = {
  summary: DashboardSummary;
  recentDeviceUpdates: DashboardDeviceUpdate[];
  activeCycles: DashboardActiveCycle[];
  recentAuditActions: AuditLog[];
};
