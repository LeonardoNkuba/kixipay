"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Header, Loading, Sidebar } from "@/components";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, token, isLoading, isAuthenticated, logout } = useAuth();
  const { t } = useLanguage();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading || !user) {
    return (
      <main className="min-h-screen bg-[radial-gradient(circle_at_top,#fff6d5_0%,#f8f2df_35%,#f2ebd0_100%)] p-6">
        <Loading message={t("nav.validatingSession")} />
      </main>
    );
  }

  const handleLogout = () => {
    logout();
    router.replace("/");
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#fff6d5_0%,#f8f2df_35%,#f2ebd0_100%)]">
      <Sidebar
        user={user}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onLogout={handleLogout}
      />

      <div className="lg:pl-72">
        <Header user={user} token={token} onOpenSidebar={() => setSidebarOpen(true)} />

        <main className="px-4 py-5 sm:px-6">{children}</main>

        <footer className="border-t border-[#e8dcae] px-6 py-4 text-xs text-[#806a25]">
          {t("nav.footer")}
        </footer>
      </div>
    </div>
  );
}
