import { ContributionStatus, LoanStatus } from "@prisma/client";
import { Router } from "express";
import { asyncHandler } from "../../lib/http.js";
import { prisma } from "../../lib/prisma.js";

export const reportsRouter = Router();

reportsRouter.get(
  "/summary",
  asyncHandler(async (req, res) => {
    const groups = await prisma.group.findMany({
      where: { memberships: { some: { userId: req.user!.id, isActive: true } } },
      include: {
        memberships: {
          where: { isActive: true },
          include: {
            user: { select: { firstName: true, lastName: true } },
            trustScore: true,
          },
        },
      },
    });

    const groupIds = groups.map((group) => group.id);

    const [contributions, loans] = await Promise.all([
      groupIds.length
        ? prisma.contribution.findMany({
            where: { groupId: { in: groupIds } },
            select: { groupId: true, status: true, amount: true },
          })
        : Promise.resolve([]),
      groupIds.length
        ? prisma.loan.findMany({
            where: { groupId: { in: groupIds } },
            include: { payments: true },
          })
        : Promise.resolve([]),
    ]);

    const groupReports = groups.map((group) => {
      const groupContributions = contributions.filter((item) => item.groupId === group.id);
      const contributionsCollected = groupContributions
        .filter((item) => item.status !== ContributionStatus.PENDING)
        .reduce((acc, item) => acc + Number(item.amount), 0);
      const contributionsPending = groupContributions
        .filter((item) => item.status === ContributionStatus.PENDING)
        .reduce((acc, item) => acc + Number(item.amount), 0);

      const groupLoans = loans.filter((loan) => loan.groupId === group.id);
      const loansOutstanding = groupLoans
        .filter((loan) => loan.status === LoanStatus.APPROVED)
        .reduce((acc, loan) => {
          const totalDue = Number(loan.amount) * (1 + Number(loan.interestRate) / 100);
          const paid = loan.payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
          return acc + Math.max(0, totalDue - paid);
        }, 0);

      return {
        groupId: group.id,
        groupName: group.name,
        currency: group.currency,
        contributionsCollected,
        contributionsPending,
        loansOutstanding,
        loansCount: groupLoans.length,
      };
    });

    const totals = groupReports.reduce(
      (acc, report) => ({
        contributionsCollected: acc.contributionsCollected + report.contributionsCollected,
        contributionsPending: acc.contributionsPending + report.contributionsPending,
        loansOutstanding: acc.loansOutstanding + report.loansOutstanding,
      }),
      { contributionsCollected: 0, contributionsPending: 0, loansOutstanding: 0 },
    );

    const loansIssued = loans
      .filter((loan) => loan.status === LoanStatus.APPROVED || loan.status === LoanStatus.PAID)
      .reduce((acc, loan) => acc + Number(loan.amount), 0);

    const trustLeaderboard = groups
      .flatMap((group) =>
        group.memberships
          .filter((membership) => membership.trustScore)
          .map((membership) => ({
            membershipId: membership.id,
            name: membership.user
              ? `${membership.user.firstName} ${membership.user.lastName}`
              : "Membro",
            groupName: group.name,
            score: membership.trustScore!.score,
            onTimePayments: membership.trustScore!.onTimePayments,
            latePayments: membership.trustScore!.latePayments,
          })),
      )
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    res.json({
      totals: { ...totals, loansIssued },
      groups: groupReports,
      trustLeaderboard,
    });
  }),
);
