import { describe, expect, it } from "vitest";
import { computeContributionDueDate, isContributionOnTime, isLoanPaymentOnTime } from "./punctuality.js";

describe("computeContributionDueDate", () => {
  it("builds the due date in UTC regardless of local timezone", () => {
    const referenceMonth = new Date("2026-07-01T00:00:00.000Z");
    const dueDate = computeContributionDueDate(referenceMonth, 9);

    expect(dueDate.toISOString()).toBe("2026-07-09T00:00:00.000Z");
  });
});

describe("isContributionOnTime", () => {
  // Regression test: a contribution paid July 3 against a due date of July 9
  // was miscategorized as late because referenceMonth.getMonth() (local, not
  // UTC) rolled back to June on a UTC-4 machine. See apps/api/src/modules/
  // contributions/contributions.routes.ts history.
  it("treats a payment made before the collection day as on time", () => {
    const referenceMonth = new Date("2026-07-01T00:00:00.000Z");
    const paidAt = new Date("2026-07-03T00:00:00.000Z");

    expect(isContributionOnTime("PAID", paidAt, referenceMonth, 9)).toBe(true);
  });

  it("treats a payment made after the collection day as late", () => {
    const referenceMonth = new Date("2026-09-01T00:00:00.000Z");
    const paidAt = new Date("2026-09-15T00:00:00.000Z");

    expect(isContributionOnTime("PAID", paidAt, referenceMonth, 9)).toBe(false);
  });

  it("treats a payment made exactly on the collection day as on time", () => {
    const referenceMonth = new Date("2026-07-01T00:00:00.000Z");
    const paidAt = new Date("2026-07-09T00:00:00.000Z");

    expect(isContributionOnTime("PAID", paidAt, referenceMonth, 9)).toBe(true);
  });

  it("always treats an explicit LATE status as late, even if paid early", () => {
    const referenceMonth = new Date("2026-07-01T00:00:00.000Z");
    const paidAt = new Date("2026-07-01T00:00:00.000Z");

    expect(isContributionOnTime("LATE", paidAt, referenceMonth, 9)).toBe(false);
  });

  it("treats PENDING as not-yet-on-time (caller should not record it at all)", () => {
    const referenceMonth = new Date("2026-07-01T00:00:00.000Z");

    expect(isContributionOnTime("PENDING", undefined, referenceMonth, 9)).toBe(false);
  });

  it("assumes on time when the group has no collectionDay configured", () => {
    const referenceMonth = new Date("2026-07-01T00:00:00.000Z");
    const paidAt = new Date("2026-07-25T00:00:00.000Z");

    expect(isContributionOnTime("PAID", paidAt, referenceMonth, undefined)).toBe(true);
  });

  it("handles a December reference month without rolling into next year", () => {
    const referenceMonth = new Date("2026-12-01T00:00:00.000Z");
    const paidAt = new Date("2026-12-08T00:00:00.000Z");

    expect(isContributionOnTime("PAID", paidAt, referenceMonth, 9)).toBe(true);
  });
});

describe("isLoanPaymentOnTime", () => {
  it("treats a payment before the due date as on time", () => {
    expect(isLoanPaymentOnTime(new Date("2026-08-01"), new Date("2026-08-31"))).toBe(true);
  });

  it("treats a payment after the due date as late", () => {
    expect(isLoanPaymentOnTime(new Date("2026-09-01"), new Date("2026-08-31"))).toBe(false);
  });

  it("treats a payment on the due date as on time", () => {
    const dueDate = new Date("2026-08-31");
    expect(isLoanPaymentOnTime(dueDate, dueDate)).toBe(true);
  });
});
