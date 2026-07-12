import { LoanStatus } from "@prisma/client";
import { Router } from "express";
import { asyncHandler } from "../../lib/http.js";
import { prisma } from "../../lib/prisma.js";

export const dashboardRouter = Router();

const loanStatuses: LoanStatus[] = [
  LoanStatus.PENDING,
  LoanStatus.APPROVED,
  LoanStatus.REJECTED,
  LoanStatus.PAID,
];

dashboardRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const groups = await prisma.group.findMany({
      where: {
        memberships: {
          some: { userId: req.user!.id, isActive: true },
        },
      },
      include: { memberships: true },
    });

    const groupIds = groups.map((group) => group.id);

    const [loanCounts] = await Promise.all([
      groupIds.length
        ? prisma.loan.groupBy({
            by: ["status"],
            where: { groupId: { in: groupIds } },
            _count: { _all: true },
          })
        : Promise.resolve([]),
    ]);

    const totalBalance = groups.reduce((acc, group) => {
      const activeMembers = group.memberships.filter((item) => item.isActive).length;
      return acc + Number(group.monthlyContribution) * activeMembers;
    }, 0);

    const totalMembersSet = new Set<string>();
    for (const group of groups) {
      for (const member of group.memberships) {
        if (member.isActive) {
          totalMembersSet.add(member.userId);
        }
      }
    }

    const loansByStatus = loanStatuses.map((status) => ({
      status,
      count: loanCounts.find((row) => row.status === status)?._count._all ?? 0,
    }));

    const activeLoans = loansByStatus
      .filter((item) => item.status === LoanStatus.PENDING || item.status === LoanStatus.APPROVED)
      .reduce((acc, item) => acc + item.count, 0);

    res.json({
      totalBalance,
      totalMembers: totalMembersSet.size,
      monthlyContributions: totalBalance,
      activeLoans,
      groupsCount: groups.length,
      chartData: groups.slice(0, 6).map((group) => ({
        name: group.name,
        value: Number(group.monthlyContribution),
      })),
      loansByStatus,
    });
  }),
);
