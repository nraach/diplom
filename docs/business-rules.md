# BUSINESS RULES

## DEVICE

* Device is permanent
* Cannot be deleted
* Can be written off (admin only)

---

## SERVICE CYCLE

* Each repair = new cycle
* Each calibration = new cycle
* Repair + calibration = TWO cycles

---

## SOP & DEPOT

* Two independent checks
* Apply to any cycle
* Values: true / false
* Set manually by admin

---

## HANDOVER

* Device can be handed over
* Must store:

  * user
  * date
* Ends cycle

---

## CALIBRATION RULE

* Track last calibration
* If last calibration > 10 days -> show "needs calibration" warning
* If device has no calibration records and device age > 10 days -> show "needs calibration" warning
* Calibration warning must not block other explicit device states

---

## CANCELLED CYCLE

* TODO: Device.currentStatus behavior after cancelling a service cycle is not defined yet
* Current MVP must not change Device.currentStatus automatically on cancel

---

## HISTORY

Each device must show:

* all cycles
* who created cycle
* SOP result
* depot result
* handover info
* comments

---

## IMPORTANT

* NO hidden logic
* ALL state changes must be explicit

---

## ACCESS

* Admin can create and modify all records
* Technical specialist can only add new records
* Guest can only view records
