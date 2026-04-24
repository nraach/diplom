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

  const progressHint = useMemo(() => {
    if (!cycle) {
      return "Создаем новый цикл и сразу фиксируем его тип. Остальные этапы появятся уже в процессе работы.";
    }

    if (status === "created") {
      return "Цикл еще не ушел в активную работу. Следующий логичный шаг — перевести его в работу.";
    }

    if (status === "in_progress" && sopCheck === "") {
      return "Цикл в работе. Обычно после этого отмечают результат SOP.";
    }

    if (sopCheck === "false" || depotCheck === "false") {
      return "В цикле есть проблемная проверка. Стоит явно зафиксировать комментарий, чтобы история читалась понятнее.";
    }

    if (readyForHandover || status === "ready_for_handover") {
      return "Цикл уже выглядит готовым к передаче. Проверьте комментарий и выполните handover из карточки активного цикла.";
    }

    if (status === "cancelled") {
      return "Цикл отменен. Оставьте в комментарии короткую причину, чтобы это было понятно в истории.";
    }

    return "Форма синхронизирована с трекером: обновляйте только текущий этап и ближайшие контрольные точки.";
  }, [cycle, depotCheck, readyForHandover, sopCheck, status]);

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
              <h4>{cycle ? "Управление этапами цикла" : "Новый сервисный цикл"}</h4>
            </div>
          </div>

          <div className="cycle-form-intro">
            <strong>{cycle ? "Форма движения цикла" : "Старт процесса"}</strong>
            <span>{progressHint}</span>
          </div>

          <div className="cycle-form-stack">
            {!cycle ? (
              <section className="cycle-form-group">
                <div className="cycle-form-group-header">
                  <div>
                    <p className="eyebrow">Шаг 1</p>
                    <h5>Тип сервисного цикла</h5>
                  </div>
                  <span className="cycle-form-group-note">Это определяет дальнейший маршрут прибора.</span>
                </div>

                <div className="cycle-type-grid">
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
                            ? "Используйте для ремонтных работ и восстановления прибора."
                            : "Используйте для калибровки и проверки точности прибора."}
                        </small>
                      </span>
                    </label>
                  ))}
                </div>
              </section>
            ) : (
              <>
                <section className="cycle-form-group">
                  <div className="cycle-form-group-header">
                    <div>
                      <p className="eyebrow">Шаг 1</p>
                      <h5>Текущий этап процесса</h5>
                    </div>
                    <span className="cycle-form-group-note">Статус должен отражать реальное положение цикла в трекере.</span>
                  </div>

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
                </section>

                <section className="cycle-form-group">
                  <div className="cycle-form-group-header">
                    <div>
                      <p className="eyebrow">Шаг 2</p>
                      <h5>Контрольные проверки</h5>
                    </div>
                    <span className="cycle-form-group-note">SOP и Depot независимы друг от друга и влияют на визуальные точки трекера.</span>
                  </div>

                  <div className="cycle-check-grid">
                    <label className="form-field cycle-check-field">
                      <span>Результат SOP</span>
                      <select value={sopCheck} onChange={(event) => setSopCheck(event.target.value)}>
                        <option value="">Не задано</option>
                        <option value="true">Пройдена</option>
                        <option value="false">Не пройдена</option>
                      </select>
                    </label>

                    <label className="form-field cycle-check-field">
                      <span>Результат Depot</span>
                      <select value={depotCheck} onChange={(event) => setDepotCheck(event.target.value)}>
                        <option value="">Не задано</option>
                        <option value="true">Пройдена</option>
                        <option value="false">Не пройдена</option>
                      </select>
                    </label>
                  </div>
                </section>

                <section className="cycle-form-group">
                  <div className="cycle-form-group-header">
                    <div>
                      <p className="eyebrow">Шаг 3</p>
                      <h5>Подготовка к передаче</h5>
                    </div>
                    <span className="cycle-form-group-note">Этот флаг подсвечивает финальный этап перед handover.</span>
                  </div>

                  <label className="checkbox-card cycle-ready-card">
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
                </section>
              </>
            )}

            <section className="cycle-form-group">
              <div className="cycle-form-group-header">
                <div>
                  <p className="eyebrow">{cycle ? "Шаг 4" : "Шаг 2"}</p>
                  <h5>Комментарий и контекст</h5>
                </div>
                <span className="cycle-form-group-note">Короткий комментарий сильно упрощает чтение истории цикла.</span>
              </div>

              <label className="span-2 form-field">
                <span>Комментарий</span>
                <textarea
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                  placeholder="Например: что сделано, почему проверка не пройдена, что осталось перед handover"
                  rows={4}
                />
              </label>
            </section>
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
