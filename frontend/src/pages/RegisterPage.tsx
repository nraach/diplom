import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { authApi } from "../api/auth.api";
import { ApiError } from "../api/client";

export function RegisterPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const mutation = useMutation({
    mutationFn: authApi.register
  });

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    mutation.mutate({ fullName, email, password });
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="auth-intro">
          <p className="eyebrow">Учет NDT-приборов</p>
          <h1>Регистрация</h1>
        </div>

        {mutation.isSuccess ? (
          <div className="notice">Заявка создана. Администратор должен одобрить учетную запись перед входом.</div>
        ) : null}

        <form className="stack-form" onSubmit={handleSubmit}>
          <label className="form-field">
            <span>ФИО</span>
            <input value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="Иванов Иван" required />
          </label>

          <label className="form-field">
            <span>Email</span>
            <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" placeholder="user@example.com" required />
          </label>

          <label className="form-field">
            <span>Пароль</span>
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              placeholder="Минимум 6 символов"
              required
              minLength={6}
            />
          </label>

          {mutation.error ? <p className="error-text">{getErrorMessage(mutation.error)}</p> : null}

          <button type="submit" className="button-wide" disabled={mutation.isPending}>
            {mutation.isPending ? "Отправка..." : "Зарегистрироваться"}
          </button>
        </form>

        <p className="auth-footer">
          Уже одобрены? <Link to="/login">Войти</Link>
        </p>
      </section>
    </main>
  );
}

function getErrorMessage(error: Error) {
  return error instanceof ApiError ? error.message : "Не удалось зарегистрироваться.";
}
