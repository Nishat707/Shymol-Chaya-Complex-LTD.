// @ts-check
import nextjs from "@prisma/composer/nextjs";
import { compute } from "@prisma/composer-prisma-cloud";
import { postgres, dataContract } from "@prisma/composer-prisma-cloud/orm";
import { type } from "arktype";
import { field, secretString } from "@prisma/composer/arktype";
import appContractJson from "./src/prisma/contract.json" with { type: "json" };

export default compute({
  name: "web",
  deps: { db: postgres(dataContract(appContractJson)) },
  input: type({
    supabaseUrl: field(type("string")),
    supabaseAnonKey: secretString(),
  }),
  build: nextjs({ module: import.meta.url, appDir: "." }),
});
