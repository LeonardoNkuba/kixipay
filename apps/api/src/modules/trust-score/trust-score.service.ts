import type { Prisma, PrismaClient } from "@prisma/client";

type TxClient = PrismaClient | Prisma.TransactionClient;

const clampScore = (value: number) => Math.max(0, Math.min(100, Math.round(value)));

export const recordPunctualityEvent = async (
  tx: TxClient,
  membershipId: string,
  onTime: boolean,
) => {
  const existing = await tx.trustScore.findUnique({ where: { membershipId } });

  const onTimePayments = (existing?.onTimePayments ?? 0) + (onTime ? 1 : 0);
  const latePayments = (existing?.latePayments ?? 0) + (onTime ? 0 : 1);
  const score = clampScore((onTimePayments / (onTimePayments + latePayments)) * 100);

  return tx.trustScore.upsert({
    where: { membershipId },
    create: {
      membershipId,
      score,
      onTimePayments,
      latePayments,
      lastCalculatedAt: new Date(),
    },
    update: {
      score,
      onTimePayments,
      latePayments,
      lastCalculatedAt: new Date(),
    },
  });
};
