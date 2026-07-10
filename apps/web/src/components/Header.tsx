"use client";

import { Menu, Search, Bell, ChevronDown } from "lucide-react";
import { AuthUser } from "@/types/domain";
import { initials } from "@/utils/format";
import { Avatar } from "@/components/Avatar";

type HeaderProps = {
  user: AuthUser;
  onOpenSidebar: () => void;
};

export const Header = ({ user, onOpenSidebar }: HeaderProps) => {
  return (
    <header className="sticky top-0 z-20 border-b border-[#eddca2] bg-[#fffdf4]/95 px-4 py-3 backdrop-blur sm:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="rounded-lg border border-[#e7d392] p-2 text-[#6f101f] lg:hidden"
          onClick={onOpenSidebar}
        >
          <Menu size={18} />
        </button>

        <div className="relative flex-1">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#987d2c]" />
          <input
            type="search"
            placeholder="Pesquisar grupo, membro ou transacao"
            className="h-10 w-full rounded-xl border border-[#e6d7a2] bg-white pl-9 pr-3 text-sm text-[#32270b] outline-none focus:border-[#cba23a] focus:ring-2 focus:ring-[#ffce00]/30"
          />
        </div>

        <button type="button" className="rounded-xl border border-[#e8d9a4] bg-white p-2 text-[#6f101f]">
          <Bell size={18} />
        </button>

        <div className="hidden items-center gap-3 rounded-xl border border-[#e8d9a4] bg-white px-3 py-1.5 sm:flex">
          <Avatar
            name={`${user.firstName} ${user.lastName}`}
            initials={initials(user.firstName, user.lastName)}
            className="h-8 w-8 text-xs"
          />
          <div>
            <p className="text-sm font-semibold text-[#2c2205]">{user.firstName}</p>
          </div>
          <ChevronDown size={16} className="text-[#8f7427]" />
        </div>
      </div>
    </header>
  );
};
