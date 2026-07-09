"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type StoredUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
};

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<StoredUser | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("kixipay_token");
    const rawUser = localStorage.getItem("kixipay_user");

    if (!token || !rawUser) {
      router.replace("/");
      return;
    }

    try {
      const parsedUser = JSON.parse(rawUser) as StoredUser;
      setUser(parsedUser);
    } catch {
      localStorage.removeItem("kixipay_token");
      localStorage.removeItem("kixipay_user");
      router.replace("/");
    }
  }, [router]);

  const onLogout = () => {
    localStorage.removeItem("kixipay_token");
    localStorage.removeItem("kixipay_user");
    router.replace("/");
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#5a0d19_0%,#1a0f11_42%,#0e0e0f_100%)] p-5 text-[#fbf7e6] sm:p-8">
      <section className="mx-auto max-w-4xl rounded-3xl border border-[#ffce00]/25 bg-[#151517]/85 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.45)] backdrop-blur-sm sm:p-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#ffce00]">kixipay</p>
            <h1 className="mt-2 text-3xl font-bold">Dashboard</h1>
            <p className="mt-2 text-sm text-[#d8cfb2]">
              Sessao autenticada com sucesso.
            </p>
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="h-11 rounded-xl bg-[#c8102e] px-5 text-sm font-semibold transition hover:bg-[#a40d25]"
          >
            Terminar sessao
          </button>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <article className="rounded-2xl border border-[#ffce00]/20 bg-[#0f0f10]/65 p-5">
            <p className="text-xs uppercase tracking-[0.16em] text-[#ffce00]">Nome</p>
            <p className="mt-2 text-lg font-semibold">
              {user ? `${user.firstName} ${user.lastName}` : "A carregar..."}
            </p>
          </article>
          <article className="rounded-2xl border border-[#ffce00]/20 bg-[#0f0f10]/65 p-5">
            <p className="text-xs uppercase tracking-[0.16em] text-[#ffce00]">Email</p>
            <p className="mt-2 text-lg font-semibold">{user?.email || "A carregar..."}</p>
          </article>
        </div>
      </section>
    </main>
  );
}
