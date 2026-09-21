import { useEffect, useState } from 'react';
import { isAxiosError } from 'axios';
import { AccountService } from '../../services/account.service';
import type { GoalPlan, IAccount } from '../../types';

export interface GoalForm {
  enabled: boolean;
  amount: string;
  mode: 'DEADLINE' | 'MONTHLY';
  start: string;
  target: string;
  monthly: string;
}

export const money = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
const monthText = (value: string | null) => value ? `${value.slice(5)}/${value.slice(0, 4)}` : '';

export function initialGoal(account?: IAccount): GoalForm {
  const now = new Date();
  return {
    enabled: account?.goalAmount != null,
    amount: account?.goalAmount?.toString() ?? '',
    mode: account?.goalMode ?? 'MONTHLY',
    start: account?.goalStartMonth ?? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
    target: account?.goalTargetMonth ?? '',
    monthly: account?.goalMonthlyAmount?.toString() ?? '',
  };
}

export function goalPayload(goal: GoalForm): Partial<IAccount> {
  return goal.enabled ? {
    goalAmount: Number(goal.amount), goalMode: goal.mode, goalStartMonth: goal.start,
    goalTargetMonth: goal.mode === 'DEADLINE' ? goal.target : null,
    goalMonthlyAmount: goal.mode === 'MONTHLY' ? Number(goal.monthly) : null,
  } : { goalAmount: null };
}

export function GoalSummary({ plan, amount }: { plan: GoalPlan; amount: number }) {
  return <div className="mt-4 space-y-2 text-sm text-gray-600">
    <div className="flex justify-between gap-2"><span>Meta: {money(amount)}</span><strong>{Math.floor(plan.progress)}%</strong></div>
    <div role="progressbar" aria-label="Progresso da meta" aria-valuenow={Math.floor(plan.progress)} aria-valuemin={0} aria-valuemax={100} className="h-2 rounded-full bg-emerald-100 overflow-hidden">
      <div className="h-full bg-emerald-600 transition-all" style={{ width: `${plan.progress}%` }} />
    </div>
    {plan.status === 'COMPLETED' ? <p className="font-semibold text-emerald-700">Meta alcançada!</p> : <>
      <p>Falta guardar <strong>{money(plan.remaining)}</strong></p>
      {plan.status === 'OVERDUE' ? <p className="text-amber-700">Prazo encerrado em {monthText(plan.completionMonth)}. Edite a meta para definir um novo prazo.</p> : <>
        <p><strong>{money(plan.monthlyAmount!)}/mês</strong> · {plan.months} {plan.months === 1 ? 'contribuição' : 'contribuições'}</p>
        <p>Previsão: <strong>{monthText(plan.completionMonth)}</strong>, começando em {monthText(plan.startMonth)}.</p>
        {plan.lastContribution !== plan.monthlyAmount && <p>Última contribuição: {money(plan.lastContribution!)}.</p>}
      </>}
    </>}
  </div>;
}

export function GoalPlanner({ value, onChange, balance }: { value: GoalForm; onChange: (goal: GoalForm) => void; balance: number }) {
  const [preview, setPreview] = useState<{ key: string; plan: GoalPlan | null; error: string } | null>(null);
  const payloadKey = JSON.stringify({ ...goalPayload(value), balance });
  useEffect(() => {
    if (!value.enabled) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const plan = await AccountService.previewGoal(JSON.parse(payloadKey), controller.signal);
        if (!controller.signal.aborted) setPreview({ key: payloadKey, plan, error: '' });
      } catch (error) {
        if (!controller.signal.aborted) setPreview({ key: payloadKey, plan: null,
          error: isAxiosError(error) ? error.response?.data?.error ?? 'Não foi possível calcular a previsão.' : 'Não foi possível calcular a previsão.' });
      }
    }, 350);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [payloadKey, value.enabled]);
  const current = preview?.key === payloadKey ? preview : null;
  const inputClass = 'mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 bg-white';
  return <fieldset className="border-t border-gray-100 pt-4 space-y-4">
    <label className="flex gap-2 items-center font-medium text-gray-800">
      <input type="checkbox" checked={value.enabled} onChange={e => onChange({ ...value, enabled: e.target.checked })} />
      Planejar uma meta
    </label>
    {value.enabled && <>
      <label className="block text-sm text-gray-700">Quanto quer juntar no total? (R$)
        <input required type="number" min="0.01" max="10000000000" step="0.01" className={inputClass} value={value.amount} onChange={e => onChange({ ...value, amount: e.target.value })} placeholder="Ex: 6000" />
      </label>
      <label className="block text-sm text-gray-700">Como deseja planejar?
        <select className={inputClass} value={value.mode} onChange={e => onChange({ ...value, mode: e.target.value as GoalForm['mode'] })}>
          <option value="MONTHLY">Informar contribuição e calcular prazo</option>
          <option value="DEADLINE">Informar prazo e calcular contribuição</option>
        </select>
      </label>
      <label className="block text-sm text-gray-700">Primeira contribuição em
        <input required type="month" min="2000-01" max="9999-12" className={inputClass} value={value.start} onChange={e => onChange({ ...value, start: e.target.value })} />
      </label>
      {value.mode === 'MONTHLY' ? <label className="block text-sm text-gray-700">Contribuição mensal (R$)
        <input required type="number" min="0.01" max="10000000000" step="0.01" className={inputClass} value={value.monthly} onChange={e => onChange({ ...value, monthly: e.target.value })} placeholder="Ex: 600" />
      </label> : <label className="block text-sm text-gray-700">Alcançar a meta até
        <input required type="month" min={value.start || '2000-01'} max="9999-12" className={inputClass} value={value.target} onChange={e => onChange({ ...value, target: e.target.value })} />
      </label>}
      <p className="text-xs text-gray-500">A previsão considera o saldo guardado e uma contribuição por mês, incluindo o mês inicial e o final. Meses passados não entram no cálculo. Se já contribuiu neste mês, planeje a próxima contribuição a partir do mês seguinte.</p>
      <div aria-live="polite" className="rounded-lg bg-emerald-50 p-3">
        {!current ? <p className="text-sm text-gray-500">Calculando previsão…</p> : current.error ? <p className="text-sm text-amber-800">{current.error}</p> : current.plan && <GoalSummary plan={current.plan} amount={Number(value.amount)} />}
      </div>
      <p className="text-xs text-gray-500">Planejamento sem juros ou rendimentos. O saldo só aumenta quando você registra uma entrada ou transferência para a caixinha.</p>
    </>}
  </fieldset>;
}
