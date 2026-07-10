import { Card, EmptyState } from "@/components";

export default function SettingsPage() {
  return (
    <div className="space-y-4">
      <Card title="Configuracoes" subtitle="Preferencias da sua conta e da plataforma">
        <EmptyState
          title="Configuracoes basicas em breve"
          description="A estrutura da navegacao esta pronta. Os ajustes de conta e seguranca entram na proxima iteracao."
        />
      </Card>
    </div>
  );
}
