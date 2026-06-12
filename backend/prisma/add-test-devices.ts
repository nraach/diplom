import { PrismaClient, ServiceCycleStatus, ServiceCycleType } from "@prisma/client";

const prisma = new PrismaClient();

type Fixture = {
  serialNumber: string;
  name: string;
  category: string;
  description: string;
  calibrationIntervalDays?: number | null;
  currentStatus?: "active" | "handed_over";
  customAttributes?: Array<{ label: string; value: string }>;
  cycle: {
    type: ServiceCycleType;
    status: ServiceCycleStatus;
    receivedAt: Date;
    depotName: string;
    diagnosis?: string | null;
    workPerformed?: string | null;
    sopCheck?: boolean | null;
    sopCheckedAt?: Date | null;
    depotCheck?: boolean | null;
    depotCheckedAt?: Date | null;
    readyForHandover?: boolean;
    handedOverAt?: Date | null;
    finalConclusion?: string | null;
    serviceNotes?: string | null;
    equipmentNotes?: string | null;
    comment?: string | null;
    createdAt: Date;
    createdBy: "admin" | "specialist";
    handedOverBy?: "admin" | "specialist" | null;
    closedAt?: Date | null;
  };
};

function daysAgo(days: number) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

const fixtures: Fixture[] = [
  {
    serialNumber: "NDT-101",
    name: "Ультразвуковой дефектоскоп УД-101",
    category: "Ультразвуковой контроль",
    description: "Тестовый прибор с новым циклом ремонта.",
    customAttributes: [
      { label: "Цвет", value: "Серый" },
      { label: "Форма", value: "Прямоугольный" }
    ],
    cycle: {
      type: "repair",
      status: "created",
      receivedAt: daysAgo(1),
      depotName: "Новосибирск",
      comment: "Цикл только создан, диагностика еще не начата.",
      createdAt: daysAgo(1),
      createdBy: "specialist"
    }
  },
  {
    serialNumber: "NDT-102",
    name: "Толщиномер ТЛ-102",
    category: "Толщинометрия",
    description: "Тестовый прибор в активной работе.",
    customAttributes: [{ label: "Цвет", value: "Синий" }],
    cycle: {
      type: "repair",
      status: "in_progress",
      receivedAt: daysAgo(2),
      depotName: "Омск",
      diagnosis: "Нестабильная работа платы питания.",
      workPerformed: "Проведена замена конденсаторов и очистка контактов.",
      comment: "Прибор находится на этапе ремонта.",
      createdAt: daysAgo(2),
      createdBy: "specialist"
    }
  },
  {
    serialNumber: "NDT-103",
    name: "Вихретоковый дефектоскоп ВТ-103",
    category: "Вихретоковый контроль",
    description: "Тестовый прибор с успешно пройденным SOP.",
    customAttributes: [{ label: "Форма", value: "Квадрат" }],
    cycle: {
      type: "repair",
      status: "sop_passed",
      receivedAt: daysAgo(4),
      depotName: "Томск",
      diagnosis: "Поврежден разъем питания.",
      workPerformed: "Заменен разъем и выполнено контрольное включение.",
      sopCheck: true,
      sopCheckedAt: daysAgo(2),
      comment: "SOP пройден, ожидается Depot.",
      createdAt: daysAgo(4),
      createdBy: "specialist"
    }
  },
  {
    serialNumber: "NDT-104",
    name: "Магнитопорошковый дефектоскоп МД-104",
    category: "Магнитный контроль",
    description: "Тестовый прибор с непройденным SOP.",
    cycle: {
      type: "repair",
      status: "sop_failed",
      receivedAt: daysAgo(5),
      depotName: "Кемерово",
      diagnosis: "Сбой индикации при запуске.",
      workPerformed: "Локализован дефект в цепи индикации.",
      sopCheck: false,
      comment: "Требуется повторная доработка до следующего SOP.",
      createdAt: daysAgo(5),
      createdBy: "specialist"
    }
  },
  {
    serialNumber: "NDT-105",
    name: "Рентгеновский аппарат РА-105",
    category: "Радиографический контроль",
    description: "Тестовый прибор с пройденным Depot.",
    calibrationIntervalDays: 45,
    cycle: {
      type: "repair",
      status: "depot_passed",
      receivedAt: daysAgo(7),
      depotName: "Барнаул",
      diagnosis: "Замечание по системе охлаждения.",
      workPerformed: "Заменен вентилятор и выполнен прогон под нагрузкой.",
      sopCheck: true,
      sopCheckedAt: daysAgo(5),
      depotCheck: true,
      depotCheckedAt: daysAgo(3),
      comment: "Все проверки пройдены, осталось оформить итог.",
      createdAt: daysAgo(7),
      createdBy: "admin"
    }
  },
  {
    serialNumber: "NDT-106",
    name: "Твердомер ТВ-106",
    category: "Измерение твердости",
    description: "Тестовый прибор с непройденным Depot.",
    cycle: {
      type: "repair",
      status: "depot_failed",
      receivedAt: daysAgo(8),
      depotName: "Красноярск",
      diagnosis: "Некорректная калибровка датчика.",
      workPerformed: "Настройка датчика и замена кабеля.",
      sopCheck: true,
      sopCheckedAt: daysAgo(6),
      depotCheck: false,
      comment: "Нужна дополнительная регулировка перед выдачей.",
      createdAt: daysAgo(8),
      createdBy: "specialist"
    }
  },
  {
    serialNumber: "NDT-107",
    name: "Акустико-эмиссионный комплекс АЭ-107",
    category: "Акустическая эмиссия",
    description: "Тестовый прибор, готовый к передаче.",
    calibrationIntervalDays: 60,
    cycle: {
      type: "repair",
      status: "ready_for_handover",
      receivedAt: daysAgo(10),
      depotName: "Иркутск",
      diagnosis: "Нарушение герметичности разъема.",
      workPerformed: "Разъем заменен, выполнено контрольное тестирование.",
      sopCheck: true,
      sopCheckedAt: daysAgo(7),
      depotCheck: true,
      depotCheckedAt: daysAgo(6),
      readyForHandover: true,
      finalConclusion: "Прибор полностью готов к выдаче.",
      comment: "Ожидает подтверждения передачи.",
      createdAt: daysAgo(10),
      createdBy: "admin"
    }
  },
  {
    serialNumber: "NDT-108",
    name: "Профилометр ПР-108",
    category: "Профилометрия",
    description: "Тестовый прибор с завершенным циклом.",
    currentStatus: "handed_over",
    customAttributes: [{ label: "Цвет", value: "Черный" }],
    cycle: {
      type: "repair",
      status: "handed_over",
      receivedAt: daysAgo(18),
      depotName: "Новокузнецк",
      diagnosis: "Разряд внутреннего аккумулятора.",
      workPerformed: "Аккумулятор заменен, проведена финальная проверка.",
      sopCheck: true,
      sopCheckedAt: daysAgo(15),
      depotCheck: true,
      depotCheckedAt: daysAgo(14),
      readyForHandover: true,
      handedOverAt: daysAgo(13),
      finalConclusion: "Исправен, передан заказчику.",
      comment: "Цикл успешно завершен.",
      createdAt: daysAgo(18),
      createdBy: "specialist",
      handedOverBy: "admin",
      closedAt: daysAgo(13)
    }
  },
  {
    serialNumber: "NDT-109",
    name: "Калибратор сигналов КС-109",
    category: "Калибровка",
    description: "Тестовый прибор с новым циклом калибровки.",
    cycle: {
      type: "calibration",
      status: "created",
      receivedAt: daysAgo(3),
      depotName: "Абакан",
      comment: "Калибровочный цикл только создан.",
      createdAt: daysAgo(3),
      createdBy: "admin"
    }
  },
  {
    serialNumber: "NDT-110",
    name: "Измеритель шероховатости ИШ-110",
    category: "Калибровка",
    description: "Тестовый прибор на этапе калибровки.",
    calibrationIntervalDays: 90,
    customAttributes: [{ label: "Форма", value: "Круглый" }],
    cycle: {
      type: "calibration",
      status: "in_progress",
      receivedAt: daysAgo(2),
      depotName: "Бийск",
      serviceNotes: "Проводится серия контрольных измерений.",
      equipmentNotes: "Полный комплект поставки.",
      comment: "Активная калибровка в работе.",
      createdAt: daysAgo(2),
      createdBy: "specialist"
    }
  }
];

