import { apiFetch } from "@/services/api";
import { Group, DashboardStats, Loan } from "@/types/domain";
import { toNumber } from "@/utils/format";

export const getDashboardStats = async (token: string): Promise<DashboardStats> => {
  const groups = await apiFetch<Group[]>("/groups", { method: "GET" }, token);

  const totalBalance = groups.reduce((acc, group) => {
    const members = group.memberships?.filter((item) => item.isActive).length || 0;
    return acc + toNumber(group.monthlyContribution) * members;
  }, 0);

  const totalMembersSet = new Set<string>();
  for (const group of groups) {
    for (const member of group.memberships || []) {
      if (member.isActive) {
        totalMembersSet.add(member.userId);
      }
    }
  }

  const loansByGroup = await Promise.all(
    groups.map(async (group) => {
      const loans = await apiFetch<Loan[]>(`/loans/group/${group.id}`, { method: "GET" }, token);
      return loans.filter((loan) => loan.status === "PENDING" || loan.status === "APPROVED").length;
    }),
  );

  const monthlyContributions = groups.reduce((acc, group) => {
    const members = group.memberships?.filter((item) => item.isActive).length || 0;
    return acc + toNumber(group.monthlyContribution) * members;
  }, 0);

  return {
    totalBalance,
    totalMembers: totalMembersSet.size,
    monthlyContributions,
    activeLoans: loansByGroup.reduce((acc, value) => acc + value, 0),
    groupsCount: groups.length,
    chartData: groups.slice(0, 6).map((group) => ({
      name: group.name,
      value: toNumber(group.monthlyContribution),
    })),
  };
};
