# API (MINIMAL REQUIRED)

## AUTH

POST /auth/register
POST /auth/login

---

## USERS

GET /users
PATCH /users/:id/approve
PATCH /users/:id/block
PATCH /users/:id/role

---

## DEVICES

GET /devices
POST /devices
POST /devices/upload-photo
GET /devices/:id
PATCH /devices/:id

---

## CYCLES

GET /cycles
POST /cycles
PATCH /cycles/:id
PATCH /cycles/:id/handover

---

## AUDIT

GET /audit

---

## DASHBOARD

GET /dashboard

Returns:

* summary
* recentDeviceUpdates
* activeCycles
* recentAuditActions

Rules:

* auth required
* recentAuditActions is returned only for admin users
