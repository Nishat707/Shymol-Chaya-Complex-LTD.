import Decimal from "decimal.js";

// Stand-in for the @prisma/client surface the tests import. The app itself gets
// its client from the Composer service declaration (lib/db.ts).
export const Prisma = { Decimal };
