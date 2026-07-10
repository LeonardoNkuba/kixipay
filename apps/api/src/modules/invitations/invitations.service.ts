import crypto from "node:crypto";
import { MembershipRole } from "@prisma/client";
import { ApiError } from "../../lib/http.js";
import { prisma } from "../../lib/prisma.js";

const INVITATION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 dias

export const createInvitation = async (input: {
  groupId: string;
  email: string;
  role: MembershipRole;
  createdBy: string;
}) => {
  const requester = await prisma.membership.findUnique({
    where: { userId_groupId: { userId: input.createdBy, groupId: input.groupId } },
  });

  if (!requester || !requester.isActive || requester.role !== MembershipRole.ADMIN) {
    throw new ApiError(403, "Apenas administradores do grupo podem convidar membros.");
  }

  const group = await prisma.group.findUnique({ where: { id: input.groupId } });
  if (!group) {
    throw new ApiError(404, "Grupo nao encontrado.");
  }

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + INVITATION_TTL_MS);

  const existingPending = await prisma.invitation.findFirst({
    where: { groupId: input.groupId, email: input.email, status: "PENDING" },
  });

  const invitation = existingPending
    ? await prisma.invitation.update({
        where: { id: existingPending.id },
        data: { token, expiresAt, role: input.role, createdBy: input.createdBy },
      })
    : await prisma.invitation.create({
        data: {
          groupId: input.groupId,
          email: input.email,
          role: input.role,
          token,
          expiresAt,
          createdBy: input.createdBy,
        },
      });

  await prisma.auditLog.create({
    data: {
      userId: input.createdBy,
      groupId: input.groupId,
      action: "INVITATION_CREATED",
      entity: "Invitation",
      entityId: invitation.id,
      newValue: { email: input.email, role: input.role },
    },
  });

  const inviteUrl = `${process.env.WEB_APP_URL || "http://localhost:3000"}/accept-invite?token=${token}`;

  // MODO DEMO (hackathon): sem servico de email configurado.
  // Em producao, isto deveria ser enviado por email (Resend, SES, etc.) e nunca logado.
  console.log("\n=== CONVITE PARA GRUPO (modo demo, sem email real) ===");
  console.log(`Grupo: ${group.name}`);
  console.log(`Convidado: ${input.email} (${input.role})`);
  console.log(`Link de convite (valido por 7 dias): ${inviteUrl}`);
  console.log("========================================================\n");

  return { message: "Convite gerado com sucesso." };
};

export const listInvitations = async (input: { groupId: string; requesterId: string }) => {
  const requester = await prisma.membership.findUnique({
    where: { userId_groupId: { userId: input.requesterId, groupId: input.groupId } },
  });

  if (!requester || !requester.isActive) {
    throw new ApiError(403, "Sem permissao para este grupo.");
  }

  return prisma.invitation.findMany({
    where: { groupId: input.groupId },
    orderBy: { createdAt: "desc" },
  });
};

export const getInvitationByToken = async (token: string) => {
  const invitation = await prisma.invitation.findUnique({
    where: { token },
    include: { group: { select: { id: true, name: true } } },
  });

  if (!invitation) {
    throw new ApiError(404, "Convite nao encontrado.");
  }

  if (invitation.status !== "PENDING" || invitation.expiresAt < new Date()) {
    throw new ApiError(400, "Convite invalido ou expirado.");
  }

  return {
    email: invitation.email,
    role: invitation.role,
    groupId: invitation.group.id,
    groupName: invitation.group.name,
    expiresAt: invitation.expiresAt,
  };
};

export const acceptInvitation = async (input: { token: string; userId: string; userEmail: string }) => {
  const invitation = await prisma.invitation.findUnique({ where: { token: input.token } });

  if (!invitation) {
    throw new ApiError(404, "Convite nao encontrado.");
  }

  if (invitation.status !== "PENDING" || invitation.expiresAt < new Date()) {
    throw new ApiError(400, "Convite invalido ou expirado.");
  }

  if (invitation.email.toLowerCase() !== input.userEmail.toLowerCase()) {
    throw new ApiError(403, "Este convite foi emitido para outro email.");
  }

  const membership = await prisma.membership.upsert({
    where: { userId_groupId: { userId: input.userId, groupId: invitation.groupId } },
    update: { isActive: true, role: invitation.role },
    create: {
      userId: input.userId,
      groupId: invitation.groupId,
      role: invitation.role,
      isActive: true,
    },
  });

  await prisma.invitation.update({
    where: { id: invitation.id },
    data: { status: "ACCEPTED" },
  });

  await prisma.auditLog.create({
    data: {
      userId: input.userId,
      groupId: invitation.groupId,
      action: "INVITATION_ACCEPTED",
      entity: "Invitation",
      entityId: invitation.id,
      newValue: { membershipId: membership.id },
    },
  });

  return { groupId: invitation.groupId };
};
