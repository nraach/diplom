import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { devicesApi } from "../api/devices.api";
import { DeviceForm } from "../components/DeviceForm";
import { StatusBadge } from "../components/StatusBadge";
import { useAuth } from "../hooks/useAuth";
import { usePollingQuery } from "../hooks/usePollingQuery";
import { Device, DeviceCustomAttribute, DeviceStatus } from "../types/device";
import { cycleTypeLabels, deviceStatusLabels } from "../utils/status-labels";

type ViewMode = "table" | "cards";
type BuiltInDeviceFilterKey = "status" | "type" | "ready" | "handover" | "warning";
type DeviceFilterOption = {
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

export function DevicesPage() {
  const { user } = useAuth();
  const canCreate = user?.role === "admin" || user?.role === "technical_specialist";
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const devicesQuery = usePollingQuery({ queryKey: ["devices"], queryFn: devicesApi.list });
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [activeFilterKey, setActiveFilterKey] = useState(searchParams.get("filterKey") ?? "");
  const [activeFilterValue, setActiveFilterValue] = useState(searchParams.get("attributeValue") ?? "");
  const [editingDevice, setEditingDevice] = useState<Device | null>(null);
  const [successMessage, setSuccessMessage] = useState("");

  const createMutation = useMutation({
    mutationFn: devicesApi.create,
    onSuccess() {
      setSuccessMessage("Прибор добавлен.");
      setIsCreateOpen(false);
      void queryClient.invalidateQueries({ queryKey: ["devices"] });
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: Parameters<typeof devicesApi.update>[1] }) => devicesApi.update(id, input),
    onSuccess() {
      setSuccessMessage("Прибор сохранен.");
      setEditingDevice(null);
      void queryClient.invalidateQueries({ queryKey: ["devices"] });
    }
  });

  const uploadPhotoMutation = useMutation({
    mutationFn: devicesApi.uploadPhoto
  });

  const devices = devicesQuery.data ?? [];
  const filterOptions = useMemo(() => buildDeviceFilterOptions(devices), [devices]);
  const selectedFilterConfig = useMemo(
    () => filterOptions.find((option) => option.key === activeFilterKey) ?? null,
    [activeFilterKey, filterOptions]
  );
  const filteredDevices = useMemo(() => {
    return devices.filter((device) => {
      const normalizedQuery = query.trim().toLowerCase();
      const matchesQuery =
        !normalizedQuery ||
        device.serialNumber.toLowerCase().includes(normalizedQuery) ||
        device.name.toLowerCase().includes(normalizedQuery);

      if (!selectedFilterConfig || !activeFilterValue) {
        return matchesQuery;
      }

      const matchesSelectedFilter = selectedFilterConfig.isCustomAttribute
        ? device.customAttributes.some(
            (attribute) =>
              normalizeText(attribute.label) === normalizeText(selectedFilterConfig.attributeLabel ?? "") &&
              attribute.value === activeFilterValue
          )
        : matchBuiltInDeviceFilter(device, selectedFilterConfig.key as BuiltInDeviceFilterKey, activeFilterValue);

      return matchesQuery && matchesSelectedFilter;
    });
  }, [activeFilterValue, devices, query, selectedFilterConfig]);

  useEffect(() => {
    const nextFilter = getActiveDeviceFilter(searchParams, filterOptions);
    setQuery(searchParams.get("q") ?? "");
    setActiveFilterKey(nextFilter.key);
    setActiveFilterValue(nextFilter.value);
  }, [filterOptions, searchParams]);

  function updateFilters(next: {
    q?: string;
    filterKey?: string;
    filterValue?: string;
  }) {
    const params = new URLSearchParams(searchParams);
    const nextQuery = next.q ?? query;
    const nextSelectedKey = next.filterKey ?? activeFilterKey;
    const nextSelectedValue = next.filterValue ?? activeFilterValue;
    const nextSelectedFilter = filterOptions.find((option) => option.key === nextSelectedKey) ?? null;

    if (nextQuery) {
      params.set("q", nextQuery);
    } else {
      params.delete("q");
    }

    (Object.keys(builtInDeviceFilterConfigs) as BuiltInDeviceFilterKey[]).forEach((key) => {
      params.delete(key);
    });
    params.delete("filterKey");
    params.delete("attribute");
    params.delete("attributeValue");

    if (nextSelectedFilter) {
      params.set("filterKey", nextSelectedFilter.key);

      if (nextSelectedFilter.isCustomAttribute) {
        params.set("attribute", nextSelectedFilter.attributeLabel ?? "");
      }

      if (nextSelectedValue) {
        if (nextSelectedFilter.isCustomAttribute) {
          params.set("attribute", nextSelectedFilter.attributeLabel ?? "");
          params.set("attributeValue", nextSelectedValue);
        } else {
          params.set(nextSelectedFilter.key, nextSelectedValue);
        }
      }
    }

    setSearchParams(params);
  }

  return (
    <div className="page-stack">
      <header className="page-header">
        <div>
          <p className="eyebrow">Реестр</p>
          <h2>Приборы</h2>
        </div>
        <div className="page-header-actions">
          {canCreate ? (
            <button type="button" onClick={() => setIsCreateOpen((value) => !value)}>
              {isCreateOpen ? "Скрыть форму" : "Новый прибор"}
            </button>
          ) : null}
        </div>
      </header>

      {successMessage ? <p className="success-text">{successMessage}</p> : null}

      <section className="panel">
        <div className="panel-heading">
          <h3>Фильтры и режим просмотра</h3>
          <div className="segmented-control">
            <button type="button" className={viewMode === "table" ? "active" : ""} onClick={() => setViewMode("table")}>
              Таблица
            </button>
            <button type="button" className={viewMode === "cards" ? "active" : ""} onClick={() => setViewMode("cards")}>
              Карточки
            </button>
          </div>
        </div>

        <div className="filters filters-extended">
          <input
            placeholder="Поиск по серийному номеру или названию"
            value={query}
            onChange={(event) => {
              const value = event.target.value;
              setQuery(value);
              updateFilters({ q: value });
            }}
          />

          <select
            value={activeFilterKey}
            onChange={(event) => {
              const value = event.target.value;
              setActiveFilterKey(value);
              setActiveFilterValue("");
              updateFilters({ filterKey: value, filterValue: "" });
            }}
          >
            <option value="">Выберите фильтр</option>
            {filterOptions.map((option) => (
              <option key={option.key} value={option.key}>
                {option.label}
              </option>
            ))}
          </select>

          <select
            value={activeFilterValue}
            disabled={!selectedFilterConfig}
            onChange={(event) => {
              const value = event.target.value;
              setActiveFilterValue(value);
              updateFilters({ filterKey: activeFilterKey, filterValue: value });
            }}
          >
            <option value="">{selectedFilterConfig ? selectedFilterConfig.emptyLabel : "Сначала выберите фильтр"}</option>
            {selectedFilterConfig?.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </section>

      {isCreateOpen && canCreate ? (
        <section className="panel">
          <div className="panel-heading">
            <h3>Новый прибор</h3>
            <button type="button" className="ghost-button" onClick={() => setIsCreateOpen(false)}>
              Закрыть
            </button>
          </div>

          <DeviceForm
            submitLabel="Добавить прибор"
            canEditCustomAttributes={user?.role === "admin"}
            onSubmit={(input) => createMutation.mutateAsync(input)}
            onUploadPhoto={async (file) => {
              const result = await uploadPhotoMutation.mutateAsync(file);
              return result.photoUrl;
            }}
          />

          {uploadPhotoMutation.error ? <p className="error-text">{uploadPhotoMutation.error.message}</p> : null}
          {createMutation.error ? <p className="error-text">{createMutation.error.message}</p> : null}
        </section>
      ) : null}

      {editingDevice && user?.role === "admin" ? (
        <section className="panel">
          <div className="panel-heading">
            <h3>Редактировать прибор</h3>
            <button type="button" className="ghost-button" onClick={() => setEditingDevice(null)}>
              Закрыть
            </button>
          </div>

          <DeviceForm
            device={editingDevice}
            submitLabel="Сохранить прибор"
            canEditStatus
            canEditCustomAttributes
            onSubmit={(input) => {
              if (input.isWrittenOff && !editingDevice.isWrittenOff && !window.confirm("Списать этот прибор?")) {
                return Promise.resolve();
              }

              return updateMutation.mutateAsync({ id: editingDevice.id, input });
            }}
            onUploadPhoto={async (file) => {
              const result = await uploadPhotoMutation.mutateAsync(file);
              return result.photoUrl;
            }}
          />

          {uploadPhotoMutation.error ? <p className="error-text">{uploadPhotoMutation.error.message}</p> : null}
          {updateMutation.error ? <p className="error-text">{updateMutation.error.message}</p> : null}
        </section>
      ) : null}

      {devicesQuery.isLoading ? <section className="panel muted-panel">Загрузка приборов...</section> : null}

      {!devicesQuery.isLoading && filteredDevices.length === 0 ? (
        <section className="panel muted-panel">
          <strong>Нет данных по выбранным фильтрам.</strong>
        </section>
      ) : null}

      {!devicesQuery.isLoading && filteredDevices.length > 0 && viewMode === "table" ? (
        <DevicesTable devices={filteredDevices} canEdit={user?.role === "admin"} onEdit={setEditingDevice} />
      ) : null}

      {!devicesQuery.isLoading && filteredDevices.length > 0 && viewMode === "cards" ? (
        <DevicesCards devices={filteredDevices} canEdit={user?.role === "admin"} onEdit={setEditingDevice} />
      ) : null}
    </div>
  );
}

function DevicesTable({
  devices,
  canEdit,
  onEdit
}: {
  devices: Device[];
  canEdit: boolean;
  onEdit: (device: Device) => void;
}) {
  return (
    <section className="panel">
      <div className="panel-heading">
        <h3>Список приборов</h3>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Серийный номер</th>
              <th>Название</th>
              <th>Статус</th>
              <th>Калибровка</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {devices.map((device) => (
              <tr key={device.id}>
                <td className="strong-cell">{device.serialNumber}</td>
                <td>{device.name}</td>
                <td>
                  <StatusBadge label={deviceStatusLabels[device.currentStatus as DeviceStatus]} value={device.currentStatus} />
                </td>
                <td>{device.needsCalibrationWarning ? <StatusBadge label="Требуется" value="needs_calibration" /> : "В норме"}</td>
                <td className="actions-cell">
                  <Link to={`/devices/${device.id}`}>Открыть</Link>
                  {canEdit ? (
                    <button type="button" className="link-button" onClick={() => onEdit(device)}>
                      Редактировать
                    </button>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function DevicesCards({
  devices,
  canEdit,
  onEdit
}: {
  devices: Device[];
  canEdit: boolean;
  onEdit: (device: Device) => void;
}) {
  return (
    <section className="device-card-grid">
      {devices.map((device) => (
        <article className="device-card" key={device.id}>
          <div className="device-card-top">
            <div>
              <p className="eyebrow">{device.serialNumber}</p>
              <h3>{device.name}</h3>
            </div>
            <StatusBadge label={deviceStatusLabels[device.currentStatus]} value={device.currentStatus} />
          </div>

          <p className="device-card-meta">{device.category ?? "Без категории"}</p>
          <p className="muted-text">{device.description ?? "Описание не задано"}</p>

          <div className="status-row">
            {device.needsCalibrationWarning ? <StatusBadge label="Требуется калибровка" value="needs_calibration" /> : null}
            <span>{device.serviceCycles.length} цикл(ов)</span>
          </div>

          <div className="card-actions">
            <Link to={`/devices/${device.id}`}>Открыть</Link>
            {canEdit ? (
              <button type="button" className="link-button" onClick={() => onEdit(device)}>
                Редактировать
              </button>
            ) : null}
          </div>
        </article>
      ))}
    </section>
  );
}

function buildDeviceFilterOptions(devices: Device[]): DeviceFilterOption[] {
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

function matchBuiltInDeviceFilter(device: Device, filterKey: BuiltInDeviceFilterKey, filterValue: string) {
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

function getActiveDeviceFilter(searchParams: URLSearchParams, filterOptions: DeviceFilterOption[]) {
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

function normalizeText(value: string) {
  return value.trim().toLocaleLowerCase("ru");
}
