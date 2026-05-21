import { PrismaClient, ServiceCycleStatus, ServiceCycleType } from "@prisma/client";

const prisma = new PrismaClient();

type Fixture = {
  serialNumber: string;
  name: string;
  category: string;
  description: string;
  calibrationIntervalDays?: number | null;
  currentStatus?: "active" | "handed_over";
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
    serialNumber: "NDT-006",
    name: "Ультразвуковой дефектоскоп УД-06",
    category: "Ультразвуковой контроль",
    description: "Тестовый прибор с циклом на этапе создания",
    cycle: {
      type: "repair",
      status: "created",
      receivedAt: daysAgo(1),
      depotName: "Новосибирск",
      comment: "Цикл только создан",
      createdAt: daysAgo(1),
      createdBy: "specialist"
    }
  },
  {
    serialNumber: "NDT-007",
    name: "Толщиномер ТЛ-07",
    category: "Толщинометрия",
    description: "Тестовый прибор в активной работе",
    cycle: {
      type: "repair",
      status: "in_progress",
      receivedAt: daysAgo(2),
      depotName: "Омск",
      diagnosis: "Нестабильное питание платы",
      workPerformed: "Замена конденсаторов и проверка цепей",
      comment: "Находится в ремонте",
      createdAt: daysAgo(2),
      createdBy: "specialist"
    }
  },
  {
    serialNumber: "NDT-008",
    name: "Вихретоковый дефектоскоп ВТ-08",
    category: "Вихретоковый контроль",
    description: "Тестовый прибор с пройденным SOP",
    cycle: {
      type: "repair",
      status: "sop_passed",
      receivedAt: daysAgo(4),
      depotName: "Томск",
      diagnosis: "Проблема в разъеме питания",
      workPerformed: "Замена разъема и контрольное включение",
      sopCheck: true,
      sopCheckedAt: daysAgo(2),
      comment: "SOP пройден, Depot еще не начат",
      createdAt: daysAgo(4),
      createdBy: "specialist"
    }
  },
  {
    serialNumber: "NDT-009",
    name: "Магнитопорошковый дефектоскоп МД-09",
    category: "Магнитный контроль",
    description: "Тестовый прибор с непройденным SOP",
    cycle: {
      type: "repair",
      status: "sop_failed",
      receivedAt: daysAgo(5),
      depotName: "Кемерово",
      diagnosis: "Сбой в блоке индикации",
      workPerformed: "Проведена локализация дефекта",
      sopCheck: false,
      comment: "SOP не пройден, требуется доработка",
      createdAt: daysAgo(5),
      createdBy: "specialist"
    }
  },
  {
    serialNumber: "NDT-010",
    name: "Рентгеновский аппарат РА-10",
    category: "Радиографический контроль",
    description: "Тестовый прибор с пройденным Depot",
    cycle: {
      type: "repair",
      status: "depot_passed",
      receivedAt: daysAgo(7),
      depotName: "Барнаул",
      diagnosis: "Замечание по охлаждению",
      workPerformed: "Очистка, замена вентилятора, прогон под нагрузкой",
      sopCheck: true,
      sopCheckedAt: daysAgo(5),
      depotCheck: true,
      depotCheckedAt: daysAgo(3),
      comment: "Все проверки пройдены, осталось оформить итог",
      createdAt: daysAgo(7),
      createdBy: "admin"
    }
  },
  {
    serialNumber: "NDT-011",
    name: "Твердомер ТВ-11",
    category: "Измерение твердости",
    description: "Тестовый прибор с непройденным Depot",
    cycle: {
      type: "repair",
      status: "depot_failed",
      receivedAt: daysAgo(8),
      depotName: "Красноярск",
      diagnosis: "Некорректная калибровка датчика",
      workPerformed: "Настройка датчика и замена кабеля",
      sopCheck: true,
      sopCheckedAt: daysAgo(6),
      depotCheck: false,
      comment: "Depot не пройден, нужна дополнительная регулировка",
      createdAt: daysAgo(8),
      createdBy: "specialist"
    }
  },
  {
    serialNumber: "NDT-012",
    name: "Акустический эмиссионный комплекс АЭ-12",
    category: "Акустическая эмиссия",
    description: "Тестовый прибор, готовый к передаче",
    calibrationIntervalDays: 45,
    cycle: {
      type: "repair",
      status: "ready_for_handover",
      receivedAt: daysAgo(10),
      depotName: "Иркутск",
      diagnosis: "Нарушение герметичности разъема",
      workPerformed: "Замена разъема, контрольное тестирование",
      sopCheck: true,
      sopCheckedAt: daysAgo(7),
      depotCheck: true,
      depotCheckedAt: daysAgo(6),
      readyForHandover: true,
      finalConclusion: "Прибор полностью готов к выдаче",
      comment: "Ожидает подтверждения передачи",
      createdAt: daysAgo(10),
      createdBy: "admin"
    }
  },
  {
    serialNumber: "NDT-013",
    name: "Профилометр ПР-13",
    category: "Профилометрия",
    description: "Тестовый прибор с завершенным сервисным циклом",
    currentStatus: "handed_over",
    cycle: {
      type: "repair",
      status: "handed_over",
      receivedAt: daysAgo(18),
      depotName: "Новокузнецк",
      diagnosis: "Разряд внутреннего аккумулятора",
      workPerformed: "Замена аккумулятора и финальная проверка",
      sopCheck: true,
      sopCheckedAt: daysAgo(15),
      depotCheck: true,
      depotCheckedAt: daysAgo(14),
      readyForHandover: true,
      handedOverAt: daysAgo(13),
      finalConclusion: "Исправен, передан заказчику",
      comment: "Цикл успешно завершен",
      createdAt: daysAgo(18),
      createdBy: "specialist",
      handedOverBy: "admin",
      closedAt: daysAgo(13)
    }
  },
  {
    serialNumber: "NDT-014",
    name: "Калибратор сигналов КС-14",
    category: "Калибровка",
    description: "Тестовый прибор с циклом калибровки на этапе создания",
    cycle: {
      type: "calibration",
      status: "created",
      receivedAt: daysAgo(3),
      depotName: "Абакан",
      comment: "Цикл калибровки только создан",
      createdAt: daysAgo(3),
      createdBy: "admin"
    }
  },
  {
    serialNumber: "NDT-015",
    name: "Измеритель шероховатости ИШ-15",
    category: "Калибровка",
    description: "Тестовый прибор на этапе калибровки",
    calibrationIntervalDays: 60,
    cycle: {
      type: "calibration",
      status: "in_progress",
      receivedAt: daysAgo(2),
      depotName: "Бийск",
      serviceNotes: "Проводится серия контрольных измерений",
      equipmentNotes: "Полный комплект поставки",
      comment: "Активная калибровка",
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
    throw new Error("Не удалось найти активных пользователей admin и technical_specialist для тестовых данных.");
  }

  for (const fixture of fixtures) {
    const device = await prisma.device.upsert({
      where: { serialNumber: fixture.serialNumber },
      update: {
        name: fixture.name,
        category: fixture.category,
        description: fixture.description,
        calibrationIntervalDays: fixture.calibrationIntervalDays ?? null,
        currentStatus: fixture.currentStatus ?? "active"
      },
      create: {
        serialNumber: fixture.serialNumber,
        name: fixture.name,
        category: fixture.category,
        description: fixture.description,
        calibrationIntervalDays: fixture.calibrationIntervalDays ?? null,
        currentStatus: fixture.currentStatus ?? "active"
      }
    });

    await prisma.serviceCycle.deleteMany({
      where: { deviceId: device.id }
    });

    await prisma.serviceCycle.create({
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
  }

  console.log(`Добавлено или обновлено ${fixtures.length} тестовых приборов с сервисными циклами.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
