"use client";

import { FormEvent, Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { resetPassword } from "@/services/auth";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [success, setSuccess] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");

    if (!token) {
      setErrorMessage("Token de recuperacao ausente ou invalido. Solicite um novo link.");
      return;
    }

    if (password.length < 6) {
      setErrorMessage("A palavra-passe deve ter no minimo 6 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("As palavras-passe nao coincidem.");
      return;
    }

    setIsLoading(true);

    try {
      await resetPassword(token, password);
      setSuccess(true);
      setTimeout(() => router.push("/"), 2000);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Erro ao redefinir a palavra-passe.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="relative z-10 w-full max-w-md overflow-hidden rounded-3xl border border-[#ffce00]/25 bg-[#141416]/90 shadow-[0_24px_70px_rgba(0,0,0,0.45)] backdrop-blur-sm">
      <div className="relative p-6 sm:p-8 md:p-10">
        <div className="pointer-events-none absolute -left-16 -top-16 h-44 w-44 rounded-full bg-[#ffce00]/18" />

        <header className="mx-auto flex flex-col items-center gap-2 text-center">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#ffce00]">kixipay</p>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Definir nova senha</h1>
          <p className="text-sm text-[#d8cfb2]">Escolha uma nova palavra-passe para a sua conta.</p>
        </header>

        {!token ? (
          <div className="mt-8 space-y-4 text-center">
            <p className="rounded-lg border border-[#c8102e]/70 bg-[#c8102e]/15 px-4 py-3 text-sm text-[#ffb8c4]">
              Este link parece invalido ou incompleto.
            </p>
            <Link href="/forgot-password" className="inline-block text-sm font-semibold text-[#ffce00] hover:underline">
              Solicitar novo link
            </Link>
          </div>
        ) : success ? (
          <div className="mt-8 space-y-4 text-center">
            <p className="rounded-lg border border-[#3f7d4a]/60 bg-[#204426]/40 px-4 py-3 text-sm text-[#c8f0cf]">
              Palavra-passe atualizada com sucesso. Redirecionando para o login...
            </p>
          </div>
        ) : (
          <form className="mx-auto mt-8 w-full space-y-5" onSubmit={onSubmit}>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-sm text-[#ffce00]">
                  Nova palavra-passe
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="text-xs text-[#d8cfb2] transition hover:text-[#ffce00]"
                >
                  {showPassword ? "Ocultar" : "Mostrar"}
                </button>
              </div>
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                minLength={6}
                className="h-12 w-full rounded-xl border border-[#ffce00]/35 bg-[#0f0f10]/60 px-4 text-sm outline-none transition focus:border-[#ffce00] focus:ring-2 focus:ring-[#ffce00]/35"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="text-sm text-[#ffce00]">
                Confirmar nova palavra-passe
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                required
                minLength={6}
                className="h-12 w-full rounded-xl border border-[#ffce00]/35 bg-[#0f0f10]/60 px-4 text-sm outline-none transition focus:border-[#ffce00] focus:ring-2 focus:ring-[#ffce00]/35"
              />
            </div>

            <p className="text-xs text-[#d8cfb2]">Use no minimo 6 caracteres.</p>

            {errorMessage ? (
              <p className="rounded-lg border border-[#c8102e]/70 bg-[#c8102e]/15 px-3 py-2 text-xs text-[#ffb8c4]">
                {errorMessage}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={isLoading}
              className="h-12 w-full rounded-xl bg-[#c8102e] text-sm font-semibold tracking-wide text-[#fbf7e6] transition hover:bg-[#a40d25] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isLoading ? "A atualizar..." : "Redefinir palavra-passe"}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_20%_10%,#6f101f_0%,#2b0a10_40%,#0f0f10_100%)] px-4 py-8 text-[#fbf7e6] sm:px-6 lg:px-10">
      <div className="pointer-events-none absolute -left-20 top-6 h-72 w-72 rounded-full bg-[#c8102e]/45 blur-2xl" />
      <div className="pointer-events-none absolute -right-20 bottom-10 h-72 w-72 rounded-full bg-[#ffce00]/30 blur-2xl" />
      <Suspense fallback={null}>
        <ResetPasswordForm />
      </Suspense>
    </main>
  );
}