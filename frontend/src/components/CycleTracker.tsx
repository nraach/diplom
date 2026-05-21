import { ServiceCycle, ServiceCycleStatus } from "../types/cycle";
import { getCycleDisplayStatus } from "../utils/cycle-display-status";
import { cycleStatusLabels } from "../utils/status-labels";

type TrackerTone = "completed" | "current" | "upcoming" | "failed";

type CycleTrackerProps = {
  cycle: ServiceCycle;
  compact?: boolean;
};

type TrackerStep = {
  id: string;
  label: string;
  caption: string;
  tone: TrackerTone;
  stateLabel: string;
};

const stepOrder = ["created", "in_progress", "sop", "depot", "ready_for_handover", "handed_over"] as const;

const statusStageMap: Record<ServiceCycleStatus, (typeof stepOrder)[number]> = {
  created: "created",
  in_progress: "in_progress",
  sop_passed: "sop",
  sop_failed: "sop",
  depot_passed: "depot",
  depot_failed: "depot",
  ready_for_handover: "ready_for_handover",
  handed_over: "handed_over"
};

export function CycleTracker({ cycle, compact = false }: CycleTrackerProps) {
  const displayStatus = getCycleDisplayStatus(cycle);
  const steps = getTrackerSteps(cycle);

  return (
    <section className={`cycle-tracker ${compact ? "cycle-tracker-compact" : ""}`}>
      <div className="cycle-tracker-header">
        <div>
          <p className="eyebrow">{compact ? "Маршрут цикла" : "Трекер цикла"}</p>
          <h4>{compact ? "Этапы движения" : cycleStatusLabels[displayStatus]}</h4>
        </div>
        {!compact ? (
          <p className="cycle-tracker-summary">
            Текущий этап подсвечен сильнее, завершенные шаги формируют понятный маршрут, а проблемные точки сразу
            видны отдельно.
          </p>
        ) : null}
      </div>

      <ol className="cycle-tracker-rail" aria-label="Этапы сервисного цикла">
        {steps.map((step, index) => (
          <li
            key={step.id}
            className={`cycle-tracker-step cycle-tracker-step-${step.tone} ${
              index < steps.length - 1 ? "cycle-tracker-step-linked" : ""
            }`}
          >
            <span className="cycle-tracker-node" aria-hidden="true">
              <span className="cycle-tracker-icon">{getStepIcon(step.tone)}</span>
            </span>
            <div className="cycle-tracker-copy">
              <div className="cycle-tracker-copy-top">
                <strong>{step.label}</strong>
                <span className={`cycle-tracker-state cycle-tracker-state-${step.tone}`}>{step.stateLabel}</span>
              </div>
              <span>{step.caption}</span>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

function getTrackerSteps(cycle: ServiceCycle): TrackerStep[] {
  const displayStatus = getCycleDisplayStatus(cycle);
  const currentStage = statusStageMap[displayStatus];
  const currentStageIndex = stepOrder.indexOf(currentStage);

  const createdTone = getBaseTone("created", currentStageIndex);
  const workTone = getBaseTone("in_progress", currentStageIndex);
  const sopTone = getCheckTone("sop", cycle.sopCheck, currentStageIndex);
  const depotTone = getCheckTone("depot", cycle.depotCheck, currentStageIndex);
  const readyTone = getReadyTone(cycle, currentStageIndex);
  const handoverTone = getHandoverTone(cycle, currentStageIndex);

  return [
    {
      id: "created",
      label: "Создан",
      caption: `Создан ${formatDate(cycle.createdAt)}`,
      tone: createdTone,
      stateLabel: getStateLabel(createdTone)
    },
    {
      id: "in_progress",
      label: "В работе",
      caption: getWorkCaption(cycle),
      tone: workTone,
      stateLabel: getStateLabel(workTone)
    },
    {
      id: "sop",
      label: "SOP",
      caption: formatCheckCaption(cycle.sopCheck, "Проверка еще не отмечена"),
      tone: sopTone,
      stateLabel: getStateLabel(sopTone)
    },
    {
      id: "depot",
      label: "Depot",
      caption: formatCheckCaption(cycle.depotCheck, "Проверка еще не отмечена"),
      tone: depotTone,
      stateLabel: getStateLabel(depotTone)
    },
    {
      id: "ready_for_handover",
      label: "Готов к передаче",
      caption: cycle.readyForHandover ? "Цикл отмечен как готовый к передаче" : "Ожидает подтверждения готовности",
      tone: readyTone,
      stateLabel: getStateLabel(readyTone)
    },
    {
      id: "handed_over",
      label: "Передан",
      caption:
        displayStatus === "handed_over" && cycle.handedOverAt
          ? `Передан ${formatDate(cycle.handedOverAt)}`
          : "Финальная передача еще не выполнена",
      tone: handoverTone,
      stateLabel: getStateLabel(handoverTone)
    }
  ];
}

function getBaseTone(stepId: (typeof stepOrder)[number], currentStageIndex: number): TrackerTone {
  const stepIndex = stepOrder.indexOf(stepId);

  if (stepIndex < currentStageIndex) {
    return "completed";
  }

  if (stepIndex === currentStageIndex) {
    return "current";
  }

  return "upcoming";
}

function getCheckTone(stepId: "sop" | "depot", value: boolean | null, currentStageIndex: number): TrackerTone {
  if (value === true) {
    return "completed";
  }

  if (value === false) {
    return "failed";
  }

  const stepIndex = stepOrder.indexOf(stepId);

  if (stepIndex === currentStageIndex) {
    return "current";
  }

  return "upcoming";
}

function getReadyTone(cycle: ServiceCycle, currentStageIndex: number): TrackerTone {
  const displayStatus = getCycleDisplayStatus(cycle);

  if (displayStatus === "handed_over") {
    return "completed";
  }

  if (cycle.readyForHandover || displayStatus === "ready_for_handover") {
    return "current";
  }

  return getBaseTone("ready_for_handover", currentStageIndex);
}

function getHandoverTone(cycle: ServiceCycle, currentStageIndex: number): TrackerTone {
  const displayStatus = getCycleDisplayStatus(cycle);

  if (displayStatus === "handed_over") {
    return "completed";
  }

  return getBaseTone("handed_over", currentStageIndex);
}

function getWorkCaption(cycle: ServiceCycle) {
  const displayStatus = getCycleDisplayStatus(cycle);

  if (displayStatus === "created") {
    return "Цикл еще не переведен в активную работу";
  }

  return "Цикл находится в активной сервисной работе";
}

function formatCheckCaption(value: boolean | null, emptyLabel: string) {
  if (value === true) {
    return "Проверка пройдена";
  }

  if (value === false) {
    return "Проверка не пройдена";
  }

  return emptyLabel;
}

function getStateLabel(tone: TrackerTone) {
  switch (tone) {
    case "completed":
      return "Готово";
    case "current":
      return "Сейчас";
    case "upcoming":
      return "Дальше";
    case "failed":
      return "Проблема";
    default:
      return "";
  }
}

function getStepIcon(tone: TrackerTone) {
  switch (tone) {
    case "completed":
      return "✓";
    case "current":
      return "•";
    case "failed":
      return "!";
    case "upcoming":
    default:
      return "";
  }
}

function formatDate(value: string) {
  return new Date(value).toLocaleString("ru-RU");
}
