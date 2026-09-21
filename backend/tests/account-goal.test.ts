import { describe, expect, it } from "vitest";
import { calculateGoal, parseGoal, validateMoney } from "../src/lib/account-goal.js";

const monthly = { goalAmount: 6000, goalMode: "MONTHLY", goalStartMonth: "2026-10", goalMonthlyAmount: 600 };

describe("Planejamento de caixinhas", () => {
  it("desconta o saldo guardado e conta o mês da primeira contribuição", () => {
    expect(calculateGoal(parseGoal(monthly), 600, "2026-09")).toMatchObject({
      remaining: 5400, months: 9, monthlyAmount: 600, completionMonth: "2027-06", progress: 10,
    });
  });
  it("calcula a contribuição até julho incluindo os dois meses extremos", () => {
    const goal = parseGoal({ ...monthly, goalMode: "DEADLINE", goalTargetMonth: "2027-07" });
    expect(calculateGoal(goal, 0, "2026-09")).toMatchObject({ months: 10, monthlyAmount: 600, completionMonth: "2027-07" });
  });
  it("arredonda a contribuição para cima em centavos e ajusta a última", () => {
    const goal = parseGoal({ goalAmount: 100, goalMode: "DEADLINE", goalStartMonth: "2026-10", goalTargetMonth: "2026-12" });
    expect(calculateGoal(goal, 0, "2026-09")).toMatchObject({ monthlyAmount: 33.34, lastContribution: 33.32, months: 3 });
  });
  it("arredonda os meses para cima na modalidade mensal", () => {
    expect(calculateGoal(parseGoal({ ...monthly, goalAmount: 1000 }), 0, "2026-09")).toMatchObject({ months: 2, lastContribution: 400, completionMonth: "2026-11" });
  });
  it("recalcula a previsão com o saldo atual sem contar meses passados", () => {
    expect(calculateGoal(parseGoal(monthly), 1200, "2027-01")).toMatchObject({ startMonth: "2027-01", months: 8, completionMonth: "2027-08" });
  });
  it("trata saldo acima da meta e prazo vencido", () => {
    const goal = parseGoal({ ...monthly, goalMode: "DEADLINE", goalTargetMonth: "2026-10" });
    expect(calculateGoal(goal, 6100, "2026-11")).toMatchObject({ status: "COMPLETED", remaining: 0, progress: 100, months: 0 });
    expect(calculateGoal(goal, 100, "2026-11")).toMatchObject({ status: "OVERDUE", remaining: 5900, monthlyAmount: null });
  });
  it("permite quitar a meta no primeiro mês com contribuição maior que o restante", () => {
    expect(calculateGoal(parseGoal(monthly), 5999.99, "2026-09")).toMatchObject({ months: 1, lastContribution: 0.01 });
  });
  it("não gera contribuições de zero centavos para metas pequenas", () => {
    const goal = parseGoal({ goalAmount: 0.01, goalMode: "DEADLINE", goalStartMonth: "2026-10", goalTargetMonth: "2027-10" });
    expect(calculateGoal(goal, 0, "2026-09")).toMatchObject({ months: 1, monthlyAmount: 0.01, lastContribution: 0.01 });
  });
  it.each([
    { goalAmount: 0 }, { goalAmount: -1 }, { goalAmount: 1.001 }, { goalMonthlyAmount: 0 },
    { goalMonthlyAmount: Infinity }, { goalStartMonth: "2026-13" }, { goalMode: "INVALID" },
    { goalMode: "DEADLINE", goalTargetMonth: "2026-09" },
  ])("rejeita configuração inválida: %j", patch => {
    expect(() => parseGoal({ ...monthly, ...patch })).toThrow();
  });
  it("remove todos os campos quando a meta é desativada", () => {
    const goal = parseGoal({ goalAmount: null }, parseGoal(monthly));
    expect(Object.values(goal).every(value => value === null)).toBe(true);
    expect(calculateGoal(goal, 500)).toBeNull();
  });
  it("aceita saldo zero e rejeita valores não numéricos", () => {
    expect(validateMoney(0, "Saldo")).toBe(0);
    expect(() => validateMoney("0", "Saldo")).toThrow();
    expect(() => validateMoney(NaN, "Saldo")).toThrow();
  });
});
