import { DeviceStatus } from "../types/device";
import { ServiceCycleStatus, ServiceCycleType } from "../types/cycle";
import { UserRole, UserStatus } from "../types/user";

export const deviceStatusLabels: Record<DeviceStatus, string> = {
  active: "Активен",
  in_repair: "В ремонте",
  in_calibration: "На калибровке",
  sop: "SOP",
  depot: "Depot",
  ready_for_handover: "Готов к передаче",
  handed_over: "Передан",
  needs_calibration: "Требуется калибровка",
  written_off: "Списан"
};

export const cycleStatusLabels: Record<ServiceCycleStatus, string> = {
  created: "Создан",
  in_progress: "В работе",
  sop_passed: "SOP пройден",
  sop_failed: "SOP не пройден",
  depot_passed: "Depot пройден",
  depot_failed: "Depot не пройден",
  ready_for_handover: "Готов к передаче",
  handed_over: "Передан"
};

export const cycleTypeLabels: Record<ServiceCycleType, string> = {
  repair: "Ремонт",
  calibration: "Калибровка"
};

export const userRoleLabels: Record<UserRole, string> = {
  admin: "Администратор",
  technical_specialist: "Технический специалист",
  guest: "Гость"
};

export const userStatusLabels: Record<UserStatus, string> = {
  pending: "Ожидает одобрения",
  active: "Активен",
  blocked: "Заблокирован"
};

export const auditActionLabels: Record<string, string> = {
  register: "Регистрация",
  login: "Вход",
  approve_user: "Одобрение пользователя",
  block_user: "Блокировка пользователя",
  change_user_role: "Смена роли пользователя",
  create_guest_user: "Создание гостевого пользователя",
  create_device: "Создание прибора",
  update_device: "Обновление прибора",
  write_off_device: "Списание прибора",
  create_cycle: "Создание сервисного цикла",
  update_cycle: "Обновление сервисного цикла",
  handover: "Передача",
  seed_admin: "Техническое создание администратора"
};

export const entityTypeLabels: Record<string, string> = {
  user: "Пользователь",
  device: "Прибор",
  service_cycle: "Сервисный цикл"
};
