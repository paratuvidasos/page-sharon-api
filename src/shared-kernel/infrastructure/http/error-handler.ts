import { NextFunction, Request, Response } from "express";
import { MulterError } from "multer";
import { ZodError } from "zod";
import { DomainException } from "../../domain/exceptions/DomainException";

const AVATAR_MAX_SIZE_MB = Number(process.env.AVATAR_MAX_SIZE_MB ?? 5);

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

  if (err instanceof MulterError) {
    const message =
      err.code === "LIMIT_FILE_SIZE"
        ? `El archivo supera el tamaño máximo permitido (${AVATAR_MAX_SIZE_MB}MB).`
        : "No se pudo procesar el archivo enviado.";
    res.status(400).json({ error: "INVALID_FILE", message });
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
