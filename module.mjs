// @ts-check
import { appRoot } from "@prisma/composer";
import { variable } from "@prisma/composer-prisma-cloud";
import { postgres, dataContract } from "@prisma/composer-prisma-cloud/orm";
import appContractJson from "./src/prisma/contract.json" with { type: "json" };
import web from "./service.mjs";

export default appRoot("prisma-postgres-fulvous-grass", ({ provision }) => {
  const supabaseUrl = provision(variable({ name: "NEXT_PUBLIC_SUPABASE_URL" })); // The Supabase project URL that every auth client talks to.
  const supabaseAnonKey = provision(variable.secret({ name: "NEXT_PUBLIC_SUPABASE_ANON_KEY" })); // The Supabase anon key the server and browser auth clients sign in with.
  const siteUrl = provision(variable({ name: "NEXT_PUBLIC_SITE_URL" })); // The public origin used for server-side redirects.
  const database = provision(postgres({ name: "database", contract: dataContract(appContractJson), config: "./prisma.config.ts" }));
  provision(web, { deps: { db: database }, input: { supabaseUrl, supabaseAnonKey, siteUrl } });
});
