import { FormEvent, useEffect, useMemo, useState } from "react";
import { CreateCycleInput, ServiceCycle, ServiceCycleStatus, ServiceCycleType, UpdateCycleInput } from "../types/cycle";
import { cycleStatusLabels, cycleTypeLabels } from "../utils/status-labels";

type CycleFormProps = {
  submitLabel: string;
} & (
  | {
      deviceId: string;
      cycle?: undefined;
      onSubmit: (input: CreateCycleInput) => Promise<unknown>;
    }
  | {
      deviceId?: undefined;
      cycle: ServiceCycle;
      onSubmit: (input: UpdateCycleInput) => Promise<unknown>;
    }
);

const cycleStatuses = Object.keys(cycleStatusLabels) as ServiceCycleStatus[];

export function CycleForm({ deviceId, cycle, submitLabel, onSubmit }: CycleFormProps) {
  const [type, setType] = useState<ServiceCycleType>("repair");
  const [status, setStatus] = useState<ServiceCycleStatus>("created");
  const [receivedAt, setReceivedAt] = useState(getTodayDateValue());
  const [sopCheckedAt, setSopCheckedAt] = useState("");
  const [depotCheckedAt, setDepotCheckedAt] = useState("");
  const [sopCheck, setSopCheck] = useState("");
  const [depotCheck, setDepotCheck] = useState("");
  const [readyForHandover, setReadyForHandover] = useState(false);
  const [diagnosis, setDiagnosis] = useState("");
  const [workPerformed, setWorkPerformed] = useState("");
  const [serviceNotes, setServiceNotes] = useState("");
  const [equipmentNotes, setEquipmentNotes] = useState("");
  const [finalConclusion, setFinalConclusion] = useState("");
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const hasExistingCycle = Boolean(cycle);
  const isCreatedStage = !hasExistingCycle || status === "created";
  const isRepairWorkStage = type === "repair" && hasExistingCycle && status === "in_progress";
  const shouldShowWorkBlocks = hasExistingCycle && status !== "created";
  const shouldShowControlBlocks =
    hasExistingCycle &&
    status !== "created" &&
    (type !== "repair" || (hasText(diagnosis) && hasText(workPerformed)));

  useEffect(() => {
    if (cycle) {
      setType(cycle.type);
      setStatus(cycle.status);
      setReceivedAt(toDateInputValue(cycle.receivedAt) || getTodayDateValue());
      setSopCheckedAt(toDateInputValue(cycle.sopCheckedAt ?? cycle.checkedAt));
      setDepotCheckedAt(toDateInputValue(cycle.depotCheckedAt ?? cycle.checkedAt));
      setSopCheck(booleanToSelectValue(cycle.sopCheck));
      setDepotCheck(booleanToSelectValue(cycle.depotCheck));
      setReadyForHandover(cycle.readyForHandover);
      setDiagnosis(cycle.diagnosis ?? "");
      setWorkPerformed(cycle.workPerformed ?? "");
      setServiceNotes(cycle.serviceNotes ?? "");
      setEquipmentNotes(cycle.equipmentNotes ?? "");
      setFinalConclusion(cycle.finalConclusion ?? "");
      setComment(cycle.comment ?? "");
      setLocalError(null);
      return;
    }

    setType("repair");
    setStatus("created");
    setReceivedAt(getTodayDateValue());
    setSopCheckedAt("");
    setDepotCheckedAt("");
    setSopCheck("");
    setDepotCheck("");
    setReadyForHandover(false);
    setDiagnosis("");
    setWorkPerformed("");
    setServiceNotes("");
    setEquipmentNotes("");
    setFinalConclusion("");
    setComment("");
    setLocalError(null);
  }, [cycle]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setLocalError(null);

    const validationMessage = getLocalValidationMessage({
      cycle,
      type,
      status,
      diagnosis,
      workPerformed,
      sopCheck,
      depotCheck,
      sopCheckedAt,
      depotCheckedAt,
      finalConclusion,
      readyForHandover
    });

    if (validationMessage) {
      setLocalError(validationMessage);
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        receivedAt: emptyToNull(receivedAt),
        sopCheckedAt: emptyToNull(sopCheckedAt),
        depotCheckedAt: emptyToNull(depotCheckedAt),
        diagnosis: emptyToNull(diagnosis),
        workPerformed: emptyToNull(workPerformed),
        serviceNotes: emptyToNull(serviceNotes),
        equipmentNotes: emptyToNull(equipmentNotes),
        finalConclusion: emptyToNull(finalConclusion),
        comment: emptyToNull(comment)
      };

      if (cycle) {
        await onSubmit({
          status,
          ...payload,
          sopCheck: selectValueToBoolean(sopCheck),
          depotCheck: selectValueToBoolean(depotCheck),
          readyForHandover
        });
      } else if (deviceId) {
        await onSubmit({
          deviceId,
          type,
          ...payload
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="device-form" onSubmit={handleSubmit}>
      <div className="form-surface">
        <div className="form-section">
          <div className="form-section-header">
            <div>
              <p className="eyebrow">{cycle ? "Редактирование" : "Создание"}</p>
              <h4>{cycle ? "Карточка сервисного случая" : "Новый сервисный случай"}</h4>
            </div>
          </div>

          {localError ? <p className="error-text">{localError}</p> : null}

          <div className="cycle-form-stack">
            <section className="cycle-form-group">
              <div className="cycle-form-group-header">
                <div>
                  <p className="eyebrow">Блок 1</p>
                  <h5>Прием</h5>
                </div>
              </div>

              <div className="form-grid">
                {!cycle ? (
                  <div className="span-2 cycle-type-grid">
                    {(Object.entries(cycleTypeLabels) as [ServiceCycleType, string][]).map(([value, label]) => (
                      <label key={value} className={`cycle-choice-card ${type === value ? "cycle-choice-card-active" : ""}`}>
                        <input
                          type="radio"
                          name="cycleType"
                          value={value}
                          checked={type === value}
                          onChange={(event) => setType(event.target.value as ServiceCycleType)}
                        />
                        <span>
                          <strong>{label}</strong>
                          <small>
                            {value === "repair"
                              ? "Используйте для поломок, диагностики, регулировки и восстановления прибора."
                              : "Используйте для плановой калибровки и проверки точности прибора."}
                          </small>
                        </span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <label className="form-field">
                    <span>Статус цикла</span>
                    <select value={status} onChange={(event) => setStatus(event.target.value as ServiceCycleStatus)}>
                      {cycleStatuses.map((value) => (
                        <option key={value} value={value}>
                          {cycleStatusLabels[value]}
                        </option>
                      ))}
                    </select>
                  </label>
                )}

                <label className="form-field">
                  <span>
                    Дата приема
                    {!hasText(receivedAt) ? <FieldRequirement tone="current">Нужно сейчас</FieldRequirement> : null}
                  </span>
                  <input type="date" value={receivedAt} onChange={(event) => setReceivedAt(event.target.value)} />
                </label>

                <label className="span-2 form-field">
                  <span>Комплектация и замечания по приемке</span>
                  <textarea
                    value={equipmentNotes}
                    onChange={(event) => setEquipmentNotes(event.target.value)}
                    placeholder="Например: кабель, зарядка, без телефона, не хватает крышки"
                    rows={3}
                  />
                </label>
              </div>
            </section>

            {shouldShowWorkBlocks ? (
              <>
                <section className="cycle-form-group">
                  <div className="cycle-form-group-header">
                    <div>
                      <p className="eyebrow">Блок 2</p>
                      <h5>Осмотр и диагностика</h5>
                    </div>
                  </div>

                  <div className="form-grid">
                    <label className="span-2 form-field">
                      <span>
                        Диагноз
                        {isRepairWorkStage ? <FieldRequirement tone="current">Нужно сейчас</FieldRequirement> : null}
                      </span>
                      <textarea
                        value={diagnosis}
                        onChange={(event) => setDiagnosis(event.target.value)}
                        placeholder="Что сломано, что обнаружили при осмотре, какие симптомы наблюдаются"
                        rows={4}
                      />
                      {type === "repair" ? (
                        <span className="field-note">Для ремонта без диагноза нельзя двигаться к проверкам и завершению.</span>
                      ) : null}
                    </label>

                    <label className="span-2 form-field">
                      <span>Служебные заметки</span>
                      <textarea
                        value={serviceNotes}
                        onChange={(event) => setServiceNotes(event.target.value)}
                        placeholder="Например: ждем оплату, подписана спецификация, согласование с заказчиком"
                        rows={3}
                      />
                    </label>
                  </div>
                </section>

                <section className="cycle-form-group">
                  <div className="cycle-form-group-header">
                    <div>
                      <p className="eyebrow">Блок 3</p>
                      <h5>Выполненные работы</h5>
                    </div>
                  </div>

                  <label className="span-2 form-field">
                    <span>
                      Что сделано
                      {isRepairWorkStage ? <FieldRequirement tone="current">Нужно сейчас</FieldRequirement> : null}
                    </span>
                    <textarea
                      value={workPerformed}
                      onChange={(event) => setWorkPerformed(event.target.value)}
                      placeholder="Например: замена датчика, замена разъема, регулировка, калибровка"
                      rows={4}
                    />
                    {type === "repair" ? <span className="field-note">Для ремонта это обязательное поле перед переходом к итоговым этапам.</span> : null}
                  </label>
                </section>
              </>
            ) : null}

            {shouldShowControlBlocks ? (
              <>
                <section className="cycle-form-group">
                  <div className="cycle-form-group-header">
                    <div>
                      <p className="eyebrow">Блок 4</p>
                      <h5>Контроль и итог</h5>
                    </div>
                  </div>

                  <div className="cycle-checks-grid">
                    <section className="cycle-check-card">
                      <div className="cycle-check-card-header">
                        <strong>SOP</strong>
                        <span>Отдельно фиксируем результат и дату проверки на SOP.</span>
                      </div>
                      <div className="cycle-check-card-body">
                        <label className="form-field cycle-check-field">
                          <span>Результат SOP</span>
                          <select value={sopCheck} onChange={(event) => setSopCheck(event.target.value)}>
                            <option value="">Не задано</option>
                            <option value="true">Пройдена</option>
                            <option value="false">Не пройдена</option>
                          </select>
                        </label>

                        <label className="form-field cycle-check-field">
                          <span>Дата SOP</span>
                          <input type="date" value={sopCheckedAt} onChange={(event) => setSopCheckedAt(event.target.value)} />
                        </label>
                      </div>
                    </section>

                    <section className="cycle-check-card">
                      <div className="cycle-check-card-header">
                        <strong>Depot</strong>
                        <span>Дата Depot хранится отдельно, чтобы проверки не смешивались между собой.</span>
                      </div>
                      <div className="cycle-check-card-body">
                        <label className="form-field cycle-check-field">
                          <span>Результат Depot</span>
                          <select value={depotCheck} onChange={(event) => setDepotCheck(event.target.value)}>
                            <option value="">Не задано</option>
                            <option value="true">Пройдена</option>
                            <option value="false">Не пройдена</option>
                          </select>
                        </label>

                        <label className="form-field cycle-check-field">
                          <span>Дата Depot</span>
                          <input type="date" value={depotCheckedAt} onChange={(event) => setDepotCheckedAt(event.target.value)} />
                        </label>
                      </div>
                    </section>
                  </div>

                  <div className="form-grid">
                    <label className="form-field span-2">
                      <span>Итог</span>
                      <input
                        value={finalConclusion}
                        onChange={(event) => setFinalConclusion(event.target.value)}
                        placeholder="Например: исправен, ожидает доп. работ"
                      />
                    </label>

                    {cycle ? (
                      <label className="span-2 checkbox-card cycle-ready-card">
                        <input
                          type="checkbox"
                          checked={readyForHandover}
                          onChange={(event) => setReadyForHandover(event.target.checked)}
                        />
                        <span>
                          <strong>Готов к передаче</strong>
                          <small>Включайте, когда цикл фактически завершен и прибор можно передавать дальше.</small>
                        </span>
                      </label>
                    ) : null}
                  </div>
                </section>

                <section className="cycle-form-group">
                  <div className="cycle-form-group-header">
                    <div>
                      <p className="eyebrow">Блок 5</p>
                      <h5>Дополнительный комментарий</h5>
                    </div>
                  </div>

                  <label className="span-2 form-field">
                    <span>Комментарий</span>
                    <textarea
                      value={comment}
                      onChange={(event) => setComment(event.target.value)}
                      placeholder="Например: прибор отправлен, нужно дождаться деталей, согласовано с заказчиком"
                      rows={3}
                    />
                  </label>
                </section>
              </>
            ) : null}
          </div>
        </div>

        <div className="form-actions form-actions-end">
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Сохранение..." : submitLabel}
          </button>
        </div>
      </div>
    </form>
  );
}

function FieldRequirement({ tone, children }: { tone: "current"; children: string }) {
  return <span className={`field-requirement field-requirement-${tone}`}>{children}</span>;
}

function booleanToSelectValue(value: boolean | null) {
  if (value === null) {
    return "";
  }

  return value ? "true" : "false";
}

function selectValueToBoolean(value: string) {
  if (value === "") {
    return null;
  }

  return value === "true";
}

function emptyToNull(value: string) {
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function toDateInputValue(value: string | null) {
  if (!value) {
    return "";
  }

  return value.slice(0, 10);
}

function getTodayDateValue() {
  return new Date().toISOString().slice(0, 10);
}

function hasText(value: string) {
  return value.trim().length > 0;
}

function getLocalValidationMessage(input: {
  cycle?: ServiceCycle;
  type: ServiceCycleType;
  status: ServiceCycleStatus;
  diagnosis: string;
  workPerformed: string;
  sopCheck: string;
  depotCheck: string;
  sopCheckedAt: string;
  depotCheckedAt: string;
  finalConclusion: string;
  readyForHandover: boolean;
}) {
  if (!input.cycle) {
    return null;
  }

  const missingForRepairBeforeChecks: string[] = [];
  const isTryingToMoveIntoChecksOrFurther =
    input.sopCheck !== "" ||
    input.depotCheck !== "" ||
    input.status === "sop_passed" ||
    input.status === "sop_failed" ||
    input.status === "depot_passed" ||
    input.status === "depot_failed" ||
    input.status === "ready_for_handover";

  if (input.type === "repair" && isTryingToMoveIntoChecksOrFurther) {
    if (!hasText(input.diagnosis)) {
      missingForRepairBeforeChecks.push("диагноз");
    }

    if (!hasText(input.workPerformed)) {
      missingForRepairBeforeChecks.push('поле "Что сделано"');
    }
  }

  if (missingForRepairBeforeChecks.length > 0) {
    return `Сначала заполните: ${missingForRepairBeforeChecks.join(", ")}.`;
  }

  const missingPassedCheckDates: string[] = [];

  if (input.sopCheck === "true" && !input.sopCheckedAt) {
    missingPassedCheckDates.push("дату SOP");
  }

  if (input.depotCheck === "true" && !input.depotCheckedAt) {
    missingPassedCheckDates.push("дату Depot");
  }

  if (missingPassedCheckDates.length > 0) {
    return `Если проверка пройдена, заполните: ${missingPassedCheckDates.join(", ")}.`;
  }

  const isTryingToFinish =
    input.readyForHandover || input.status === "ready_for_handover" || input.status === "handed_over";

  if (!isTryingToFinish) {
    return null;
  }

  const missingForFinish: string[] = [];

  if (input.type === "repair" && !hasText(input.diagnosis)) {
    missingForFinish.push("диагноз");
  }

  if (input.type === "repair" && !hasText(input.workPerformed)) {
    missingForFinish.push('поле "Что сделано"');
  }

  if (input.sopCheck === "") {
    missingForFinish.push("результат SOP");
  }

  if (input.sopCheck === "true" && !input.sopCheckedAt) {
    missingForFinish.push("дату SOP");
  }

  if (input.depotCheck === "") {
    missingForFinish.push("результат Depot");
  }

  if (input.depotCheck === "true" && !input.depotCheckedAt) {
    missingForFinish.push("дату Depot");
  }

  if (!hasText(input.finalConclusion)) {
    missingForFinish.push("итог");
  }

  if (missingForFinish.length === 0) {
    return null;
  }

  return `Чтобы перевести цикл к передаче, заполните: ${missingForFinish.join(", ")}.`;
}
