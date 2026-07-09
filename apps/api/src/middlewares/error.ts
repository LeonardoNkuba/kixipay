import type { NextFunction, Request, Response } from "express";
import { ApiError } from "../lib/http.js";

export const notFoundHandler = (_req: Request, res: Response) => {
  res.status(404).json({ message: "Rota nao encontrada." });
};

export const errorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({ message: err.message });
  }

  if (err instanceof Error) {
    return res.status(500).json({ message: err.message });
  }

  return res.status(500).json({ message: "Erro interno." });
};
