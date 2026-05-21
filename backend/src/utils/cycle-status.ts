import { ServiceCycleStatus } from "@prisma/client";

const inactiveStatuses: ServiceCycleStatus[] = ["handed_over"];

export function isActiveCycleStatus(status: ServiceCycleStatus) {
  return !inactiveStatuses.includes(status);
}

export function getInactiveCycleStatuses() {
  return inactiveStatuses;
}
