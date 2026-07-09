import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import {
  ContributionStatus,
  CycleType,
  GroupStatus,
  InvitationStatus,
  LoanStatus,
  MembershipRole,
  NotificationType,
  PrismaClient,
  TransactionType,
  UserStatus,
} from "@prisma/client";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  const passwordHash = await bcrypt.hash("123456", 10);

  await prisma.$transaction([
    prisma.auditLog.deleteMany(),
    prisma.notification.deleteMany(),
    prisma.transaction.deleteMany(),
    prisma.loanPayment.deleteMany(),
    prisma.loan.deleteMany(),
    prisma.contribution.deleteMany(),
    prisma.invitation.deleteMany(),
    prisma.trustScore.deleteMany(),
    prisma.membership.deleteMany(),
    prisma.groupSettings.deleteMany(),
    prisma.group.deleteMany(),
    prisma.user.deleteMany(),
  ]);

  const leonardo = await prisma.user.create({
    data: {
      firstName: "Leonardo",
      lastName: "Nkuba",
      email: "leonardo@kixipay.ao",
      phone: "+244900000001",
      passwordHash,
      isVerified: true,
      status: UserStatus.ACTIVE,
    },
  });

  const maria = await prisma.user.create({
    data: {
      firstName: "Maria",
      lastName: "Silva",
      email: "maria@kixipay.ao",
      phone: "+244900000002",
      passwordHash,
      isVerified: true,
      status: UserStatus.ACTIVE,
    },
  });

  const joao = await prisma.user.create({
    data: {
      firstName: "Joao",
      lastName: "Pedro",
      email: "joao@kixipay.ao",
      phone: "+244900000003",
      passwordHash,
      isVerified: true,
      status: UserStatus.ACTIVE,
    },
  });

  const ana = await prisma.user.create({
    data: {
      firstName: "Ana",
      lastName: "Costa",
      email: "ana@kixipay.ao",
      phone: "+244900000004",
      passwordHash,
      isVerified: false,
      status: UserStatus.ACTIVE,
    },
  });

  const familiaSilva = await prisma.group.create({
    data: {
      name: "Familia Silva",
      description: "Kixikila familiar para emergencias e investimento.",
      monthlyContribution: 10000,
      currency: "AOA",
      maxMembers: 12,
      cycleType: CycleType.MONTHLY,
      startDate: new Date("2026-07-01"),
      status: GroupStatus.ACTIVE,
      createdBy: leonardo.id,
    },
  });

  await prisma.groupSettings.create({
    data: {
      groupId: familiaSilva.id,
      defaultInterestRate: 10,
      collectionDay: 9,
      maxMembers: 12,
      requireLoanApproval: true,
    },
  });

  const memberships = await prisma.$transaction([
    prisma.membership.create({
      data: {
        userId: leonardo.id,
        groupId: familiaSilva.id,
        role: MembershipRole.ADMIN,
        isActive: true,
      },
    }),
    prisma.membership.create({
      data: {
        userId: maria.id,
        groupId: familiaSilva.id,
        role: MembershipRole.TREASURER,
        isActive: true,
      },
    }),
    prisma.membership.create({
      data: {
        userId: joao.id,
        groupId: familiaSilva.id,
        role: MembershipRole.MEMBER,
        isActive: true,
      },
    }),
  ]);

  await prisma.trustScore.createMany({
    data: [
      {
        membershipId: memberships[0].id,
        score: 98,
        onTimePayments: 12,
        latePayments: 0,
        lastCalculatedAt: new Date(),
      },
      {
        membershipId: memberships[1].id,
        score: 95,
        onTimePayments: 11,
        latePayments: 1,
        lastCalculatedAt: new Date(),
      },
      {
        membershipId: memberships[2].id,
        score: 82,
        onTimePayments: 8,
        latePayments: 3,
        lastCalculatedAt: new Date(),
      },
    ],
  });

  const julyMonth = new Date("2026-07-01");

  const contribLeonardo = await prisma.contribution.create({
    data: {
      groupId: familiaSilva.id,
      userId: leonardo.id,
      amount: 10000,
      referenceMonth: julyMonth,
      status: ContributionStatus.PAID,
      paidAt: new Date("2026-07-09T10:00:00.000Z"),
    },
  });

  const contribMaria = await prisma.contribution.create({
    data: {
      groupId: familiaSilva.id,
      userId: maria.id,
      amount: 10000,
      referenceMonth: julyMonth,
      status: ContributionStatus.PAID,
      paidAt: new Date("2026-07-08T11:00:00.000Z"),
    },
  });

  const contribJoao = await prisma.contribution.create({
    data: {
      groupId: familiaSilva.id,
      userId: joao.id,
      amount: 10000,
      referenceMonth: julyMonth,
      status: ContributionStatus.LATE,
      paidAt: null,
    },
  });

  const loanMaria = await prisma.loan.create({
    data: {
      groupId: familiaSilva.id,
      userId: maria.id,
      amount: 50000,
      interestRate: 10,
      reason: "Compra de material para negocio familiar",
      status: LoanStatus.APPROVED,
      approvedBy: leonardo.id,
      approvedAt: new Date("2026-07-08T12:00:00.000Z"),
      dueDate: new Date("2026-08-30"),
    },
  });

  const loanPaymentMaria = await prisma.loanPayment.create({
    data: {
      loanId: loanMaria.id,
      amount: 15000,
      paidAt: new Date("2026-07-10T09:00:00.000Z"),
    },
  });

  await prisma.transaction.createMany({
    data: [
      {
        groupId: familiaSilva.id,
        userId: leonardo.id,
        type: TransactionType.CONTRIBUTION,
        amount: 10000,
        description: "Contribuicao de Leonardo",
      },
      {
        groupId: familiaSilva.id,
        userId: maria.id,
        type: TransactionType.CONTRIBUTION,
        amount: 10000,
        description: "Contribuicao de Maria",
      },
      {
        groupId: familiaSilva.id,
        userId: maria.id,
        type: TransactionType.LOAN,
        amount: 50000,
        description: "Emprestimo aprovado para Maria",
      },
      {
        groupId: familiaSilva.id,
        userId: maria.id,
        type: TransactionType.LOAN_PAYMENT,
        amount: 15000,
        description: "Primeira parcela do emprestimo",
      },
    ],
  });

  await prisma.notification.createMany({
    data: [
      {
        userId: joao.id,
        title: "Lembrete de contribuicao",
        message: "Voce ainda nao pagou a contribuicao de Julho.",
        type: NotificationType.WARNING,
        isRead: false,
      },
      {
        userId: maria.id,
        title: "Emprestimo aprovado",
        message: "Seu emprestimo de 50.000 AOA foi aprovado.",
        type: NotificationType.SUCCESS,
        isRead: false,
      },
    ],
  });

  await prisma.invitation.create({
    data: {
      groupId: familiaSilva.id,
      email: ana.email,
      token: "invite-ana-familia-silva-2026",
      status: InvitationStatus.PENDING,
      expiresAt: new Date("2026-07-20T00:00:00.000Z"),
      createdBy: leonardo.id,
    },
  });

  await prisma.auditLog.createMany({
    data: [
      {
        userId: leonardo.id,
        groupId: familiaSilva.id,
        action: "GROUP_CREATED",
        entity: "Group",
        entityId: familiaSilva.id,
      },
      {
        userId: leonardo.id,
        groupId: familiaSilva.id,
        action: "CONTRIBUTION_CREATED",
        entity: "Contribution",
        entityId: contribLeonardo.id,
      },
      {
        userId: maria.id,
        groupId: familiaSilva.id,
        action: "CONTRIBUTION_CREATED",
        entity: "Contribution",
        entityId: contribMaria.id,
      },
      {
        userId: joao.id,
        groupId: familiaSilva.id,
        action: "CONTRIBUTION_CREATED",
        entity: "Contribution",
        entityId: contribJoao.id,
      },
      {
        userId: leonardo.id,
        groupId: familiaSilva.id,
        action: "LOAN_APPROVED",
        entity: "Loan",
        entityId: loanMaria.id,
      },
      {
        userId: maria.id,
        groupId: familiaSilva.id,
        action: "LOAN_PAYMENT_CREATED",
        entity: "LoanPayment",
        entityId: loanPaymentMaria.id,
      },
    ],
  });

  console.log("Seed concluido com sucesso.");
  console.log("Login demo: leonardo@kixipay.ao / 123456");
}

main()
  .catch((error) => {
    console.error("Erro no seed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
