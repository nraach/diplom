import { User } from "./user";

export type ServiceCycleType = "repair" | "calibration";

export type ServiceCycleStatus =
  | "created"
  | "in_progress"
  | "sop_passed"
  | "sop_failed"
  | "depot_passed"
  | "depot_failed"
  | "ready_for_handover"
  | "handed_over"
  | "cancelled";

export type ServiceCycle = {
  id: string;
  deviceId: string;
  type: ServiceCycleType;
  status: ServiceCycleStatus;
  sopCheck: boolean | null;
  depotCheck: boolean | null;
  readyForHandover: boolean;
  handedOverAt: string | null;
  handedOverByUserId: string | null;
  handedOverBy?: Pick<User, "id" | "fullName" | "email"> | null;
  comment: string | null;
  createdByUserId: string;
  createdBy?: Pick<User, "id" | "fullName" | "email">;
  createdAt: string;
  updatedAt: string;
  closedAt: string | null;
};

export type CreateCycleInput = {
  deviceId: string;
  type: ServiceCycleType;
  comment?: string | null;
};

export type UpdateCycleInput = {
  status?: ServiceCycleStatus;
  sopCheck?: boolean | null;
  depotCheck?: boolean | null;
  readyForHandover?: boolean;
  comment?: string | null;
};

export type HandoverInput = {
  comment?: string | null;
};
