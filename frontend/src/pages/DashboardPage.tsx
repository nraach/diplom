import { useNavigate } from "react-router-dom";
import { dashboardApi } from "../api/dashboard.api";
import { FloatingToast } from "../components/FloatingToast";
import { StatusBadge } from "../components/StatusBadge";
import { useAuth } from "../hooks/useAuth";
import { usePollingQuery } from "../hooks/usePollingQuery";
import { getCycleDisplayStatus } from "../utils/cycle-display-status";
import {
  auditActionLabels,
  cycleStatusLabels,
  cycleTypeLabels,
  deviceStatusLabels,
  entityTypeLabels
} from "../utils/status-labels";

export function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const dashboardQuery = usePollingQuery({ queryKey: ["dashboard"], queryFn: dashboardApi.getSummary });
  const dashboard = dashboardQuery.data;
  const summary = dashboard?.summary ?? {
    totalDevices: 0,
    inRepair: 0,
    inCalibration: 0,
    readyForHandover: 0,
    handedOver: 0,
    needsCalibrationWarning: 0
  };
  const recentDeviceUpdates = dashboard?.recentDeviceUpdates ?? [];
  const recentAuditActions = dashboard?.recentAuditActions ?? [];
  const activeCycles = dashboard?.activeCycles ?? [];

  return (
    <div className="page-stack dashboard-page">
      <header className="page-header dashboard-hero">
        <div>
          <p className="eyebrow">Обзор</p>
          <h2>Панель</h2>
        </div>
      </header>

      {dashboardQuery.isLoading ? <section className="panel muted-panel">Загрузка сводки...</section> : null}
      {dashboardQuery.error ? (
        <FloatingToast
          key={`dashboard-${dashboardQuery.error.message}`}
          message={dashboardQuery.error.message}
          variant="error"
          durationMs={4200}
          onDismiss={() => void dashboardQuery.refetch()}
        />
      ) : null}

      <section className="metrics-grid dashboard-metrics">
        <Metric label="Всего приборов" value={summary.totalDevices} onClick={() => navigate("/devices")} />
        <Metric label="В ремонте" value={summary.inRepair} tone="repair" onClick={() => navigate("/devices?status=in_repair")} />
        <Metric
          label="На калибровке"
          value={summary.inCalibration}
          tone="calibration"
          onClick={() => navigate("/devices?status=in_calibration")}
        />
        <Metric
          label="Готовы к передаче"
          value={summary.readyForHandover}
          tone="ready"
          onClick={() => navigate("/devices?status=ready_for_handover")}
        />
        <Metric label="Переданы" value={summary.handedOver} tone="done" onClick={() => navigate("/devices?status=handed_over")} />
        <Metric
          label="Требуют калибровки"
          value={summary.needsCalibrationWarning}
          tone="warning"
          onClick={() => navigate("/devices?warning=true")}
        />
      </section>

      <section className="dashboard-main-grid">
        <div className="panel dashboard-panel">
          <div className="panel-heading dashboard-heading">
            <div>
              <p className="eyebrow">Приборы</p>
              <h3>Последние изменения</h3>
            </div>
          </div>
          <div className="list-stack dashboard-list">
            {recentDeviceUpdates.map((device) => (
              <button
                key={device.id}
                type="button"
                className="compact-item compact-item-button dashboard-item"
                onClick={() => navigate(`/devices/${device.id}`)}
                title="Открыть карточку прибора"
              >
                <div>
                  <strong>{device.name}</strong>
                  <span>{device.serialNumber}</span>
                </div>
                <StatusBadge label={deviceStatusLabels[device.currentStatus]} value={device.currentStatus} />
              </button>
            ))}
            {recentDeviceUpdates.length === 0 ? <p className="muted-text">Изменений приборов пока нет.</p> : null}
          </div>
        </div>

        <div className="panel dashboard-panel">
          <div className="panel-heading dashboard-heading">
            <div>
              <p className="eyebrow">Контроль</p>
              <h3>Оперативный контроль</h3>
            </div>
          </div>

          <div className="dashboard-control-stack">
            <section className="dashboard-subsection">
              <div className="dashboard-subsection-header">
                <h4>Активные сервисные циклы</h4>
              </div>
              {activeCycles.length === 0 ? <p className="muted-text">Нет активных сервисных циклов.</p> : null}
              {activeCycles.length > 0 ? (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Прибор</th>
                        <th>Тип</th>
                        <th>Статус</th>
                        <th>Создал</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeCycles.map((cycle) => (
                        <tr
                          key={cycle.id}
                          className="dashboard-cycle-row"
                          onClick={() => navigate(`/devices/${cycle.device?.id ?? cycle.deviceId}`)}
                          title="Открыть карточку прибора"
                        >
                          <td className="strong-cell">{cycle.device?.name ?? cycle.deviceId}</td>
                          <td>
                            <StatusBadge label={cycleTypeLabels[cycle.type]} value={cycle.type} />
                          </td>
                          <td>
                            <StatusBadge label={cycleStatusLabels[getCycleDisplayStatus(cycle)]} value={getCycleDisplayStatus(cycle)} />
                          </td>
                          <td>{cycle.createdBy?.fullName ?? "Неизвестно"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null}
            </section>

            {user?.role === "admin" ? (
              <section className="dashboard-subsection dashboard-subsection-divider">
                <div className="dashboard-subsection-header">
                  <h4>Последние действия аудита</h4>
                  <button type="button" className="link-button" onClick={() => navigate("/audit")}>
                    Все действия
                  </button>
                </div>
                <div className="list-stack dashboard-list">
                  {recentAuditActions.map((log) => (
                    <article key={log.id} className="compact-item compact-item-stacked dashboard-audit-item">
                      <strong>{auditActionLabels[log.action] ?? log.action}</strong>
                      <span>{entityTypeLabels[log.entityType] ?? log.entityType}</span>
                      <span>{log.user?.fullName ?? "Неизвестный пользователь"}</span>
                    </article>
                  ))}
                  {recentAuditActions.length === 0 ? <p className="muted-text">Действий аудита пока нет.</p> : null}
                </div>
              </section>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}

function Metric({
  label,
  value,
  tone,
  onClick
}: {
  label: string;
  value: number;
  tone?: "repair" | "calibration" | "ready" | "done" | "warning";
  onClick: () => void;
}) {
  return (
    <button type="button" className={`metric-card metric-card-button ${tone ? `metric-${tone}` : ""}`} onClick={onClick}>
      <span>{label}</span>
      <strong>{value}</strong>
    </button>
  );
}
