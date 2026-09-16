import { NavLink } from "react-router-dom";
import { LayoutDashboard, Wallet, Tags, ArrowLeftRight, Target } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

export function Navbar() {
    const { user, logout } = useAuth();
    const navItems = [
        { name: "Visão Geral", path: "/dashboard", icon: LayoutDashboard },
        { name: "Caixinhas", path: "/accounts", icon: Wallet },
        { name: "Categorias", path: "/categories", icon: Tags },
        { name: "Transações", path: "/transactions", icon: ArrowLeftRight },
        { name: "Orçamentos", path: "/budgets", icon: Target },
        ...(user?.role === 'ADMIN' ? [{ name: "Usuários", path: "/users", icon: Tags }] : []),
    ];

    return (
        <>
            {/* Top Navbar (Desktop & Mobile Logo) */}
            <nav className="bg-white border-b border-gray-200 shadow-sm md:mb-8 fixed top-0 w-full z-40 md:relative">
                <div className="max-w-5xl mx-auto px-6">
                    <div className="flex items-center gap-5 h-16">
                        {/* Logo/Marca */}
                        <div className="flex items-center">
                            <span className="text-xl font-bold text-emerald-600">
                                onWallet
                            </span>
                        </div>
                        {/* Links de Navegação - Escondido no Mobile (md:hidden) */}
                        <div className="hidden md:flex flex-1 min-w-0 overflow-x-auto gap-5 whitespace-nowrap">
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
                        <div className="hidden md:flex shrink-0 items-center gap-3 text-sm"><NavLink to="/profile" className="max-w-28 truncate text-gray-600 hover:text-emerald-600">{user?.name}</NavLink><button onClick={() => void logout()} className="text-red-600 hover:text-red-700">Sair</button></div>
                    </div>
                </div>
            </nav>

            {/* Espaçador para o Mobile não esconder o topo sob a navbar fixa */}
            <div className="h-16 md:hidden"></div>

            {/* Bottom Navigation - Visível apenas no Mobile */}
            <div className="md:hidden flex justify-end gap-4 px-4 py-2 text-sm"><NavLink to="/profile" className="text-gray-600">Minha conta</NavLink><button onClick={() => void logout()} className="text-red-600">Sair</button></div>
            <nav className="md:hidden fixed bottom-0 w-full bg-white border-t border-gray-200 z-50 pb-safe">
                <div className="flex items-center h-16 overflow-x-auto">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        return (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                className={({ isActive }) =>
                                    `flex flex-col items-center justify-center min-w-16 flex-1 h-full space-y-1 transition-colors ${
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
