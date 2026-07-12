"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { Plus, Users } from "lucide-react";
import { Button, Card, EmptyState, Input, Loading, Modal, Select } from "@/components";
import { useAuth } from "@/hooks/useAuth";
import { useGroups } from "@/hooks/useGroups";
import { useLanguage } from "@/hooks/useLanguage";
import { formatCurrency } from "@/utils/format";

export default function GroupsPage() {
  const { token } = useAuth();
  const { groups, isLoading, error, refresh, addGroup } = useGroups(token);
  const { t } = useLanguage();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [monthlyContribution, setMonthlyContribution] = useState("");
  const [maxMembers, setMaxMembers] = useState("");
  const [cycleType, setCycleType] = useState<"WEEKLY" | "MONTHLY">("MONTHLY");
  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 10));

  const resetForm = () => {
    setName("");
    setDescription("");
    setMonthlyContribution("");
    setMaxMembers("");
    setCycleType("MONTHLY");
    setStartDate(new Date().toISOString().slice(0, 10));
    setFormError("");
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError("");
    setIsSaving(true);

    try {
      await addGroup({
        name,
        description: description || undefined,
        monthlyContribution: Number(monthlyContribution),
        maxMembers: maxMembers ? Number(maxMembers) : undefined,
        cycleType,
        startDate,
      });
      setIsCreateOpen(false);
      resetForm();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : t("groupsList.genericError"));
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <Loading message={t("groupsList.loadingMessage")} />;
  }

  if (error) {
    return (
      <EmptyState
        title={t("groupsList.errorTitle")}
        description={error}
        actionLabel={t("common.tryAgain")}
        onAction={refresh}
      />
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#2d2206]">{t("groupsList.title")}</h1>
          <p className="text-sm text-[#7d6822]">{t("groupsList.subtitle")}</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="inline-flex items-center gap-2">
          <Plus size={16} />
          {t("groupsList.newGroup")}
        </Button>
      </div>

      {!groups.length ? (
        <EmptyState
          title={t("groupsList.emptyTitle")}
          description={t("groupsList.emptyDescription")}
          actionLabel={t("groupsList.createAction")}
          onAction={() => setIsCreateOpen(true)}
          icon={<Users size={20} />}
        />
      ) : (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {groups.map((group) => {
            const activeMembers = group.memberships?.filter((item) => item.isActive).length || 0;
            const monthlyValue = Number(group.monthlyContribution);
            const balance = monthlyValue * activeMembers;

            return (
              <Card key={group.id} title={group.name} subtitle={group.description || t("groupDetail.noDescription")}>
                <div className="space-y-2 text-sm text-[#4f4013]">
                  <p>{t("groupsList.activeMembers", { count: activeMembers })}</p>
                  <p>{t("groupsList.estimatedBalance", { value: formatCurrency(balance, group.currency) })}</p>
                  <p>{t("groupsList.contribution", { value: formatCurrency(monthlyValue, group.currency) })}</p>
                </div>
                <Link
                  href={`/groups/${group.id}`}
                  className="mt-4 inline-flex rounded-lg bg-[#fff4ce] px-3 py-1.5 text-sm font-semibold text-[#6f101f] transition hover:bg-[#ffe49a]"
                >
                  {t("groupsList.enter")}
                </Link>
              </Card>
            );
          })}
        </section>
      )}

      <Modal title={t("groupsList.modalTitle")} isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)}>
        <form className="space-y-4" onSubmit={onSubmit}>
          <Input label={t("groupsList.name")} value={name} onChange={(event) => setName(event.target.value)} required />
          <Input
            label={t("groupsList.description")}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder={t("common.optional")}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label={t("groupsList.monthlyContribution")}
              type="number"
              min={1}
              value={monthlyContribution}
              onChange={(event) => setMonthlyContribution(event.target.value)}
              required
            />
            <Input
              label={t("groupsList.maxMembers")}
              type="number"
              min={1}
              value={maxMembers}
              onChange={(event) => setMaxMembers(event.target.value)}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              label={t("groupsList.cycle")}
              value={cycleType}
              onChange={(event) => setCycleType(event.target.value as "WEEKLY" | "MONTHLY")}
            >
              <option value="MONTHLY">{t("common.monthly")}</option>
              <option value="WEEKLY">{t("common.weekly")}</option>
            </Select>
            <Input
              label={t("groupsList.startDate")}
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              required
            />
          </div>

          {formError ? <p className="text-sm text-[#a31533]">{formError}</p> : null}

          <div className="flex justify-end gap-2">
            <Button variant="ghost" type="button" onClick={() => setIsCreateOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? t("groupsList.creating") : t("groupsList.create")}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
