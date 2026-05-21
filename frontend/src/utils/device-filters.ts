import { Device } from "../types/device";
import { cycleTypeLabels, deviceStatusLabels } from "./status-labels";

export type BuiltInDeviceFilterKey = "status" | "type" | "ready" | "handover" | "warning";

export type DeviceFilterOption = {
  key: string;
  label: string;
  emptyLabel: string;
  options: Array<{ value: string; label: string }>;
  isCustomAttribute?: boolean;
  attributeLabel?: string;
};

const builtInDeviceFilterConfigs: Record<
  BuiltInDeviceFilterKey,
  {
    label: string;
    emptyLabel: string;
    options: Array<{ value: string; label: string }>;
  }
> = {
  status: {
    label: "Статусы",
    emptyLabel: "Все статусы",
    options: Object.entries(deviceStatusLabels).map(([value, label]) => ({ value, label }))
  },
  type: {
    label: "Типы циклов",
    emptyLabel: "Все типы циклов",
    options: Object.entries(cycleTypeLabels).map(([value, label]) => ({ value, label }))
  },
  ready: {
    label: "Готовность",
    emptyLabel: "Готовность: все",
    options: [
      { value: "true", label: "Готов к передаче" },
      { value: "false", label: "Не готов" }
    ]
  },
  handover: {
    label: "Передача",
    emptyLabel: "Передача: все",
    options: [
      { value: "true", label: "Передан" },
      { value: "false", label: "Не передан" }
    ]
  },
  warning: {
    label: "Калибровка",
    emptyLabel: "Калибровка: все",
    options: [
      { value: "true", label: "Требуется" },
      { value: "false", label: "В норме" }
    ]
  }
};

export function buildDeviceFilterOptions(devices: Device[]): DeviceFilterOption[] {
  const builtInOptions: DeviceFilterOption[] = (Object.entries(builtInDeviceFilterConfigs) as Array<
    [BuiltInDeviceFilterKey, (typeof builtInDeviceFilterConfigs)[BuiltInDeviceFilterKey]]
  >).map(([key, config]) => ({
    key,
    label: config.label,
    emptyLabel: config.emptyLabel,
    options: config.options
  }));

  const attributeValueMap = new Map<string, Set<string>>();

  devices.forEach((device) => {
    device.customAttributes.forEach((attribute) => {
      const normalizedLabel = normalizeText(attribute.label);

      if (!normalizedLabel) {
        return;
      }

      const currentValues = attributeValueMap.get(normalizedLabel) ?? new Set<string>();
      currentValues.add(attribute.value);
      attributeValueMap.set(normalizedLabel, currentValues);
    });
  });

  const customAttributeOptions: DeviceFilterOption[] = Array.from(attributeValueMap.entries())
    .map(([normalizedLabel, values]) => {
      const originalLabel = findOriginalAttributeLabel(devices, normalizedLabel);

      return {
        key: `attribute:${normalizedLabel}`,
        label: originalLabel,
        emptyLabel: `${originalLabel}: все`,
        options: Array.from(values)
          .sort((left, right) => left.localeCompare(right, "ru"))
          .map((value) => ({ value, label: value })),
        isCustomAttribute: true,
        attributeLabel: originalLabel
      };
    })
    .sort((left, right) => left.label.localeCompare(right.label, "ru"));

  return [...builtInOptions, ...customAttributeOptions];
}

export function matchBuiltInDeviceFilter(device: Device, filterKey: BuiltInDeviceFilterKey, filterValue: string) {
  switch (filterKey) {
    case "status":
      return device.currentStatus === filterValue;
    case "type":
      return device.serviceCycles.some((cycle) => cycle.type === filterValue);
    case "ready":
      return device.serviceCycles.some((cycle) => String(cycle.readyForHandover) === filterValue);
    case "handover":
      return device.serviceCycles.some((cycle) => String(cycle.status === "handed_over") === filterValue);
    case "warning":
      return String(device.needsCalibrationWarning) === filterValue;
    default:
      return true;
  }
}

export function getActiveDeviceFilter(searchParams: URLSearchParams, filterOptions: DeviceFilterOption[]) {
  const explicitFilterKey = searchParams.get("filterKey") ?? "";

  if (explicitFilterKey) {
    const matchingOption = filterOptions.find((option) => option.key === explicitFilterKey);

    if (matchingOption) {
      if (matchingOption.isCustomAttribute) {
        return {
          key: matchingOption.key,
          value: searchParams.get("attributeValue") ?? ""
        };
      }

      return {
        key: matchingOption.key,
        value: searchParams.get(matchingOption.key) ?? ""
      };
    }
  }

  for (const key of Object.keys(builtInDeviceFilterConfigs) as BuiltInDeviceFilterKey[]) {
    const value = searchParams.get(key) ?? "";

    if (value) {
      return { key, value };
    }
  }

  const attributeLabel = searchParams.get("attribute") ?? "";
  const attributeValue = searchParams.get("attributeValue") ?? "";

  if (attributeLabel && attributeValue) {
    const matchingOption = filterOptions.find(
      (option) => option.isCustomAttribute && normalizeText(option.attributeLabel ?? "") === normalizeText(attributeLabel)
    );

    if (matchingOption) {
      return { key: matchingOption.key, value: attributeValue };
    }
  }

  return { key: "", value: "" };
}

export function clearDeviceFilterParams(params: URLSearchParams) {
  (Object.keys(builtInDeviceFilterConfigs) as BuiltInDeviceFilterKey[]).forEach((key) => {
    params.delete(key);
  });
  params.delete("filterKey");
  params.delete("attribute");
  params.delete("attributeValue");
}

export function normalizeText(value: string) {
  return value.trim().toLocaleLowerCase("ru");
}

function findOriginalAttributeLabel(devices: Device[], normalizedLabel: string) {
  for (const device of devices) {
    for (const attribute of device.customAttributes) {
      if (normalizeText(attribute.label) === normalizedLabel) {
        return attribute.label;
      }
    }
  }

  return normalizedLabel;
}
