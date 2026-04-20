import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { resolveApiUrl } from "../api/client";
import { cyclesApi } from "../api/cycles.api";
import { devicesApi } from "../api/devices.api";
import { CycleForm } from "../components/CycleForm";
import { DeviceForm } from "../components/DeviceForm";
import { HandoverForm } from "../components/HandoverForm";
import { StatusBadge } from "../components/StatusBadge";
import { useAuth } from "../hooks/useAuth";
import { usePollingQuery } from "../hooks/usePollingQuery";
import { ServiceCycle } from "../types/cycle";
import { cycleStatusLabels, cycleTypeLabels, deviceStatusLabels } from "../utils/status-labels";
import { getCalibrationWarningText } from "../utils/calibration";

export function DeviceDetailsPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const canCreateRecords = user?.role === "admin" || user?.role === "technical_specialist";
  const canManageRecords = user?.role === "admin";
  const queryClient = useQueryClient();
  const [editingCycle, setEditingCycle] = useState<ServiceCycle | null>(null);
  const [isEditingDevice, setIsEditingDevice] = useState(false);
  const [isCreateCycleOpen, setIsCreateCycleOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const deviceQuery = usePollingQuery({
    queryKey: ["device", id],
    queryFn: () => devicesApi.get(id ?? ""),
    enabled: Boolean(id)
  });

  const uploadPhotoMutation = useMutation({
    mutationFn: devicesApi.uploadPhoto
  });

  const updateDeviceMutation = useMutation({
    mutationFn: ({ deviceId, input }: { deviceId: string; input: Parameters<typeof devicesApi.update>[1] }) =>
      devicesApi.update(deviceId, input),
    onSuccess() {
      setSuccessMessage("Прибор сохранен.");
      setIsEditingDevice(false);
      void queryClient.invalidateQueries({ queryKey: ["device", id] });
      void queryClient.invalidateQueries({ queryKey: ["devices"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    }
  });

  const createCycleMutation = useMutation({
    mutationFn: cyclesApi.create,
    onSuccess() {
      setSuccessMessage("Сервисный цикл создан.");
      setIsCreateCycleOpen(false);
      void queryClient.invalidateQueries({ queryKey: ["device", id] });
      void queryClient.invalidateQueries({ queryKey: ["devices"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    }
  });

  const updateCycleMutation = useMutation({
    mutationFn: ({ cycleId, input }: { cycleId: string; input: Parameters<typeof cyclesApi.update>[1] }) =>
      cyclesApi.update(cycleId, input),
    onSuccess() {
      setSuccessMessage("Сервисный цикл сохранен.");
      setEditingCycle(null);
      void queryClient.invalidateQueries({ queryKey: ["device", id] });
      void queryClient.invalidateQueries({ queryKey: ["devices"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    }
  });

  const handoverMutation = useMutation({
    mutationFn: ({ cycleId, comment }: { cycleId: string; comment: string | null }) =>
      cyclesApi.handover(cycleId, { comment }),
    onSuccess() {
      setSuccessMessage("Передача подтверждена.");
      void queryClient.invalidateQueries({ queryKey: ["device", id] });
      void queryClient.invalidateQueries({ queryKey: ["devices"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    }
  });

  const device = deviceQuery.data;
  const activeCycle = useMemo(
    () => device?.serviceCycles.find((cycle) => cycle.status !== "handed_over" && cycle.status !== "cancelled") ?? null,
    [device?.serviceCycles]
  );
  const isWrittenOff = Boolean(device?.isWrittenOff || device?.currentStatus === "written_off");

  if (deviceQuery.isLoading) {
    return <div className="panel muted-panel">Загрузка прибора...</div>;
  }

  if (!device) {
    return (
      <section className="panel">
        <h2>Прибор не найден</h2>
        <Link to="/devices">Назад к приборам</Link>
      </section>
    );
  }

  return (
    <div className="page-stack">
      <header className="page-header">
        <div>
          <p className="eyebrow">{device.serialNumber}</p>
          <h2>{device.name}</h2>
          {device.category ? <p>{device.category}</p> : null}
        </div>
        <div className="page-header-actions">
          <div className="status-row">
            <StatusBadge label={deviceStatusLabels[device.currentStatus]} value={device.currentStatus} />
            {device.needsCalibrationWarning ? (
              <StatusBadge label={getCalibrationWarningText(device)} value="needs_calibration" />
            ) : null}
          </div>
          <Link to="/devices">Назад к приборам</Link>
        </div>
      </header>

      {successMessage ? <p className="success-text">{successMessage}</p> : null}

      <section className="device-details-grid">
        <div className="device-photo">
          {device.photoUrl ? <img src={resolveApiUrl(device.photoUrl)} alt={device.name} /> : <span>Нет фото</span>}
        </div>
        <div className="panel">
          <div className="panel-heading">
            <h3>Информация о приборе</h3>
            {canManageRecords ? (
              <button type="button" className="ghost-button" onClick={() => setIsEditingDevice((value) => !value)}>
                {isEditingDevice ? "Скрыть форму" : "Редактировать"}
              </button>
            ) : null}
          </div>
          <dl className="details-list">
            <div>
              <dt>Статус</dt>
              <dd>
                <StatusBadge label={deviceStatusLabels[device.currentStatus]} value={device.currentStatus} />
              </dd>
            </div>
            <div>
              <dt>Калибровка</dt>
              <dd>
                {device.needsCalibrationWarning ? (
                  <StatusBadge label={getCalibrationWarningText(device)} value="needs_calibration" />
                ) : (
                  getCalibrationWarningText(device)
                )}
              </dd>
            </div>
            <div>
              <dt>Категория</dt>
              <dd>{device.category ?? "Не задано"}</dd>
            </div>
            <div>
              <dt>Описание</dt>
              <dd>{device.description ?? "Не задано"}</dd>
            </div>
          </dl>
        </div>
      </section>

      {isEditingDevice && canManageRecords ? (
        <section className="panel">
          <div className="panel-heading">
            <h3>Редактировать прибор</h3>
            <button type="button" className="ghost-button" onClick={() => setIsEditingDevice(false)}>
              Закрыть
            </button>
          </div>
          <DeviceForm
            device={device}
            submitLabel="Сохранить прибор"
            canEditStatus
            onSubmit={(input) => {
              if (input.isWrittenOff && !device.isWrittenOff && !window.confirm("Списать этот прибор?")) {
                return Promise.resolve();
              }

              return updateDeviceMutation.mutateAsync({ deviceId: device.id, input });
            }}
            onUploadPhoto={async (file) => {
              const result = await uploadPhotoMutation.mutateAsync(file);
              return result.photoUrl;
            }}
          />
          {uploadPhotoMutation.error ? <p className="error-text">{uploadPhotoMutation.error.message}</p> : null}
          {updateDeviceMutation.error ? <p className="error-text">{updateDeviceMutation.error.message}</p> : null}
        </section>
      ) : null}

      <section className="panel">
        <div className="panel-heading">
          <h3>Сервисные действия</h3>
          {!activeCycle && !isWrittenOff && canCreateRecords ? (
            <button type="button" onClick={() => setIsCreateCycleOpen((value) => !value)}>
              {isCreateCycleOpen ? "Скрыть форму" : "Новый сервисный цикл"}
            </button>
          ) : null}
        </div>

        {isWrittenOff ? <p className="muted-text">Для списанного прибора нельзя создать новый цикл.</p> : null}
        {!isWrittenOff && activeCycle ? <p className="muted-text">У этого прибора уже есть активный сервисный цикл.</p> : null}

        {!isWrittenOff && !activeCycle && isCreateCycleOpen && canCreateRecords ? (
          <CycleForm deviceId={device.id} submitLabel="Создать цикл" onSubmit={(input) => createCycleMutation.mutateAsync(input)} />
        ) : null}
        {createCycleMutation.error ? <p className="error-text">{createCycleMutation.error.message}</p> : null}

        {activeCycle && canManageRecords ? (
          <div className="section-divider">
            <div className="panel-heading">
              <h3>Передача</h3>
            </div>
            <HandoverForm
              onSubmit={(comment) => {
                if (!window.confirm("Подтвердить передачу прибора?")) {
                  return Promise.resolve();
                }

                return handoverMutation.mutateAsync({ cycleId: activeCycle.id, comment });
              }}
              disabled={handoverMutation.isPending}
            />
            {handoverMutation.error ? <p className="error-text">{handoverMutation.error.message}</p> : null}
          </div>
        ) : null}
      </section>

      {editingCycle && canManageRecords ? (
        <section className="panel">
          <div className="panel-heading">
            <h3>Редактировать сервисный цикл</h3>
            <button type="button" className="ghost-button" onClick={() => setEditingCycle(null)}>
              Закрыть
            </button>
          </div>
          <CycleForm
            cycle={editingCycle}
            submitLabel="Сохранить цикл"
            onSubmit={(input) => updateCycleMutation.mutateAsync({ cycleId: editingCycle.id, input })}
          />
          {updateCycleMutation.error ? <p className="error-text">{updateCycleMutation.error.message}</p> : null}
        </section>
      ) : null}

      <section className="panel">
        <div className="panel-heading">
          <h3>История сервисных циклов</h3>
        </div>
        <div className="cycle-list">
          {device.serviceCycles.map((cycle) => (
            <article className="cycle-card" key={cycle.id}>
              <div className="panel-heading">
                <div>
                  <p className="eyebrow">{cycleTypeLabels[cycle.type]}</p>
                  <h4>
                    <StatusBadge label={cycleStatusLabels[cycle.status]} value={cycle.status} />
                  </h4>
                </div>
                {canManageRecords ? (
                  <button type="button" className="ghost-button" onClick={() => setEditingCycle(cycle)}>
                    Редактировать
                  </button>
                ) : null}
              </div>
              <dl className="details-list">
                <div>
                  <dt>SOP</dt>
                  <dd>{formatCheck(cycle.sopCheck)}</dd>
                </div>
                <div>
                  <dt>Депо</dt>
                  <dd>{formatCheck(cycle.depotCheck)}</dd>
                </div>
                <div>
                  <dt>Готов к передаче</dt>
                  <dd>{cycle.readyForHandover ? "Да" : "Нет"}</dd>
                </div>
                <div>
                  <dt>Передача</dt>
                  <dd>
                    {cycle.handedOverAt
                      ? `${formatDate(cycle.handedOverAt)}, ${cycle.handedOverBy?.fullName ?? "неизвестно"}`
                      : "Не передан"}
                  </dd>
                </div>
                <div>
                  <dt>Создал</dt>
                  <dd>{cycle.createdBy?.fullName ?? "Неизвестно"}</dd>
                </div>
                <div>
                  <dt>Комментарий</dt>
                  <dd>{cycle.comment ?? "Нет комментария"}</dd>
                </div>
              </dl>
            </article>
          ))}
          {device.serviceCycles.length === 0 ? <p className="muted-text">Циклов пока нет.</p> : null}
        </div>
      </section>
    </div>
  );
}

function formatCheck(value: boolean | null) {
  if (value === null) {
    return "Не задано";
  }

  return value ? "Пройдена" : "Не пройдена";
}

function formatDate(value: string) {
  return new Date(value).toLocaleString();
}
