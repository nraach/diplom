import { ReactNode } from "react";
import { UserRole } from "../types/user";
import { useAuth } from "../hooks/useAuth";

type RoleGuardProps = {
  roles: UserRole[];
  children: ReactNode;
};

export function RoleGuard({ roles, children }: RoleGuardProps) {
  const { user } = useAuth();

  if (!user || !roles.includes(user.role)) {
    return (
      <section className="panel">
        <h2>Доступ запрещен</h2>
        <p>Эта страница доступна только пользователям с нужной ролью.</p>
      </section>
    );
  }

  return <>{children}</>;
}
