import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "node:crypto";
import { ApiError } from "../../lib/http.js";
import { prisma } from "../../lib/prisma.js";
import { ensureDemoAdmin, resetDemoDataset } from "../demo/demo-dataset.js";

const signToken = (userId: string, email: string) => {
  const secret = process.env.JWT_SECRET;
  const expiresIn = (process.env.JWT_EXPIRES_IN || "7d") as jwt.SignOptions["expiresIn"];

  if (!secret) {
    throw new ApiError(500, "JWT_SECRET nao configurado.");
  }

  return jwt.sign({ email }, secret, {
    subject: userId,
    expiresIn,
  });
};

export const registerUser = async (input: {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  password: string;
}) => {
  const exists = await prisma.user.findUnique({ where: { email: input.email } });
  if (exists) {
    throw new ApiError(409, "Email ja cadastrado.");
  }

  const passwordHash = await bcrypt.hash(input.password, 10);

  const user = await prisma.user.create({
    data: {
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      phone: input.phone,
      passwordHash,
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      isDemo: true,
    },
  });

  const token = signToken(user.id, user.email);
  return { user, token };
};

export const loginUser = async (input: { email: string; password: string }) => {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user) {
    throw new ApiError(401, "Credenciais invalidas.");
  }

  const match = await bcrypt.compare(input.password, user.passwordHash);
  if (!match) {
    throw new ApiError(401, "Credenciais invalidas.");
  }

  const token = signToken(user.id, user.email);

  return {
    user: {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      isDemo: user.isDemo,
    },
    token,
  };
};

export const demoLogin = async () => {
  const demoUser = await ensureDemoAdmin(prisma);

  const existingGroup = await prisma.group.findFirst({ where: { createdBy: demoUser.id } });
  if (!existingGroup) {
    await resetDemoDataset(prisma, demoUser.id);
  }

  const token = signToken(demoUser.id, demoUser.email);

  return {
    user: {
      id: demoUser.id,
      firstName: demoUser.firstName,
      lastName: demoUser.lastName,
      email: demoUser.email,
      isDemo: demoUser.isDemo,
    },
    token,
  };
};

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hora

export const requestPasswordReset = async (email: string) => {
  const user = await prisma.user.findUnique({ where: { email } });

  // Resposta generica sempre, mesmo se o email nao existir (evita enumeracao de contas).
  if (!user) {
    return { message: "Se o email existir, um link de recuperacao foi gerado." };
  }

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      resetPasswordToken: token,
      resetPasswordExpiresAt: expiresAt,
    },
  });

  const resetUrl = `${process.env.WEB_APP_URL || "http://localhost:3000"}/reset-password?token=${token}`;

  // MODO DEMO (hackathon): sem servico de email configurado.
  // Em producao, isto deveria ser enviado por email (Resend, SES, etc.) e nunca logado.
  console.log("\n=== RECUPERACAO DE SENHA (modo demo, sem email real) ===");
  console.log(`Utilizador: ${user.email}`);
  console.log(`Link de reset (valido por 1h): ${resetUrl}`);
  console.log("=========================================================\n");

  return { message: "Se o email existir, um link de recuperacao foi gerado." };
};

export const resetPassword = async (input: { token: string; password: string }) => {
  const user = await prisma.user.findUnique({
    where: { resetPasswordToken: input.token },
  });

  if (!user || !user.resetPasswordExpiresAt || user.resetPasswordExpiresAt < new Date()) {
    throw new ApiError(400, "Token invalido ou expirado.");
  }

  const passwordHash = await bcrypt.hash(input.password, 10);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      resetPasswordToken: null,
      resetPasswordExpiresAt: null,
    },
  });

  return { message: "Palavra-passe atualizada com sucesso." };
};