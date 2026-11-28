import { describe, expect, it } from "vitest";
import { residentFinancialMetrics } from "../lib/resident-finance";

describe("resident financial summary", () => {
  it("calculates current charge and outstanding balance from unvoided allocations", () => {
    const metrics = residentFinancialMetrics(
      [
        {
          month: "2026-10",
          amount: 3000,
          waived: 500,
          allocations: [{ amount: 1000 }],
        },
        {
          month: "2026-11",
          amount: 3500,
          waived: 0,
          allocations: [{ amount: 3500 }],
        },
      ],
      4500,
      "2026-11",
      true,
    );

    expect(metrics).toEqual({
      currentCharge: 3500,
      outstanding: 1500,
      totalPaid: 4500,
      latestPaymentStatus: "Recorded",
    });
  });

  it("shows zero when no charge or payment exists", () => {
    expect(residentFinancialMetrics([], 0, "2026-11", false)).toEqual({
      currentCharge: 0,
      outstanding: 0,
      totalPaid: 0,
      latestPaymentStatus: "No payment",
    });
  });
});
