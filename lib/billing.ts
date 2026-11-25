import { db } from "./db";
// Creates the month's bills for occupied flats. Safe to run twice: existing bills are never touched.
export async function generateMonth(month: string, actorId: string) {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) throw new Error("Month must be YYYY-MM.");
  if (await db().orm.public.MonthClose.first({ month })) throw new Error(`${month} is closed.`);
  const setting = await db().orm.public.ChargeSetting
    .where((cs) => cs.effectiveFrom.lte(`${month}-01`))
    .orderBy((cs) => cs.effectiveFrom.desc())
    .first();
  if (!setting) throw new Error("No default charge is effective for this month.");
  const flats = await db().orm.public.Flat.where({ occupancy: "OCCUPIED" }).all();
  const created = await db().orm.public.MonthlyCharge.createAll(
    flats.map(f => ({ flatId: f.id, month, amount: f.customCharge ?? setting.amount })),
    { onConflict: "skip", conflictOn: ["flatId", "month"] },
  );
  await db().orm.public.AuditLog.create({ actorId, action: "GENERATE_MONTH", entity: "MonthlyCharge", entityId: month, after: { created: created.length } });
  return created.length;
}
