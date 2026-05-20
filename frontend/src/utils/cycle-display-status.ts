import { ServiceCycle, ServiceCycleStatus } from "../types/cycle";

export function getCycleDisplayStatus(cycle: Pick<ServiceCycle, "status" | "readyForHandover" | "sopCheck" | "depotCheck">): ServiceCycleStatus {
  if (cycle.status === "cancelled" || cycle.status === "handed_over" || cycle.status === "ready_for_handover") {
    return cycle.status;
  }

  if (cycle.readyForHandover) {
    return "ready_for_handover";
  }

  if (cycle.depotCheck === true) {
    return "depot_passed";
  }

  if (cycle.depotCheck === false) {
    return "depot_failed";
  }

  if (cycle.sopCheck === true) {
    return "sop_passed";
  }

  if (cycle.sopCheck === false) {
    return "sop_failed";
  }

  if (cycle.status === "created") {
    return "created";
  }

  return "in_progress";
}
