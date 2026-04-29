import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { resolveApiUrl } from "../api/client";
import { cyclesApi } from "../api/cycles.api";
import { devicesApi } from "../api/devices.api";
import { CycleForm } from "../components/CycleForm";
import { CycleNextAction } from "../components/CycleNextAction";
import { CycleTracker } from "../components/CycleTracker";
import { DeviceForm } from "../components/DeviceForm";
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
  const editCycleSectionRef = useRef<HTMLElement | null>(null);
  const [editingCycle, setEditingCycle] = useState<ServiceCycle | null>(null);
  const [shouldFocusDiagnosis, setShouldFocusDiagnosis] = useState(false);
  const [reopenEditorAfterAdvanceCycleId, setReopenEditorAfterAdvanceCycleId] = useState<string | null>(null);
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
      void invalidateDeviceQueries(queryClient, id);
    }
  });

  const createCycleMutation = useMutation({
    mutationFn: cyclesApi.create,
    onSuccess() {
      setSuccessMessage("Сервисный цикл создан.");
      setIsCreateCycleOpen(false);
      setShouldFocusDiagnosis(false);
      void invalidateDeviceQueries(queryClient, id);
    }
  });

  const updateCycleMutation = useMutation({
    mutationFn: ({ cycleId, input }: { cycleId: string; input: Parameters<typeof cyclesApi.update>[1] }) =>
      cyclesApi.update(cycleId, input),
    onSuccess(updatedCycle, variables) {
      setSuccessMessage("Сервисный цикл сохранен.");

      const shouldKeepEditorOpen =
        (editingCycle?.id === variables.cycleId &&
          editingCycle.status === "created" &&
          variables.input.status === "in_progress") ||
        (reopenEditorAfterAdvanceCycleId === variables.cycleId && variables.input.status === "in_progress");

      setShouldFocusDiagnosis(shouldKeepEditorOpen);
      setReopenEditorAfterAdvanceCycleId(null);
      setEditingCycle(shouldKeepEditorOpen ? updatedCycle : null);
      void invalidateDeviceQueries(queryClient, id);
    }
  });

  const handoverMutation = useMutation({
    mutationFn: ({ cycleId, comment }: { cycleId: string; comment: string | null }) =>
      cyclesApi.handover(cycleId, { comment }),
    onSuccess() {
      setSuccessMessage("Передача подтверждена.");
      setShouldFocusDiagnosis(false);
      setReopenEditorAfterAdvanceCycleId(null);
      void invalidateDeviceQueries(queryClient, id);
    }
  });

  const deleteCycleMutation = useMutation({
    mutationFn: cyclesApi.remove,
    onSuccess() {
      setSuccessMessage("Сервисный цикл удален.");
      setEditingCycle(null);
      setShouldFocusDiagnosis(false);
      setReopenEditorAfterAdvanceCycleId(null);
      setIsCreateCycleOpen(false);
      void invalidateDeviceQueries(queryClient, id);
    }
  });

  const device = deviceQuery.data;
  const activeCycle = useMemo(
    () => device?.serviceCycles.find((cycle) => cycle.status !== "handed_over" && cycle.status !== "cancelled") ?? null,
    [device?.serviceCycles]
  );
  const archivedCycles = useMemo(
    () => device?.serviceCycles.filter((cycle) => cycle.id !== activeCycle?.id) ?? [],
    [activeCycle?.id, device?.serviceCycles]
  );
  const isWrittenOff = Boolean(device?.isWrittenOff || device?.currentStatus === "written_off");
  const isCycleEditingMode = Boolean(editingCycle && canManageRecords);

  useEffect(() => {
    if (!editingCycle || !editCycleSectionRef.current) {
      return;
    }

    editCycleSectionRef.current.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }, [editingCycle]);

  useEffect(() => {
    if (!editingCycle || !shouldFocusDiagnosis || !editCycleSectionRef.current) {
      return;
    }

    const diagnosisField = editCycleSectionRef.current.querySelector<HTMLTextAreaElement>(
      'textarea[placeholder="Что сломано, что обнаружили при осмотре, какие симптомы наблюдаются"]'
    );

    if (!diagnosisField) {
      return;
    }

    diagnosisField.scrollIntoView({
      behavior: "smooth",
      block: "center"
    });
    diagnosisField.focus();
    setShouldFocusDiagnosis(false);
  }, [editingCycle, shouldFocusDiagnosis]);

  function openCycleEditor(targetCycle: ServiceCycle) {
    if (editingCycle?.id === targetCycle.id) {
      setShouldFocusDiagnosis(false);
      editCycleSectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
      return;
    }

    setShouldFocusDiagnosis(false);
    setEditingCycle(targetCycle);
  }

  function handleDeleteCycle(targetCycle: ServiceCycle) {
    const isActiveTarget = targetCycle.id === activeCycle?.id;
    const confirmationMessage = isActiveTarget
      ? "Удалить активный сервисный цикл? Это снимет его с прибора и пересчитает текущий статус."
      : "Удалить этот сервисный цикл из истории?";

    if (!window.confirm(confirmationMessage)) {
      return;
    }

    setReopenEditorAfterAdvanceCycleId(null);
    void deleteCycleMutation.mutateAsync(targetCycle.id);
  }

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
      {!isCycleEditingMode ? (
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
      ) : null}

      {successMessage ? <p className="success-text">{successMessage}</p> : null}

      {isCycleEditingMode ? (
        <section className="panel" ref={editCycleSectionRef}>
          <div className="panel-heading">
            <h3>Редактировать сервисный цикл</h3>
            <button type="button" className="ghost-button" onClick={() => setEditingCycle(null)}>
              Закрыть
            </button>
          </div>

          <CycleForm
            cycle={editingCycle!}
            submitLabel="Сохранить цикл"
            onSubmit={(input) => updateCycleMutation.mutateAsync({ cycleId: editingCycle!.id, input })}
          />

          {updateCycleMutation.error ? <p className="error-text">{updateCycleMutation.error.message}</p> : null}
        </section>
      ) : (
        <>
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
                  <dd>{formatOptionalText(device.category)}</dd>
                </div>
                <div>
                  <dt>Описание</dt>
                  <dd>{formatOptionalText(device.description)}</dd>
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

            {activeCycle ? (
              <div className="active-cycle-stack">
                <div className="active-cycle-card">
                  <div className="active-cycle-header">
                    <div>
                      <p className="eyebrow">Активный цикл · {cycleTypeLabels[activeCycle.type]}</p>
                      <p className="status-row">
                        <StatusBadge label={cycleStatusLabels[activeCycle.status]} value={activeCycle.status} />
                      </p>
                    </div>

                    {canManageRecords ? (
                      <div className="inline-actions">
                        <button type="button" className="ghost-button" onClick={() => openCycleEditor(activeCycle)}>
                          Редактировать
                        </button>
                        <button
                          type="button"
                          className="ghost-button danger-ghost"
                          onClick={() => handleDeleteCycle(activeCycle)}
                          disabled={deleteCycleMutation.isPending}
                        >
                          Удалить
                        </button>
                      </div>
                    ) : null}
                  </div>

                  <CycleTracker cycle={activeCycle} />

                  <dl className="details-list active-cycle-details">
                    <div>
                      <dt>Дата приема</dt>
                      <dd>{formatReceivedAt(activeCycle.receivedAt, activeCycle.createdAt)}</dd>
                    </div>
                    <div>
                      <dt>Создал</dt>
                      <dd>{activeCycle.createdBy?.fullName ?? "Неизвестно"}</dd>
                    </div>
                    <div>
                      <dt>SOP</dt>
                      <dd>{formatCheck(activeCycle.sopCheck)}</dd>
                    </div>
                    <div>
                      <dt>Дата SOP</dt>
                      <dd>{formatOptionalDateOnly(activeCycle.sopCheckedAt ?? activeCycle.checkedAt)}</dd>
                    </div>
                    <div>
                      <dt>Depot</dt>
                      <dd>{formatCheck(activeCycle.depotCheck)}</dd>
                    </div>
                    <div>
                      <dt>Дата Depot</dt>
                      <dd>{formatOptionalDateOnly(activeCycle.depotCheckedAt ?? activeCycle.checkedAt)}</dd>
                    </div>
                    <div>
                      <dt>Готов к передаче</dt>
                      <dd>{activeCycle.readyForHandover ? "Да" : "Нет"}</dd>
                    </div>
                    <div>
                      <dt>Диагноз</dt>
                      <dd>{formatOptionalText(activeCycle.diagnosis)}</dd>
                    </div>
                    <div>
                      <dt>Что сделано</dt>
                      <dd>{formatOptionalText(activeCycle.workPerformed)}</dd>
                    </div>
                    <div>
                      <dt>Комплектация</dt>
                      <dd>{formatOptionalText(activeCycle.equipmentNotes)}</dd>
                    </div>
                    <div>
                      <dt>Итог</dt>
                      <dd>{formatOptionalText(activeCycle.finalConclusion)}</dd>
                    </div>
                    <div>
                      <dt>Служебные заметки</dt>
                      <dd>{formatOptionalText(activeCycle.serviceNotes)}</dd>
                    </div>
                    <div>
                      <dt>Комментарий</dt>
                      <dd>{formatOptionalText(activeCycle.comment)}</dd>
                    </div>
                  </dl>
                </div>

                {canManageRecords ? (
                  <CycleNextAction
                    cycle={activeCycle}
                    disabled={updateCycleMutation.isPending || handoverMutation.isPending}
                    onAdvanceStatus={async (input) => {
                      if (!window.confirm("Перевести цикл к следующему шагу?")) {
                        return Promise.resolve();
                      }

                      const shouldReopenEditor = activeCycle.status === "created" && input.status === "in_progress";
                      setReopenEditorAfterAdvanceCycleId(shouldReopenEditor ? activeCycle.id : null);
                      return updateCycleMutation.mutateAsync({ cycleId: activeCycle.id, input });
                    }}
                    onOpenEditor={() => openCycleEditor(activeCycle)}
                    onHandover={async (comment) => {
                      if (!window.confirm("Подтвердить передачу прибора?")) {
                        return Promise.resolve();
                      }

                      return handoverMutation.mutateAsync({ cycleId: activeCycle.id, comment });
                    }}
                  />
                ) : null}
              </div>
            ) : null}

            {!isWrittenOff && !activeCycle && isCreateCycleOpen && canCreateRecords ? (
              <CycleForm deviceId={device.id} submitLabel="Создать цикл" onSubmit={(input) => createCycleMutation.mutateAsync(input)} />
            ) : null}

            {createCycleMutation.error ? <p className="error-text">{createCycleMutation.error.message}</p> : null}
            {deleteCycleMutation.error ? <p className="error-text">{deleteCycleMutation.error.message}</p> : null}
          </section>

          <section className="panel">
            <div className="panel-heading">
              <h3>История сервисных циклов</h3>
            </div>

            <div className="cycle-list">
              {archivedCycles.map((cycle) => (
                <article className="cycle-card" key={cycle.id}>
                  <div className="panel-heading">
                    <div>
                      <p className="eyebrow">{cycleTypeLabels[cycle.type]}</p>
                      <h4>
                        <StatusBadge label={cycleStatusLabels[cycle.status]} value={cycle.status} />
                      </h4>
                    </div>

                    {canManageRecords ? (
                      <div className="inline-actions">
                        <button type="button" className="ghost-button" onClick={() => openCycleEditor(cycle)}>
                          Редактировать
                        </button>
                        <button
                          type="button"
                          className="ghost-button danger-ghost"
                          onClick={() => handleDeleteCycle(cycle)}
                          disabled={deleteCycleMutation.isPending}
                        >
                          Удалить
                        </button>
                      </div>
                    ) : null}
                  </div>

                  <CycleTracker cycle={cycle} compact />

                  <dl className="details-list">
                    <div>
                      <dt>Дата приема</dt>
                      <dd>{formatReceivedAt(cycle.receivedAt, cycle.createdAt)}</dd>
                    </div>
                    <div>
                      <dt>SOP</dt>
                      <dd>{formatCheck(cycle.sopCheck)}</dd>
                    </div>
                    <div>
                      <dt>Дата SOP</dt>
                      <dd>{formatOptionalDateOnly(cycle.sopCheckedAt ?? cycle.checkedAt)}</dd>
                    </div>
                    <div>
                      <dt>Depot</dt>
                      <dd>{formatCheck(cycle.depotCheck)}</dd>
                    </div>
                    <div>
                      <dt>Дата Depot</dt>
                      <dd>{formatOptionalDateOnly(cycle.depotCheckedAt ?? cycle.checkedAt)}</dd>
                    </div>
                    <div>
                      <dt>Диагноз</dt>
                      <dd>{formatOptionalText(cycle.diagnosis)}</dd>
                    </div>
                    <div>
                      <dt>Что сделано</dt>
                      <dd>{formatOptionalText(cycle.workPerformed)}</dd>
                    </div>
                    <div>
                      <dt>Итог</dt>
                      <dd>{formatOptionalText(cycle.finalConclusion)}</dd>
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
                      <dt>Служебные заметки</dt>
                      <dd>{formatOptionalText(cycle.serviceNotes)}</dd>
                    </div>
                    <div>
                      <dt>Комментарий</dt>
                      <dd>{formatOptionalText(cycle.comment)}</dd>
                    </div>
                  </dl>
                </article>
              ))}

              {archivedCycles.length === 0 ? <p className="muted-text">Завершенных или отмененных циклов пока нет.</p> : null}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

async function invalidateDeviceQueries(queryClient: ReturnType<typeof useQueryClient>, id: string | undefined) {
  await queryClient.invalidateQueries({ queryKey: ["device", id] });
  await queryClient.invalidateQueries({ queryKey: ["devices"] });
  await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
}

function formatCheck(value: boolean | null) {
  if (value === null) {
    return "Не задано";
  }

  return value ? "Пройдена" : "Не пройдена";
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString("ru-RU");
}

function formatDateOnly(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("ru-RU");
}

function formatReceivedAt(receivedAt: string, createdAt: string) {
  const receivedDate = new Date(receivedAt);

  if (Number.isNaN(receivedDate.getTime())) {
    return receivedAt;
  }

  if (
    receivedDate.getUTCHours() === 0 &&
    receivedDate.getUTCMinutes() === 0 &&
    receivedDate.getUTCSeconds() === 0 &&
    receivedDate.getUTCMilliseconds() === 0
  ) {
    const createdDate = new Date(createdAt);

    if (!Number.isNaN(createdDate.getTime())) {
      const mergedDate = new Date(receivedDate);
      mergedDate.setUTCHours(
        createdDate.getUTCHours(),
        createdDate.getUTCMinutes(),
        createdDate.getUTCSeconds(),
        createdDate.getUTCMilliseconds()
      );

      return mergedDate.toLocaleString("ru-RU");
    }
  }

  return receivedDate.toLocaleString("ru-RU");
}

function formatOptionalDateOnly(value: string | null) {
  return value ? formatDateOnly(value) : "Не задано";
}

function formatOptionalText(value: string | null) {
  return value?.trim() ? value : "Не задано";
}
