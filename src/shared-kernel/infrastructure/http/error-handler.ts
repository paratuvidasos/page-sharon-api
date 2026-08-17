import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { DomainException } from "../../domain/exceptions/DomainException";

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof DomainException) {
    res.status(err.statusCode).json({ error: err.code, message: err.message });
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({
      error: "VALIDATION_ERROR",
      message: "Los datos enviados no son válidos.",
      issues: err.issues,
    });
    return;
  }

  console.error(err);
  res.status(500).json({ error: "INTERNAL_ERROR", message: "Ocurrió un error inesperado." });
}
