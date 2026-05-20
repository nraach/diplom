import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { authApi } from "../api/auth.api";
import { ApiError } from "../api/client";
import { FloatingToast } from "../components/FloatingToast";
import { useAuth } from "../hooks/useAuth";

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const mutation = useMutation({
    mutationFn: authApi.login,
    onSuccess(data) {
      login(data.token, data.user);
      navigate("/dashboard");
    }
  });

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    mutation.mutate({ email, password });
  }

  return (
    <main className="auth-page">
      {mutation.error ? (
        <FloatingToast
          key={`login-${getErrorMessage(mutation.error)}`}
          message={getErrorMessage(mutation.error)}
          variant="error"
          durationMs={4200}
          onDismiss={() => mutation.reset()}
        />
      ) : null}

      <section className="auth-card">
        <div className="auth-intro">
          <p className="eyebrow">Учет NDT-приборов</p>
          <h1>Вход</h1>
        </div>

        <form className="stack-form" onSubmit={handleSubmit}>
          <label className="form-field">
            <span>Email</span>
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              type="email"
              placeholder="admin@example.com"
              required
            />
          </label>

          <label className="form-field">
            <span>Пароль</span>
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              placeholder="Введите пароль"
              required
              minLength={6}
            />
          </label>

          <button type="submit" className="button-wide" disabled={mutation.isPending}>
            {mutation.isPending ? "Вход..." : "Войти"}
          </button>
        </form>

        <p className="auth-footer">
          Нужен доступ? <Link to="/register">Зарегистрироваться</Link>
        </p>
      </section>
    </main>
  );
}

function getErrorMessage(error: Error) {
  return error instanceof ApiError ? error.message : "Не удалось войти. Проверьте доступность сервера.";
}
