"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { apiFetch } from "@/services/api";
import { getGroupById, updateGroup, updateGroupStatus } from "@/services/groups";
import { createInvitation, Invitation, listInvitations } from "@/services/invitations";
import { removeMember, updateMemberRole } from "@/services/members";
import { Contribution, Group, Membership } from "@/types/domain";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Input,
  Loading,
  Modal,
  Select,
  Table,
} from "@/components";
import { useAuth } from "@/hooks/useAuth";
import { useLoans } from "@/hooks/useLoans";
import { useMembers } from "@/hooks/useMembers";
import { formatCurrency, formatDate } from "@/utils/format";

type Tab = "resumo" | "membros" | "contribuicoes" | "emprestimos";
type Role = "ADMIN" | "TREASURER" | "MEMBER";

const statusLabel: Record<Group["status"], string> = {
  ACTIVE: "Ativo",
  PAUSED: "Pausado",
  CLOSED: "Encerrado",
};

const statusTone: Record<Group["status"], "success" | "warning" | "danger"> = {
  ACTIVE: "success",
  PAUSED: "warning",
  CLOSED: "danger",
};

export default function GroupDetailPage() {
  const params = useParams<{ groupId: string }>();
  const groupId = params.groupId;
  const { token, user } = useAuth();

  const [group, setGroup] = useState<Group | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<Tab>("resumo");
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [isContribLoading, setIsContribLoading] = useState(false);

  const { loans, isLoading: isLoansLoading, requestLoan, decideLoan, payLoan } = useLoans(
    token,
    groupId,
  );
  const { members } = useMembers(group?.memberships);

  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [isInvitationsLoading, setIsInvitationsLoading] = useState(false);
  const [memberEmail, setMemberEmail] = useState("");
  const [memberRole, setMemberRole] = useState<Role>("MEMBER");
  const [isInviting, setIsInviting] = useState(false);
  const [inviteMessage, setInviteMessage] = useState("");
  const [inviteError, setInviteError] = useState("");
  const [memberActionError, setMemberActionError] = useState("");

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editError, setEditError] = useState("");
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editMonthlyContribution, setEditMonthlyContribution] = useState("");
  const [editMaxMembers, setEditMaxMembers] = useState("");
  const [editCycleType, setEditCycleType] = useState<"WEEKLY" | "MONTHLY">("MONTHLY");
  const [isChangingStatus, setIsChangingStatus] = useState(false);

  const [isLoanOpen, setIsLoanOpen] = useState(false);
  const [isSavingLoan, setIsSavingLoan] = useState(false);
  const [loanError, setLoanError] = useState("");
  const [loanAmount, setLoanAmount] = useState("");
  const [loanInterestRate, setLoanInterestRate] = useState("10");
  const [loanReason, setLoanReason] = useState("");
  const [loanDueDate, setLoanDueDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [loanActionError, setLoanActionError] = useState("");
  const [payingLoanId, setPayingLoanId] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [isSavingPayment, setIsSavingPayment] = useState(false);

  const reloadGroup = () => {
    if (!token || !groupId) {
      return;
    }

    return getGroupById(token, groupId).then((data) => setGroup(data));
  };

  useEffect(() => {
    if (!token || !groupId) {
      return;
    }

    setIsLoading(true);
    setError("");

    getGroupById(token, groupId)
      .then((data) => setGroup(data))
      .catch((err) => setError(err instanceof Error ? err.message : "Erro ao carregar grupo."))
      .finally(() => setIsLoading(false));
  }, [groupId, token]);

  useEffect(() => {
    if (!token || !groupId || tab !== "contribuicoes") {
      return;
    }

    setIsContribLoading(true);
    apiFetch<Contribution[]>(`/contributions/group/${groupId}`, { method: "GET" }, token)
      .then((data) => setContributions(data))
      .catch(() => setContributions([]))
      .finally(() => setIsContribLoading(false));
  }, [groupId, tab, token]);

  const loadInvitations = () => {
    if (!token || !groupId) {
      return;
    }

    setIsInvitationsLoading(true);
    listInvitations(token, groupId)
      .then((data) => setInvitations(data.filter((item) => item.status === "PENDING")))
      .catch(() => setInvitations([]))
      .finally(() => setIsInvitationsLoading(false));
  };

  useEffect(() => {
    if (tab !== "membros") {
      return;
    }

    loadInvitations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId, tab, token]);

  const currentMembership: Membership | undefined = useMemo(() => {
    return group?.memberships?.find((item) => item.userId === user?.id);
  }, [group, user]);

  const isAdmin = currentMembership?.role === "ADMIN";
  const canApproveLoans = currentMembership?.role === "ADMIN" || currentMembership?.role === "TREASURER";

  const estimatedBalance = useMemo(() => {
    if (!group) {
      return 0;
    }

    const activeMembers = members.filter((member) => member.isActive).length;
    return Number(group.monthlyContribution) * activeMembers;
  }, [group, members]);

  const onAddMember = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token || !groupId) {
      return;
    }

    setInviteError("");
    setInviteMessage("");
    setIsInviting(true);

    try {
      await createInvitation(token, { groupId, email: memberEmail, role: memberRole });
      setInviteMessage(
        "Convite gerado. Modo demo: verifique o console/terminal da API para encontrar o link.",
      );
      setMemberEmail("");
      setMemberRole("MEMBER");
      loadInvitations();
    } catch (error) {
      setInviteError(error instanceof Error ? error.message : "Erro ao gerar convite.");
    } finally {
      setIsInviting(false);
    }
  };

  const openEditModal = () => {
    if (!group) {
      return;
    }

    setEditName(group.name);
    setEditDescription(group.description || "");
    setEditMonthlyContribution(String(Number(group.monthlyContribution)));
    setEditMaxMembers(group.maxMembers ? String(group.maxMembers) : "");
    setEditCycleType(group.cycleType);
    setEditError("");
    setIsEditOpen(true);
  };

  const onSaveEdit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token || !groupId) {
      return;
    }

    setEditError("");
    setIsSavingEdit(true);

    try {
      await updateGroup(token, groupId, {
        name: editName,
        description: editDescription || undefined,
        monthlyContribution: Number(editMonthlyContribution),
        maxMembers: editMaxMembers ? Number(editMaxMembers) : undefined,
        cycleType: editCycleType,
      });
      await reloadGroup();
      setIsEditOpen(false);
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "Erro ao atualizar grupo.");
    } finally {
      setIsSavingEdit(false);
    }
  };

  const onChangeStatus = async (status: Group["status"]) => {
    if (!token || !groupId) {
      return;
    }

    const confirmMessage =
      status === "CLOSED"
        ? "Encerrar este grupo? Membros nao poderao mais registar novas contribuicoes ou emprestimos."
        : status === "PAUSED"
          ? "Pausar este grupo?"
          : "Reativar este grupo?";

    if (!window.confirm(confirmMessage)) {
      return;
    }

    setIsChangingStatus(true);
    try {
      await updateGroupStatus(token, groupId, status);
      await reloadGroup();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao atualizar status do grupo.");
    } finally {
      setIsChangingStatus(false);
    }
  };

  const onChangeMemberRole = async (membershipId: string, role: Role) => {
    if (!token || !groupId) {
      return;
    }

    setMemberActionError("");
    try {
      await updateMemberRole(token, groupId, membershipId, role);
      await reloadGroup();
    } catch (err) {
      setMemberActionError(err instanceof Error ? err.message : "Erro ao alterar cargo.");
    }
  };

  const onRemoveMember = async (membershipId: string, name: string) => {
    if (!token || !groupId) {
      return;
    }

    if (!window.confirm(`Remover ${name} do grupo?`)) {
      return;
    }

    setMemberActionError("");
    try {
      await removeMember(token, groupId, membershipId);
      await reloadGroup();
    } catch (err) {
      setMemberActionError(err instanceof Error ? err.message : "Erro ao remover membro.");
    }
  };

  const onRequestLoan = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!groupId) {
      return;
    }

    setLoanError("");
    setIsSavingLoan(true);

    try {
      await requestLoan({
        groupId,
        amount: Number(loanAmount),
        interestRate: Number(loanInterestRate),
        reason: loanReason || undefined,
        dueDate: loanDueDate,
      });
      setIsLoanOpen(false);
      setLoanAmount("");
      setLoanReason("");
    } catch (err) {
      setLoanError(err instanceof Error ? err.message : "Erro ao solicitar emprestimo.");
    } finally {
      setIsSavingLoan(false);
    }
  };

  const onDecideLoan = async (loanId: string, approved: boolean) => {
    setLoanActionError("");
    try {
      await decideLoan(loanId, approved);
    } catch (err) {
      setLoanActionError(err instanceof Error ? err.message : "Erro ao decidir emprestimo.");
    }
  };

  const onSubmitPayment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!payingLoanId) {
      return;
    }

    setLoanActionError("");
    setIsSavingPayment(true);

    try {
      await payLoan(payingLoanId, Number(paymentAmount));
      setPayingLoanId(null);
      setPaymentAmount("");
    } catch (err) {
      setLoanActionError(err instanceof Error ? err.message : "Erro ao registar pagamento.");
    } finally {
      setIsSavingPayment(false);
    }
  };

  if (isLoading) {
    return <Loading message="Carregando detalhes do grupo..." />;
  }

  if (error || !group) {
    return (
      <EmptyState
        title="Nao foi possivel abrir o grupo"
        description={error || "Grupo nao encontrado."}
        actionLabel="Voltar para Grupos"
        onAction={() => {
          window.location.href = "/groups";
        }}
      />
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <Link href="/groups" className="text-sm font-semibold text-[#6f101f] hover:underline">
          Voltar para grupos
        </Link>
        <h1 className="text-2xl font-bold text-[#2b2105]">{group.name}</h1>
        <Badge tone="info">{group.cycleType === "MONTHLY" ? "Mensal" : "Semanal"}</Badge>
        <Badge tone={statusTone[group.status]}>{statusLabel[group.status]}</Badge>

        {isAdmin ? (
          <div className="ml-auto flex flex-wrap gap-2">
            <Button variant="ghost" onClick={openEditModal}>
              Editar grupo
            </Button>
            {group.status !== "CLOSED" ? (
              <Button
                variant="ghost"
                disabled={isChangingStatus}
                onClick={() => onChangeStatus(group.status === "PAUSED" ? "ACTIVE" : "PAUSED")}
              >
                {group.status === "PAUSED" ? "Reativar" : "Pausar"}
              </Button>
            ) : null}
            {group.status !== "CLOSED" ? (
              <Button variant="ghost" disabled={isChangingStatus} onClick={() => onChangeStatus("CLOSED")}>
                Encerrar grupo
              </Button>
            ) : (
              <Button variant="ghost" disabled={isChangingStatus} onClick={() => onChangeStatus("ACTIVE")}>
                Reativar grupo
              </Button>
            )}
          </div>
        ) : null}
      </div>

      <Card>
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-[#8a7226]">Saldo estimado</p>
            <p className="mt-1 text-xl font-bold text-[#2a2004]">{formatCurrency(estimatedBalance, group.currency)}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-[#8a7226]">Membros ativos</p>
            <p className="mt-1 text-xl font-bold text-[#2a2004]">{members.filter((item) => item.isActive).length}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-[#8a7226]">Contribuicao</p>
            <p className="mt-1 text-xl font-bold text-[#2a2004]">
              {formatCurrency(Number(group.monthlyContribution), group.currency)}
            </p>
          </div>
        </div>
      </Card>

      <div className="flex flex-wrap gap-2">
        {(["resumo", "membros", "contribuicoes", "emprestimos"] as Tab[]).map((item) => (
          <Button key={item} variant={tab === item ? "primary" : "ghost"} onClick={() => setTab(item)}>
            {item[0].toUpperCase() + item.slice(1)}
          </Button>
        ))}
      </div>

      {tab === "resumo" ? (
        <Card title="Resumo" subtitle={group.description || "Sem descricao"}>
          <p className="text-sm text-[#584713]">
            Grupo iniciado em {formatDate(group.startDate)}. Esta area centraliza membros, contribuicoes e emprestimos.
          </p>
        </Card>
      ) : null}

      {tab === "membros" ? (
        <div className="space-y-4">
          <Card title="Convidar membro" subtitle="Gera um convite por email para entrar no grupo">
            <form className="grid gap-3 sm:grid-cols-3" onSubmit={onAddMember}>
              <Input
                label="Email"
                type="email"
                value={memberEmail}
                onChange={(event) => setMemberEmail(event.target.value)}
                required
              />
              <Select
                label="Cargo"
                value={memberRole}
                onChange={(event) => setMemberRole(event.target.value as Role)}
              >
                <option value="MEMBER">MEMBER</option>
                <option value="TREASURER">TREASURER</option>
                <option value="ADMIN">ADMIN</option>
              </Select>
              <div className="flex items-end">
                <Button type="submit" className="w-full" disabled={isInviting}>
                  {isInviting ? "Enviando..." : "Enviar convite"}
                </Button>
              </div>
            </form>

            {inviteMessage ? (
              <p className="mt-3 rounded-lg border border-[#3f7d4a]/60 bg-[#204426]/10 px-3 py-2 text-xs text-[#204426]">
                {inviteMessage}
              </p>
            ) : null}
            {inviteError ? (
              <p className="mt-3 rounded-lg border border-[#c8102e]/70 bg-[#c8102e]/10 px-3 py-2 text-xs text-[#6f101f]">
                {inviteError}
              </p>
            ) : null}
          </Card>

          {memberActionError ? (
            <p className="rounded-lg border border-[#c8102e]/70 bg-[#c8102e]/10 px-3 py-2 text-xs text-[#6f101f]">
              {memberActionError}
            </p>
          ) : null}

          <Table headers={["Nome", "Cargo", "Entrou em", "Status", isAdmin ? "Acoes" : ""]}>
            {(group.memberships || []).map((membership) => {
              const name = membership.user
                ? `${membership.user.firstName} ${membership.user.lastName}`
                : "Membro";
              const isSelf = membership.userId === user?.id;

              return (
                <tr key={membership.id}>
                  <td className="px-4 py-3">{name}</td>
                  <td className="px-4 py-3">
                    {isAdmin && membership.isActive ? (
                      <Select
                        value={membership.role}
                        onChange={(event) =>
                          onChangeMemberRole(membership.id, event.target.value as Role)
                        }
                        className="h-9"
                      >
                        <option value="MEMBER">MEMBER</option>
                        <option value="TREASURER">TREASURER</option>
                        <option value="ADMIN">ADMIN</option>
                      </Select>
                    ) : (
                      membership.role
                    )}
                  </td>
                  <td className="px-4 py-3">{formatDate(membership.joinedAt)}</td>
                  <td className="px-4 py-3">
                    <Badge tone={membership.isActive ? "success" : "warning"}>
                      {membership.isActive ? "Ativo" : "Inativo"}
                    </Badge>
                  </td>
                  {isAdmin ? (
                    <td className="px-4 py-3">
                      {membership.isActive ? (
                        <Button
                          variant="ghost"
                          className="h-8 px-2 text-xs"
                          onClick={() => onRemoveMember(membership.id, isSelf ? "voce" : name)}
                        >
                          Remover
                        </Button>
                      ) : null}
                    </td>
                  ) : null}
                </tr>
              );
            })}
          </Table>

          {isInvitationsLoading ? (
            <Loading message="Carregando convites..." />
          ) : invitations.length ? (
            <Card title="Convites pendentes">
              <Table headers={["Email", "Cargo", "Expira em"]}>
                {invitations.map((invitation) => (
                  <tr key={invitation.id}>
                    <td className="px-4 py-3">{invitation.email}</td>
                    <td className="px-4 py-3">{invitation.role}</td>
                    <td className="px-4 py-3">{formatDate(invitation.expiresAt)}</td>
                  </tr>
                ))}
              </Table>
            </Card>
          ) : null}
        </div>
      ) : null}

      {tab === "contribuicoes" ? (
        isContribLoading ? (
          <Loading message="Carregando contribuicoes..." />
        ) : contributions.length ? (
          <Table headers={["Membro", "Valor", "Referencia", "Status"]}>
            {contributions.map((item) => (
              <tr key={item.id}>
                <td className="px-4 py-3">{item.userId.slice(0, 8)}</td>
                <td className="px-4 py-3">{formatCurrency(Number(item.amount), group.currency)}</td>
                <td className="px-4 py-3">{formatDate(item.referenceMonth)}</td>
                <td className="px-4 py-3">
                  <Badge
                    tone={
                      item.status === "PAID"
                        ? "success"
                        : item.status === "LATE"
                          ? "danger"
                          : "warning"
                    }
                  >
                    {item.status}
                  </Badge>
                </td>
              </tr>
            ))}
          </Table>
        ) : (
          <EmptyState
            title="Sem contribuicoes"
            description="Nenhuma contribuicao foi registrada para este grupo."
          />
        )
      ) : null}

      {tab === "emprestimos" ? (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button
              disabled={group.status === "CLOSED"}
              onClick={() => {
                setLoanError("");
                setIsLoanOpen(true);
              }}
            >
              Solicitar emprestimo
            </Button>
          </div>

          {loanActionError ? (
            <p className="rounded-lg border border-[#c8102e]/70 bg-[#c8102e]/10 px-3 py-2 text-xs text-[#6f101f]">
              {loanActionError}
            </p>
          ) : null}

          {isLoansLoading ? (
            <Loading message="Carregando emprestimos..." />
          ) : loans.length ? (
            <Table headers={["Valor", "Juros", "Status", "Vencimento", "Acoes"]}>
              {loans.map((loan) => (
                <tr key={loan.id}>
                  <td className="px-4 py-3">{formatCurrency(Number(loan.amount), group.currency)}</td>
                  <td className="px-4 py-3">{Number(loan.interestRate)}%</td>
                  <td className="px-4 py-3">
                    <Badge
                      tone={
                        loan.status === "APPROVED"
                          ? "success"
                          : loan.status === "PENDING"
                            ? "warning"
                            : loan.status === "REJECTED"
                              ? "danger"
                              : "info"
                      }
                    >
                      {loan.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">{formatDate(loan.dueDate)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {loan.status === "PENDING" && canApproveLoans ? (
                        <>
                          <Button
                            variant="secondary"
                            className="h-8 px-2 text-xs"
                            onClick={() => onDecideLoan(loan.id, true)}
                          >
                            Aprovar
                          </Button>
                          <Button
                            variant="ghost"
                            className="h-8 px-2 text-xs"
                            onClick={() => onDecideLoan(loan.id, false)}
                          >
                            Rejeitar
                          </Button>
                        </>
                      ) : null}
                      {loan.status === "APPROVED" ? (
                        <Button
                          variant="ghost"
                          className="h-8 px-2 text-xs"
                          onClick={() => {
                            setLoanActionError("");
                            setPaymentAmount("");
                            setPayingLoanId(loan.id);
                          }}
                        >
                          Registar pagamento
                        </Button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </Table>
          ) : (
            <EmptyState title="Sem emprestimos" description="Nenhum emprestimo encontrado para este grupo." />
          )}
        </div>
      ) : null}

      <Modal title="Editar grupo" isOpen={isEditOpen} onClose={() => setIsEditOpen(false)}>
        <form className="space-y-4" onSubmit={onSaveEdit}>
          <Input label="Nome" value={editName} onChange={(event) => setEditName(event.target.value)} required />
          <Input
            label="Descricao"
            value={editDescription}
            onChange={(event) => setEditDescription(event.target.value)}
            placeholder="Opcional"
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Contribuicao mensal"
              type="number"
              min={1}
              value={editMonthlyContribution}
              onChange={(event) => setEditMonthlyContribution(event.target.value)}
              required
            />
            <Input
              label="Maximo de membros"
              type="number"
              min={1}
              value={editMaxMembers}
              onChange={(event) => setEditMaxMembers(event.target.value)}
            />
          </div>

          <Select
            label="Ciclo"
            value={editCycleType}
            onChange={(event) => setEditCycleType(event.target.value as "WEEKLY" | "MONTHLY")}
          >
            <option value="MONTHLY">Mensal</option>
            <option value="WEEKLY">Semanal</option>
          </Select>

          {editError ? <p className="text-sm text-[#a31533]">{editError}</p> : null}

          <div className="flex justify-end gap-2">
            <Button variant="ghost" type="button" onClick={() => setIsEditOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSavingEdit}>
              {isSavingEdit ? "A guardar..." : "Guardar"}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal title="Solicitar emprestimo" isOpen={isLoanOpen} onClose={() => setIsLoanOpen(false)}>
        <form className="space-y-4" onSubmit={onRequestLoan}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Valor"
              type="number"
              min={1}
              value={loanAmount}
              onChange={(event) => setLoanAmount(event.target.value)}
              required
            />
            <Input
              label="Juros (%)"
              type="number"
              min={0}
              value={loanInterestRate}
              onChange={(event) => setLoanInterestRate(event.target.value)}
              required
            />
          </div>
          <Input
            label="Motivo"
            value={loanReason}
            onChange={(event) => setLoanReason(event.target.value)}
            placeholder="Opcional"
          />
          <Input
            label="Data de vencimento"
            type="date"
            value={loanDueDate}
            onChange={(event) => setLoanDueDate(event.target.value)}
            required
          />

          {loanError ? <p className="text-sm text-[#a31533]">{loanError}</p> : null}

          <div className="flex justify-end gap-2">
            <Button variant="ghost" type="button" onClick={() => setIsLoanOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSavingLoan}>
              {isSavingLoan ? "A enviar..." : "Solicitar"}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        title="Registar pagamento"
        isOpen={Boolean(payingLoanId)}
        onClose={() => setPayingLoanId(null)}
      >
        <form className="space-y-4" onSubmit={onSubmitPayment}>
          <Input
            label="Valor pago"
            type="number"
            min={1}
            value={paymentAmount}
            onChange={(event) => setPaymentAmount(event.target.value)}
            required
          />

          {loanActionError ? <p className="text-sm text-[#a31533]">{loanActionError}</p> : null}

          <div className="flex justify-end gap-2">
            <Button variant="ghost" type="button" onClick={() => setPayingLoanId(null)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSavingPayment}>
              {isSavingPayment ? "A guardar..." : "Registar"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
