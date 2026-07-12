"use client";

import { Card, EmptyState, LanguageSwitcher } from "@/components";
import { useLanguage } from "@/hooks/useLanguage";

export default function SettingsPage() {
  const { t } = useLanguage();

  return (
    <div className="space-y-4">
      <Card title={t("settingsPage.title")} subtitle={t("settingsPage.subtitle")}>
        <div className="max-w-xs">
          <p className="mb-2 text-sm font-medium text-[#5d4a14]">{t("language.label")}</p>
          <LanguageSwitcher />
        </div>
      </Card>

      <Card>
        <EmptyState
          title={t("settingsPage.emptyTitle")}
          description={t("settingsPage.emptyDescription")}
        />
      </Card>
    </div>
  );
}
