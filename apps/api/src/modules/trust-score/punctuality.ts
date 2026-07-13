export const computeContributionDueDate = (referenceMonth: Date, collectionDay: number): Date => {
  return new Date(
    Date.UTC(referenceMonth.getUTCFullYear(), referenceMonth.getUTCMonth(), collectionDay),
  );
};

export const isContributionOnTime = (
  status: "PENDING" | "PAID" | "LATE",
  paidAt: Date | undefined,
  referenceMonth: Date,
  collectionDay: number | undefined,
): boolean => {
  if (status === "LATE") {
    return false;
  }

  if (status === "PENDING") {
    return false;
  }

  if (!collectionDay || !paidAt) {
    return true;
  }

  return paidAt <= computeContributionDueDate(referenceMonth, collectionDay);
};

export const isLoanPaymentOnTime = (paidAt: Date, dueDate: Date): boolean => paidAt <= dueDate;