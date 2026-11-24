import { PrismaClient, Role } from "@prisma/client";
const db = new PrismaClient();
const LAYOUT: Record<number, string> = { 2: "AB", 3: "ABCDEF", 4: "ABCDEF", 5: "ABCDEF", 6: "ABCDEF", 7: "ABCDEF", 8: "ABCDEF", 9: "ABCDEF", 10: "ABCDEF" };
const CATEGORIES = ["Electricity","Staff Salaries","Generator Maintenance","Lift Maintenance","Water Management","Cleaning and Hygiene","Security","Electrical Maintenance","Building Maintenance","Gardening and Outdoor","Administrative Expenses","Other / Miscellaneous"];

async function main() {
  for (const [floor, letters] of Object.entries(LAYOUT))
    for (const l of letters) {
      const number = `${floor}${l}`;
      await db.flat.upsert({ where: { number }, update: {}, create: { number, floor: Number(floor) } });
    }
  for (const name of CATEGORIES) await db.expenseCategory.upsert({ where: { name }, update: {}, create: { name } });
  if (!(await db.chargeSetting.count()))
    await db.chargeSetting.create({ data: { amount: "3000", effectiveFrom: new Date("2026-01-01") } });
  const email = process.env.SUPER_ADMIN_EMAIL?.toLowerCase();
  if (!email) throw new Error("Set SUPER_ADMIN_EMAIL in .env");
  await db.user.upsert({ where: { email }, update: {}, create: { email, role: Role.SUPER_ADMIN, name: "Super Admin" } });
  console.log("Seeded flats:", await db.flat.count());
}
main().finally(() => db.$disconnect());
