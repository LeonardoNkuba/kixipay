import bcrypt from "bcryptjs";
import type { Prisma, PrismaClient } from "@prisma/client";
import {
  ContributionStatus,
  CycleType,
  GroupStatus,
  LoanStatus,
  MembershipRole,
  NotificationType,
} from "@prisma/client";

export const DEMO_ADMIN_EMAIL = "demo@kixipay.ao";

const DEMO_MEMBER_NAMES: Array<[string, string]> = [
  ["Isabel", "Fernandes"],
  ["Pedro", "Manuel"],
  ["Beatriz", "Neto"],
  ["Carlos", "Alberto"],
  ["Fatima", "Bumba"],
  ["Miguel", "Ventura"],
  ["Rosa", "Domingos"],
  ["Antonio", "Zola"],
  ["Luisa", "Kiala"],
  ["Paulo", "Sachipengo"],
  ["Teresa", "Mbala"],
  ["Ricardo", "Fonseca"],
  ["Cristina", "Wanga"],
  ["Eduardo", "Lopes"],
  ["Marta", "Chissano"],
  ["Vasco", "Tomas"],
  ["Ines", "Katumba"],
];

const clampScore = (value: number) => Math.max(0, Math.min(100, Math.round(value)));

// Demo-only credential: /auth/demo never checks this hash, it issues a token directly.
const DEMO_PASSWORD_PLACEHOLDER = "kixipay-demo-mode-no-login";

const monthsBack = (count: number): Date[] => {
  const now = new Date();
  const months: Date[] = [];
  for (let i = count - 1; i >= 0; i -= 1) {
    months.push(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1)));
  }
  return months;
};

export const ensureDemoAdmin = async (prisma: PrismaClient) => {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD_PLACEHOLDER, 10);

  return prisma.user.upsert({
    where: { email: DEMO_ADMIN_EMAIL },
    update: { isDemo: true },
    create: {
      firstName: "Demo",
      lastName: "Admin",
      email: DEMO_ADMIN_EMAIL,
      passwordHash,
      isVerified: true,
      isDemo: true,
    },
  });
};

type LoanDefinition = {
  memberIndex: number;
  amount: number;
  status: LoanStatus;
  reason: string;
  payments?: number[];
};

const LOAN_DEFINITIONS: LoanDefinition[] = [
  { memberIndex: 2, amount: 40000, status: LoanStatus.PENDING, reason: "Despesas medicas" },
  { memberIndex: 4, amount: 60000, status: LoanStatus.APPROVED, reason: "Expansao de negocio familiar" },
  { memberIndex: 6, amount: 50000, status: LoanStatus.APPROVED, reason: "Materiais de construcao", payments: [20000] },
  { memberIndex: 8, amount: 35000, status: LoanStatus.PAID, reason: "Matricula escolar", payments: [35000] },
  { memberIndex: 10, amount: 30000, status: LoanStatus.REJECTED, reason: "Compra de equipamento" },
];

