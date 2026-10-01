import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { FlowerGuideCardsData } from "@blossompot/shared";
import { resolveFlowerGuideCards } from "./flower-guide-cards";

function record(slug: "usa" | "uk" | "canada", price: number): FlowerGuideCardsData {
  const country = slug === "usa" ? "US" : slug === "uk" ? "GB" : "CA";
  const count = slug === "usa" ? 24 : 10;
  return {
    country,
    slug,
    products: Array.from({ length: count }, (_, i) => ({
      slug: `${slug}-${i}`,
      name: `${slug} ${i}`,
      price,
      currency: "USD",
      categorySlug: "flowers",
      images: ["https://cdn.example.com/flower.jpg"],
      inventory: 3,
      published: true,
    })),
  };
}

function scheduler() {
  const tasks: Array<() => Promise<void>> = [];
  return {
    scheduleWrite(task: () => Promise<void>) {
      tasks.push(task);
    },
    async flush() {
      const pending = tasks.splice(0);
      for (const task of pending) await task();
    },
  };
}

describe("flower guide card cache", () => {
  it("returns selected cards before the shared write runs", async () => {
    const store = new Map<string, FlowerGuideCardsData>();
    let writes = 0;
    const writesLater = scheduler();
    const memory = new Map<string, { at: number; data: FlowerGuideCardsData }>();
    const first = await resolveFlowerGuideCards(
      "uk",
      {
        readShared: async () => null,
        writeShared: async (data) => {
          writes += 1;
          store.set(data.country, data);
          return true;
        },
        selectCards: async () => ({ data: record("uk", 49), products: [] }),
        scheduleWrite: writesLater.scheduleWrite,
      },
      memory
    );

    assert.equal(first.source, "miss");
    assert.equal(first.data?.products.length, 10);
    assert.equal(writes, 0);
    assert.equal(store.has("GB"), false);
    assert.equal(memory.get("GB")?.data.products[0]?.price, 49);

    await writesLater.flush();
    assert.equal(writes, 1);
    assert.equal(store.get("GB")?.products.length, 10);
  });

  it("uses fresh memory without a shared read", async () => {
    let reads = 0;
    let selects = 0;
    const memory = new Map<string, { at: number; data: FlowerGuideCardsData }>();
    memory.set("GB", { at: Date.now(), data: record("uk", 40) });
    const hit = await resolveFlowerGuideCards(
      "uk",
      {
        readShared: async () => {
          reads += 1;
          return record("uk", 99);
        },
        writeShared: async () => true,
        selectCards: async () => {
          selects += 1;
          return { data: record("uk", 1), products: [] };
        },
        scheduleWrite: () => undefined,
      },
      memory
    );
    assert.equal(hit.source, "memory");
    assert.equal(hit.data?.products[0]?.price, 40);
    assert.equal(reads, 0);
    assert.equal(selects, 0);
  });

  it("reads the shared country record when memory is empty and does not select again", async () => {
    const store = new Map<string, FlowerGuideCardsData>([["GB", record("uk", 49)]]);
    let selects = 0;
    const memory = new Map<string, { at: number; data: FlowerGuideCardsData }>();
    const hit = await resolveFlowerGuideCards(
      "uk",
      {
        readShared: async (country) => store.get(country) ?? null,
        writeShared: async () => true,
        selectCards: async () => {
          selects += 1;
          return { data: record("uk", 1), products: [] };
        },
        scheduleWrite: () => undefined,
      },
      memory
    );
    assert.equal(hit.source, "shared");
    assert.equal(selects, 0);
    assert.equal(hit.data?.products[0]?.price, 49);
    assert.equal(memory.get("GB")?.data.products[0]?.price, 49);
  });

  it("keeps UK and Canada records separate", async () => {
    const store = new Map<string, FlowerGuideCardsData>();
    const memory = new Map<string, { at: number; data: FlowerGuideCardsData }>();
    const writes = scheduler();
    const deps = {
      readShared: async (country: string) => store.get(country) ?? null,
      writeShared: async (data: FlowerGuideCardsData) => {
        store.set(data.country, data);
        return true;
      },
      selectCards: async (slug: "usa" | "uk" | "canada") => ({
        data: record(slug, slug === "uk" ? 40 : 55),
        products: [],
      }),
      scheduleWrite: writes.scheduleWrite,
    };

    const uk = await resolveFlowerGuideCards("uk", deps, memory);
    const canada = await resolveFlowerGuideCards("canada", deps, memory);
    assert.equal(uk.data?.country, "GB");
    assert.equal(uk.data?.products[0]?.price, 40);
    assert.equal(canada.data?.country, "CA");
    assert.equal(canada.data?.products[0]?.price, 55);
    assert.equal(canada.data?.products.length, 10);

    const ukAgain = await resolveFlowerGuideCards("uk", deps, memory);
    assert.equal(ukAgain.source, "memory");
    assert.equal(ukAgain.data?.products[0]?.price, 40);
    assert.notEqual(ukAgain.data?.products[0]?.price, canada.data?.products[0]?.price);
  });

  it("falls back to selection when the shared read fails", async () => {
    const memory = new Map<string, { at: number; data: FlowerGuideCardsData }>();
    const result = await resolveFlowerGuideCards(
      "canada",
      {
        readShared: async () => {
          throw new Error("shared read failed");
        },
        writeShared: async () => true,
        selectCards: async () => ({ data: record("canada", 55), products: [] }),
        scheduleWrite: () => undefined,
      },
      memory
    );
    assert.equal(result.source, "miss");
    assert.equal(result.data?.country, "CA");
    assert.equal(result.data?.products.length, 10);
  });

  it("does not store an empty selection and does not reuse an expired entry", async () => {
    const memory = new Map<string, { at: number; data: FlowerGuideCardsData }>();
    let shared: FlowerGuideCardsData | null = null;
    let selects = 0;
    let scheduled = 0;
    const deps = {
      readShared: async () => shared,
      writeShared: async (data: FlowerGuideCardsData) => {
        shared = data;
        return true;
      },
      selectCards: async (slug: "usa" | "uk" | "canada") => {
        selects += 1;
        return selects === 1
          ? { data: null, products: [] }
          : { data: record(slug, 20 + selects), products: [] };
      },
      scheduleWrite: () => {
        scheduled += 1;
      },
    };

    const empty = await resolveFlowerGuideCards("usa", deps, memory);
    assert.equal(empty.source, "miss");
    assert.equal(empty.data, null);
    assert.equal(shared, null);
    assert.equal(scheduled, 0);
    assert.equal(memory.has("US"), false);

    const built = await resolveFlowerGuideCards("usa", deps, memory);
    assert.equal(built.data?.products.length, 24);
    assert.equal(built.data?.products[0]?.price, 22);
    assert.equal(scheduled, 1);

    const entry = memory.get("US");
    assert.ok(entry);
    entry.at = Date.now() - 46_000;

    const rebuilt = await resolveFlowerGuideCards("usa", deps, memory);
    assert.equal(rebuilt.source, "miss");
    assert.equal(selects, 3);
    assert.equal(rebuilt.data?.products[0]?.price, 23);
    assert.equal(memory.has("US"), true);
  });
});
