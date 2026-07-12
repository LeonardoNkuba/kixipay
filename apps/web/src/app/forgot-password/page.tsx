"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/hooks/useLanguage";
import { LanguageSwitcher } from "@/components";
import { requestPasswordReset } from "@/services/auth";

export default function ForgotPasswordPage() {
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");
    setIsLoading(true);

    try {
      await requestPasswordReset(email);
      setSubmitted(true);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : t("auth.forgotPassword.genericError"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_20%_10%,#6f101f_0%,#2b0a10_40%,#0f0f10_100%)] px-4 py-8 text-[#fbf7e6] sm:px-6 lg:px-10">
      <div className="pointer-events-none absolute -left-20 top-6 h-72 w-72 rounded-full bg-[#c8102e]/45 blur-2xl" />
      <div className="pointer-events-none absolute -right-20 bottom-10 h-72 w-72 rounded-full bg-[#ffce00]/30 blur-2xl" />

      <section className="relative z-10 w-full max-w-md overflow-hidden rounded-3xl border border-[#ffce00]/25 bg-[#141416]/90 shadow-[0_24px_70px_rgba(0,0,0,0.45)] backdrop-blur-sm">
        <div className="relative p-6 sm:p-8 md:p-10">
          <div className="pointer-events-none absolute -left-16 -top-16 h-44 w-44 rounded-full bg-[#ffce00]/18" />

          <div className="flex justify-end">
            <LanguageSwitcher variant="dark" />
          </div>

          <header className="mx-auto flex flex-col items-center gap-2 text-center">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#ffce00]">
              kixipay
            </p>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{t("auth.forgotPassword.title")}</h1>
            <p className="text-sm text-[#d8cfb2]">{t("auth.forgotPassword.subtitle")}</p>
          </header>

          {submitted ? (
            <div className="mt-8 space-y-4 text-center">
              <p className="rounded-lg border border-[#3f7d4a]/60 bg-[#204426]/40 px-4 py-3 text-sm text-[#c8f0cf]">
                {t("auth.forgotPassword.successMessage")}
              </p>
              <p className="text-xs text-[#d8cfb2]">{t("auth.forgotPassword.demoNotice")}</p>
              <Link href="/" className="inline-block text-sm font-semibold text-[#ffce00] hover:underline">
                {t("auth.forgotPassword.backToLogin")}
              </Link>
            </div>
          ) : (
            <form className="mx-auto mt-8 w-full space-y-5" onSubmit={onSubmit}>
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm text-[#ffce00]">
                  {t("auth.forgotPassword.email")}
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
                {isLoading ? t("auth.forgotPassword.submitting") : t("auth.forgotPassword.submit")}
              </button>

              <div className="flex items-center justify-center pt-1 text-sm text-[#d8cfb2]">
                <Link href="/" className="transition hover:text-[#ffce00]">
                  {t("auth.forgotPassword.backToLogin")}
                </Link>
              </div>
            </form>
          )}
        </div>
      </section>
    </main>
  );
}
