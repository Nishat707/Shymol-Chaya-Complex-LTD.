import service from "../service.mjs";
import type { PostgresClient } from "@prisma/orm-postgres/runtime";
import type { Contract } from "../src/prisma/contract.d";

// The service declaration is authored as plain JavaScript, so its inferred
// client type carries a widened contract. Retype it here from the emitted
// contract, which is the same contract the declaration wires.
type DbClient = PostgresClient<Contract>;

let client: DbClient | undefined;

// The client arrives from the service declaration's database dependency. It is
// resolved lazily on first request: next build imports every route module
// without the runtime environment, so module scope is too early.
export function db(): DbClient {
  client ??= service.load().db.client as unknown as DbClient;
  return client;
}
