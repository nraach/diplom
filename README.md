# NDT Device Tracking System

НИЛ ФМК СГУПС

## PURPOSE

This is a full-stack web application for tracking non-destructive testing devices.

The system replaces Excel-based tracking and provides:

* device lifecycle tracking
* repair and calibration history
* SOP and depot checks
* handover tracking
* user roles and permissions

IMPORTANT:
This system tracks **device state**, NOT physical location.

---

## CORE CONCEPT

* Device = permanent entity
* Repair / Calibration = separate service cycles
* Each service action = NEW cycle
* Device history = sequence of cycles

---

## TECH STACK

Frontend:

* React
* TypeScript
* Vite

Backend:

* Node.js
* TypeScript

Database:

* PostgreSQL

ORM:

* Prisma

---

## STRICT RULES FOR IMPLEMENTATION

* DO NOT copy Excel UI
* DO NOT invent new entities unless necessary
* FOLLOW docs/ as source of truth
* IF something is unclear → write TODO, DO NOT GUESS
* KEEP architecture simple (no overengineering)

---

## REQUIRED FEATURES (MVP)

1. Authentication (register + login + approval)
2. Roles (admin / technical specialist / guest)
3. Devices CRUD
4. Service cycles (repair / calibration)
5. SOP / depot checks
6. Handover tracking
7. Device history
8. Dashboard
9. Audit log
10. Calibration reminder (10 days rule)

---

## PROJECT STRUCTURE (EXPECTED)

frontend/
backend/
docs/

---

## DEVELOPMENT STRATEGY

Implement in phases:

1. Project setup
2. Database schema
3. Auth + users
4. Devices
5. Service cycles
6. Dashboard
7. Audit log
8. Notifications

---

## OUTPUT REQUIREMENTS

You must:

* generate clean folder structure
* generate working backend API
* generate frontend UI
* generate Prisma schema
* generate seed data
* update documentation if needed

---

## RUNNING THE PROJECT

### One command start

From the project root:

```bash
npm run dev
```

This command:

* tries to start Docker container `ndt-postgres` if Docker is available
* opens one terminal window for backend
* opens one terminal window for frontend

Use this after initial setup is already done.

### Prerequisites

* Node.js 20+
* npm
* PostgreSQL

### PostgreSQL

Use an existing local PostgreSQL server or start one with Docker:

```bash
docker run --name ndt-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=ndt_device_tracking -p 5432:5432 -d postgres:16
```

### Backend

```bash
cd backend
cp .env.example .env
npm install
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
npm run dev
```

For a non-migration local sync, use:

```bash
npm run prisma:push
npm run prisma:seed
```

Backend defaults:

* API: http://localhost:4000
* PostgreSQL URL: set `DATABASE_URL` in `backend/.env`
* JWT secret: set `JWT_SECRET` in `backend/.env`
* Frontend CORS origin: set `CORS_ORIGIN` in `backend/.env`
* Uploaded device photos are stored in `backend/uploads`

Seed users:

* admin@example.com / admin123
* specialist@example.com / user123
* pending@example.com / user123
* guest@example.com / user123

### Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Frontend defaults:

* App: http://localhost:5173
* API URL: set `VITE_API_URL` in `frontend/.env`

### Checks

Backend:

```bash
cd backend
npm run build
npx prisma validate
```

Frontend:

```bash
cd frontend
npm run typecheck
npm run build
```

### MVP Smoke Checklist

Run backend and frontend, then verify:

* register a new user and confirm the account is pending
* login as `specialist@example.com` succeeds
* login as `pending@example.com` fails before approval
* login as admin and approve, block, and change roles in Users
* create a device, then open device details
* admin edits and writes off a device
* create one repair or calibration cycle for a device
* creating a second active cycle for the same device is blocked
* update SOP and depot checks on a cycle
* handover an active cycle and confirm device history is updated
* dashboard summary, recent devices, active cycles, and admin audit actions refresh by polling
* a device with no calibration records shows warning only after device age > 10 days
* a written off device cannot start a new cycle
* handover is blocked for `handed_over` and `cancelled` cycles

TODO:

* Device.currentStatus behavior after cancelling a service cycle is not defined yet and is not changed automatically in MVP
