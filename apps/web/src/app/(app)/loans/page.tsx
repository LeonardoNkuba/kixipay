"use client";

import { useEffect, useState } from "react";
import { Badge, Card, EmptyState, Loading, Select, Table } from "@/components";
import { useAuth } from "@/hooks/useAuth";
import { useGroups } from "@/hooks/useGroups";
import { useLoans } from "@/hooks/useLoans";
import { formatCurrency, formatDate } from "@/utils/format";

export default function LoansPage() {
  const { token } = useAuth();
  const { groups } = useGroups(token);
  const [selectedGroupId, setSelectedGroupId] = useState("");

  useEffect(() => {
    if (!selectedGroupId && groups.length) {
      setSelectedGroupId(groups[0].id);
    }
  }, [groups, selectedGroupId]);

  const { loans, isLoading } = useLoans(token, selectedGroupId);
  const selectedGroup = groups.find((group) => group.id === selectedGroupId);

  return (
    <div className="space-y-4">
      <Card title="Emprestimos" subtitle="Controle de solicitacoes, aprovacoes e pagamentos">
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
          <EmptyState title="Sem grupos" description="Crie um grupo para gerir emprestimos." />
        )}
      </Card>

      {isLoading ? (
        <Loading message="Carregando emprestimos..." />
      ) : loans.length ? (
        <Table headers={["Valor", "Juros", "Status", "Vencimento", "Criado em"]}>
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
                  {loan.status}
                </Badge>
              </td>
              <td className="px-4 py-3">{formatDate(loan.dueDate)}</td>
              <td className="px-4 py-3">{formatDate(loan.createdAt)}</td>
            </tr>
          ))}
        </Table>
      ) : (
        groups.length > 0 &&
        selectedGroupId && <EmptyState title="Sem emprestimos" description="Nenhum emprestimo no grupo selecionado." />
      )}
    </div>
  );
}
