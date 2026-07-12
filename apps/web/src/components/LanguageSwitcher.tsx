"use client";

import clsx from "clsx";
import { useLanguage } from "@/hooks/useLanguage";
import { locales, Locale } from "@/i18n/types";

type LanguageSwitcherProps = {
  className?: string;
  variant?: "light" | "dark";
};

export const LanguageSwitcher = ({ className, variant = "light" }: LanguageSwitcherProps) => {
  const { locale, setLocale, t } = useLanguage();

  return (
    <label className={clsx("inline-flex items-center gap-2", className)}>
      <span className="sr-only">{t("language.label")}</span>
      <select
        value={locale}
        onChange={(event) => setLocale(event.target.value as Locale)}
        className={clsx(
          "h-9 rounded-lg border px-2 text-sm outline-none transition",
          variant === "light"
            ? "border-[#e8d9a4] bg-white text-[#2c2205] focus:border-[#cba23a] focus:ring-2 focus:ring-[#ffce00]/30"
            : "border-[#ffce00]/35 bg-[#0f0f10]/60 text-[#fbf7e6] focus:border-[#ffce00] focus:ring-2 focus:ring-[#ffce00]/35",
        )}
      >
        {locales.map((option) => (
          <option key={option.code} value={option.code}>
            {option.flag} {option.label}
          </option>
        ))}
      </select>
    </label>
  );
};
