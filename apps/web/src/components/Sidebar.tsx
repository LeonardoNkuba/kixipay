"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import {
  BarChart3,
  HandCoins,
  LayoutDashboard,
  LogOut,
  Settings,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { AuthUser } from "@/types/domain";
import { initials } from "@/utils/format";
import { Avatar } from "@/components/Avatar";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/groups", label: "Meus Grupos", icon: Users },
  { href: "/contributions", label: "Contribuicoes", icon: Wallet },
  { href: "/loans", label: "Emprestimos", icon: HandCoins },
  { href: "/reports", label: "Relatorios", icon: BarChart3 },
  { href: "/settings", label: "Configuracoes", icon: Settings },
];

type SidebarProps = {
  user: AuthUser;
  open: boolean;
  onClose: () => void;
  onLogout: () => void;
};

export const Sidebar = ({ user, open, onClose, onLogout }: SidebarProps) => {
  const pathname = usePathname();

  return (
    <>
      <aside
        className={clsx(
          "fixed inset-y-0 left-0 z-40 w-72 bg-[#6f101f] p-5 text-[#fff4cc] shadow-xl transition-transform lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[#ffce00]">kixipay</p>
            <h2 className="mt-1 text-xl font-bold">Painel Financeiro</h2>
          </div>
          <button type="button" className="rounded-lg p-1 hover:bg-[#8c162b] lg:hidden" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="mt-8 flex items-center gap-3 rounded-2xl border border-[#d6ab35]/40 bg-[#8c162b]/45 p-3">
          <Avatar
            name={`${user.firstName} ${user.lastName}`}
            initials={initials(user.firstName, user.lastName)}
            className="h-11 w-11 bg-[#ffce00] text-[#391106]"
          />
          <div>
            <p className="text-sm font-semibold">{user.firstName}</p>
            <p className="text-xs text-[#f4dfa0]">Conta ativa</p>
          </div>
        </div>

        <nav className="mt-8 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition",
                  isActive
                    ? "bg-[#ffce00] text-[#311204]"
                    : "text-[#ffeab8] hover:bg-[#8c162b] hover:text-[#fff5d2]",
                )}
                onClick={onClose}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <button
          type="button"
          onClick={onLogout}
          className="mt-10 flex w-full items-center justify-center gap-2 rounded-xl border border-[#e7be57]/40 bg-[#8c162b] px-4 py-2 text-sm font-semibold text-[#ffe9ab] transition hover:bg-[#aa1c34]"
        >
          <LogOut size={16} />
          Logout
        </button>
      </aside>

      {open ? <div className="fixed inset-0 z-30 bg-black/45 lg:hidden" onClick={onClose} /> : null}
    </>
  );
};
