import "dotenv/config";
import prisma from "../lib/prisma.js";

async function assignLegacyData(): Promise<void> {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if (!email) {
    throw new Error("Defina ADMIN_EMAIL para identificar o administrador dos dados antigos.");
  }

  const admin = await prisma.user.findUnique({ where: { email } });
  if (!admin || admin.role !== "ADMIN") {
    throw new Error("Administrador não encontrado para associar os dados antigos.");
  }

  const result = await prisma.$transaction(async (tx) => {
    const accounts = await tx.$executeRaw`UPDATE "account" SET "userId" = ${admin.id} WHERE "userId" IS NULL`;
    const categories = await tx.$executeRaw`UPDATE "category" SET "userId" = ${admin.id} WHERE "userId" IS NULL`;
    return { accounts, categories };
  });

  console.log(`Dados associados ao administrador: ${result.accounts} contas e ${result.categories} categorias.`);
}

try {
  await assignLegacyData();
} catch (error) {
  console.error("Não foi possível associar os dados antigos:", error);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
