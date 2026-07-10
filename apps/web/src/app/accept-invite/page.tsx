"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { acceptInvitation, getInvitationByToken, InvitationPreview } from "@/services/invitations";

function AcceptInviteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get("token") || "";
  const { token, user, isLoading: isAuthLoading, logout } = useAuth();

  const [preview, setPreview] = useState<InvitationPreview | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(true);
  const [previewError, setPreviewError] = useState("");
  const [isAccepting, setIsAccepting] = useState(false);
  const [acceptError, setAcceptError] = useState("");

  useEffect(() => {
    if (!inviteToken) {
      setIsLoadingPreview(false);
      return;
    }

    getInvitationByToken(inviteToken)
      .then((data) => setPreview(data))
      .catch((error) =>
        setPreviewError(error instanceof Error ? error.message : "Convite invalido ou expirado."),
      )
      .finally(() => setIsLoadingPreview(false));
  }, [inviteToken]);

  const onAccept = async () => {
    if (!token) {
      return;
    }

    setAcceptError("");
    setIsAccepting(true);

    try {
      const result = await acceptInvitation(token, inviteToken);
      router.push(`/groups/${result.groupId}`);
    } catch (error) {
      setAcceptError(error instanceof Error ? error.message : "Erro ao aceitar convite.");
      setIsAccepting(false);
    }
  };

  const emailMatches = Boolean(
    preview && user && preview.email.toLowerCase() === user.email.toLowerCase(),
  );

  return (
    <section className="relative z-10 w-full max-w-md overflow-hidden rounded-3xl border border-[#ffce00]/25 bg-[#141416]/90 shadow-[0_24px_70px_rgba(0,0,0,0.45)] backdrop-blur-sm">
      <div className="relative p-6 sm:p-8 md:p-10">
        <div className="pointer-events-none absolute -left-16 -top-16 h-44 w-44 rounded-full bg-[#ffce00]/18" />

        <header className="mx-auto flex flex-col items-center gap-2 text-center">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#ffce00]">kixipay</p>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Convite para grupo</h1>
        </header>

        {!inviteToken || previewError ? (
          <div className="mt-8 space-y-4 text-center">
            <p className="rounded-lg border border-[#c8102e]/70 bg-[#c8102e]/15 px-4 py-3 text-sm text-[#ffb8c4]">
              {previewError || "Este link de convite parece invalido ou incompleto."}
            </p>
            <Link href="/" className="inline-block text-sm font-semibold text-[#ffce00] hover:underline">
              Voltar para o login
            </Link>
          </div>
        ) : isLoadingPreview || isAuthLoading ? (
          <p className="mt-8 text-center text-sm text-[#d8cfb2]">Carregando convite...</p>
        ) : preview ? (
          <div className="mt-8 space-y-5">
            <div className="space-y-1 rounded-xl border border-[#ffce00]/25 bg-[#0f0f10]/60 px-4 py-3 text-center">
              <p className="text-sm text-[#d8cfb2]">Voce foi convidado para</p>
              <p className="text-lg font-bold text-[#fbf7e6]">{preview.groupName}</p>
              <p className="text-xs text-[#d8cfb2]">
                Cargo: {preview.role} · Email convidado: {preview.email}
              </p>
            </div>

            {!token ? (
              <div className="flex flex-col gap-3">
                <Link
                  href={`/register?token=${inviteToken}&email=${encodeURIComponent(preview.email)}`}
                  className="h-12 w-full rounded-xl bg-[#c8102e] px-4 text-center text-sm font-semibold leading-[3rem] text-[#fbf7e6] transition hover:bg-[#a40d25]"
                >
                  Criar conta e entrar no grupo
                </Link>
                <Link
                  href={`/?redirect=${encodeURIComponent(`/accept-invite?token=${inviteToken}`)}`}
                  className="h-12 w-full rounded-xl border border-[#ffce00]/35 px-4 text-center text-sm font-semibold leading-[3rem] text-[#ffce00] transition hover:bg-[#ffce00]/10"
                >
                  Ja tenho conta
                </Link>
              </div>
            ) : emailMatches ? (
              <div className="space-y-3">
                {acceptError ? (
                  <p className="rounded-lg border border-[#c8102e]/70 bg-[#c8102e]/15 px-3 py-2 text-xs text-[#ffb8c4]">
                    {acceptError}
                  </p>
                ) : null}
                <button
                  type="button"
                  onClick={onAccept}
                  disabled={isAccepting}
                  className="h-12 w-full rounded-xl bg-[#c8102e] text-sm font-semibold tracking-wide text-[#fbf7e6] transition hover:bg-[#a40d25] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isAccepting ? "A entrar no grupo..." : "Aceitar convite"}
                </button>
              </div>
            ) : (
              <div className="space-y-3 text-center">
                <p className="rounded-lg border border-[#c8102e]/70 bg-[#c8102e]/15 px-4 py-3 text-xs text-[#ffb8c4]">
                  Este convite foi emitido para {preview.email}, mas voce esta autenticado como{" "}
                  {user?.email}.
                </p>
                <button
                  type="button"
                  onClick={logout}
                  className="text-sm font-semibold text-[#ffce00] hover:underline"
                >
                  Sair e entrar com outra conta
                </button>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </section>
  );
}

export default function AcceptInvitePage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_20%_10%,#6f101f_0%,#2b0a10_40%,#0f0f10_100%)] px-4 py-8 text-[#fbf7e6] sm:px-6 lg:px-10">
      <div className="pointer-events-none absolute -left-20 top-6 h-72 w-72 rounded-full bg-[#c8102e]/45 blur-2xl" />
      <div className="pointer-events-none absolute -right-20 bottom-10 h-72 w-72 rounded-full bg-[#ffce00]/30 blur-2xl" />
      <Suspense fallback={null}>
        <AcceptInviteContent />
      </Suspense>
    </main>
  );
}