async function main() {
  const admin = await prisma.user.findFirst({
    where: { role: "admin", status: "active" }
  });
  const specialist = await prisma.user.findFirst({
    where: { role: "technical_specialist", status: "active" }
  });

  if (!admin || !specialist) {
    throw new Error("Не удалось найти активных пользователей admin и technical_specialist для загрузки тестовых данных.");
  }

  await prisma.$transaction(async (tx) => {
    await tx.auditLog.deleteMany({
      where: {
        entityType: {
          in: ["device", "service_cycle"]
        }
      }
    });

    await tx.serviceCycle.deleteMany();
    await tx.device.deleteMany();

    for (const fixture of fixtures) {
      const device = await tx.device.create({
        data: {
          serialNumber: fixture.serialNumber,
          name: fixture.name,
          category: fixture.category,
          description: fixture.description,
          calibrationIntervalDays: fixture.calibrationIntervalDays ?? null,
          currentStatus: fixture.currentStatus ?? "active",
          customAttributes: fixture.customAttributes ?? []
        }
      });

      const cycle = await tx.serviceCycle.create({
        data: {
          deviceId: device.id,
          type: fixture.cycle.type,
          status: fixture.cycle.status,
          receivedAt: fixture.cycle.receivedAt,
          depotName: fixture.cycle.depotName,
          diagnosis: fixture.cycle.diagnosis ?? null,
          workPerformed: fixture.cycle.workPerformed ?? null,
          sopCheck: fixture.cycle.sopCheck ?? null,
          sopCheckedAt: fixture.cycle.sopCheckedAt ?? null,
          depotCheck: fixture.cycle.depotCheck ?? null,
          depotCheckedAt: fixture.cycle.depotCheckedAt ?? null,
          readyForHandover: fixture.cycle.readyForHandover ?? false,
          handedOverAt: fixture.cycle.handedOverAt ?? null,
          handedOverByUserId:
            fixture.cycle.handedOverBy === "admin"
              ? admin.id
              : fixture.cycle.handedOverBy === "specialist"
                ? specialist.id
                : null,
          finalConclusion: fixture.cycle.finalConclusion ?? null,
          serviceNotes: fixture.cycle.serviceNotes ?? null,
          equipmentNotes: fixture.cycle.equipmentNotes ?? null,
          comment: fixture.cycle.comment ?? null,
          createdAt: fixture.cycle.createdAt,
          createdByUserId: fixture.cycle.createdBy === "admin" ? admin.id : specialist.id,
          closedAt: fixture.cycle.closedAt ?? null
        }
      });

      await tx.auditLog.createMany({
        data: [
          {
            userId: fixture.cycle.createdBy === "admin" ? admin.id : specialist.id,
            entityType: "device",
            entityId: device.id,
            action: "create_device",
            newValue: {
              serialNumber: device.serialNumber,
              name: device.name,
              category: device.category
            }
          },
          {
            userId: fixture.cycle.createdBy === "admin" ? admin.id : specialist.id,
            entityType: "service_cycle",
            entityId: cycle.id,
            action: "create_cycle",
            newValue: {
              deviceId: device.id,
              type: cycle.type,
              status: cycle.status
            }
          }
        ]
      });
    }
  });

  console.log(`Полностью пересоздано ${fixtures.length} тестовых приборов с сервисными циклами.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
