import type { pt } from "@/i18n/locales/pt";

export type Locale = "pt" | "en" | "es" | "fr";

export type LocaleOption = { code: Locale; label: string; flag: string };

export const locales: LocaleOption[] = [
  { code: "pt", label: "Portugues", flag: "\u{1F1F5}\u{1F1F9}" },
  { code: "en", label: "English", flag: "\u{1F1EC}\u{1F1E7}" },
  { code: "es", label: "Espanol", flag: "\u{1F1EA}\u{1F1F8}" },
  { code: "fr", label: "Francais", flag: "\u{1F1EB}\u{1F1F7}" },
];

export const defaultLocale: Locale = "pt";

export type Dictionary = typeof pt;

type NestedKeyOf<T> = {
  [K in keyof T & string]: T[K] extends string ? `${K}` : `${K}.${NestedKeyOf<T[K]>}`;
}[keyof T & string];

export type TranslationKey = NestedKeyOf<Dictionary>;
