import jwt from "jsonwebtoken";
import { ApiError } from "../lib/http.js";
export const requireAuth = (req, _res, next) => {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
        throw new ApiError(401, "Token ausente.");
    }
    const token = header.replace("Bearer ", "").trim();
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new ApiError(500, "JWT_SECRET nao configurado.");
    }
    try {
        const payload = jwt.verify(token, secret);
        req.user = { id: payload.sub, email: payload.email };
        next();
    }
    catch {
        throw new ApiError(401, "Token invalido.");
    }
};
