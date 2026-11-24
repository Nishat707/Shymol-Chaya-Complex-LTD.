import { prisma } from "./db";
// Creates the month's bills for occupied flats. Safe to run twice: existing bills are never touched.
export async function generateMonth(month: string, actorId: string) {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) throw new Error("Month must be YYYY-MM.");
  if (await prisma.monthClose.findUnique({ where: { month } })) throw new Error(`${month} is closed.`);
  const asOf = new Date(`${month}-01T00:00:00Z`);
  const setting = await prisma.chargeSetting.findFirst({ where: { effectiveFrom: { lte: asOf } }, orderBy: { effectiveFrom: "desc" } });
  if (!setting) throw new Error("No default charge is effective for this month.");
  const flats = await prisma.flat.findMany({ where: { occupancy: "OCCUPIED" } });
  const res = await prisma.monthlyCharge.createMany({
    data: flats.map(f => ({ flatId: f.id, month, amount: f.customCharge ?? setting.amount })),
    skipDuplicates: true,
  });
  await prisma.auditLog.create({ data: { actorId, action: "GENERATE_MONTH", entity: "MonthlyCharge", entityId: month, after: { created: res.count } } });
  return res.count;
}
