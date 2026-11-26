import { describe, expect, it } from "vitest";
import { topExpenseCategories, topPayers } from "../lib/dashboard-analytics";

describe("resident dashboard rankings", () => {
  it("sums payments by flat and excludes voided payments", () => {
    const rankings = topPayers([
      { amount: 1200, voidedAt: null, flat: { id: "a", number: "2A", ownerName: "Amina" } },
      { amount: 800, voidedAt: null, flat: { id: "a", number: "2A", ownerName: "Amina" } },
      { amount: 1500, voidedAt: null, flat: { id: "b", number: "2B", ownerName: "Bashir" } },
      { amount: 9000, voidedAt: new Date(), flat: { id: "c", number: "3A", ownerName: "Chaya" } },
    ]);

    expect(rankings).toEqual([
      { label: "Amina · Flat 2A", total: 2000 },
      { label: "Bashir · Flat 2B", total: 1500 },
    ]);
  });

  it("ranks only paid expense totals by category", () => {
    const rankings = topExpenseCategories([
      { amount: 3000, status: "PAID", category: { id: "power", name: "Electricity" } },
      { amount: 700, status: "PAID", category: { id: "power", name: "Electricity" } },
      { amount: 2500, status: "PAID", category: { id: "lift", name: "Lift Maintenance" } },
      { amount: 9000, status: "RECORDED", category: { id: "staff", name: "Staff Salaries" } },
    ]);

    expect(rankings).toEqual([
      { label: "Electricity", total: 3700 },
      { label: "Lift Maintenance", total: 2500 },
    ]);
  });
});
