export const toNumber = (value: number | string | null | undefined): number => {
  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  return 0;
};

export const formatCurrency = (value: number, currency = "AOA") => {
  return new Intl.NumberFormat("pt-AO", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value);
};

export const formatDate = (date: string) => {
  return new Intl.DateTimeFormat("pt-AO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));
};

export const initials = (firstName?: string, lastName?: string) => {
  const first = (firstName || "").trim().charAt(0).toUpperCase();
  const last = (lastName || "").trim().charAt(0).toUpperCase();
  return `${first}${last}`.trim() || "KP";
};
