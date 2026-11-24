import { describe, it, expect } from "vitest";
import { Prisma } from "@prisma/client";
import { allocate } from "../lib/allocate";
const D = (n: number) => new Prisma.Decimal(n);
const dues = [
  { chargeId: "b", month: "2026-02", due: D(3000) },
  { chargeId: "a", month: "2026-01", due: D(1000) },
  { chargeId: "c", month: "2026-03", due: D(3000) },
];
describe("allocate", () => {
  it("pays oldest month first and spills over", () => {
    const r = allocate(2500, dues);
    expect(r.map(x => [x.chargeId, x.amount.toNumber()])).toEqual([["a", 1000], ["b", 1500]]);
  });
  it("rejects more than total dues", () => expect(() => allocate(8000, dues)).toThrow(/exceeds/));
  it("rejects zero", () => expect(() => allocate(0, dues)).toThrow());
  it("allocations sum to the amount", () => {
    const sum = allocate(7000, dues).reduce((a, x) => a.plus(x.amount), D(0));
    expect(sum.toNumber()).toBe(7000);
  });
});
