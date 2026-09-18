import { AsyncLocalStorage } from "node:async_hooks";
import { createHash, randomBytes } from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import prisma from "./prisma.js";

type User = NonNullable<Awaited<ReturnType<typeof prisma.user.findUnique>>>;
export type PublicUser = Pick<User, "id" | "name" | "email" | "role" | "isActive" | "created_at">;
const authContext = new AsyncLocalStorage<PublicUser>();
const cookieName = "onwallet_session";
const sessionMs = 7 * 24 * 60 * 60 * 1000;

export function publicUser(user: User): PublicUser {
  const { id, name, email, role, isActive, created_at } = user;
  return { id, name, email, role, isActive, created_at };
}

export function currentUser(): PublicUser {
  const user = authContext.getStore();
  if (!user) throw new Error("Usuário não autenticado");
  return user;
}

export function currentUserId(): string {
  return currentUser().id;
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function cookieToken(req: Request): string | undefined {
  const item = req.headers.cookie?.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${cookieName}=`));
  return item?.slice(cookieName.length + 1);
}

export async function startSession(userId: string, res: Response): Promise<void> {
  const token = randomBytes(32).toString("base64url");
  await prisma.session.create({
    data: { userId, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + sessionMs) },
  });
  res.cookie(cookieName, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: sessionMs,
  });
  res.setHeader("Cache-Control", "no-store");
}

export async function endSession(req: Request, res: Response): Promise<void> {
  const token = cookieToken(req);
  if (token) await prisma.session.deleteMany({ where: { tokenHash: hashToken(token) } });
  res.clearCookie(cookieName, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });
  res.setHeader("Cache-Control", "no-store");
}

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const token = cookieToken(req);
    if (!token) { res.status(401).json({ error: "Faça login para continuar" }); return; }
    const session = await prisma.session.findUnique({
      where: { tokenHash: hashToken(token) },
      include: { user: true },
    });
    if (!session || session.expiresAt <= new Date() || !session.user.isActive) {
      res.status(401).json({ error: "Sessão inválida ou expirada" });
      return;
    }
    res.setHeader("Cache-Control", "no-store");
    authContext.run(publicUser(session.user), next);
  } catch (error) { next(error); }
}

export function requireAdmin(_req: Request, res: Response, next: NextFunction): void {
  if (currentUser().role !== "ADMIN") { res.status(403).json({ error: "Acesso restrito ao administrador" }); return; }
  next();
}

export function checkOrigin(req: Request, res: Response, next: NextFunction): void {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) { next(); return; }
  const origin = req.get("origin");
  const allowed = process.env.FRONTEND_URL || "http://localhost:5173";
  const sameHost = origin && URL.canParse(origin) ? new URL(origin).host === req.get("host") : false;
  if (origin && origin !== allowed && !sameHost) { res.status(403).json({ error: "Origem não permitida" }); return; }
  next();
}
