import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { auditApi } from "../api/audit.api";
import { usePollingQuery } from "../hooks/usePollingQuery";
import { auditActionLabels, entityTypeLabels } from "../utils/status-labels";

export function AuditPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const auditQuery = usePollingQuery({ queryKey: ["audit"], queryFn: auditApi.list });
  const logs = auditQuery.data ?? [];
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [actionFilter, setActionFilter] = useState(searchParams.get("action") ?? "");
  const [entityFilter, setEntityFilter] = useState(searchParams.get("entity") ?? "");
  const [userFilter, setUserFilter] = useState(searchParams.get("user") ?? "");

  useEffect(() => {
    setQuery(searchParams.get("q") ?? "");
    setActionFilter(searchParams.get("action") ?? "");
    setEntityFilter(searchParams.get("entity") ?? "");
    setUserFilter(searchParams.get("user") ?? "");
  }, [searchParams]);

  const actionOptions = useMemo(
    () => Array.from(new Set(logs.map((log) => log.action))).sort((left, right) => left.localeCompare(right)),
    [logs]
  );
  const entityOptions = useMemo(
    () => Array.from(new Set(logs.map((log) => log.entityType))).sort((left, right) => left.localeCompare(right)),
    [logs]
  );
  const userOptions = useMemo(
    () =>
      Array.from(
        new Map(
          logs.map((log) => [
            log.userId,
            {
              id: log.userId,
              label: log.user?.fullName?.trim() || log.user?.email?.trim() || "Неизвестный пользователь"
            }
          ])
        ).values()
      ).sort((left, right) => left.label.localeCompare(right.label)),
    [logs]
  );

  const filteredLogs = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return logs.filter((log) => {
      const matchesQuery =
        !normalizedQuery ||
        log.entityId.toLowerCase().includes(normalizedQuery) ||
        log.user?.fullName?.toLowerCase().includes(normalizedQuery) ||
        log.user?.email?.toLowerCase().includes(normalizedQuery) ||
        (auditActionLabels[log.action] ?? log.action).toLowerCase().includes(normalizedQuery) ||
        (entityTypeLabels[log.entityType] ?? log.entityType).toLowerCase().includes(normalizedQuery);
      const matchesAction = !actionFilter || log.action === actionFilter;
      const matchesEntity = !entityFilter || log.entityType === entityFilter;
      const matchesUser = !userFilter || log.userId === userFilter;

      return matchesQuery && matchesAction && matchesEntity && matchesUser;
    });
  }, [actionFilter, entityFilter, logs, query, userFilter]);

  function updateFilters(next: {
    q?: string;
    action?: string;
    entity?: string;
    user?: string;
  }) {
    const params = new URLSearchParams(searchParams);
    const entries = {
      q: next.q ?? query,
      action: next.action ?? actionFilter,
      entity: next.entity ?? entityFilter,
      user: next.user ?? userFilter
    };

    Object.entries(entries).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });

    setSearchParams(params);
  }

  function resetFilters() {
    setSearchParams(new URLSearchParams());
  }

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

      {!auditQuery.isLoading ? (
        <section className="panel">
          <div className="panel-heading">
            <h3>Фильтры аудита</h3>
            <button type="button" className="ghost-button" onClick={resetFilters} disabled={!query && !actionFilter && !entityFilter && !userFilter}>
              Сбросить
            </button>
          </div>
          <div className="filters">
            <input
              placeholder="Поиск по ID, пользователю, действию или сущности"
              value={query}
              onChange={(event) => {
                const value = event.target.value;
                setQuery(value);
                updateFilters({ q: value });
              }}
            />
            <select
              value={actionFilter}
              onChange={(event) => {
                const value = event.target.value;
                setActionFilter(value);
                updateFilters({ action: value });
              }}
            >
              <option value="">Все действия</option>
              {actionOptions.map((value) => (
                <option key={value} value={value}>
                  {auditActionLabels[value] ?? value}
                </option>
              ))}
            </select>
            <select
              value={entityFilter}
              onChange={(event) => {
                const value = event.target.value;
                setEntityFilter(value);
                updateFilters({ entity: value });
              }}
            >
              <option value="">Все сущности</option>
              {entityOptions.map((value) => (
                <option key={value} value={value}>
                  {entityTypeLabels[value] ?? value}
                </option>
              ))}
            </select>
            <select
              value={userFilter}
              onChange={(event) => {
                const value = event.target.value;
                setUserFilter(value);
                updateFilters({ user: value });
              }}
            >
              <option value="">Все пользователи</option>
              {userOptions.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.label}
                </option>
              ))}
            </select>
          </div>
          <p className="muted-text">
            Показано {filteredLogs.length} из {logs.length} записей.
          </p>
        </section>
      ) : null}

      {!auditQuery.isLoading && logs.length === 0 ? (
        <section className="panel muted-panel">
          <strong>Действий аудита пока нет.</strong>
        </section>
      ) : null}

      {logs.length > 0 && filteredLogs.length === 0 ? (
        <section className="panel muted-panel">
          <strong>По текущим фильтрам записи не найдены.</strong>
        </section>
      ) : null}

      {filteredLogs.length > 0 ? (
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
                {filteredLogs.map((log) => (
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
  return new Date(value).toLocaleString("ru-RU");
}
