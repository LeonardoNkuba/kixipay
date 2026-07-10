import { Router } from "express";
import { MembershipRole } from "@prisma/client";
import { z } from "zod";
import { asyncHandler } from "../../lib/http.js";
import { requireAuth } from "../../middlewares/auth.js";
import {
  acceptInvitation,
  createInvitation,
  getInvitationByToken,
  listInvitations,
} from "./invitations.service.js";

const createInvitationSchema = z.object({
  groupId: z.string().uuid(),
  email: z.string().email(),
  role: z.nativeEnum(MembershipRole).default(MembershipRole.MEMBER),
});

const listInvitationsSchema = z.object({
  groupId: z.string().uuid(),
});

const tokenParamsSchema = z.object({
  token: z.string().min(1),
});

export const invitationsRouter = Router();

invitationsRouter.post(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const payload = createInvitationSchema.parse(req.body);
    const result = await createInvitation({ ...payload, createdBy: req.user!.id });
    res.status(201).json(result);
  }),
);

invitationsRouter.get(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { groupId } = listInvitationsSchema.parse(req.query);
    const result = await listInvitations({ groupId, requesterId: req.user!.id });
    res.json(result);
  }),
);

invitationsRouter.get(
  "/:token",
  asyncHandler(async (req, res) => {
    const { token } = tokenParamsSchema.parse(req.params);
    const result = await getInvitationByToken(token);
    res.json(result);
  }),
);

invitationsRouter.post(
  "/:token/accept",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { token } = tokenParamsSchema.parse(req.params);
    const result = await acceptInvitation({
      token,
      userId: req.user!.id,
      userEmail: req.user!.email,
    });
    res.json(result);
  }),
);
