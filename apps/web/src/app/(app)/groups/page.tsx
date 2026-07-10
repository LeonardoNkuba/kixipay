"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { Plus, Users } from "lucide-react";
import { Button, Card, EmptyState, Input, Loading, Modal, Select } from "@/components";
import { useAuth } from "@/hooks/useAuth";
import { useGroups } from "@/hooks/useGroups";
import { formatCurrency } from "@/utils/format";

export default function GroupsPage() {
  const { token } = useAuth();
  const { groups, isLoading, error, refresh, addGroup } = useGroups(token);
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
      setFormError(err instanceof Error ? err.message : "Erro ao criar grupo.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <Loading message="Carregando seus grupos..." />;
  }

  if (error) {
    return (
      <EmptyState
        title="Erro ao carregar grupos"
        description={error}
        actionLabel="Tentar novamente"
        onAction={refresh}
      />
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#2d2206]">Meus Grupos</h1>
          <p className="text-sm text-[#7d6822]">Gerencie suas kixikilas e acompanhe os membros.</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="inline-flex items-center gap-2">
          <Plus size={16} />
          Novo Grupo
        </Button>
      </div>

      {!groups.length ? (
        <EmptyState
          title="Voce ainda nao possui grupos"
          description="Crie seu primeiro grupo para iniciar a jornada financeira colaborativa."
          actionLabel="Criar Grupo"
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
              <Card key={group.id} title={group.name} subtitle={group.description || "Sem descricao"}>
                <div className="space-y-2 text-sm text-[#4f4013]">
                  <p>{activeMembers} membros ativos</p>
                  <p>Saldo estimado: {formatCurrency(balance, group.currency)}</p>
                  <p>Contribuicao: {formatCurrency(monthlyValue, group.currency)}</p>
                </div>
                <Link
                  href={`/groups/${group.id}`}
                  className="mt-4 inline-flex rounded-lg bg-[#fff4ce] px-3 py-1.5 text-sm font-semibold text-[#6f101f] transition hover:bg-[#ffe49a]"
                >
                  Entrar
                </Link>
              </Card>
            );
          })}
        </section>
      )}

      <Modal title="Criar Novo Grupo" isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)}>
        <form className="space-y-4" onSubmit={onSubmit}>
          <Input label="Nome" value={name} onChange={(event) => setName(event.target.value)} required />
          <Input
            label="Descricao"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Opcional"
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Contribuicao mensal"
              type="number"
              min={1}
              value={monthlyContribution}
              onChange={(event) => setMonthlyContribution(event.target.value)}
              required
            />
            <Input
              label="Maximo de membros"
              type="number"
              min={1}
              value={maxMembers}
              onChange={(event) => setMaxMembers(event.target.value)}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              label="Ciclo"
              value={cycleType}
              onChange={(event) => setCycleType(event.target.value as "WEEKLY" | "MONTHLY")}
            >
              <option value="MONTHLY">Mensal</option>
              <option value="WEEKLY">Semanal</option>
            </Select>
            <Input
              label="Data de inicio"
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              required
            />
          </div>

          {formError ? <p className="text-sm text-[#a31533]">{formError}</p> : null}

          <div className="flex justify-end gap-2">
            <Button variant="ghost" type="button" onClick={() => setIsCreateOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "A criar..." : "Criar"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
