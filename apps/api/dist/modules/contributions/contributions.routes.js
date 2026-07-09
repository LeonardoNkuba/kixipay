import { Router } from "express";
import { ContributionStatus, TransactionType } from "@prisma/client";
import { z } from "zod";
import { ApiError, asyncHandler } from "../../lib/http.js";
import { prisma } from "../../lib/prisma.js";
const createContributionSchema = z.object({
    groupId: z.string().uuid(),
    userId: z.string().uuid().optional(),
    amount: z.coerce.number().positive(),
    referenceMonth: z.coerce.date(),
    status: z.nativeEnum(ContributionStatus).default(ContributionStatus.PAID),
    paidAt: z.coerce.date().optional(),
});
const groupParamsSchema = z.object({
    groupId: z.string().uuid(),
});
export const contributionsRouter = Router();
contributionsRouter.get("/group/:groupId", asyncHandler(async (req, res) => {
    const { groupId } = groupParamsSchema.parse(req.params);
    const records = await prisma.contribution.findMany({
        where: { groupId },
        include: {
            user: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                },
            },
        },
        orderBy: { createdAt: "desc" },
    });
    res.json(records);
}));
contributionsRouter.post("/", asyncHandler(async (req, res) => {
    const payload = createContributionSchema.parse(req.body);
    const membership = await prisma.membership.findUnique({
        where: {
            userId_groupId: {
                userId: payload.userId ?? req.user.id,
                groupId: payload.groupId,
            },
        },
    });
    if (!membership?.isActive) {
        throw new ApiError(400, "Membro invalido para o grupo.");
    }
    const contribution = await prisma.$transaction(async (tx) => {
        const created = await tx.contribution.create({
            data: {
                groupId: payload.groupId,
                userId: payload.userId ?? req.user.id,
                amount: payload.amount,
                referenceMonth: payload.referenceMonth,
                status: payload.status,
                paidAt: payload.paidAt,
            },
        });
        await tx.transaction.create({
            data: {
                groupId: payload.groupId,
                userId: payload.userId ?? req.user.id,
                type: TransactionType.CONTRIBUTION,
                amount: payload.amount,
                description: "Contribuicao mensal",
            },
        });
        await tx.auditLog.create({
            data: {
                userId: req.user.id,
                groupId: payload.groupId,
                action: "CONTRIBUTION_CREATED",
                entity: "Contribution",
                entityId: created.id,
                newValue: created,
            },
        });
        return created;
    });
    res.status(201).json(contribution);
}));
