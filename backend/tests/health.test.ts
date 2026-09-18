import { describe, expect, it } from "vitest";
import request from "supertest";
import app from "../src/app.js";

describe("Health endpoint", ()=>{
    it("deve retornar status 200 e OK", async()=>{
        const response = await request(app).get("/health");

        expect(response.status).toBe(200);
        expect(response.text).toBe("OK");
    })
})