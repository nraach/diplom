import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { devicesApi } from "../api/devices.api";
import { DeviceForm } from "../components/DeviceForm";
import { StatusBadge } from "../components/StatusBadge";
import { useAuth } from "../hooks/useAuth";
import { usePollingQuery } from "../hooks/usePollingQuery";
import { Device, DeviceStatus } from "../types/device";
import { cycleTypeLabels, deviceStatusLabels } from "../utils/status-labels";

type ViewMode = "table" | "cards";

export function DevicesPage() {
  const { user } = useAuth();
  const canCreate = user?.role === "admin" || user?.role === "technical_specialist";
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const devicesQuery = usePollingQuery({ queryKey: ["devices"], queryFn: devicesApi.list });
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") ?? "");
  const [typeFilter, setTypeFilter] = useState(searchParams.get("type") ?? "");
  const [readyFilter, setReadyFilter] = useState(searchParams.get("ready") ?? "");
  const [handoverFilter, setHandoverFilter] = useState(searchParams.get("handover") ?? "");
  const [warningFilter, setWarningFilter] = useState(searchParams.get("warning") ?? "");
  const [editingDevice, setEditingDevice] = useState<Device | null>(null);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    setQuery(searchParams.get("q") ?? "");
    setStatusFilter(searchParams.get("status") ?? "");
    setTypeFilter(searchParams.get("type") ?? "");
    setReadyFilter(searchParams.get("ready") ?? "");
    setHandoverFilter(searchParams.get("handover") ?? "");
    setWarningFilter(searchParams.get("warning") ?? "");
  }, [searchParams]);

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
  const filteredDevices = useMemo(() => {
    return devices.filter((device) => {
      const normalizedQuery = query.trim().toLowerCase();
      const matchesQuery =
        !normalizedQuery ||
        device.serialNumber.toLowerCase().includes(normalizedQuery) ||
        device.name.toLowerCase().includes(normalizedQuery);
      const matchesStatus = !statusFilter || device.currentStatus === statusFilter;
      const matchesType = !typeFilter || device.serviceCycles.some((cycle) => cycle.type === typeFilter);
      const matchesReady =
        !readyFilter || device.serviceCycles.some((cycle) => String(cycle.readyForHandover) === readyFilter);
      const matchesHandover =
        !handoverFilter || device.serviceCycles.some((cycle) => String(cycle.status === "handed_over") === handoverFilter);
      const matchesWarning = !warningFilter || String(device.needsCalibrationWarning) === warningFilter;

      return matchesQuery && matchesStatus && matchesType && matchesReady && matchesHandover && matchesWarning;
    });
  }, [devices, handoverFilter, query, readyFilter, statusFilter, typeFilter, warningFilter]);

  function updateFilters(next: {
    q?: string;
    status?: string;
    type?: string;
    ready?: string;
    handover?: string;
    warning?: string;
  }) {
    const params = new URLSearchParams(searchParams);

    const entries = {
      q: next.q ?? query,
      status: next.status ?? statusFilter,
      type: next.type ?? typeFilter,
      ready: next.ready ?? readyFilter,
      handover: next.handover ?? handoverFilter,
      warning: next.warning ?? warningFilter
    };

    Object.entries(entries).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });

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
            value={statusFilter}
            onChange={(event) => {
              const value = event.target.value;
              setStatusFilter(value);
              updateFilters({ status: value });
            }}
          >
            <option value="">Все статусы</option>
            {Object.entries(deviceStatusLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <select
            value={typeFilter}
            onChange={(event) => {
              const value = event.target.value;
              setTypeFilter(value);
              updateFilters({ type: value });
            }}
          >
            <option value="">Все типы циклов</option>
            {Object.entries(cycleTypeLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <select
            value={readyFilter}
            onChange={(event) => {
              const value = event.target.value;
              setReadyFilter(value);
              updateFilters({ ready: value });
            }}
          >
            <option value="">Готовность: все</option>
            <option value="true">Готов к передаче</option>
            <option value="false">Не готов</option>
          </select>
          <select
            value={handoverFilter}
            onChange={(event) => {
              const value = event.target.value;
              setHandoverFilter(value);
              updateFilters({ handover: value });
            }}
          >
            <option value="">Передача: все</option>
            <option value="true">Передан</option>
            <option value="false">Не передан</option>
          </select>
          <select
            value={warningFilter}
            onChange={(event) => {
              const value = event.target.value;
              setWarningFilter(value);
              updateFilters({ warning: value });
            }}
          >
            <option value="">Калибровка: все</option>
            <option value="true">Требуется</option>
            <option value="false">В норме</option>
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
