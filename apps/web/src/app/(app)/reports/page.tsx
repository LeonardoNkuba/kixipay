"use client";

import { Coins, HandCoins, TrendingDown, Wallet } from "lucide-react";
import { Badge, Card, EmptyState, Loading, StatCard, Table } from "@/components";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { useReports } from "@/hooks/useReports";
import { formatCurrency } from "@/utils/format";

export default function ReportsPage() {
  const { token } = useAuth();
  const { summary, isLoading, error, refresh } = useReports(token);
  const { t } = useLanguage();

  if (isLoading) {
    return <Loading message={t("reportsPage.loadingMessage")} />;
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

  if (!summary.groups.length) {
    return (
      <div className="space-y-4">
        <Card title={t("reportsPage.title")} subtitle={t("reportsPage.subtitle")}>
          <EmptyState
            title={t("reportsPage.emptyTitle")}
            description={t("reportsPage.emptyDescription")}
          />
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-[#2d2206]">{t("reportsPage.title")}</h1>
        <p className="text-sm text-[#7d6822]">{t("reportsPage.subtitle")}</p>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title={t("reportsPage.statCollected")}
          value={formatCurrency(summary.totals.contributionsCollected)}
          caption={t("reportsPage.statCollectedCaption")}
          icon={<Coins size={20} />}
        />
        <StatCard
          title={t("reportsPage.statPending")}
          value={formatCurrency(summary.totals.contributionsPending)}
          caption={t("reportsPage.statPendingCaption")}
          icon={<Wallet size={20} />}
        />
        <StatCard
          title={t("reportsPage.statIssued")}
          value={formatCurrency(summary.totals.loansIssued)}
          caption={t("reportsPage.statIssuedCaption")}
          icon={<HandCoins size={20} />}
        />
        <StatCard
          title={t("reportsPage.statOutstanding")}
          value={formatCurrency(summary.totals.loansOutstanding)}
          caption={t("reportsPage.statOutstandingCaption")}
          icon={<TrendingDown size={20} />}
        />
      </section>

      <Card title={t("reportsPage.groupsTableTitle")} subtitle={t("reportsPage.groupsTableSubtitle")}>
        <Table
          headers={[
            t("reportsPage.tableGroup"),
            t("reportsPage.tableCollected"),
            t("reportsPage.tablePending"),
            t("reportsPage.tableOutstanding"),
            t("reportsPage.tableLoansCount"),
          ]}
        >
          {summary.groups.map((group) => (
            <tr key={group.groupId}>
              <td className="px-4 py-3">{group.groupName}</td>
              <td className="px-4 py-3">{formatCurrency(group.contributionsCollected, group.currency)}</td>
              <td className="px-4 py-3">{formatCurrency(group.contributionsPending, group.currency)}</td>
              <td className="px-4 py-3">{formatCurrency(group.loansOutstanding, group.currency)}</td>
              <td className="px-4 py-3">{group.loansCount}</td>
            </tr>
          ))}
        </Table>
      </Card>

      {summary.trustLeaderboard.length ? (
        <Card title={t("reportsPage.leaderboardTitle")} subtitle={t("reportsPage.leaderboardSubtitle")}>
          <Table
            headers={[
              t("reportsPage.tableMember"),
              t("reportsPage.tableGroup"),
              t("reportsPage.tableScore"),
              t("reportsPage.tablePunctuality"),
            ]}
          >
            {summary.trustLeaderboard.map((entry) => (
              <tr key={entry.membershipId}>
                <td className="px-4 py-3">{entry.name}</td>
                <td className="px-4 py-3">{entry.groupName}</td>
                <td className="px-4 py-3">
                  <Badge tone={entry.score >= 80 ? "success" : entry.score >= 50 ? "warning" : "danger"}>
                    {String(entry.score)}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  {entry.onTimePayments}/{entry.onTimePayments + entry.latePayments}
                </td>
              </tr>
            ))}
          </Table>
        </Card>
      ) : null}
    </div>
  );
}
