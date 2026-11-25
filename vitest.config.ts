import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      // The tests import Prisma.Decimal from @prisma/client; Prisma 8 has no
      // @prisma/client package, so map it to the local stand-in.
      "@prisma/client": fileURLToPath(new URL("./compat/prisma-client.ts", import.meta.url)),
    },
  },
});
