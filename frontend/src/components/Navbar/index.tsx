import { NavLink } from "react-router-dom";

export function Navbar() {
    // Array para facilitar a adição de novos menus no futuro
    const navItems = [
        { name: "Contas", path: "/accounts" },
        { name: "Categorias", path: "/categories" },
        { name: "Transações", path: "/transactions" },
        { name: "Orçamentos", path: "/budgets" },
    ];

    return (
        <nav className="bg-white border-b border-gray-200 shadow-sm mb-8">
            <div className="max-w-5xl mx-auto px-6">
                <div className="flex justify-between h-16">
                    {/* Logo/Marca */}
                    <div className="flex items-center">
                        <span className="text-xl font-bold text-emerald-600">
                            onWallet
                        </span>
                    </div>

                    {/* Links de Navegação */}
                    <div className="flex space-x-8">
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
    );
}

