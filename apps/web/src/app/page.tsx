"use client";

import { FormEvent, Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/dashboard";
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("kixipay_token");
    if (token) {
      router.replace(redirectTo);
    }
  }, [router, redirectTo]);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");
    setIsLoading(true);

    try {
      await login(email, password);
      router.push(redirectTo);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Erro inesperado ao autenticar.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
      <section className="relative z-10 w-full max-w-5xl overflow-hidden rounded-3xl border border-[#ffce00]/25 bg-[#141416]/90 shadow-[0_24px_70px_rgba(0,0,0,0.45)] backdrop-blur-sm">
        <div className="relative p-6 sm:p-8 md:p-10 lg:p-12">
          <div className="pointer-events-none absolute -left-16 -top-16 h-44 w-44 rounded-full bg-[#ffce00]/18" />
          <div className="pointer-events-none absolute left-6 top-14 h-36 w-36 rounded-full border-8 border-[#c8102e]/35" />

          <header className="mx-auto flex max-w-md flex-col items-center gap-2 text-center">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#ffce00]">
              kixipay
            </p>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Bem-vindo de volta</h1>
            <p className="text-sm text-[#d8cfb2]">
              Entre para acompanhar sua kixikila com transparencia e seguranca.
            </p>
          </header>

          <form
            className="mx-auto mt-10 w-full max-w-md space-y-6"
            aria-label="Formulario de login"
            onSubmit={onSubmit}
          >
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm text-[#ffce00]">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="seunome@email.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                className="h-12 w-full rounded-xl border border-[#ffce00]/35 bg-[#0f0f10]/60 px-4 text-sm outline-none transition focus:border-[#ffce00] focus:ring-2 focus:ring-[#ffce00]/35"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-sm text-[#ffce00]">
                  Palavra-passe
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
                className="h-12 w-full rounded-xl border border-[#ffce00]/35 bg-[#0f0f10]/60 px-4 text-sm outline-none transition focus:border-[#ffce00] focus:ring-2 focus:ring-[#ffce00]/35"
              />
              <p className="text-xs text-[#d8cfb2]">Use no minimo 6 caracteres.</p>
            </div>

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
              {isLoading ? "A entrar..." : "Entrar"}
            </button>

            <div className="flex flex-col items-center justify-between gap-3 pt-1 text-sm text-[#d8cfb2] sm:flex-row">
              <Link href="/forgot-password" className="transition hover:text-[#ffce00]">
                Esqueci a palavra-passe
              </Link>
              <Link href="/register" className="transition hover:text-[#ffce00]">
                Criar conta
              </Link>
            </div>
          </form>

          <footer className="mt-10 flex flex-col items-center justify-center gap-3 border-t border-[#ffce00]/20 pt-6 text-xs text-[#d8cfb2] sm:flex-row">
            <button type="button" className="transition hover:text-[#ffce00]">
              Termos de uso
            </button>
            <span className="hidden sm:inline">|</span>
            <button type="button" className="transition hover:text-[#ffce00]">
              Politica de privacidade
            </button>
          </footer>
        </div>
      </section>
  );
}

export default function Home() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_20%_10%,#6f101f_0%,#2b0a10_40%,#0f0f10_100%)] px-4 py-8 text-[#fbf7e6] sm:px-6 lg:px-10">
      <div className="pointer-events-none absolute -left-20 top-6 h-72 w-72 rounded-full bg-[#c8102e]/45 blur-2xl" />
      <div className="pointer-events-none absolute -right-20 bottom-10 h-72 w-72 rounded-full bg-[#ffce00]/30 blur-2xl" />

      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>

      <div className="fixed bottom-5 right-4 z-20 flex flex-col gap-3 sm:bottom-7 sm:right-7">
        <button className="rounded-xl bg-[#ffce00] px-4 py-3 text-sm font-semibold text-[#111111] shadow-[0_10px_24px_rgba(0,0,0,0.35)] transition hover:brightness-95">
          Pedir conta
        </button>
        <button className="rounded-xl bg-[#1f1f22] px-4 py-3 text-sm font-semibold text-[#fbf7e6] shadow-[0_10px_24px_rgba(0,0,0,0.35)] transition hover:bg-[#2b2b30]">
          Precisa de ajuda?
        </button>
      </div>
    </main>
  );
}