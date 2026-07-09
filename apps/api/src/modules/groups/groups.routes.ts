import { Router } from "express";
import { CycleType, MembershipRole } from "@prisma/client";
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

const groupParamsSchema = z.object({
  groupId: z.string().uuid(),
});

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