export const resetDemoDataset = async (prisma: PrismaClient, demoUserId: string) => {
  const previousGroups = await prisma.group.findMany({
    where: { createdBy: demoUserId },
    select: { id: true },
  });

  if (previousGroups.length) {
    await prisma.group.deleteMany({ where: { id: { in: previousGroups.map((group) => group.id) } } });
  }

  const memberPasswordHash = await bcrypt.hash(DEMO_PASSWORD_PLACEHOLDER, 10);
  const members = await Promise.all(
    DEMO_MEMBER_NAMES.map(([firstName, lastName], index) =>
      prisma.user.upsert({
        where: { email: `demo.member${index + 1}@kixipay.ao` },
        update: { isDemo: true },
        create: {
          firstName,
          lastName,
          email: `demo.member${index + 1}@kixipay.ao`,
          passwordHash: memberPasswordHash,
          isVerified: true,
          isDemo: true,
        },
      }),
    ),
  );

  // Group deletion cascades memberships/contributions/loans, but not notifications
  // (Notification only relates to User, not Group), so those linger across resets.
  const allUserIds = [demoUserId, ...members.map((member) => member.id)];
  await prisma.notification.deleteMany({ where: { userId: { in: allUserIds } } });

  const months = monthsBack(6);

  const group = await prisma.group.create({
    data: {
      name: "Kixikila Bairro Prenda",
      description: "Grupo de demonstracao com 6 meses de historico simulado, para explorar a plataforma sem criar dados do zero.",
      monthlyContribution: 15000,
      currency: "AOA",
      maxMembers: 20,
      cycleType: CycleType.MONTHLY,
      startDate: months[0],
      status: GroupStatus.ACTIVE,
      createdBy: demoUserId,
    },
  });

  await prisma.groupSettings.create({
    data: {
      groupId: group.id,
      defaultInterestRate: 10,
      collectionDay: 5,
      maxMembers: 20,
      requireLoanApproval: true,
    },
  });

  const roles: MembershipRole[] = [
    MembershipRole.ADMIN,
    MembershipRole.TREASURER,
    ...Array<MembershipRole>(DEMO_MEMBER_NAMES.length - 1).fill(MembershipRole.MEMBER),
  ];

  const memberships = await Promise.all(
    allUserIds.map((userId, index) =>
      prisma.membership.create({
        data: { userId, groupId: group.id, role: roles[index], isActive: true },
      }),
    ),
  );

  const currentMonthIndex = months.length - 1;
  const punctuality = new Map<string, { onTime: number; late: number }>();
  const bump = (membershipId: string, onTime: boolean) => {
    const entry = punctuality.get(membershipId) ?? { onTime: 0, late: 0 };
    if (onTime) entry.onTime += 1;
    else entry.late += 1;
    punctuality.set(membershipId, entry);
  };

  const contributionRows: Prisma.ContributionCreateManyInput[] = [];
  const currentMonthPaidTransactions: Prisma.TransactionCreateManyInput[] = [];
  const pendingCurrentMonthMemberships: (typeof memberships)[number][] = [];

  months.forEach((month, monthIndex) => {
    const isCurrentMonth = monthIndex === currentMonthIndex;
    memberships.forEach((membership, memberIndex) => {
      let status: ContributionStatus;
      let paidAt: Date | null;

      if (isCurrentMonth) {
        const isPending = (memberIndex + monthIndex) % 5 === 0;
        status = isPending ? ContributionStatus.PENDING : ContributionStatus.PAID;
        paidAt = isPending ? null : new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth(), 3));
        if (isPending) {
          pendingCurrentMonthMemberships.push(membership);
        } else {
          currentMonthPaidTransactions.push({
            groupId: group.id,
            userId: membership.userId,
            type: "CONTRIBUTION",
            amount: 15000,
            description: "Contribuicao mensal",
          });
        }
      } else {
        const isLate = (memberIndex * 3 + monthIndex) % 7 === 0;
        status = isLate ? ContributionStatus.LATE : ContributionStatus.PAID;
        paidAt = isLate ? null : new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth(), 2 + (memberIndex % 5)));
      }

      if (status !== ContributionStatus.PENDING) {
        bump(membership.id, status === ContributionStatus.PAID);
      }

      contributionRows.push({
        groupId: group.id,
        userId: membership.userId,
        amount: 15000,
        referenceMonth: month,
        status,
        paidAt,
      });
    });
  });

  await prisma.contribution.createMany({ data: contributionRows });

  await Promise.all(
    memberships.map((membership) => {
      const stats = punctuality.get(membership.id) ?? { onTime: 0, late: 0 };
      const total = stats.onTime + stats.late;
      const score = total ? clampScore((stats.onTime / total) * 100) : 100;

      return prisma.trustScore.create({
        data: {
          membershipId: membership.id,
          score,
          onTimePayments: stats.onTime,
          latePayments: stats.late,
          lastCalculatedAt: new Date(),
        },
      });
    }),
  );

  const now = new Date();
  const loanDueDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 15));
  const auditRows: Prisma.AuditLogCreateManyInput[] = [
    { userId: demoUserId, groupId: group.id, action: "GROUP_CREATED", entity: "Group", entityId: group.id },
  ];
  const notificationRows: Prisma.NotificationCreateManyInput[] = [];
  const transactionRows: Prisma.TransactionCreateManyInput[] = [...currentMonthPaidTransactions];

  for (const def of LOAN_DEFINITIONS) {
    const borrowerMembership = memberships[def.memberIndex + 1];
    const isDecided = def.status !== LoanStatus.PENDING;

    const loan = await prisma.loan.create({
      data: {
        groupId: group.id,
        userId: borrowerMembership.userId,
        amount: def.amount,
        interestRate: 10,
        reason: def.reason,
        status: def.status,
        approvedBy: isDecided ? demoUserId : null,
        approvedAt: isDecided ? now : null,
        dueDate: loanDueDate,
      },
    });

    transactionRows.push({
      groupId: group.id,
      userId: borrowerMembership.userId,
      type: "LOAN",
      amount: def.amount,
      description: `Emprestimo solicitado: ${def.reason}`,
    });

    auditRows.push({
      userId: def.status === LoanStatus.PENDING ? borrowerMembership.userId : demoUserId,
      groupId: group.id,
      action: def.status === LoanStatus.REJECTED ? "LOAN_REJECTED" : def.status === LoanStatus.PENDING ? "LOAN_REQUESTED" : "LOAN_APPROVED",
      entity: "Loan",
      entityId: loan.id,
    });

    if (def.status === LoanStatus.REJECTED) {
      notificationRows.push({
        userId: borrowerMembership.userId,
        title: "Emprestimo rejeitado",
        message: `O seu pedido de ${def.amount.toLocaleString("pt-PT")} AOA nao foi aprovado.`,
        type: NotificationType.WARNING,
      });
    } else if (def.status === LoanStatus.PENDING) {
      notificationRows.push({
        userId: borrowerMembership.userId,
        title: "Pedido de emprestimo enviado",
        message: `O seu pedido de ${def.amount.toLocaleString("pt-PT")} AOA aguarda aprovacao.`,
        type: NotificationType.INFO,
      });
    } else {
      notificationRows.push({
        userId: borrowerMembership.userId,
        title: "Emprestimo aprovado",
        message: `O seu emprestimo de ${def.amount.toLocaleString("pt-PT")} AOA foi aprovado.`,
        type: NotificationType.SUCCESS,
      });
    }

    for (const paymentAmount of def.payments ?? []) {
      await prisma.loanPayment.create({
        data: { loanId: loan.id, amount: paymentAmount, paidAt: now },
      });

      transactionRows.push({
        groupId: group.id,
        userId: borrowerMembership.userId,
        type: "LOAN_PAYMENT",
        amount: paymentAmount,
        description: "Pagamento de parcela do emprestimo",
      });

      auditRows.push({
        userId: borrowerMembership.userId,
        groupId: group.id,
        action: "LOAN_PAYMENT_CREATED",
        entity: "Loan",
        entityId: loan.id,
      });
    }
  }

  for (const membership of pendingCurrentMonthMemberships) {
    notificationRows.push({
      userId: membership.userId,
      title: "Lembrete de contribuicao",
      message: "A sua contribuicao deste mes ainda esta pendente.",
      type: NotificationType.WARNING,
    });
  }

  if (transactionRows.length) {
    await prisma.transaction.createMany({ data: transactionRows });
  }
  if (notificationRows.length) {
    await prisma.notification.createMany({ data: notificationRows });
  }
  await prisma.auditLog.createMany({ data: auditRows });

  return {
    groupId: group.id,
    membersCount: memberships.length,
    contributionsCount: contributionRows.length,
    loansCount: LOAN_DEFINITIONS.length,
  };
};
