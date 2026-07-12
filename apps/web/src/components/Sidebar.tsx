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
import { useLanguage } from "@/hooks/useLanguage";
import { TranslationKey } from "@/i18n/types";
import { initials } from "@/utils/format";
import { Avatar } from "@/components/Avatar";

const navItems: Array<{ href: string; labelKey: TranslationKey; icon: typeof LayoutDashboard }> = [
  { href: "/dashboard", labelKey: "nav.dashboard", icon: LayoutDashboard },
  { href: "/groups", labelKey: "nav.groups", icon: Users },
  { href: "/contributions", labelKey: "nav.contributions", icon: Wallet },
  { href: "/loans", labelKey: "nav.loans", icon: HandCoins },
  { href: "/reports", labelKey: "nav.reports", icon: BarChart3 },
  { href: "/settings", labelKey: "nav.settings", icon: Settings },
];

type SidebarProps = {
  user: AuthUser;
  open: boolean;
  onClose: () => void;
  onLogout: () => void;
};

export const Sidebar = ({ user, open, onClose, onLogout }: SidebarProps) => {
  const pathname = usePathname();
  const { t } = useLanguage();

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
            <p className="text-xs uppercase tracking-[0.2em] text-[#ffce00]">{t("nav.brand")}</p>
            <h2 className="mt-1 text-xl font-bold">{t("nav.panelTitle")}</h2>
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
            <p className="text-xs text-[#f4dfa0]">{t("nav.accountActive")}</p>
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
                <span>{t(item.labelKey)}</span>
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
          {t("nav.logout")}
        </button>
      </aside>

      {open ? <div className="fixed inset-0 z-30 bg-black/45 lg:hidden" onClick={onClose} /> : null}
    </>
  );
};
