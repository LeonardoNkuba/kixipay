"use client";

import { useEffect, useState } from "react";
import { Badge, Card, EmptyState, Loading, Select, Table } from "@/components";
import { useAuth } from "@/hooks/useAuth";
import { useGroups } from "@/hooks/useGroups";
import { useLanguage } from "@/hooks/useLanguage";
import { useLoans } from "@/hooks/useLoans";
import { formatCurrency, formatDate } from "@/utils/format";

export default function LoansPage() {
  const { token } = useAuth();
  const { groups } = useGroups(token);
  const { t } = useLanguage();
  const [selectedGroupId, setSelectedGroupId] = useState("");

  const statusLabel: Record<string, string> = {
    PENDING: t("common.loanStatusPending"),
    APPROVED: t("common.loanStatusApproved"),
    REJECTED: t("common.loanStatusRejected"),
    PAID: t("common.loanStatusPaid"),
  };

  useEffect(() => {
    if (!selectedGroupId && groups.length) {
      setSelectedGroupId(groups[0].id);
    }
  }, [groups, selectedGroupId]);

  const { loans, isLoading } = useLoans(token, selectedGroupId);
  const selectedGroup = groups.find((group) => group.id === selectedGroupId);

  return (
    <div className="space-y-4">
      <Card title={t("loansPage.title")} subtitle={t("loansPage.subtitle")}>
        {groups.length ? (
          <div className="max-w-sm">
            <Select
              label={t("loansPage.group")}
              value={selectedGroupId}
              onChange={(event) => setSelectedGroupId(event.target.value)}
            >
              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </Select>
          </div>
        ) : (
          <EmptyState
            title={t("loansPage.emptyGroupsTitle")}
            description={t("loansPage.emptyGroupsDescription")}
          />
        )}
      </Card>

      {isLoading ? (
        <Loading message={t("loansPage.loadingMessage")} />
      ) : loans.length ? (
        <Table
          headers={[
            t("loansPage.tableValue"),
            t("loansPage.tableInterest"),
            t("loansPage.tableStatus"),
            t("loansPage.tableDue"),
            t("loansPage.tableCreated"),
          ]}
        >
          {loans.map((loan) => (
            <tr key={loan.id}>
              <td className="px-4 py-3">{formatCurrency(Number(loan.amount), selectedGroup?.currency || "AOA")}</td>
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
                  {statusLabel[loan.status]}
                </Badge>
              </td>
              <td className="px-4 py-3">{formatDate(loan.dueDate)}</td>
              <td className="px-4 py-3">{formatDate(loan.createdAt)}</td>
            </tr>
          ))}
        </Table>
      ) : (
        groups.length > 0 &&
        selectedGroupId && (
          <EmptyState
            title={t("loansPage.emptyLoansTitle")}
            description={t("loansPage.emptyLoansDescription")}
          />
        )
      )}
    </div>
  );
}
