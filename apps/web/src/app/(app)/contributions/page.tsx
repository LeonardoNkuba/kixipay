"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/services/api";
import { Contribution } from "@/types/domain";
import { Badge, Card, EmptyState, Loading, Select, Table } from "@/components";
import { useAuth } from "@/hooks/useAuth";
import { useGroups } from "@/hooks/useGroups";
import { formatCurrency, formatDate } from "@/utils/format";

export default function ContributionsPage() {
  const { token } = useAuth();
  const { groups } = useGroups(token);
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!selectedGroupId && groups.length) {
      setSelectedGroupId(groups[0].id);
    }
  }, [groups, selectedGroupId]);

  useEffect(() => {
    if (!token || !selectedGroupId) {
      return;
    }

    setIsLoading(true);
    apiFetch<Contribution[]>(`/contributions/group/${selectedGroupId}`, { method: "GET" }, token)
      .then((data) => setContributions(data))
      .catch(() => setContributions([]))
      .finally(() => setIsLoading(false));
  }, [selectedGroupId, token]);

  const selectedGroup = groups.find((group) => group.id === selectedGroupId);

  return (
    <div className="space-y-4">
      <Card title="Contribuicoes" subtitle="Acompanhe o status de pagamentos por grupo">
        {groups.length ? (
          <div className="max-w-sm">
            <Select
              label="Grupo"
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
            title="Sem grupos"
            description="Crie um grupo para começar a registrar contribuicoes."
          />
        )}
      </Card>

      {isLoading ? (
        <Loading message="Carregando contribuicoes..." />
      ) : contributions.length ? (
        <Table headers={["Membro", "Valor", "Referencia", "Status", "Pagamento"]}>
          {contributions.map((item) => (
            <tr key={item.id}>
              <td className="px-4 py-3">{item.userId.slice(0, 8)}</td>
              <td className="px-4 py-3">
                {formatCurrency(Number(item.amount), selectedGroup?.currency || "AOA")}
              </td>
              <td className="px-4 py-3">{formatDate(item.referenceMonth)}</td>
              <td className="px-4 py-3">
                <Badge
                  tone={
                    item.status === "PAID"
                      ? "success"
                      : item.status === "LATE"
                        ? "danger"
                        : "warning"
                  }
                >
                  {item.status}
                </Badge>
              </td>
              <td className="px-4 py-3">{item.paidAt ? formatDate(item.paidAt) : "-"}</td>
            </tr>
          ))}
        </Table>
      ) : (
        groups.length > 0 &&
        selectedGroupId && (
          <EmptyState title="Sem dados" description="Nenhuma contribuicao encontrada para o grupo selecionado." />
        )
      )}
    </div>
  );
}
