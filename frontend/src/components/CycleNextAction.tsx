import { ServiceCycle } from "../types/cycle";
import { HandoverForm } from "./HandoverForm";

type CycleNextActionProps = {
  cycle: ServiceCycle;
  disabled?: boolean;
  onAdvanceStatus: (input: {
    status?: ServiceCycle["status"];
    readyForHandover?: boolean;
    comment?: string | null;
  }) => Promise<unknown>;
  onOpenEditor: () => void;
  onHandover: (comment: string | null) => Promise<unknown>;
};

export function CycleNextAction({
  cycle,
  disabled = false,
  onAdvanceStatus,
  onOpenEditor,
  onHandover
}: CycleNextActionProps) {
  const nextAction = getNextAction(cycle);

  if (!nextAction) {
    return null;
  }

  if (nextAction.kind === "handover") {
    return (
      <section className="next-action-panel">
        <div className="next-action-header">
          <div>
            <p className="eyebrow">Следующий шаг</p>
            <h4>{nextAction.title}</h4>
          </div>
          <p className="next-action-copy">{nextAction.description}</p>
        </div>
        <HandoverForm disabled={disabled} onSubmit={onHandover} submitLabel={nextAction.buttonLabel} />
      </section>
    );
  }

  return (
    <section className="next-action-panel">
      <div className="next-action-header">
        <div>
          <p className="eyebrow">Следующий шаг</p>
          <h4>{nextAction.title}</h4>
        </div>
        <p className="next-action-copy">{nextAction.description}</p>
      </div>

      <div className="next-action-footer">
        {nextAction.hint ? <p className="next-action-hint">{nextAction.hint}</p> : <span />}
        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            if (nextAction.kind === "edit") {
              onOpenEditor();
              return;
            }

            void onAdvanceStatus(nextAction.payload);
          }}
        >
          {nextAction.buttonLabel}
        </button>
      </div>
    </section>
  );
}

function getNextAction(cycle: ServiceCycle) {
  if (cycle.status === "cancelled" || cycle.status === "handed_over") {
    return null;
  }

  if (cycle.status === "created") {
    return {
      kind: "advance" as const,
      title: "Перевести цикл в работу",
      description: "Цикл уже создан. Следующее логичное действие — начать активную сервисную работу.",
      buttonLabel: "Перевести в работу",
      payload: {
        status: "in_progress" as const
      }
    };
  }

  if (cycle.sopCheck === null) {
    return {
      kind: "edit" as const,
      title: "Зафиксировать результат SOP",
      description: "Трекер ждет первую контрольную точку. Открой форму редактирования и отметь итог SOP.",
      buttonLabel: "Перейти к SOP",
      hint: "В форме ниже/сверху откроется редактирование текущего цикла."
    };
  }

  if (cycle.depotCheck === null) {
    return {
      kind: "edit" as const,
      title: "Зафиксировать результат Depot",
      description: "Следующий этап после SOP — результат depot-проверки. Его лучше явно отметить в цикле.",
      buttonLabel: "Перейти к Depot",
      hint: "Откроется форма редактирования текущего цикла."
    };
  }

  if (!cycle.readyForHandover && cycle.status !== "ready_for_handover") {
    return {
      kind: "advance" as const,
      title: "Отметить готовность к передаче",
      description: "Контрольные точки уже заполнены. Теперь цикл можно перевести в состояние готовности к handover.",
      buttonLabel: "Готов к передаче",
      payload: {
        status: "ready_for_handover" as const,
        readyForHandover: true
      }
    };
  }

  return {
    kind: "handover" as const,
    title: "Подтвердить передачу",
    description: "Цикл дошел до финального этапа. Осталось зафиксировать handover и завершить маршрут прибора.",
    buttonLabel: "Подтвердить передачу"
  };
}
