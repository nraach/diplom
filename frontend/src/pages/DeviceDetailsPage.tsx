import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { resolveApiUrl } from "../api/client";
import { cyclesApi } from "../api/cycles.api";
import { devicesApi } from "../api/devices.api";
import { CycleEditorTarget, CycleForm } from "../components/CycleForm";
import { CycleNextAction } from "../components/CycleNextAction";
import { CycleTracker } from "../components/CycleTracker";
import { DeviceForm } from "../components/DeviceForm";
import { StatusBadge } from "../components/StatusBadge";
import { useAuth } from "../hooks/useAuth";
import { usePollingQuery } from "../hooks/usePollingQuery";
import { ServiceCycle } from "../types/cycle";
import { getCycleDisplayStatus } from "../utils/cycle-display-status";
import { cycleStatusLabels, cycleTypeLabels, deviceStatusLabels } from "../utils/status-labels";
import { getCalibrationWarningText } from "../utils/calibration";

export function DeviceDetailsPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const canCreateRecords = user?.role === "admin" || user?.role === "technical_specialist";
  const canManageRecords = user?.role === "admin";
  const queryClient = useQueryClient();
  const editCycleSectionRef = useRef<HTMLElement | null>(null);
  const editDeviceScrollAnchorRef = useRef<HTMLDivElement | null>(null);
  const editDeviceSectionRef = useRef<HTMLElement | null>(null);
  const deviceEditorScrollAnimationRef = useRef<number | null>(null);
  const [editingCycle, setEditingCycle] = useState<ServiceCycle | null>(null);
  const [editorTarget, setEditorTarget] = useState<CycleEditorTarget | null>(null);
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
      smoothScrollToTop(540, deviceEditorScrollAnimationRef);
      setIsEditingDevice(false);
      void invalidateDeviceQueries(queryClient, id);
    }
  });

  const createCycleMutation = useMutation({
    mutationFn: cyclesApi.create,
    onSuccess() {
      setSuccessMessage("Сервисный цикл создан.");
      setIsCreateCycleOpen(false);
      setEditorTarget(null);
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

      setEditorTarget(shouldKeepEditorOpen ? "diagnosis" : null);
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
      setEditorTarget(null);
      setReopenEditorAfterAdvanceCycleId(null);
      void invalidateDeviceQueries(queryClient, id);
    }
  });

  const deleteCycleMutation = useMutation({
    mutationFn: cyclesApi.remove,
    onSuccess() {
      setSuccessMessage("Сервисный цикл удален.");
      setEditingCycle(null);
      setEditorTarget(null);
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

    scrollEditorToTarget(editCycleSectionRef.current, editorTarget);
  }, [editingCycle, editorTarget]);

  function openCycleEditor(targetCycle: ServiceCycle, target: CycleEditorTarget = "top") {
    if (editingCycle?.id === targetCycle.id) {
      setEditorTarget(target);

      if (editCycleSectionRef.current) {
        scrollEditorToTarget(editCycleSectionRef.current, target);
      }

      return;
    }

    setEditorTarget(target);
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

  function openDeviceEditor() {
    smoothScrollToElement(editDeviceScrollAnchorRef.current, 16, 540, deviceEditorScrollAnimationRef);
    if (isEditingDevice) {
      return;
    }

    setIsEditingDevice(true);
  }

  function closeDeviceEditor() {
    cancelAnimatedScroll(deviceEditorScrollAnimationRef);
    setIsEditingDevice(false);
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
      <header className="page-header device-page-header">
        <div className="page-header-copy">
          <p className="eyebrow">{device.serialNumber}</p>
          <h2>{device.name}</h2>
        </div>
        <div className="page-header-actions">
          <Link to="/devices" className="page-header-back-link">
            Назад к приборам
          </Link>
        </div>
      </header>

      {successMessage ? <p className="success-text">{successMessage}</p> : null}

      {isCycleEditingMode ? (
        <>
          <section className="device-details-grid">
            <div className="device-photo">
              {device.photoUrl ? <img src={resolveApiUrl(device.photoUrl)} alt={device.name} /> : <span>Нет фото</span>}
            </div>

            <div className="panel">
              <div className="panel-heading">
                <h3>Информация о приборе</h3>
                {canManageRecords ? (
                  <button type="button" className="ghost-button" onClick={isEditingDevice ? closeDeviceEditor : openDeviceEditor}>
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

          {device.customAttributes.length > 0 || canManageRecords ? (
            <section className="panel">
              <div className="panel-heading">
                <div className="subsection-heading">
                  <h3>Дополнительные свойства</h3>
                  {canManageRecords ? <span>Заполняются администратором в режиме редактирования.</span> : null}
                </div>
              </div>

              {device.customAttributes.length > 0 ? (
                <dl className="details-list details-list-single">
                  {device.customAttributes.map((attribute, index) => (
                    <div key={`${attribute.label}-${index}`}>
                      <dt>{attribute.label}</dt>
                      <dd>{attribute.value}</dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <p className="muted-text">Дополнительные свойства пока не заданы.</p>
              )}
            </section>
          ) : null}

          <section className="panel" ref={editCycleSectionRef}>
            <div className="panel-heading">
              <h3>Редактировать сервисный цикл</h3>
              <button
                type="button"
                className="ghost-button"
                onClick={() => {
                  setEditingCycle(null);
                  setEditorTarget(null);
                }}
              >
                Закрыть
              </button>
            </div>

            <CycleForm
              cycle={editingCycle!}
              initialTarget={editorTarget}
              submitLabel="Сохранить цикл"
              onSubmit={(input) => updateCycleMutation.mutateAsync({ cycleId: editingCycle!.id, input })}
            />

            {updateCycleMutation.error ? <p className="error-text">{updateCycleMutation.error.message}</p> : null}
          </section>
        </>
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
                  <button type="button" className="ghost-button" onClick={isEditingDevice ? closeDeviceEditor : openDeviceEditor}>
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

          {device.customAttributes.length > 0 || canManageRecords ? (
            <section className="panel">
              <div className="panel-heading">
                <div className="subsection-heading">
                  <h3>Дополнительные свойства</h3>
                  {canManageRecords ? <span>Заполняются администратором в режиме редактирования.</span> : null}
                </div>
              </div>

              {device.customAttributes.length > 0 ? (
                <dl className="details-list details-list-single">
                  {device.customAttributes.map((attribute, index) => (
                    <div key={`${attribute.label}-${index}`}>
                      <dt>{attribute.label}</dt>
                      <dd>{attribute.value}</dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <p className="muted-text">Дополнительные свойства пока не заданы.</p>
              )}
            </section>
          ) : null}

          {canManageRecords ? <div ref={editDeviceScrollAnchorRef} /> : null}

          {canManageRecords ? (
            <div className={`device-editor-region ${isEditingDevice ? "device-editor-region-open" : ""}`}>
              <section className="panel" ref={editDeviceSectionRef} aria-hidden={!isEditingDevice}>
                <div className="panel-heading">
                  <h3>Редактировать прибор</h3>
                  <button type="button" className="ghost-button" onClick={closeDeviceEditor}>
                    Закрыть
                  </button>
                </div>

                <DeviceForm
                  device={device}
                  submitLabel="Сохранить прибор"
                  canEditStatus
                  canEditCustomAttributes
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
            </div>
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
                        <StatusBadge label={cycleStatusLabels[getCycleDisplayStatus(activeCycle)]} value={getCycleDisplayStatus(activeCycle)} />
                      </p>
                    </div>

                    {canManageRecords ? (
                      <div className="inline-actions">
                        <button type="button" className="ghost-button" onClick={() => openCycleEditor(activeCycle, "top")}>
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
                      <dt>Из депо</dt>
                      <dd>{formatOptionalText(activeCycle.depotName)}</dd>
                    </div>
                    <div>
                      <dt>Диагноз</dt>
                      <dd>{formatOptionalText(activeCycle.diagnosis)}</dd>
                    </div>
                    <div>
                      <dt>SOP</dt>
                      <dd>{formatCheck(activeCycle.sopCheck)}</dd>
                    </div>
                    <div>
                      <dt>Дата SOP</dt>
                      <dd>{formatOptionalDateOnly(activeCycle.sopCheckedAt)}</dd>
                    </div>
                    <div>
                      <dt>Depot</dt>
                      <dd>{formatCheck(activeCycle.depotCheck)}</dd>
                    </div>
                    <div>
                      <dt>Дата Depot</dt>
                      <dd>{formatOptionalDateOnly(activeCycle.depotCheckedAt)}</dd>
                    </div>
                    <div>
                      <dt>Готов к передаче</dt>
                      <dd>{activeCycle.readyForHandover ? "Да" : "Нет"}</dd>
                    </div>
                    <div>
                      <dt>Создал</dt>
                      <dd>{activeCycle.createdBy?.fullName ?? "Неизвестно"}</dd>
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
                    onOpenEditor={(target) => openCycleEditor(activeCycle, target ?? "top")}
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
                        <StatusBadge label={cycleStatusLabels[getCycleDisplayStatus(cycle)]} value={getCycleDisplayStatus(cycle)} />
                      </h4>
                    </div>

                    {canManageRecords ? (
                      <div className="inline-actions">
                        <button type="button" className="ghost-button" onClick={() => openCycleEditor(cycle, "top")}>
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
                      <dt>Из депо</dt>
                      <dd>{formatOptionalText(cycle.depotName)}</dd>
                    </div>
                    <div>
                      <dt>Диагноз</dt>
                      <dd>{formatOptionalText(cycle.diagnosis)}</dd>
                    </div>
                    <div>
                      <dt>SOP</dt>
                      <dd>{formatCheck(cycle.sopCheck)}</dd>
                    </div>
                    <div>
                      <dt>Дата SOP</dt>
                      <dd>{formatOptionalDateOnly(cycle.sopCheckedAt)}</dd>
                    </div>
                    <div>
                      <dt>Depot</dt>
                      <dd>{formatCheck(cycle.depotCheck)}</dd>
                    </div>
                    <div>
                      <dt>Дата Depot</dt>
                      <dd>{formatOptionalDateOnly(cycle.depotCheckedAt)}</dd>
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

function scrollEditorToTarget(container: HTMLElement, target: CycleEditorTarget | null) {
  if (!target || target === "top") {
    container.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
    return;
  }

  const anchor = container.querySelector<HTMLElement>(`[data-cycle-anchor="${target}"]`);

  if (!anchor) {
    container.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
    return;
  }

  anchor.scrollIntoView({
    behavior: "smooth",
    block: "center"
  });

  const focusable = anchor.querySelector<HTMLElement>("textarea, input, select");
  focusable?.focus();
}

function scrollToElement(element: HTMLElement | null, offset = 0) {
  if (!element) {
    return;
  }

  const top = Math.max(element.getBoundingClientRect().top + window.scrollY - offset, 0);

  window.scrollTo({
    top,
    behavior: "smooth"
  });
}

function smoothScrollToElement(
  element: HTMLElement | null,
  offset: number,
  durationMs: number,
  animationRef: { current: number | null }
) {
  if (!element) {
    return;
  }

  cancelAnimatedScroll(animationRef);

  const startY = window.scrollY;
  const targetY = Math.max(element.getBoundingClientRect().top + window.scrollY - offset, 0);
  const distance = targetY - startY;

  if (Math.abs(distance) < 4) {
    window.scrollTo({ top: targetY });
    return;
  }

  const startTime = performance.now();

  const tick = (now: number) => {
    const progress = Math.min((now - startTime) / durationMs, 1);
    const eased = easeInOutCubic(progress);

    window.scrollTo({
      top: startY + distance * eased
    });

    if (progress < 1) {
      animationRef.current = requestAnimationFrame(tick);
      return;
    }

    animationRef.current = null;
  };

  animationRef.current = requestAnimationFrame(tick);
}

function cancelAnimatedScroll(animationRef: { current: number | null }) {
  if (animationRef.current === null) {
    return;
  }

  cancelAnimationFrame(animationRef.current);
  animationRef.current = null;
}

function easeInOutCubic(progress: number) {
  return progress < 0.5 ? 4 * progress * progress * progress : 1 - Math.pow(-2 * progress + 2, 3) / 2;
}

function smoothScrollToTop(durationMs: number, animationRef: { current: number | null }) {
  cancelAnimatedScroll(animationRef);

  const startY = window.scrollY;

  if (startY < 4) {
    window.scrollTo({ top: 0 });
    return;
  }

  const startTime = performance.now();

  const tick = (now: number) => {
    const progress = Math.min((now - startTime) / durationMs, 1);
    const eased = easeInOutCubic(progress);

    window.scrollTo({
      top: startY * (1 - eased)
    });

    if (progress < 1) {
      animationRef.current = requestAnimationFrame(tick);
      return;
    }

    animationRef.current = null;
  };

  animationRef.current = requestAnimationFrame(tick);
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
