import { describe, expect, it } from "vitest";
import { recordPunctualityEvent } from "./trust-score.service.js";

type FakeTrustScore = {
  membershipId: string;
  score: number;
  onTimePayments: number;
  latePayments: number;
  lastCalculatedAt: Date | null;
};

const createFakeTx = (initial?: FakeTrustScore) => {
  let store: FakeTrustScore | undefined = initial;

  const tx = {
    trustScore: {
      findUnique: async () => store ?? null,
      upsert: async ({ create, update }: { create: FakeTrustScore; update: Partial<FakeTrustScore> }) => {
        store = store ? { ...store, ...update } : create;
        return store;
      },
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any;

  return { tx, getStore: () => store };
};

describe("recordPunctualityEvent", () => {
  it("creates a fresh trust score at 100 on the first on-time event", async () => {
    const { tx, getStore } = createFakeTx();

    await recordPunctualityEvent(tx, "membership-1", true);

    expect(getStore()).toMatchObject({ score: 100, onTimePayments: 1, latePayments: 0 });
  });

  it("creates a fresh trust score at 0 on the first late event", async () => {
    const { tx, getStore } = createFakeTx();

    await recordPunctualityEvent(tx, "membership-1", false);

    expect(getStore()).toMatchObject({ score: 0, onTimePayments: 0, latePayments: 1 });
  });

  it("recalculates the score as a percentage of on-time payments", async () => {
    const { tx, getStore } = createFakeTx({
      membershipId: "membership-1",
      score: 100,
      onTimePayments: 3,
      latePayments: 0,
      lastCalculatedAt: new Date(),
    });

    await recordPunctualityEvent(tx, "membership-1", false);

    // 3 on-time, 1 late -> 75%
    expect(getStore()).toMatchObject({ score: 75, onTimePayments: 3, latePayments: 1 });
  });

  it("clamps the score between 0 and 100", async () => {
    const { tx, getStore } = createFakeTx({
      membershipId: "membership-1",
      score: 100,
      onTimePayments: 1,
      latePayments: 0,
      lastCalculatedAt: new Date(),
    });

    await recordPunctualityEvent(tx, "membership-1", true);

    const store = getStore();
    expect(store?.score).toBeGreaterThanOrEqual(0);
    expect(store?.score).toBeLessThanOrEqual(100);
  });
});
