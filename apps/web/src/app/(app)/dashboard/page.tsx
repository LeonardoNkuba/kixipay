"use client";

import { Coins, HandCoins, Users, WalletCards } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, EmptyState, Loading, StatCard } from "@/components";
import { useAuth } from "@/hooks/useAuth";
import { useDashboard } from "@/hooks/useDashboard";
import { formatCurrency } from "@/utils/format";

export default function DashboardPage() {
  const { token } = useAuth();
  const { stats, isLoading, error, refresh } = useDashboard(token);

  if (isLoading) {
    return <Loading message="Carregando indicadores do dashboard..." />;
  }

  if (error) {
    return (
      <EmptyState
        title="Erro ao carregar dados"
        description={error}
        actionLabel="Tentar novamente"
        onAction={refresh}
      />
    );
  }

  return (
    <div className="space-y-5">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Saldo Total"
          value={formatCurrency(stats.totalBalance)}
          caption="Estimativa por contribuicoes ativas"
          icon={<WalletCards size={20} />}
        />
        <StatCard
          title="Total de Membros"
          value={String(stats.totalMembers)}
          caption="Membros ativos em todos os grupos"
          icon={<Users size={20} />}
        />
        <StatCard
          title="Contribuicoes do Mes"
          value={formatCurrency(stats.monthlyContributions)}
          caption="Soma mensal prevista"
          icon={<Coins size={20} />}
        />
        <StatCard
          title="Emprestimos Ativos"
          value={String(stats.activeLoans)}
          caption="Pendentes ou aprovados"
          icon={<HandCoins size={20} />}
        />
      </section>

      <Card title="Contribuicao por Grupo" subtitle="Visao rapida para decisoes semanais">
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
            title="Sem grupos para analisar"
            description="Crie seu primeiro grupo para visualizar os indicadores no dashboard."
          />
        )}
      </Card>
    </div>
  );
}
