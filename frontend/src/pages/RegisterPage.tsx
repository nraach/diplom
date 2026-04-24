import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { authApi } from "../api/auth.api";
import { ApiError } from "../api/client";

type RegisterFieldName = "fullName" | "email" | "password";

type ValidationErrorDetails = {
  fieldErrors?: Partial<Record<RegisterFieldName, string[]>>;
};

export function RegisterPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const mutation = useMutation({
    mutationFn: authApi.register
  });
  const fieldErrors = getRegisterFieldErrors(mutation.error);

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
            <input
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              placeholder="Иванов Иван"
              required
              aria-invalid={Boolean(fieldErrors.fullName)}
              className={fieldErrors.fullName ? "input-error" : undefined}
            />
            {fieldErrors.fullName ? <span className="field-error">{fieldErrors.fullName}</span> : null}
          </label>

          <label className="form-field">
            <span>Email</span>
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              type="email"
              placeholder="user@example.com"
              required
              aria-invalid={Boolean(fieldErrors.email)}
              className={fieldErrors.email ? "input-error" : undefined}
            />
            {fieldErrors.email ? <span className="field-error">{fieldErrors.email}</span> : null}
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
              aria-invalid={Boolean(fieldErrors.password)}
              className={fieldErrors.password ? "input-error" : undefined}
            />
            {fieldErrors.password ? <span className="field-error">{fieldErrors.password}</span> : null}
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

function getRegisterFieldErrors(error: Error | null) {
  if (!(error instanceof ApiError)) {
    return {} as Partial<Record<RegisterFieldName, string>>;
  }

  const details = error.details as ValidationErrorDetails | undefined;
  const errors = details?.fieldErrors;

  return {
    fullName: errors?.fullName?.[0],
    email: errors?.email?.[0],
    password: errors?.password?.[0]
  };
}
