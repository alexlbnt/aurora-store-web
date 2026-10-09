"use client";

import { useActionState, useState } from "react";
import { authenticate } from "./actions";
import Link from "next/link";

const fieldClass =
  "w-full min-h-12 rounded-lg border border-primary/25 bg-accent-cream px-4 text-primary placeholder:text-primary/40";

export default function LoginPage() {
  const [errorMessage, formAction, isPending] = useActionState(authenticate, undefined);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background-light p-4">
      <Link href="/" className="mb-8 font-serif text-5xl text-primary">
        Aurora
      </Link>

      <div className="w-full max-w-md rounded-lg border border-primary/10 bg-white p-8">
        <h1 className="mb-1 text-2xl font-semibold text-primary">Entrar no painel</h1>
        <p className="mb-8 text-sm text-primary/70">Use o e-mail e a senha da sua conta de administrador.</p>

        <form action={formAction} className="flex flex-col gap-5">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-primary" htmlFor="email">
              E-mail
            </label>
            <input
              className={fieldClass}
              id="email"
              type="email"
              name="email"
              autoComplete="username"
              placeholder="voce@aurora.com.br"
              required
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-primary" htmlFor="password">
              Senha
            </label>
            <div className="relative">
              <input
                className={`${fieldClass} pr-12`}
                id="password"
                type={showPassword ? "text" : "password"}
                name="password"
                autoComplete="current-password"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                aria-pressed={showPassword}
                className="absolute right-1 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-lg text-primary/70 hover:bg-primary/10"
              >
                <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
                  {showPassword ? "visibility_off" : "visibility"}
                </span>
              </button>
            </div>
          </div>

          {errorMessage && (
            <div role="alert" className="flex items-start gap-2 rounded-lg border border-dawn-ink/40 bg-dawn/10 p-3 text-sm text-dawn-ink">
              <span className="material-symbols-outlined mt-0.5 text-[18px]" aria-hidden="true">error</span>
              <p>{errorMessage}</p>
            </div>
          )}

          <button
            className="flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 font-semibold text-white transition-colors hover:bg-accent-blue disabled:cursor-not-allowed disabled:opacity-70"
            type="submit"
            disabled={isPending}
          >
            {isPending ? (
              <>
                <span className="material-symbols-outlined animate-spin" aria-hidden="true">progress_activity</span>
                Entrando…
              </>
            ) : (
              "Entrar"
            )}
          </button>

          <p className="text-center text-sm text-primary/70">
            Esqueceu a senha? Fale com quem cuida do sistema.
          </p>
        </form>
      </div>
    </div>
  );
}
