export type Goal = {
  goalAmount: number | null;
  goalMode: string | null;
  goalStartMonth: string | null;
  goalTargetMonth: string | null;
  goalMonthlyAmount: number | null;
};

export const emptyGoal: Goal = {
  goalAmount: null, goalMode: null, goalStartMonth: null,
  goalTargetMonth: null, goalMonthlyAmount: null,
};

function monthIndex(value: unknown): number {
  if (typeof value !== "string" || !/^[2-9]\d{3}-(0[1-9]|1[0-2])$/.test(value)) {
    throw new Error("Informe um mês válido (AAAA-MM), entre 2000 e 9999.");
  }
  return Number(value.slice(0, 4)) * 12 + Number(value.slice(5)) - 1;
}

function monthLabel(index: number) {
  if (index > 9999 * 12 + 11) throw new Error("A contribuição é muito pequena: a previsão ultrapassa o ano 9999.");
  return `${Math.floor(index / 12)}-${String(index % 12 + 1).padStart(2, "0")}`;
}

export function validateMoney(value: unknown, label: string, positive = false): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < (positive ? 0.01 : 0) || value > 10_000_000_000) {
    throw new Error(`${label}: informe um valor ${positive ? "maior que zero" : "igual ou maior que zero"}, até R$ 10 bilhões.`);
  }
  const cents = Math.round(value * 100);
  if (Math.abs(value * 100 - cents) > 0.0001) throw new Error(`${label}: use no máximo duas casas decimais.`);
  return cents / 100;
}

// Missing fields preserve an existing plan; explicit null removes the whole goal.
export function parseGoal(input: Record<string, unknown>, previous: Goal = emptyGoal): Goal {
  if (input.goalAmount === null) return { ...emptyGoal };
  const data = { ...previous, ...input };
  if (data.goalAmount == null) {
    if ([data.goalMode, data.goalStartMonth, data.goalTargetMonth, data.goalMonthlyAmount].some(v => v != null)) {
      throw new Error("Informe o valor total da meta.");
    }
    return { ...emptyGoal };
  }
  const goalAmount = validateMoney(data.goalAmount, "Meta", true);
  const start = monthIndex(data.goalStartMonth);
  if (data.goalMode === "DEADLINE") {
    if (monthIndex(data.goalTargetMonth) < start) throw new Error("O prazo não pode ser anterior à primeira contribuição.");
    return { goalAmount, goalMode: "DEADLINE", goalStartMonth: data.goalStartMonth as string,
      goalTargetMonth: data.goalTargetMonth as string, goalMonthlyAmount: null };
  }
  if (data.goalMode === "MONTHLY") {
    return { goalAmount, goalMode: "MONTHLY", goalStartMonth: data.goalStartMonth as string,
      goalTargetMonth: null, goalMonthlyAmount: validateMoney(data.goalMonthlyAmount, "Contribuição mensal", true) };
  }
  throw new Error("Escolha calcular por prazo ou por contribuição mensal.");
}

export function calculateGoal(goal: Goal, balance: number, currentMonth?: string) {
  if (goal.goalAmount == null) return null;
  const now = new Date();
  const today = currentMonth ?? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const start = Math.max(monthIndex(goal.goalStartMonth), monthIndex(today));
  const targetCents = Math.round(goal.goalAmount * 100);
  const remainingCents = Math.max(0, targetCents - Math.round(balance * 100));
  const base = {
    remaining: remainingCents / 100,
    progress: Math.min(100, Math.max(0, balance / goal.goalAmount * 100)),
    startMonth: monthLabel(start),
  };
  if (remainingCents === 0) return { ...base, status: "COMPLETED", months: 0, monthlyAmount: 0, lastContribution: 0, completionMonth: null };
  let months: number;
  let monthlyCents: number;
  if (goal.goalMode === "DEADLINE") {
    months = monthIndex(goal.goalTargetMonth) - start + 1;
    if (months <= 0) return { ...base, status: "OVERDUE", months: 0, monthlyAmount: null, lastContribution: null, completionMonth: goal.goalTargetMonth };
    monthlyCents = Math.ceil(remainingCents / months);
    // Small amounts can finish before the deadline when rounded to whole cents.
    months = Math.ceil(remainingCents / monthlyCents);
  } else {
    monthlyCents = Math.round(goal.goalMonthlyAmount! * 100);
    months = Math.ceil(remainingCents / monthlyCents);
  }
  return { ...base, status: "PLANNED", months, monthlyAmount: monthlyCents / 100,
    lastContribution: (remainingCents - monthlyCents * (months - 1)) / 100,
    completionMonth: monthLabel(start + months - 1) };
}
