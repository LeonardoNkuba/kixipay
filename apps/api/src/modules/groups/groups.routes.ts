import { Router } from "express";
import { CycleType, GroupStatus, MembershipRole } from "@prisma/client";
import { z } from "zod";
import { asyncHandler, ApiError } from "../../lib/http.js";
import { prisma } from "../../lib/prisma.js";

const createGroupSchema = z.object({
  name: z.string().min(3),
  description: z.string().optional(),
  monthlyContribution: z.coerce.number().positive(),
  currency: z.string().min(3).max(3).default("AOA"),
  maxMembers: z.coerce.number().int().positive().optional(),
  cycleType: z.nativeEnum(CycleType).default(CycleType.MONTHLY),
  startDate: z.coerce.date(),
});

const updateGroupSchema = z.object({
  name: z.string().min(3).optional(),
  description: z.string().optional(),
  monthlyContribution: z.coerce.number().positive().optional(),
  maxMembers: z.coerce.number().int().positive().optional(),
  cycleType: z.nativeEnum(CycleType).optional(),
});

const updateGroupStatusSchema = z.object({
  status: z.nativeEnum(GroupStatus),
});

const updateMemberRoleSchema = z.object({
  role: z.nativeEnum(MembershipRole),
});

const groupParamsSchema = z.object({
  groupId: z.string().uuid(),
});

const memberParamsSchema = z.object({
  groupId: z.string().uuid(),
  membershipId: z.string().uuid(),
});

const requireAdminMembership = async (userId: string, groupId: string) => {
  const membership = await prisma.membership.findUnique({
    where: { userId_groupId: { userId, groupId } },
  });

  if (!membership || !membership.isActive || membership.role !== MembershipRole.ADMIN) {
    throw new ApiError(403, "Apenas administradores podem realizar esta acao.");
  }

  return membership;
};

export const groupsRouter = Router();

groupsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const groups = await prisma.group.findMany({
      where: {
        memberships: {
          some: {
            userId: req.user!.id,
            isActive: true,
          },
        },
      },
      include: {
        memberships: true,
        settings: true,
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(groups);
  }),
);

groupsRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const payload = createGroupSchema.parse(req.body);

    const group = await prisma.group.create({
      data: {
        name: payload.name,
        description: payload.description,
        monthlyContribution: payload.monthlyContribution,
        currency: payload.currency,
        maxMembers: payload.maxMembers,
        cycleType: payload.cycleType,
        startDate: payload.startDate,
        createdBy: req.user!.id,
        memberships: {
          create: {
            userId: req.user!.id,
            role: MembershipRole.ADMIN,
            isActive: true,
          },
        },
        settings: {
          create: {
            defaultInterestRate: 10,
            collectionDay: 5,
            maxMembers: payload.maxMembers,
            requireLoanApproval: true,
          },
        },
      },
      include: {
        memberships: true,
        settings: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        groupId: group.id,
        action: "GROUP_CREATED",
        entity: "Group",
        entityId: group.id,
        newValue: group,
      },
    });

    res.status(201).json(group);
  }),
);

groupsRouter.get(
  "/:groupId",
  asyncHandler(async (req, res) => {
    const { groupId } = groupParamsSchema.parse(req.params);
    const membership = await prisma.membership.findUnique({
      where: { userId_groupId: { userId: req.user!.id, groupId } },
    });

    if (!membership || !membership.isActive) {
      throw new ApiError(403, "Sem permissao para este grupo.");
    }

    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: {
        settings: true,
        memberships: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            trustScore: true,
          },
        },
      },
    });

    res.json(group);
  }),
);

groupsRouter.patch(
  "/:groupId",
  asyncHandler(async (req, res) => {
    const { groupId } = groupParamsSchema.parse(req.params);
    const payload = updateGroupSchema.parse(req.body);

    await requireAdminMembership(req.user!.id, groupId);

    const existing = await prisma.group.findUnique({ where: { id: groupId } });
    if (!existing) {
      throw new ApiError(404, "Grupo nao encontrado.");
    }

    const updated = await prisma.group.update({
      where: { id: groupId },
      data: payload,
      include: { settings: true, memberships: true },
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        groupId,
        action: "GROUP_UPDATED",
        entity: "Group",
        entityId: groupId,
        oldValue: existing,
        newValue: updated,
      },
    });

    res.json(updated);
  }),
);

groupsRouter.patch(
  "/:groupId/status",
  asyncHandler(async (req, res) => {
    const { groupId } = groupParamsSchema.parse(req.params);
    const payload = updateGroupStatusSchema.parse(req.body);

    await requireAdminMembership(req.user!.id, groupId);

    const existing = await prisma.group.findUnique({ where: { id: groupId } });
    if (!existing) {
      throw new ApiError(404, "Grupo nao encontrado.");
    }

    const updated = await prisma.group.update({
      where: { id: groupId },
      data: { status: payload.status },
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        groupId,
        action: "GROUP_STATUS_CHANGED",
        entity: "Group",
        entityId: groupId,
        oldValue: existing,
        newValue: updated,
      },
    });

    res.json(updated);
  }),
);

groupsRouter.patch(
  "/:groupId/members/:membershipId",
  asyncHandler(async (req, res) => {
    const { groupId, membershipId } = memberParamsSchema.parse(req.params);
    const payload = updateMemberRoleSchema.parse(req.body);

    await requireAdminMembership(req.user!.id, groupId);

    const target = await prisma.membership.findUnique({ where: { id: membershipId } });
    if (!target || target.groupId !== groupId || !target.isActive) {
      throw new ApiError(404, "Membro nao encontrado neste grupo.");
    }

    if (target.role === MembershipRole.ADMIN && payload.role !== MembershipRole.ADMIN) {
      const otherAdmins = await prisma.membership.count({
        where: {
          groupId,
          role: MembershipRole.ADMIN,
          isActive: true,
          id: { not: membershipId },
        },
      });

      if (otherAdmins === 0) {
        throw new ApiError(400, "O grupo precisa de pelo menos um administrador.");
      }
    }

    const updated = await prisma.membership.update({
      where: { id: membershipId },
      data: { role: payload.role },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
        trustScore: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        groupId,
        action: "MEMBER_ROLE_CHANGED",
        entity: "Membership",
        entityId: membershipId,
        oldValue: target,
        newValue: updated,
      },
    });

    res.json(updated);
  }),
);

groupsRouter.delete(
  "/:groupId/members/:membershipId",
  asyncHandler(async (req, res) => {
    const { groupId, membershipId } = memberParamsSchema.parse(req.params);

    await requireAdminMembership(req.user!.id, groupId);

    const target = await prisma.membership.findUnique({ where: { id: membershipId } });
    if (!target || target.groupId !== groupId || !target.isActive) {
      throw new ApiError(404, "Membro nao encontrado neste grupo.");
    }

    if (target.role === MembershipRole.ADMIN) {
      const otherAdmins = await prisma.membership.count({
        where: {
          groupId,
          role: MembershipRole.ADMIN,
          isActive: true,
          id: { not: membershipId },
        },
      });

      if (otherAdmins === 0) {
        throw new ApiError(400, "O grupo precisa de pelo menos um administrador.");
      }
    }

    const updated = await prisma.membership.update({
      where: { id: membershipId },
      data: { isActive: false },
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        groupId,
        action: "MEMBER_REMOVED",
        entity: "Membership",
        entityId: membershipId,
        oldValue: target,
        newValue: updated,
      },
    });

    res.status(204).send();
  }),
);
