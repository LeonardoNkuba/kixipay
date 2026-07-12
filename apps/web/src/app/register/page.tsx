"use client";

import { FormEvent, Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { LanguageSwitcher } from "@/components";
import { acceptInvitation } from "@/services/invitations";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get("token") || "";
  const { register } = useAuth();
  const { t } = useLanguage();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState(searchParams.get("email") || "");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("kixipay_token");
    if (token && !inviteToken) {
      router.replace("/dashboard");
    }
  }, [router, inviteToken]);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");

    if (password.length < 6) {
      setErrorMessage(t("auth.register.passwordTooShort"));
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage(t("auth.register.passwordMismatch"));
      return;
    }

    setIsLoading(true);

    try {
      const result = await register({
        firstName,
        lastName,
        email,
        phone: phone || undefined,
        password,
      });

      if (inviteToken) {
        const invite = await acceptInvitation(result.token, inviteToken);
        router.push(`/groups/${invite.groupId}`);
        return;
      }

      router.push("/dashboard");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : t("auth.register.genericError"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
      <section className="relative z-10 w-full max-w-5xl overflow-hidden rounded-3xl border border-[#ffce00]/25 bg-[#141416]/90 shadow-[0_24px_70px_rgba(0,0,0,0.45)] backdrop-blur-sm">
        <div className="relative p-6 sm:p-8 md:p-10 lg:p-12">
          <div className="pointer-events-none absolute -left-16 -top-16 h-44 w-44 rounded-full bg-[#ffce00]/18" />
          <div className="pointer-events-none absolute left-6 top-14 h-36 w-36 rounded-full border-8 border-[#c8102e]/35" />

          <div className="flex justify-end">
            <LanguageSwitcher variant="dark" />
          </div>

          <header className="mx-auto flex max-w-md flex-col items-center gap-2 text-center">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#ffce00]">
              kixipay
            </p>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{t("auth.register.title")}</h1>
            <p className="text-sm text-[#d8cfb2]">{t("auth.register.subtitle")}</p>
          </header>

          <form
            className="mx-auto mt-10 w-full max-w-md space-y-5"
            aria-label="Formulario de registro"
            onSubmit={onSubmit}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="firstName" className="text-sm text-[#ffce00]">
                  {t("auth.register.firstName")}
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  placeholder="Leonardo"
                  value={firstName}
                  onChange={(event) => setFirstName(event.target.value)}
                  required
                  minLength={2}
                  className="h-12 w-full rounded-xl border border-[#ffce00]/35 bg-[#0f0f10]/60 px-4 text-sm outline-none transition focus:border-[#ffce00] focus:ring-2 focus:ring-[#ffce00]/35"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="lastName" className="text-sm text-[#ffce00]">
                  {t("auth.register.lastName")}
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  placeholder="Silva"
                  value={lastName}
                  onChange={(event) => setLastName(event.target.value)}
                  required
                  minLength={2}
                  className="h-12 w-full rounded-xl border border-[#ffce00]/35 bg-[#0f0f10]/60 px-4 text-sm outline-none transition focus:border-[#ffce00] focus:ring-2 focus:ring-[#ffce00]/35"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm text-[#ffce00]">
                {t("auth.register.email")}
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
              <label htmlFor="phone" className="text-sm text-[#ffce00]">
                {t("auth.register.phone")} <span className="text-[#d8cfb2]">{t("auth.register.phoneOptional")}</span>
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                placeholder="+244 9XX XXX XXX"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                className="h-12 w-full rounded-xl border border-[#ffce00]/35 bg-[#0f0f10]/60 px-4 text-sm outline-none transition focus:border-[#ffce00] focus:ring-2 focus:ring-[#ffce00]/35"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="text-sm text-[#ffce00]">
                    {t("auth.register.password")}
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="text-xs text-[#d8cfb2] transition hover:text-[#ffce00]"
                  >
                    {showPassword ? t("auth.login.hide") : t("auth.login.show")}
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
                  {t("auth.register.confirmPassword")}
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
            </div>

            <p className="text-xs text-[#d8cfb2]">{t("auth.register.hint")}</p>

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
              {isLoading ? t("auth.register.submitting") : t("auth.register.submit")}
            </button>

            <div className="flex flex-col items-center justify-center gap-3 pt-1 text-sm text-[#d8cfb2]">
              <span>
                {t("auth.register.alreadyHaveAccount")}{" "}
                <Link href="/" className="font-semibold text-[#ffce00] transition hover:underline">
                  {t("auth.register.login")}
                </Link>
              </span>
            </div>
          </form>
        </div>
      </section>
  );
}

export default function RegisterPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_20%_10%,#6f101f_0%,#2b0a10_40%,#0f0f10_100%)] px-4 py-8 text-[#fbf7e6] sm:px-6 lg:px-10">
      <div className="pointer-events-none absolute -left-20 top-6 h-72 w-72 rounded-full bg-[#c8102e]/45 blur-2xl" />
      <div className="pointer-events-none absolute -right-20 bottom-10 h-72 w-72 rounded-full bg-[#ffce00]/30 blur-2xl" />
      <Suspense fallback={null}>
        <RegisterForm />
      </Suspense>
    </main>
  );
}
