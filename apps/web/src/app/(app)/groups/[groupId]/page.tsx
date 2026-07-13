"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { apiFetch } from "@/services/api";
import { createContribution } from "@/services/contributions";
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
import { useLanguage } from "@/hooks/useLanguage";
import { useLoans } from "@/hooks/useLoans";
import { useMembers } from "@/hooks/useMembers";
import { formatCurrency, formatDate } from "@/utils/format";

type Tab = "resumo" | "membros" | "contribuicoes" | "emprestimos";
type Role = "ADMIN" | "TREASURER" | "MEMBER";

const statusTone: Record<Group["status"], "success" | "warning" | "danger"> = {
  ACTIVE: "success",
  PAUSED: "warning",
  CLOSED: "danger",
};

export default function GroupDetailPage() {
  const params = useParams<{ groupId: string }>();
  const groupId = params.groupId;
  const { token, user } = useAuth();
  const { t } = useLanguage();

  const statusLabel: Record<Group["status"], string> = {
    ACTIVE: t("groupDetail.statusActive"),
    PAUSED: t("groupDetail.statusPaused"),
    CLOSED: t("groupDetail.statusClosed"),
  };

  const tabLabel: Record<Tab, string> = {
    resumo: t("groupDetail.tabSummary"),
    membros: t("groupDetail.tabMembers"),
    contribuicoes: t("groupDetail.tabContributions"),
    emprestimos: t("groupDetail.tabLoans"),
  };

  const roleLabel: Record<Role, string> = {
    ADMIN: t("common.roleAdmin"),
    TREASURER: t("common.roleTreasurer"),
    MEMBER: t("common.roleMember"),
  };

  const contributionStatusLabel: Record<string, string> = {
    PENDING: t("common.contributionStatusPending"),
    PAID: t("common.contributionStatusPaid"),
    LATE: t("common.contributionStatusLate"),
  };

  const loanStatusLabel: Record<string, string> = {
    PENDING: t("common.loanStatusPending"),
    APPROVED: t("common.loanStatusApproved"),
    REJECTED: t("common.loanStatusRejected"),
    PAID: t("common.loanStatusPaid"),
  };

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

  const [isContribOpen, setIsContribOpen] = useState(false);
  const [isSavingContrib, setIsSavingContrib] = useState(false);
  const [contribError, setContribError] = useState("");
  const [contribUserId, setContribUserId] = useState("");
  const [contribAmount, setContribAmount] = useState("");
  const [contribReferenceMonth, setContribReferenceMonth] = useState(() =>
    new Date().toISOString().slice(0, 7),
  );
  const [contribStatus, setContribStatus] = useState<"PAID" | "LATE">("PAID");
  const [contribPaidAt, setContribPaidAt] = useState(() => new Date().toISOString().slice(0, 10));

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
      .catch((err) => setError(err instanceof Error ? err.message : t("groupDetail.loadError")))
      .finally(() => setIsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId, token]);

  const loadContributions = () => {
    if (!token || !groupId) {
      return;
    }

    setIsContribLoading(true);
    return apiFetch<Contribution[]>(`/contributions/group/${groupId}`, { method: "GET" }, token)
      .then((data) => setContributions(data))
      .catch(() => setContributions([]))
      .finally(() => setIsContribLoading(false));
  };

  useEffect(() => {
    if (!token || !groupId || tab !== "contribuicoes") {
      return;
    }

    loadContributions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      setInviteMessage(t("groupDetail.inviteSentDemo"));
      setMemberEmail("");
      setMemberRole("MEMBER");
      loadInvitations();
    } catch (error) {
      setInviteError(error instanceof Error ? error.message : t("groupDetail.genericInviteError"));
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
      setEditError(err instanceof Error ? err.message : t("groupDetail.updateError"));
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
        ? t("groupDetail.closeConfirm")
        : status === "PAUSED"
          ? t("groupDetail.pauseConfirm")
          : t("groupDetail.reactivateConfirm");

    if (!window.confirm(confirmMessage)) {
      return;
    }

    setIsChangingStatus(true);
    try {
      await updateGroupStatus(token, groupId, status);
      await reloadGroup();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("groupDetail.statusChangeError"));
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
      setMemberActionError(err instanceof Error ? err.message : t("groupDetail.roleChangeError"));
    }
  };

  const onRemoveMember = async (membershipId: string, name: string) => {
    if (!token || !groupId) {
      return;
    }

    if (!window.confirm(t("groupDetail.removeConfirm", { name }))) {
      return;
    }

    setMemberActionError("");
    try {
      await removeMember(token, groupId, membershipId);
      await reloadGroup();
    } catch (err) {
      setMemberActionError(err instanceof Error ? err.message : t("groupDetail.removeError"));
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
      setLoanError(err instanceof Error ? err.message : t("groupDetail.loanRequestError"));
    } finally {
      setIsSavingLoan(false);
    }
  };

  const onDecideLoan = async (loanId: string, approved: boolean) => {
    setLoanActionError("");
    try {
      await decideLoan(loanId, approved);
    } catch (err) {
      setLoanActionError(err instanceof Error ? err.message : t("groupDetail.loanDecisionError"));
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
      setLoanActionError(err instanceof Error ? err.message : t("groupDetail.paymentError"));
    } finally {
      setIsSavingPayment(false);
    }
  };

  const openContribModal = () => {
    setContribUserId(user?.id || "");
    setContribAmount(group ? String(Number(group.monthlyContribution)) : "");
    setContribReferenceMonth(new Date().toISOString().slice(0, 7));
    setContribStatus("PAID");
    setContribPaidAt(new Date().toISOString().slice(0, 10));
    setContribError("");
    setIsContribOpen(true);
  };

  const onRegisterContribution = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token || !groupId) {
      return;
    }

    setContribError("");
    setIsSavingContrib(true);

    try {
      await createContribution(token, {
        groupId,
        userId: canApproveLoans ? contribUserId || undefined : undefined,
        amount: Number(contribAmount),
        referenceMonth: `${contribReferenceMonth}-01`,
        status: contribStatus,
        paidAt: contribPaidAt,
      });
      setIsContribOpen(false);
      await loadContributions();
      await reloadGroup();
    } catch (err) {
      setContribError(err instanceof Error ? err.message : t("groupDetail.contributionError"));
    } finally {
      setIsSavingContrib(false);
    }
  };

  if (isLoading) {
    return <Loading message={t("groupDetail.loadingGroup")} />;
  }

  if (error || !group) {
    return (
      <EmptyState
        title={t("groupDetail.notFoundTitle")}
        description={error || t("groupDetail.notFoundDescription")}
        actionLabel={t("groupDetail.backToGroups")}
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
          {t("groupDetail.back")}
        </Link>
        <h1 className="text-2xl font-bold text-[#2b2105]">{group.name}</h1>
        <Badge tone="info">{group.cycleType === "MONTHLY" ? t("common.monthly") : t("common.weekly")}</Badge>
        <Badge tone={statusTone[group.status]}>{statusLabel[group.status]}</Badge>

        {isAdmin ? (
          <div className="ml-auto flex flex-wrap gap-2">
            <Button variant="ghost" onClick={openEditModal}>
              {t("groupDetail.edit")}
            </Button>
            {group.status !== "CLOSED" ? (
              <Button
                variant="ghost"
                disabled={isChangingStatus}
                onClick={() => onChangeStatus(group.status === "PAUSED" ? "ACTIVE" : "PAUSED")}
              >
                {group.status === "PAUSED" ? t("groupDetail.reactivate") : t("groupDetail.pause")}
              </Button>
            ) : null}
            {group.status !== "CLOSED" ? (
              <Button variant="ghost" disabled={isChangingStatus} onClick={() => onChangeStatus("CLOSED")}>
                {t("groupDetail.close")}
              </Button>
            ) : (
              <Button variant="ghost" disabled={isChangingStatus} onClick={() => onChangeStatus("ACTIVE")}>
                {t("groupDetail.reactivateGroup")}
              </Button>
            )}
          </div>
        ) : null}
      </div>

      <Card>
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-[#8a7226]">{t("groupDetail.estimatedBalance")}</p>
            <p className="mt-1 text-xl font-bold text-[#2a2004]">{formatCurrency(estimatedBalance, group.currency)}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-[#8a7226]">{t("groupDetail.activeMembers")}</p>
            <p className="mt-1 text-xl font-bold text-[#2a2004]">{members.filter((item) => item.isActive).length}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-[#8a7226]">{t("groupDetail.contribution")}</p>
            <p className="mt-1 text-xl font-bold text-[#2a2004]">
              {formatCurrency(Number(group.monthlyContribution), group.currency)}
            </p>
          </div>
        </div>
      </Card>

      <div className="flex flex-wrap gap-2">
        {(["resumo", "membros", "contribuicoes", "emprestimos"] as Tab[]).map((item) => (
          <Button key={item} variant={tab === item ? "primary" : "ghost"} onClick={() => setTab(item)}>
            {tabLabel[item]}
          </Button>
        ))}
      </div>

      {tab === "resumo" ? (
        <Card title={t("groupDetail.summaryTitle")} subtitle={group.description || t("groupDetail.noDescription")}>
          <p className="text-sm text-[#584713]">
            {t("groupDetail.summaryBody", { date: formatDate(group.startDate) })}
          </p>
        </Card>
      ) : null}

      {tab === "membros" ? (
        <div className="space-y-4">
          <Card title={t("groupDetail.inviteTitle")} subtitle={t("groupDetail.inviteSubtitle")}>
            <form className="grid gap-3 sm:grid-cols-3" onSubmit={onAddMember}>
              <Input
                label={t("groupDetail.email")}
                type="email"
                value={memberEmail}
                onChange={(event) => setMemberEmail(event.target.value)}
                required
              />
              <Select
                label={t("groupDetail.role")}
                value={memberRole}
                onChange={(event) => setMemberRole(event.target.value as Role)}
              >
                <option value="MEMBER">{roleLabel.MEMBER}</option>
                <option value="TREASURER">{roleLabel.TREASURER}</option>
                <option value="ADMIN">{roleLabel.ADMIN}</option>
              </Select>
              <div className="flex items-end">
                <Button type="submit" className="w-full" disabled={isInviting}>
                  {isInviting ? t("groupDetail.sending") : t("groupDetail.sendInvite")}
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

          <Table
            headers={[
              t("groupDetail.membersTableName"),
              t("groupDetail.membersTableRole"),
              t("groupDetail.membersTableJoined"),
              t("groupDetail.membersTableStatus"),
              t("groupDetail.membersTableTrust"),
              isAdmin ? t("groupDetail.membersTableActions") : "",
            ]}
          >
            {(group.memberships || []).map((membership) => {
              const name = membership.user
                ? `${membership.user.firstName} ${membership.user.lastName}`
                : t("groupDetail.member");
              const isSelf = membership.userId === user?.id;
              const trustScore = membership.trustScore;

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
                        className="h-9 min-w-38"
                      >
                        <option value="MEMBER">{roleLabel.MEMBER}</option>
                        <option value="TREASURER">{roleLabel.TREASURER}</option>
                        <option value="ADMIN">{roleLabel.ADMIN}</option>
                      </Select>
                    ) : (
                      roleLabel[membership.role]
                    )}
                  </td>
                  <td className="px-4 py-3">{formatDate(membership.joinedAt)}</td>
                  <td className="px-4 py-3">
                    <Badge tone={membership.isActive ? "success" : "warning"}>
                      {membership.isActive ? t("groupDetail.active") : t("groupDetail.inactive")}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    {trustScore ? (
                      <Badge
                        tone={
                          trustScore.score >= 80
                            ? "success"
                            : trustScore.score >= 50
                              ? "warning"
                              : "danger"
                        }
                      >
                        {`${trustScore.score} (${trustScore.onTimePayments}/${
                          trustScore.onTimePayments + trustScore.latePayments
                        })`}
                      </Badge>
                    ) : (
                      <Badge tone="neutral">{t("groupDetail.noHistory")}</Badge>
                    )}
                  </td>
                  {isAdmin ? (
                    <td className="px-4 py-3">
                      {membership.isActive ? (
                        <Button
                          variant="ghost"
                          className="h-8 px-2 text-xs"
                          onClick={() => onRemoveMember(membership.id, isSelf ? t("groupDetail.you") : name)}
                        >
                          {t("groupDetail.removeMember")}
                        </Button>
                      ) : null}
                    </td>
                  ) : null}
                </tr>
              );
            })}
          </Table>

          {isInvitationsLoading ? (
            <Loading message={t("groupDetail.loadingInvites")} />
          ) : invitations.length ? (
            <Card title={t("groupDetail.pendingInvitesTitle")}>
              <Table
                headers={[
                  t("groupDetail.invitesTableEmail"),
                  t("groupDetail.invitesTableRole"),
                  t("groupDetail.invitesTableExpires"),
                ]}
              >
                {invitations.map((invitation) => (
                  <tr key={invitation.id}>
                    <td className="px-4 py-3">{invitation.email}</td>
                    <td className="px-4 py-3">{roleLabel[invitation.role]}</td>
                    <td className="px-4 py-3">{formatDate(invitation.expiresAt)}</td>
                  </tr>
                ))}
              </Table>
            </Card>
          ) : null}
        </div>
      ) : null}

      {tab === "contribuicoes" ? (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button disabled={group.status === "CLOSED"} onClick={openContribModal}>
              {t("groupDetail.contributionsRegister")}
            </Button>
          </div>

          {isContribLoading ? (
            <Loading message={t("groupDetail.loadingContributions")} />
          ) : contributions.length ? (
            <Table
              headers={[
                t("groupDetail.contributionsTableMember"),
                t("groupDetail.contributionsTableAmount"),
                t("groupDetail.contributionsTableReference"),
                t("groupDetail.contributionsTableStatus"),
              ]}
            >
              {contributions.map((item) => (
                <tr key={item.id}>
                  <td className="px-4 py-3">
                    {item.user ? `${item.user.firstName} ${item.user.lastName}` : item.userId.slice(0, 8)}
                  </td>
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
                      {contributionStatusLabel[item.status]}
                    </Badge>
                  </td>
                </tr>
              ))}
            </Table>
          ) : (
            <EmptyState
              title={t("groupDetail.emptyContributionsTitle")}
              description={t("groupDetail.emptyContributionsDescription")}
            />
          )}
        </div>
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
              {t("groupDetail.loansRequest")}
            </Button>
          </div>

          {loanActionError ? (
            <p className="rounded-lg border border-[#c8102e]/70 bg-[#c8102e]/10 px-3 py-2 text-xs text-[#6f101f]">
              {loanActionError}
            </p>
          ) : null}

          {isLoansLoading ? (
            <Loading message={t("groupDetail.loadingLoans")} />
          ) : loans.length ? (
            <Table
              headers={[
                t("groupDetail.loansTableValue"),
                t("groupDetail.loansTableInterest"),
                t("groupDetail.loansTableStatus"),
                t("groupDetail.loansTableDue"),
                t("groupDetail.loansTableActions"),
              ]}
            >
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
                      {loanStatusLabel[loan.status]}
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
                            {t("groupDetail.approve")}
                          </Button>
                          <Button
                            variant="ghost"
                            className="h-8 px-2 text-xs"
                            onClick={() => onDecideLoan(loan.id, false)}
                          >
                            {t("groupDetail.reject")}
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
                          {t("groupDetail.registerPayment")}
                        </Button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </Table>
          ) : (
            <EmptyState title={t("groupDetail.emptyLoansTitle")} description={t("groupDetail.emptyLoansDescription")} />
          )}
        </div>
      ) : null}

      <Modal title={t("groupDetail.editModalTitle")} isOpen={isEditOpen} onClose={() => setIsEditOpen(false)}>
        <form className="space-y-4" onSubmit={onSaveEdit}>
          <Input
            label={t("groupsList.name")}
            value={editName}
            onChange={(event) => setEditName(event.target.value)}
            required
          />
          <Input
            label={t("groupsList.description")}
            value={editDescription}
            onChange={(event) => setEditDescription(event.target.value)}
            placeholder={t("common.optional")}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label={t("groupsList.monthlyContribution")}
              type="number"
              min={1}
              value={editMonthlyContribution}
              onChange={(event) => setEditMonthlyContribution(event.target.value)}
              required
            />
            <Input
              label={t("groupsList.maxMembers")}
              type="number"
              min={1}
              value={editMaxMembers}
              onChange={(event) => setEditMaxMembers(event.target.value)}
            />
          </div>

          <Select
            label={t("groupsList.cycle")}
            value={editCycleType}
            onChange={(event) => setEditCycleType(event.target.value as "WEEKLY" | "MONTHLY")}
          >
            <option value="MONTHLY">{t("common.monthly")}</option>
            <option value="WEEKLY">{t("common.weekly")}</option>
          </Select>

          {editError ? <p className="text-sm text-[#a31533]">{editError}</p> : null}

          <div className="flex justify-end gap-2">
            <Button variant="ghost" type="button" onClick={() => setIsEditOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={isSavingEdit}>
              {isSavingEdit ? t("common.saving") : t("common.save")}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal title={t("groupDetail.loanModalTitle")} isOpen={isLoanOpen} onClose={() => setIsLoanOpen(false)}>
        <form className="space-y-4" onSubmit={onRequestLoan}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label={t("groupDetail.amount")}
              type="number"
              min={1}
              value={loanAmount}
              onChange={(event) => setLoanAmount(event.target.value)}
              required
            />
            <Input
              label={t("groupDetail.interestRate")}
              type="number"
              min={0}
              value={loanInterestRate}
              onChange={(event) => setLoanInterestRate(event.target.value)}
              required
            />
          </div>
          <Input
            label={t("groupDetail.reason")}
            value={loanReason}
            onChange={(event) => setLoanReason(event.target.value)}
            placeholder={t("common.optional")}
          />
          <Input
            label={t("groupDetail.dueDate")}
            type="date"
            value={loanDueDate}
            onChange={(event) => setLoanDueDate(event.target.value)}
            required
          />

          {loanError ? <p className="text-sm text-[#a31533]">{loanError}</p> : null}

          <div className="flex justify-end gap-2">
            <Button variant="ghost" type="button" onClick={() => setIsLoanOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={isSavingLoan}>
              {isSavingLoan ? t("groupDetail.sending") : t("groupDetail.solicitar")}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        title={t("groupDetail.paymentModalTitle")}
        isOpen={Boolean(payingLoanId)}
        onClose={() => setPayingLoanId(null)}
      >
        <form className="space-y-4" onSubmit={onSubmitPayment}>
          <Input
            label={t("groupDetail.paidAmount")}
            type="number"
            min={1}
            value={paymentAmount}
            onChange={(event) => setPaymentAmount(event.target.value)}
            required
          />

          {loanActionError ? <p className="text-sm text-[#a31533]">{loanActionError}</p> : null}

          <div className="flex justify-end gap-2">
            <Button variant="ghost" type="button" onClick={() => setPayingLoanId(null)}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={isSavingPayment}>
              {isSavingPayment ? t("common.saving") : t("groupDetail.registar")}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        title={t("groupDetail.contribModalTitle")}
        isOpen={isContribOpen}
        onClose={() => setIsContribOpen(false)}
      >
        <form className="space-y-4" onSubmit={onRegisterContribution}>
          {canApproveLoans ? (
            <Select
              label={t("groupDetail.member")}
              value={contribUserId}
              onChange={(event) => setContribUserId(event.target.value)}
              required
            >
              {(group.memberships || [])
                .filter((membership) => membership.isActive)
                .map((membership) => (
                  <option key={membership.id} value={membership.userId}>
                    {membership.user
                      ? `${membership.user.firstName} ${membership.user.lastName}`
                      : membership.userId}
                  </option>
                ))}
            </Select>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label={t("groupDetail.amount")}
              type="number"
              min={1}
              value={contribAmount}
              onChange={(event) => setContribAmount(event.target.value)}
              required
            />
            <Input
              label={t("groupDetail.referenceMonth")}
              type="month"
              value={contribReferenceMonth}
              onChange={(event) => setContribReferenceMonth(event.target.value)}
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              label={t("groupDetail.membersTableStatus")}
              value={contribStatus}
              onChange={(event) => setContribStatus(event.target.value as "PAID" | "LATE")}
            >
              <option value="PAID">{t("groupDetail.contribStatusPaid")}</option>
              <option value="LATE">{t("groupDetail.contribStatusLate")}</option>
            </Select>
            <Input
              label={t("groupDetail.paymentDate")}
              type="date"
              value={contribPaidAt}
              onChange={(event) => setContribPaidAt(event.target.value)}
              required
            />
          </div>

          {contribError ? <p className="text-sm text-[#a31533]">{contribError}</p> : null}

          <div className="flex justify-end gap-2">
            <Button variant="ghost" type="button" onClick={() => setIsContribOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={isSavingContrib}>
              {isSavingContrib ? t("common.saving") : t("groupDetail.registar")}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
