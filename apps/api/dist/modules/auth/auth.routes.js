import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../../lib/http.js";
import { prisma } from "../../lib/prisma.js";
import { requireAuth } from "../../middlewares/auth.js";
import { loginUser, registerUser } from "./auth.service.js";
const registerSchema = z.object({
    firstName: z.string().min(2),
    lastName: z.string().min(2),
    email: z.string().email(),
    phone: z.string().optional(),
    password: z.string().min(6),
});
const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
});
export const authRouter = Router();
authRouter.post("/register", asyncHandler(async (req, res) => {
    const payload = registerSchema.parse(req.body);
    const result = await registerUser(payload);
    res.status(201).json(result);
}));
authRouter.post("/login", asyncHandler(async (req, res) => {
    const payload = loginSchema.parse(req.body);
    const result = await loginUser(payload);
    res.json(result);
}));
authRouter.get("/me", requireAuth, asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            status: true,
        },
    });
    res.json(user);
}));
