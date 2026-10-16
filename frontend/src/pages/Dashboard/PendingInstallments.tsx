import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { TransactionService } from "../../services/transaction.service";
import type { ITransaction } from "../../types";

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function monthLabel(month: string): string {
    return new Date(`${month}-01T12:00:00.000Z`).toLocaleDateString("pt-BR", {
        month: "long",
        year: "numeric",
        timeZone: "UTC",
    });
}

function installmentDetails(transaction: ITransaction): { name: string; position: string } {
    const suffix = transaction.description.match(/\s*\((\d+)\/(\d+)\)$/);
    const number = transaction.installmentNumber ?? (suffix ? Number(suffix[1]) : null);
    const count = transaction.installmentCount ?? (suffix ? Number(suffix[2]) : null);
    return {
        name: suffix ? transaction.description.slice(0, suffix.index).trim() : transaction.description,
        position: number && count ? `${number}ª parcela de ${count}` : "Parcela",
    };
}

export function PendingInstallments() {
    const [transactions, setTransactions] = useState<ITransaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);
    const [monthOffset, setMonthOffset] = useState(0);

    useEffect(() => {
        let active = true;
        TransactionService.getAll("")
            .then((data) => {
                if (active) setTransactions(data);
            })
            .catch(() => {
                if (active) setHasError(true);
            })
            .finally(() => {
                if (active) setIsLoading(false);
            });
        return () => { active = false; };
    }, []);

    const today = new Date();
    const selectedDate = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
    const selectedMonth = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, "0")}`;
    const pending = transactions.filter((transaction) =>
        transaction.type === "EXPENSE" &&
        Boolean(transaction.installmentGroupId) &&
        transaction.balanceApplied === false &&
        !transaction.paidAt &&
        !transaction.historicalPayment &&
        transaction.create_at.slice(0, 7) === selectedMonth
    );
    const byMonth = new Map<string, { transactions: ITransaction[]; cents: number }>();
    for (const transaction of pending) {
        const month = transaction.create_at.slice(0, 7);
        const current = byMonth.get(month) ?? { transactions: [], cents: 0 };
        current.transactions.push(transaction);
        current.cents += Math.round(transaction.amount * 100);
        byMonth.set(month, current);
    }
    const months = [...byMonth.entries()].sort(([a], [b]) => a.localeCompare(b));
    // Compras antigas podiam ter parcelas com frações de centavo. Somar os
    // valores originais antes de arredondar evita mostrar R$ 1.000,02 para
    // uma compra de R$ 1.000,00 dividida em seis parcelas antigas.
    const totalCents = Math.round(pending.reduce((sum, item) => sum + item.amount, 0) * 100);

    return (
        <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-100" aria-labelledby="pending-installments-title">
            <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
                <div>
                    <h2 id="pending-installments-title" className="text-lg font-bold text-gray-800">Parcelas pendentes</h2>
                    <p className="text-sm text-gray-500">Compromissos do mês escolhido, ainda não descontados do saldo.</p>
                </div>
                {!isLoading && !hasError && pending.length > 0 && (
                    <div className="text-left sm:text-right">
                        <p className="text-xs font-medium text-gray-500">Em aberto no mês</p>
                        <p className="text-xl font-bold text-amber-700">{currency.format(totalCents / 100)}</p>
                    </div>
                )}
            </div>

            <div className="inline-flex gap-1 rounded-lg bg-gray-100 p-1 mb-4" role="group" aria-label="Mês das parcelas pendentes">
                {["Este mês", "Próximo mês"].map((label, offset) => (
                    <button
                        key={label}
                        type="button"
                        aria-pressed={monthOffset === offset}
                        onClick={() => setMonthOffset(offset)}
                        className={`rounded-md px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 ${monthOffset === offset ? "bg-white text-emerald-700 shadow-sm" : "text-gray-500 hover:text-gray-800"}`}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {isLoading ? (
                <p className="text-sm text-gray-500">Carregando parcelas...</p>
            ) : hasError ? (
                <p className="text-sm text-red-600">Não foi possível carregar as parcelas pendentes.</p>
            ) : months.length === 0 ? (
                <p className="text-sm text-gray-500">Nenhuma parcela pendente em {monthLabel(selectedMonth)}.</p>
            ) : (
                <div>
                    {months.map(([month, item]) => (
                        <Link
                            key={month}
                            to={`/transactions?month=${month}`}
                            className="flex items-start justify-between gap-3 rounded-lg border border-gray-200 p-4 hover:border-amber-300 hover:bg-amber-50 transition-colors"
                            aria-label={`Ver ${item.transactions.length} parcelas pendentes de ${monthLabel(month)}`}
                        >
                            <div>
                                <p className="font-semibold capitalize text-gray-800">{monthLabel(month)}</p>
                                <p className="text-xs text-gray-500">
                                    {item.transactions.length} {item.transactions.length === 1 ? "parcela" : "parcelas"}
                                </p>
                                <ul className="mt-2 space-y-1 text-xs text-gray-600">
                                    {item.transactions.map((transaction) => {
                                        const details = installmentDetails(transaction);
                                        return (
                                            <li key={transaction.id} className="break-words">
                                                <span className="font-medium text-gray-700">{details.name}</span>
                                                <span> · {details.position}</span>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>
                            <span className="font-semibold text-amber-700 whitespace-nowrap">{currency.format(item.cents / 100)}</span>
                        </Link>
                    ))}
                </div>
            )}
        </section>
    );
}
