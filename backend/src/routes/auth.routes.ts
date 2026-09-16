import { Router } from "express";
import type { Response } from "express";
import { Prisma } from "@prisma/client";
import prisma from "../lib/prisma.js";
import PasswordService from "../services/Password.service.js";
import { currentUser, currentUserId, endSession, publicUser, requireAuth, requireAdmin, startSession } from "../lib/auth.js";

const router = Router();
const passwords = new PasswordService();
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const loginAttempts = new Map<string, { count: number; resetsAt: number }>();
const validRole = (value: unknown): value is "ADMIN" | "USER" => value === "ADMIN" || value === "USER";
const validPassword = (value: unknown): value is string => typeof value === "string" && value.length >= 8 && value.length <= 1024;
const normalEmail = (value: unknown) => typeof value === "string" ? value.trim().toLowerCase() : "";
const normalName = (value: unknown) => typeof value === "string" ? value.trim() : "";

function fail(res: Response, error: unknown): void {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    res.status(409).json({ error: "E-mail já cadastrado" });
    return;
  }
  console.error("Erro no módulo de usuários", error);
  res.status(500).json({ error: "Não foi possível concluir a operação" });
}

router.post("/login", async (req, res) => {
  const email = normalEmail(req.body?.email);
  const password = req.body?.password;
  if (!email || typeof password !== "string") { res.status(400).json({ error: "Informe e-mail e senha" }); return; }
  const key = req.ip || req.socket.remoteAddress || "unknown";
  const previous = loginAttempts.get(key);
  const attempt = previous && previous.resetsAt > Date.now() ? previous : { count: 0, resetsAt: Date.now() + 15 * 60 * 1000 };
  if (attempt.count >= 20) {
    res.setHeader("Retry-After", String(Math.ceil((attempt.resetsAt - Date.now()) / 1000)));
    res.status(429).json({ error: "Muitas tentativas de login. Tente novamente mais tarde." });
    return;
  }
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.isActive || !(await passwords.verifyPasswordHash(password, user.passwordHash))) {
      attempt.count += 1;
      if (loginAttempts.size > 10000) loginAttempts.clear();
      loginAttempts.set(key, attempt);
      res.status(401).json({ error: "E-mail ou senha inválidos" });
      return;
    }
    loginAttempts.delete(key);
    await startSession(user.id, res);
    res.json(publicUser(user));
  } catch (error) { fail(res, error); }
});

router.post("/logout", requireAuth, async (req, res) => {
  try { await endSession(req, res); res.status(204).send(); }
  catch (error) { fail(res, error); }
});

router.get("/me", requireAuth, (_req, res) => { res.json(currentUser()); });

router.patch("/me", requireAuth, async (req, res) => {
  const name = normalName(req.body?.name);
  const email = normalEmail(req.body?.email);
  if (!name || !emailPattern.test(email)) { res.status(400).json({ error: "Nome e e-mail válidos são obrigatórios" }); return; }
  try {
    const user = await prisma.user.update({ where: { id: currentUserId() }, data: { name, email } });
    res.json(publicUser(user));
  } catch (error) { fail(res, error); }
});

router.post("/me/password", requireAuth, async (req, res) => {
  const { currentPassword, newPassword } = req.body || {};
  if (typeof currentPassword !== "string" || !validPassword(newPassword)) {
    res.status(400).json({ error: "Informe a senha atual e uma nova senha de 8 a 1024 caracteres" }); return;
  }
  try {
    const user = await prisma.user.findUniqueOrThrow({ where: { id: currentUserId() } });
    if (!(await passwords.verifyPasswordHash(currentPassword, user.passwordHash))) {
      res.status(400).json({ error: "Senha atual incorreta" }); return;
    }
    await prisma.$transaction([
      prisma.user.update({ where: { id: user.id }, data: { passwordHash: await passwords.generateHash(newPassword) } }),
      prisma.session.deleteMany({ where: { userId: user.id } }),
    ]);
    await endSession(req, res);
    res.status(204).send();
  } catch (error) { fail(res, error); }
});

router.get("/users", requireAuth, requireAdmin, async (_req, res) => {
  try {
    const users = await prisma.user.findMany({ orderBy: { created_at: "desc" } });
    res.json(users.map(publicUser));
  } catch (error) { fail(res, error); }
});

router.post("/users", requireAuth, requireAdmin, async (req, res) => {
  const name = normalName(req.body?.name);
  const email = normalEmail(req.body?.email);
  const password = req.body?.password;
  const role = req.body?.role ?? "USER";
  if (!name || !emailPattern.test(email) || !validPassword(password) || !validRole(role)) {
    res.status(400).json({ error: "Informe nome, e-mail, senha de 8 a 1024 caracteres e papel válido" }); return;
  }
  try {
    const user = await prisma.user.create({ data: { name, email, passwordHash: await passwords.generateHash(password), role } });
    res.status(201).json(publicUser(user));
  } catch (error) { fail(res, error); }
});

router.patch("/users/:id", requireAuth, requireAdmin, async (req, res) => {
  const id = req.params.id as string;
  const input = req.body || {};
  const data: Prisma.UserUpdateInput = {};
  if (input.name !== undefined) {
    const name = normalName(input.name);
    if (!name) { res.status(400).json({ error: "Nome inválido" }); return; }
    data.name = name;
  }
  if (input.email !== undefined) {
    const email = normalEmail(input.email);
    if (!emailPattern.test(email)) { res.status(400).json({ error: "E-mail inválido" }); return; }
    data.email = email;
  }
  if (input.role !== undefined) {
    if (!validRole(input.role)) { res.status(400).json({ error: "Papel inválido" }); return; }
    data.role = input.role;
  }
  if (input.isActive !== undefined) {
    if (typeof input.isActive !== "boolean") { res.status(400).json({ error: "Estado inválido" }); return; }
    data.isActive = input.isActive;
  }
  if (input.password !== undefined) {
    if (!validPassword(input.password)) { res.status(400).json({ error: "A senha deve ter de 8 a 1024 caracteres" }); return; }
    data.passwordHash = await passwords.generateHash(input.password);
  }
  if (id === currentUserId() && (data.isActive === false || (data.role && data.role !== "ADMIN"))) {
    res.status(400).json({ error: "Não é possível remover o próprio acesso administrativo" }); return;
  }
  if (!Object.keys(data).length) { res.status(400).json({ error: "Nenhuma alteração informada" }); return; }
  try {
    const user = await prisma.user.update({ where: { id }, data });
    if (data.isActive === false || data.passwordHash !== undefined || data.role !== undefined) {
      await prisma.session.deleteMany({ where: { userId: id } });
    }
    res.json(publicUser(user));
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      res.status(404).json({ error: "Usuário não encontrado" }); return;
    }
    fail(res, error);
  }
});

export default router;
