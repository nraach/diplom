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
  receivedAt: string;
  checkedAt: string | null;
  sopCheck: boolean | null;
  sopCheckedAt: string | null;
  depotCheck: boolean | null;
  depotCheckedAt: string | null;
  readyForHandover: boolean;
  handedOverAt: string | null;
  handedOverByUserId: string | null;
  handedOverBy?: Pick<User, "id" | "fullName" | "email"> | null;
  diagnosis: string | null;
  workPerformed: string | null;
  serviceNotes: string | null;
  depotName: string | null;
  equipmentNotes: string | null;
  finalConclusion: string | null;
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
  receivedAt?: string | null;
  checkedAt?: string | null;
  sopCheckedAt?: string | null;
  depotCheckedAt?: string | null;
  diagnosis?: string | null;
  workPerformed?: string | null;
  serviceNotes?: string | null;
  depotName?: string | null;
  equipmentNotes?: string | null;
  finalConclusion?: string | null;
  comment?: string | null;
};

export type UpdateCycleInput = {
  status?: ServiceCycleStatus;
  receivedAt?: string | null;
  checkedAt?: string | null;
  sopCheck?: boolean | null;
  sopCheckedAt?: string | null;
  depotCheck?: boolean | null;
  depotCheckedAt?: string | null;
  readyForHandover?: boolean;
  diagnosis?: string | null;
  workPerformed?: string | null;
  serviceNotes?: string | null;
  depotName?: string | null;
  equipmentNotes?: string | null;
  finalConclusion?: string | null;
  comment?: string | null;
};

export type HandoverInput = {
  comment?: string | null;
};
