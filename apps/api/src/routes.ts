import { Router } from "express";
import { requireAuth } from "./middlewares/auth.js";
import { authRouter } from "./modules/auth/auth.routes.js";
import { groupsRouter } from "./modules/groups/groups.routes.js";
import { contributionsRouter } from "./modules/contributions/contributions.routes.js";
import { loansRouter } from "./modules/loans/loans.routes.js";
import { notificationsRouter } from "./modules/notifications/notifications.routes.js";
import { auditRouter } from "./modules/audit/audit.routes.js";

export const apiRouter = Router();

apiRouter.use("/auth", authRouter);
apiRouter.use("/groups", requireAuth, groupsRouter);
apiRouter.use("/contributions", requireAuth, contributionsRouter);
apiRouter.use("/loans", requireAuth, loansRouter);
apiRouter.use("/notifications", requireAuth, notificationsRouter);
apiRouter.use("/audit", requireAuth, auditRouter);
