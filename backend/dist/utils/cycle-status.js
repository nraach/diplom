"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isActiveCycleStatus = isActiveCycleStatus;
exports.getInactiveCycleStatuses = getInactiveCycleStatuses;
const inactiveStatuses = ["handed_over", "cancelled"];
function isActiveCycleStatus(status) {
    return !inactiveStatuses.includes(status);
}
function getInactiveCycleStatuses() {
    return inactiveStatuses;
}
