import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { ApiError } from "../../lib/http.js";
import { prisma } from "../../lib/prisma.js";
const signToken = (userId, email) => {
    const secret = process.env.JWT_SECRET;
    const expiresIn = (process.env.JWT_EXPIRES_IN || "7d");
    if (!secret) {
        throw new ApiError(500, "JWT_SECRET nao configurado.");
    }
    return jwt.sign({ email }, secret, {
        subject: userId,
        expiresIn,
    });
};
export const registerUser = async (input) => {
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
        },
    });
    const token = signToken(user.id, user.email);
    return { user, token };
};
export const loginUser = async (input) => {
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
        },
        token,
    };
};
