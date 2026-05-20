import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FloatingToast } from "../components/FloatingToast";
import { usersApi } from "../api/users.api";
import { StatusBadge } from "../components/StatusBadge";
import { usePollingQuery } from "../hooks/usePollingQuery";
import { User, UserRole } from "../types/user";
import { userRoleLabels, userStatusLabels } from "../utils/status-labels";

export function UsersPage() {
  const queryClient = useQueryClient();
  const usersQuery = usePollingQuery({ queryKey: ["users"], queryFn: usersApi.list });
  const [successToast, setSuccessToast] = useState<{ id: number; message: string } | null>(null);

  const approveMutation = useMutation({
    mutationFn: usersApi.approve,
    onSuccess() {
      setSuccessToast({ id: Date.now(), message: "Пользователь одобрен." });
      invalidateUsers();
    }
  });

  const blockMutation = useMutation({
    mutationFn: usersApi.block,
    onSuccess() {
      setSuccessToast({ id: Date.now(), message: "Пользователь заблокирован." });
      invalidateUsers();
    }
  });

  const roleMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: UserRole }) => usersApi.changeRole(id, role),
    onSuccess() {
      setSuccessToast({ id: Date.now(), message: "Роль пользователя изменена." });
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

      {successToast ? (
        <FloatingToast key={successToast.id} message={successToast.message} onDismiss={() => setSuccessToast(null)} />
      ) : null}

      {approveMutation.error ? (
        <FloatingToast
          key={`users-approve-${approveMutation.error.message}`}
          message={approveMutation.error.message}
          variant="error"
          durationMs={4200}
          index={1}
          onDismiss={() => approveMutation.reset()}
        />
      ) : null}

      {blockMutation.error ? (
        <FloatingToast
          key={`users-block-${blockMutation.error.message}`}
          message={blockMutation.error.message}
          variant="error"
          durationMs={4200}
          index={2}
          onDismiss={() => blockMutation.reset()}
        />
      ) : null}

      {roleMutation.error ? (
        <FloatingToast
          key={`users-role-${roleMutation.error.message}`}
          message={roleMutation.error.message}
          variant="error"
          durationMs={4200}
          index={3}
          onDismiss={() => roleMutation.reset()}
        />
      ) : null}

      <section className="panel">
        <div className="panel-heading">
          <h3>Список пользователей</h3>
        </div>
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
