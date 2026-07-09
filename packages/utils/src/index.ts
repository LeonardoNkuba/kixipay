export const toCurrency = (value: number, currency = "AOA") => {
  return new Intl.NumberFormat("pt-AO", {
    style: "currency",
    currency,
  }).format(value);
};
