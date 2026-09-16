import "dotenv/config";
import prisma from "../lib/prisma.js";
import PasswordService from "../services/Password.service.js";

async function createAdminUser(): Promise<void> {
  const name = process.env.ADMIN_NAME?.trim();
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;

  if (!name || !email || !password?.trim()) {
    throw new Error("Defina ADMIN_NAME, ADMIN_EMAIL e ADMIN_PASSWORD antes de executar o script.");
  }

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    console.log("Usuário com esse e-mail já existe. Nenhuma alteração foi feita.");
    return;
  }

  const passwordHash = await new PasswordService().generateHash(password);
  await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      role: "ADMIN",
      isActive: true,
    },
  });

  console.log("Administrador criado com sucesso.");
}

try {
  await createAdminUser();
} catch (error) {
  console.error("Não foi possível criar o administrador:", error);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
