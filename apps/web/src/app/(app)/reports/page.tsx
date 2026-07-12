"use client";

import { Card, EmptyState } from "@/components";
import { useLanguage } from "@/hooks/useLanguage";

export default function ReportsPage() {
  const { t } = useLanguage();

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
