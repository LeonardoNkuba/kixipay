import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../../lib/http.js";
import { prisma } from "../../lib/prisma.js";

const querySchema = z.object({
  limit: z.coerce.number().int().positive().max(100).optional(),
});

const groupParamsSchema = z.object({
  groupId: z.string().uuid(),
});

export const auditRouter = Router();

auditRouter.get(
  "/group/:groupId",
  asyncHandler(async (req, res) => {
    const { groupId } = groupParamsSchema.parse(req.params);
    const query = querySchema.parse(req.query);

    const logs = await prisma.auditLog.findMany({
      where: { groupId },
      orderBy: { createdAt: "desc" },
      take: query.limit ?? 50,
    });

    res.json(logs);
  }),
);

auditRouter.get(
  "/me",
  asyncHandler(async (req, res) => {
    const query = querySchema.parse(req.query);

    const logs = await prisma.auditLog.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: "desc" },
      take: query.limit ?? 50,
    });

    res.json(logs);
  }),
);
