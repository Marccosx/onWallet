import { NavLink } from "react-router-dom";
import { LayoutDashboard, Wallet, Tags, ArrowLeftRight, Target } from "lucide-react";

export function Navbar() {
    const navItems = [
        { name: "Visão Geral", path: "/dashboard", icon: LayoutDashboard },
        { name: "Caixinhas", path: "/accounts", icon: Wallet },
        { name: "Categorias", path: "/categories", icon: Tags },
        { name: "Transações", path: "/transactions", icon: ArrowLeftRight },
        { name: "Orçamentos", path: "/budgets", icon: Target },
    ];

    return (
        <>
            {/* Top Navbar (Desktop & Mobile Logo) */}
            <nav className="bg-white border-b border-gray-200 shadow-sm md:mb-8 fixed top-0 w-full z-40 md:relative">
                <div className="max-w-5xl mx-auto px-6">
                    <div className="flex justify-between items-center h-16">
                        {/* Logo/Marca */}
                        <div className="flex items-center">
                            <span className="text-xl font-bold text-emerald-600">
                                onWallet
                            </span>
                        </div>

                        {/* Links de Navegação - Escondido no Mobile (md:hidden) */}
                        <div className="hidden md:flex space-x-8">
                            {navItems.map((item) => (
                                <NavLink
                                    key={item.path}
                                    to={item.path}
                                    className={({ isActive }) =>
                                        `inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors ${
                                            isActive
                                                ? "border-emerald-500 text-emerald-600"
                                                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                                        }`
                                    }
                                >
                                    {item.name}
                                </NavLink>
                            ))}
                        </div>
                    </div>
                </div>
            </nav>

            {/* Espaçador para o Mobile não esconder o topo sob a navbar fixa */}
            <div className="h-16 md:hidden"></div>

            {/* Bottom Navigation - Visível apenas no Mobile */}
            <nav className="md:hidden fixed bottom-0 w-full bg-white border-t border-gray-200 z-50 pb-safe">
                <div className="flex justify-around items-center h-16">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        return (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                className={({ isActive }) =>
                                    `flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
                                        isActive 
                                            ? "text-emerald-600" 
                                            : "text-gray-400 hover:text-gray-600"
                                    }`
                                }
                            >
                                <Icon size={20} strokeWidth={2.5} />
                                <span className="text-[10px] font-medium">{item.name}</span>
                            </NavLink>
                        );
                    })}
                </div>
            </nav>
        </>
    );
}

