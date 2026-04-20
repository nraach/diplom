import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { usersApi } from "../api/users.api";
import { StatusBadge } from "../components/StatusBadge";
import { usePollingQuery } from "../hooks/usePollingQuery";
import { User, UserRole } from "../types/user";
import { userRoleLabels, userStatusLabels } from "../utils/status-labels";

export function UsersPage() {
  const queryClient = useQueryClient();
  const usersQuery = usePollingQuery({ queryKey: ["users"], queryFn: usersApi.list });
  const [successMessage, setSuccessMessage] = useState("");

  const approveMutation = useMutation({
    mutationFn: usersApi.approve,
    onSuccess() {
      setSuccessMessage("Пользователь одобрен.");
      invalidateUsers();
    }
  });

  const blockMutation = useMutation({
    mutationFn: usersApi.block,
    onSuccess() {
      setSuccessMessage("Пользователь заблокирован.");
      invalidateUsers();
    }
  });

  const roleMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: UserRole }) => usersApi.changeRole(id, role),
    onSuccess() {
      setSuccessMessage("Роль пользователя изменена.");
      invalidateUsers();
    }
  });

  function invalidateUsers() {
    void queryClient.invalidateQueries({ queryKey: ["users"] });
  }

  const users = usersQuery.data ?? [];

  return (
    <div className="page-stack">
      <header className="page-header">
        <div>
          <p className="eyebrow">Администрирование</p>
          <h2>Пользователи</h2>
        </div>
      </header>

      <section className="panel">
        <div className="panel-heading">
          <h3>Список пользователей</h3>
        </div>
        {successMessage ? <p className="success-text">{successMessage}</p> : null}
        {usersQuery.isLoading ? <p className="muted-text">Загрузка пользователей...</p> : null}
        {!usersQuery.isLoading && users.length === 0 ? <p className="muted-text">Нет данных.</p> : null}
        {users.length > 0 ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>ФИО</th>
                  <th>Email</th>
                  <th>Статус</th>
                  <th>Роль</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <UserRow
                    key={user.id}
                    user={user}
                    onApprove={() => approveMutation.mutate(user.id)}
                    onBlock={() => {
                      if (window.confirm(`Заблокировать пользователя ${user.email}?`)) {
                        blockMutation.mutate(user.id);
                      }
                    }}
                    onRoleChange={(role) => roleMutation.mutate({ id: user.id, role })}
                  />
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
        {approveMutation.error ? <p className="error-text">{approveMutation.error.message}</p> : null}
        {blockMutation.error ? <p className="error-text">{blockMutation.error.message}</p> : null}
        {roleMutation.error ? <p className="error-text">{roleMutation.error.message}</p> : null}
      </section>
    </div>
  );
}

function UserRow({
  user,
  onApprove,
  onBlock,
  onRoleChange
}: {
  user: User;
  onApprove: () => void;
  onBlock: () => void;
  onRoleChange: (role: UserRole) => void;
}) {
  return (
    <tr>
      <td className="strong-cell">{user.fullName}</td>
      <td>{user.email}</td>
      <td>
        <StatusBadge label={userStatusLabels[user.status]} value={user.status} />
      </td>
      <td>
        <select value={user.role} onChange={(event) => onRoleChange(event.target.value as UserRole)}>
          {Object.entries(userRoleLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </td>
      <td className="actions-cell">
        <button type="button" onClick={onApprove} disabled={user.status === "active"}>
          Одобрить
        </button>
        <button type="button" className="ghost-button danger-ghost" onClick={onBlock} disabled={user.status === "blocked"}>
          Заблокировать
        </button>
      </td>
    </tr>
  );
}
