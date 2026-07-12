"use client";

import { Coins, HandCoins, Users, WalletCards } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, EmptyState, Loading, StatCard } from "@/components";
import { useAuth } from "@/hooks/useAuth";
import { useDashboard } from "@/hooks/useDashboard";
import { useLanguage } from "@/hooks/useLanguage";
import { formatCurrency } from "@/utils/format";

const loanStatusColor: Record<string, string> = {
  PENDING: "#B98900",
  APPROVED: "#1D6FD1",
  REJECTED: "#B0223B",
  PAID: "#1E8E5A",
};

export default function DashboardPage() {
  const { token } = useAuth();
  const { stats, isLoading, error, refresh } = useDashboard(token);
  const { t } = useLanguage();

  const loanStatusLabel: Record<string, string> = {
    PENDING: t("common.loanStatusPending"),
    APPROVED: t("common.loanStatusApproved"),
    REJECTED: t("common.loanStatusRejected"),
    PAID: t("common.loanStatusPaid"),
  };

  const loanChartData = stats.loansByStatus.map((item) => ({
    status: item.status,
    name: loanStatusLabel[item.status],
    count: item.count,
  }));
  const totalLoans = loanChartData.reduce((acc, item) => acc + item.count, 0);

  if (isLoading) {
    return <Loading message={t("dashboard.loadingMessage")} />;
  }

  if (error) {
    return (
      <EmptyState
        title={t("common.errorTitle")}
        description={error}
        actionLabel={t("common.tryAgain")}
        onAction={refresh}
      />
    );
  }

  return (
    <div className="space-y-5">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title={t("dashboard.statBalance")}
          value={formatCurrency(stats.totalBalance)}
          caption={t("dashboard.statBalanceCaption")}
          icon={<WalletCards size={20} />}
        />
        <StatCard
          title={t("dashboard.statMembers")}
          value={String(stats.totalMembers)}
          caption={t("dashboard.statMembersCaption")}
          icon={<Users size={20} />}
        />
        <StatCard
          title={t("dashboard.statContributions")}
          value={formatCurrency(stats.monthlyContributions)}
          caption={t("dashboard.statContributionsCaption")}
          icon={<Coins size={20} />}
        />
        <StatCard
          title={t("dashboard.statLoans")}
          value={String(stats.activeLoans)}
          caption={t("dashboard.statLoansCaption")}
          icon={<HandCoins size={20} />}
        />
      </section>

      <Card title={t("dashboard.chartTitle")} subtitle={t("dashboard.chartSubtitle")}>
        {stats.chartData.length ? (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.chartData}>
                <CartesianGrid strokeDasharray="4 4" stroke="#f0e5bf" />
                <XAxis dataKey="name" stroke="#8a7227" fontSize={12} />
                <YAxis stroke="#8a7227" fontSize={12} />
                <Tooltip />
                <Bar dataKey="value" fill="#c8102e" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <EmptyState
            title={t("dashboard.emptyGroupsTitle")}
            description={t("dashboard.emptyGroupsDescription")}
          />
        )}
      </Card>

      <Card title={t("dashboard.loanChartTitle")} subtitle={t("dashboard.loanChartSubtitle")}>
        {totalLoans ? (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={loanChartData} barCategoryGap="28%">
                <CartesianGrid strokeDasharray="4 4" stroke="#f0e5bf" vertical={false} />
                <XAxis dataKey="name" stroke="#8a7227" fontSize={12} />
                <YAxis stroke="#8a7227" fontSize={12} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={64}>
                  {loanChartData.map((entry) => (
                    <Cell key={entry.status} fill={loanStatusColor[entry.status]} />
                  ))}
                  <LabelList dataKey="count" position="top" fontSize={12} fill="#584713" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <EmptyState
            title={t("dashboard.emptyLoansTitle")}
            description={t("dashboard.emptyLoansDescription")}
          />
        )}
      </Card>
    </div>
  );
}
