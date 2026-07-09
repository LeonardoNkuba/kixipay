import { NotificationType } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../../lib/http.js";
import { prisma } from "../../lib/prisma.js";

const createNotificationSchema = z.object({
  userId: z.string().uuid(),
  title: z.string().min(3),
  message: z.string().min(3),
  type: z.nativeEnum(NotificationType).default(NotificationType.INFO),
});

const notificationParamsSchema = z.object({
  notificationId: z.string().uuid(),
});

export const notificationsRouter = Router();

notificationsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: "desc" },
    });

    res.json(notifications);
  }),
);

notificationsRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const payload = createNotificationSchema.parse(req.body);

    const notification = await prisma.notification.create({
      data: payload,
    });

    res.status(201).json(notification);
  }),
);

notificationsRouter.patch(
  "/:notificationId/read",
  asyncHandler(async (req, res) => {
    const { notificationId } = notificationParamsSchema.parse(req.params);

    const notification = await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });

    res.json(notification);
  }),
);
