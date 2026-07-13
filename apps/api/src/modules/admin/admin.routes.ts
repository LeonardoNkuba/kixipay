import { Router } from "express";
import { ApiError, asyncHandler } from "../../lib/http.js";
import { prisma } from "../../lib/prisma.js";
import { requireAuth } from "../../middlewares/auth.js";
import { resetDemoDataset } from "../demo/demo-dataset.js";

export const adminRouter = Router();

adminRouter.post(
  "/reset-demo",
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({ where: { id: req.user!.id }, select: { id: true, isDemo: true } });

    if (!user?.isDemo) {
      throw new ApiError(403, "Apenas a conta demo pode reiniciar os dados de demonstracao.");
    }

    const summary = await resetDemoDataset(prisma, user.id);
    res.json({ message: "Dados de demonstracao reiniciados.", ...summary });
  }),
);
