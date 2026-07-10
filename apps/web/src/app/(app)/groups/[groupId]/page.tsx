"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { apiFetch } from "@/services/api";
import { getGroupById } from "@/services/groups";
import { Contribution, Group } from "@/types/domain";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Input,
  Loading,
  Select,
  Table,
} from "@/components";
import { useAuth } from "@/hooks/useAuth";
import { useLoans } from "@/hooks/useLoans";
import { useMembers } from "@/hooks/useMembers";
import { formatCurrency, formatDate } from "@/utils/format";

type Tab = "resumo" | "membros" | "contribuicoes" | "emprestimos";

export default function GroupDetailPage() {
  const params = useParams<{ groupId: string }>();
  const groupId = params.groupId;
  const { token } = useAuth();

  const [group, setGroup] = useState<Group | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<Tab>("resumo");
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [isContribLoading, setIsContribLoading] = useState(false);

  const { loans, isLoading: isLoansLoading } = useLoans(token, groupId);
  const { members, addMember } = useMembers(group?.memberships);

  const [memberName, setMemberName] = useState("");
  const [memberEmail, setMemberEmail] = useState("");
  const [memberRole, setMemberRole] = useState<"ADMIN" | "TREASURER" | "MEMBER">("MEMBER");

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

  const estimatedBalance = useMemo(() => {
    if (!group) {
      return 0;
    }

    const activeMembers = members.filter((member) => member.isActive).length;
    return Number(group.monthlyContribution) * activeMembers;
  }, [group, members]);

  const onAddMember = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    addMember({
      name: memberName,
      email: memberEmail,
      role: memberRole,
    });

    setMemberName("");
    setMemberEmail("");
    setMemberRole("MEMBER");
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
          <Card title="Adicionar membro" subtitle="Formulario inicial (sem envio por convite ainda)">
            <form className="grid gap-3 sm:grid-cols-4" onSubmit={onAddMember}>
              <Input
                label="Nome"
                value={memberName}
                onChange={(event) => setMemberName(event.target.value)}
                required
              />
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
                onChange={(event) =>
                  setMemberRole(event.target.value as "ADMIN" | "TREASURER" | "MEMBER")
                }
              >
                <option value="MEMBER">MEMBER</option>
                <option value="TREASURER">TREASURER</option>
                <option value="ADMIN">ADMIN</option>
              </Select>
              <div className="flex items-end">
                <Button type="submit" className="w-full">
                  Adicionar
                </Button>
              </div>
            </form>
          </Card>

          <Table headers={["Nome", "Cargo", "Entrou em", "Status", "Origem"]}>
            {members.map((member) => (
              <tr key={member.id}>
                <td className="px-4 py-3">{member.name}</td>
                <td className="px-4 py-3">{member.role}</td>
                <td className="px-4 py-3">{formatDate(member.joinedAt)}</td>
                <td className="px-4 py-3">
                  <Badge tone={member.isActive ? "success" : "warning"}>
                    {member.isActive ? "Ativo" : "Inativo"}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <Badge tone={member.source === "api" ? "info" : "neutral"}>
                    {member.source === "api" ? "API" : "Formulario"}
                  </Badge>
                </td>
              </tr>
            ))}
          </Table>
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
        isLoansLoading ? (
          <Loading message="Carregando emprestimos..." />
        ) : loans.length ? (
          <Table headers={["Valor", "Juros", "Status", "Vencimento"]}>
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
              </tr>
            ))}
          </Table>
        ) : (
          <EmptyState title="Sem emprestimos" description="Nenhum emprestimo encontrado para este grupo." />
        )
      ) : null}
    </div>
  );
}
