import postgres from "@prisma/orm-postgres/runtime";
import { contractFromJson } from "@prisma/orm-postgres/static";
import type { Contract } from "../src/prisma/contract.d";
import contractJson from "../src/prisma/contract.json" with { type: "json" };

const db = postgres({ contract: contractFromJson<Contract>(contractJson), url: process.env.DATABASE_URL ?? "" });
const LAYOUT: Record<number, string> = { 2: "AB", 3: "ABCDEF", 4: "ABCDEF", 5: "ABCDEF", 6: "ABCDEF", 7: "ABCDEF", 8: "ABCDEF", 9: "ABCDEF", 10: "ABCDEF" };
const CATEGORIES = ["Electricity","Staff Salaries","Generator Maintenance","Lift Maintenance","Water Management","Cleaning and Hygiene","Security","Electrical Maintenance","Building Maintenance","Gardening and Outdoor","Administrative Expenses","Other / Miscellaneous"];

async function main() {
  for (const [floor, letters] of Object.entries(LAYOUT))
    for (const l of letters) {
      const number = `${floor}${l}`;
      if (!(await db.orm.public.Flat.first({ number }))) await db.orm.public.Flat.create({ number, floor: Number(floor) });
    }
  for (const name of CATEGORIES)
    if (!(await db.orm.public.ExpenseCategory.first({ name }))) await db.orm.public.ExpenseCategory.create({ name });
  if (!(await db.orm.public.ChargeSetting.aggregate((a) => ({ n: a.count() }))).n)
    await db.orm.public.ChargeSetting.create({ amount: "3000", effectiveFrom: "2026-01-01" });
  const email = process.env.SUPER_ADMIN_EMAIL?.toLowerCase();
  if (!email) throw new Error("Set SUPER_ADMIN_EMAIL in .env");
  if (!(await db.orm.public.User.first({ email })))
    await db.orm.public.User.create({ email, role: "SUPER_ADMIN", name: "Super Admin" });
  console.log("Seeded flats:", (await db.orm.public.Flat.aggregate((a) => ({ n: a.count() }))).n);
}
main().finally(() => db.close());
