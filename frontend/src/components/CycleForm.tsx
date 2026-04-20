import { FormEvent, useEffect, useState } from "react";
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
  const [sopCheck, setSopCheck] = useState("");
  const [depotCheck, setDepotCheck] = useState("");
  const [readyForHandover, setReadyForHandover] = useState(false);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (cycle) {
      setType(cycle.type);
      setStatus(cycle.status);
      setSopCheck(booleanToSelectValue(cycle.sopCheck));
      setDepotCheck(booleanToSelectValue(cycle.depotCheck));
      setReadyForHandover(cycle.readyForHandover);
      setComment(cycle.comment ?? "");
      return;
    }

    setType("repair");
    setStatus("created");
    setSopCheck("");
    setDepotCheck("");
    setReadyForHandover(false);
    setComment("");
  }, [cycle]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      if (cycle) {
        await onSubmit({
          status,
          sopCheck: selectValueToBoolean(sopCheck),
          depotCheck: selectValueToBoolean(depotCheck),
          readyForHandover,
          comment: comment || null
        });
      } else if (deviceId) {
        await onSubmit({
          deviceId,
          type,
          comment: comment || null
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
              <h4>{cycle ? "Параметры сервисного цикла" : "Новый сервисный цикл"}</h4>
            </div>
          </div>

          <div className="form-grid">
            {!cycle ? (
              <label className="form-field">
                <span>Тип</span>
                <select value={type} onChange={(event) => setType(event.target.value as ServiceCycleType)} required>
                  {Object.entries(cycleTypeLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <>
                <label className="form-field">
                  <span>Статус</span>
                  <select value={status} onChange={(event) => setStatus(event.target.value as ServiceCycleStatus)}>
                    {cycleStatuses.map((value) => (
                      <option key={value} value={value}>
                        {cycleStatusLabels[value]}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="form-field">
                  <span>Проверка SOP</span>
                  <select value={sopCheck} onChange={(event) => setSopCheck(event.target.value)}>
                    <option value="">Не задано</option>
                    <option value="true">Пройдена</option>
                    <option value="false">Не пройдена</option>
                  </select>
                </label>

                <label className="form-field">
                  <span>Проверка депо</span>
                  <select value={depotCheck} onChange={(event) => setDepotCheck(event.target.value)}>
                    <option value="">Не задано</option>
                    <option value="true">Пройдена</option>
                    <option value="false">Не пройдена</option>
                  </select>
                </label>

                <label className="checkbox-card">
                  <input
                    type="checkbox"
                    checked={readyForHandover}
                    onChange={(event) => setReadyForHandover(event.target.checked)}
                  />
                  <span>
                    <strong>Готов к передаче</strong>
                    <small>Флаг доступности handover для текущего цикла.</small>
                  </span>
                </label>
              </>
            )}

            <label className="span-2 form-field">
              <span>Комментарий</span>
              <textarea
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                placeholder="Комментарий к сервисному циклу"
                rows={4}
              />
            </label>
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
