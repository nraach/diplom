# DATA MODEL (SOURCE OF TRUTH)

## Device

Represents a physical device.

Fields:

* id
* serialNumber (UNIQUE, REQUIRED)
* name
* category
* photoUrl
* description
* currentStatus
* isWrittenOff (boolean)
* createdAt
* updatedAt

Rules:

* Device always exists
* Device cannot be deleted
* Admin can mark as written off

---

## ServiceCycle

Represents ONE operation (repair OR calibration)

IMPORTANT:

* repair ≠ calibration
* always separate cycles

Fields:

* id
* deviceId
* type: repair | calibration
* status
* sopCheck: boolean | null
* depotCheck: boolean | null
* readyForHandover: boolean
* handedOverAt
* handedOverByUserId
* comment
* createdByUserId
* createdAt
* updatedAt
* closedAt

---

## User

Fields:

* id
* fullName
* email
* passwordHash
* role: admin | technical_specialist | guest
* status: pending | active
* createdAt

Rules:

* new users = pending
* default role for new users = technical_specialist
* admin must approve

---

## AuditLog

Tracks all changes

Fields:

* id
* userId
* entityType
* entityId
* action
* oldValue
* newValue
* createdAt
