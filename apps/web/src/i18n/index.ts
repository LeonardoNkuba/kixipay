import { pt } from "@/i18n/locales/pt";
import { en } from "@/i18n/locales/en";
import { es } from "@/i18n/locales/es";
import { fr } from "@/i18n/locales/fr";
import type { Dictionary, Locale } from "@/i18n/types";

export const dictionaries: Record<Locale, Dictionary> = { pt, en, es, fr };

export * from "@/i18n/types";
