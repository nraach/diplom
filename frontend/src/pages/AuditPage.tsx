import { auditApi } from "../api/audit.api";
import { usePollingQuery } from "../hooks/usePollingQuery";
import { auditActionLabels, entityTypeLabels } from "../utils/status-labels";

export function AuditPage() {
  const auditQuery = usePollingQuery({ queryKey: ["audit"], queryFn: auditApi.list });
  const logs = auditQuery.data ?? [];

  return (
    <div className="page-stack">
      <header className="page-header">
        <div>
          <p className="eyebrow">Администрирование</p>
          <h2>Аудит</h2>
        </div>
      </header>

      {auditQuery.isLoading ? <section className="panel muted-panel">Загрузка журнала аудита...</section> : null}
      {auditQuery.error ? <section className="panel error-text">{auditQuery.error.message}</section> : null}

      {!auditQuery.isLoading && logs.length === 0 ? (
        <section className="panel muted-panel">
          <strong>Действий аудита пока нет.</strong>
        </section>
      ) : null}

      {logs.length > 0 ? (
        <section className="panel">
          <div className="panel-heading">
            <h3>Журнал действий</h3>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Дата и время</th>
                  <th>Действие</th>
                  <th>Сущность</th>
                  <th>Пользователь</th>
                  <th>ID сущности</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td>{formatDate(log.createdAt)}</td>
                    <td className="strong-cell">{auditActionLabels[log.action] ?? log.action}</td>
                    <td>{entityTypeLabels[log.entityType] ?? log.entityType}</td>
                    <td>{log.user?.fullName ?? "Неизвестный пользователь"}</td>
                    <td className="audit-entity-id">{log.entityId}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </div>
  );
}

function formatDate(value: string) {
  return new Date(value).toLocaleString();
}
