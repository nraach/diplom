import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/utils/password";

const prisma = new PrismaClient();

async function main() {
  await prisma.auditLog.deleteMany();
  await prisma.serviceCycle.deleteMany();
  await prisma.device.deleteMany();
  await prisma.user.deleteMany();

  const adminPassword = await hashPassword("admin123");
  const userPassword = await hashPassword("user123");

  const admin = await prisma.user.create({
    data: {
      fullName: "Demo Admin",
      email: "admin@example.com",
      passwordHash: adminPassword,
      role: "admin",
      status: "active"
    }
  });

  const activeUser = await prisma.user.create({
    data: {
      fullName: "Demo Technical Specialist",
      email: "specialist@example.com",
      passwordHash: userPassword,
      role: "technical_specialist",
      status: "active"
    }
  });

  const pendingUser = await prisma.user.create({
    data: {
      fullName: "Pending User",
      email: "pending@example.com",
      passwordHash: userPassword,
      role: "technical_specialist",
      status: "pending"
    }
  });

  const guestUser = await prisma.user.create({
    data: {
      fullName: "Guest Viewer",
      email: "guest@example.com",
      passwordHash: userPassword,
      role: "guest",
      status: "active"
    }
  });

  const ultrasonicDevice = await prisma.device.create({
    data: {
      serialNumber: "NDT-001",
      name: "Ultrasonic Flaw Detector",
      category: "Ultrasonic",
      currentStatus: "handed_over"
    }
  });

  const magneticDevice = await prisma.device.create({
    data: {
      serialNumber: "NDT-002",
      name: "Magnetic Particle Tester",
      category: "Magnetic",
      currentStatus: "in_repair"
    }
  });

  const calibrationDevice = await prisma.device.create({
    data: {
      serialNumber: "NDT-003",
      name: "Thickness Gauge",
      category: "Calibration",
      currentStatus: "in_calibration"
    }
  });

  await prisma.serviceCycle.createMany({
    data: [
      {
        deviceId: ultrasonicDevice.id,
        type: "calibration",
        status: "handed_over",
        sopCheck: true,
        depotCheck: true,
        readyForHandover: true,
        handedOverAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
        handedOverByUserId: activeUser.id,
        comment: "Demo completed calibration cycle",
        createdByUserId: admin.id,
        closedAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000)
      },
      {
        deviceId: magneticDevice.id,
        type: "repair",
        status: "in_progress",
        sopCheck: null,
        depotCheck: false,
        readyForHandover: false,
        comment: "Demo active repair cycle",
        createdByUserId: activeUser.id
      },
      {
        deviceId: calibrationDevice.id,
        type: "calibration",
        status: "created",
        readyForHandover: false,
        comment: "Demo active calibration cycle",
        createdByUserId: activeUser.id
      }
    ]
  });

  await prisma.auditLog.createMany({
    data: [
      {
        userId: admin.id,
        entityType: "user",
        entityId: admin.id,
        action: "seed_admin",
        newValue: { email: admin.email, role: admin.role, status: admin.status }
      },
      {
        userId: admin.id,
        entityType: "user",
        entityId: pendingUser.id,
        action: "register",
        newValue: { email: pendingUser.email, status: pendingUser.status }
      },
      {
        userId: admin.id,
        entityType: "user",
        entityId: guestUser.id,
        action: "create_guest_user",
        newValue: { email: guestUser.email, role: guestUser.role, status: guestUser.status }
      },
      {
        userId: activeUser.id,
        entityType: "device",
        entityId: magneticDevice.id,
        action: "create_cycle",
        newValue: { type: "repair", status: "in_progress" }
      }
    ]
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
