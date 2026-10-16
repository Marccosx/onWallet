import { defineConfig } from "vitest/config";

export default defineConfig({
    test:{
        include: ["tests/**/*.test.ts"],
        env:{
            DATABASE_URL: process.env.DATABASE_URL_TESTE || "file:./teste.db",
        },
    },
});
