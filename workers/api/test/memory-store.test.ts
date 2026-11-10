import { buildSeed } from "../src/seed.ts";
import { InMemoryStore } from "../src/store.ts";
import { describeStoreContract } from "./store-contract.ts";

describeStoreContract("InMemoryStore", async () => ({
  store: new InMemoryStore(buildSeed(new Date("2026-11-10T12:00:00.000Z"))),
  prefix: "mem",
}));
