import { Card, EmptyState } from "@/components";

export default function ReportsPage() {
  return (
    <div className="space-y-4">
      <Card title="Relatorios" subtitle="Visoes consolidadas do seu grupo financeiro">
        <EmptyState
          title="Modulo em preparacao"
          description="Nesta fase do MVP, os relatorios avancados serao implementados apos consolidar contribuicoes e emprestimos."
        />
      </Card>
    </div>
  );
}
