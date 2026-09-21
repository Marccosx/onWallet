import { randomUUID } from "node:crypto";
import prisma from "../src/lib/prisma.js";
import PasswordService from "../src/services/Password.service.js";
import { describe, expect, it, afterEach, beforeEach } from "vitest";
import request from "supertest";
import app from "../src/app.js";

describe("Autenticação com usuário cadastrado",()=>{
    const password = new PasswordService;
    const correctPassword = "SenhaCorreta123!";
    let userId: string | undefined;
    let email: string;

    function requireUserId(): string {
        if (!userId) throw new Error("O usuário de teste não foi criado");
        return userId;
    }

    beforeEach(async()=>{
        userId = undefined;
        email = `auth-${randomUUID()}@example.com`;

        const user = await prisma.user.create({
            data:{
                name: "Usuário de teste",
                email,
                passwordHash: await password.generateHash(correctPassword),
                isActive: true,
            },
        });
        userId = user.id;
    });

    afterEach(async()=>{
        if(!userId) return;

        await prisma.session.deleteMany({where: {userId}});
        await prisma.user.delete({where: {id:userId}});
    });

    it("deve retornar o usuário da sessão em GET /auth/me", async ()=>{
        
        const agent = request.agent(app);
        const loginResponse = await agent.post("/auth/login").send({email, password: correctPassword});
        const response = await agent.get("/auth/me")
        
        expect(loginResponse.status).toBe(200);
        expect(response.status).toBe(200);
        expect(response.body.id).toBe(userId);
    });

    it("deve encerrar a sessão ao fazer logout", async ()=>{

        const agent = request.agent(app);
        const loginResponse = await agent.post("/auth/login").send({email, password: correctPassword});

        expect(loginResponse.status).toBe(200)

        const logoutResponse = await agent.post("/auth/logout")

        expect(logoutResponse.status).toBe(204)

        const verifyResponse = await agent.get("/auth/me")

        expect(verifyResponse.status).toBe(401)

        const sessionCount = await prisma.session.count({where:{userId: requireUserId()}});

        expect(sessionCount).toBe(0)

    });

    it("deve retornar 401 quando a sessão estiver expirada", async()=>{

        const agent = request.agent(app);
        const loginResponse = await agent.post("/auth/login").send({email, password: correctPassword});

        expect(loginResponse.status).toBe(200)

        const updated = await prisma.session.updateMany({where:{userId: requireUserId()}, data:{expiresAt: new Date("2000-01-01T00:00:00Z")}});

        expect(updated.count).toBe(1);

        const agentResponse = await agent.get("/auth/me")

        expect(agentResponse.status).toBe(401)
        
    })

    it("deve retornar 401 e não criar sessão quando a senha estiver incorreta", async()=>{
        const response = await request(app)
        .post("/auth/login")
        .send({
            email,
            password: "SenhaIncorreta123!",
        });
        
        expect(response.status).toBe(401);
        expect(response.headers["set-cookie"]).toBeUndefined();

        const sessionCount = await prisma.session.count({
            where:{userId: requireUserId()},
        });

        expect(sessionCount).toBe(0);
    });

    // Preparar: Criar um usuário ativo com hash de uma senha conhecida. 
    // Agir: enviar POST /auth/Login com o e-mail desse usuário e uma senha diferente da usada na preparação.
    // Verificar: Resposta 401, nenhum cookie de autenticação e nenhuma sessão criada para esse usuário.

    it("deve retornar 200 quando as credenciais forem válidas", async()=>{
        
        const response = await request(app)
        .post("/auth/login")
        .send({
            email,
            password: correctPassword,
        });
        
        expect(response.status).toBe(200)
        const cookies = response.headers["set-cookie"] as any;
        const sessionCookie = cookies?.find((cookie: string) => cookie.startsWith("onwallet_session=")
        );

        expect(sessionCookie).toBeDefined();
        expect(sessionCookie).toContain("HttpOnly");

        const sessionCount = await prisma.session.count({where: {userId: requireUserId()}});
        
        expect(sessionCount).toBe(1)

    })
    
}),

describe("GET /auth/me", ()=>{

    it("deve retornar 401 quando não houver cookie de sessão", async()=>{

        const response = await request(app)
        .get("/auth/me");
        
        expect(response.status).toBe(401)
    });
    
})

