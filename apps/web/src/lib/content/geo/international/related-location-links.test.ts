import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { getGeoLocation, locationLabel } from "../locations";
import { locationPublicPath } from "../../seo-data";
import { getInternationalLocation, internationalPath } from "./registry";
import { relatedLocationLinks } from "./related-location-links";
import type { InternationalLocation } from "./types";

const webSrc = path.resolve(__dirname, "../../../../");

function readSource(file: string): string {
  return fs.readFileSync(file, "utf8");
}

function runtimeSpecifiers(source: string): string[] {
  const withoutComments = source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .split("\n")
    .filter((line) => !line.trim().startsWith("//"))
    .join("\n")
    .replace(/\bimport\s+type\b[\s\S]*?\sfrom\s+["'][^"']+["']/g, "")
    .replace(/\bexport\s+type\b[\s\S]*?\sfrom\s+["'][^"']+["']/g, "");
  const specs = new Set<string>();
  for (const match of withoutComments.matchAll(/\bfrom\s+["']([^"']+)["']/g)) {
    specs.add(match[1]!);
  }
  for (const match of withoutComments.matchAll(/\bimport\s+["']([^"']+)["']/g)) {
    specs.add(match[1]!);
  }
  for (const match of withoutComments.matchAll(/\bimport\s*\(\s*["']([^"']+)["']\s*\)/g)) {
    specs.add(match[1]!);
  }
  return [...specs];
}

function resolveExisting(base: string): string | null {
  const candidates = [
    base,
    `${base}.ts`,
    `${base}.tsx`,
    `${base}.js`,
    `${base}.jsx`,
    `${base}.json`,
    path.join(base, "index.ts"),
    path.join(base, "index.tsx"),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) return candidate;
  }
  return null;
}

function resolveSpecifier(fromFile: string, spec: string): string | null {
  if (spec.startsWith("@/")) return resolveExisting(path.join(webSrc, spec.slice(2)));
  if (spec.startsWith(".")) return resolveExisting(path.resolve(path.dirname(fromFile), spec));
  return null;
}

function isUseClient(file: string): boolean {
  if (!/\.(ts|tsx|js|jsx)$/.test(file)) return false;
  return /^\s*["']use client["']/.test(readSource(file));
}

/** Client modules reachable from a route or layout, including modules they import. */
function clientModulesFrom(entries: string[]): Map<string, "client" | "server"> {
  const mode = new Map<string, "client" | "server">();

  function walk(file: string, asClient: boolean): void {
    const clientNow = asClient || isUseClient(file);
    const previous = mode.get(file);
    if (previous === "client") return;
    if (previous === "server" && !clientNow) return;
    mode.set(file, clientNow ? "client" : "server");
    if (!/\.(ts|tsx|js|jsx)$/.test(file)) return;
    for (const spec of runtimeSpecifiers(readSource(file))) {
      const next = resolveSpecifier(file, spec);
      if (next) walk(next, clientNow);
    }
  }

  for (const entry of entries) walk(entry, false);
  return mode;
}

describe("related USA links on international pages", () => {
  it("keeps international neighbors and published USA destinations for Ontario", () => {
    const ontario = getInternationalLocation("ontario");
    assert.ok(ontario);
    const quebec = getInternationalLocation("quebec");
    const manitoba = getInternationalLocation("manitoba");
    const newYork = getGeoLocation("new-york");
    assert.ok(quebec);
    assert.ok(manitoba);
    assert.ok(newYork);

    const links = relatedLocationLinks(ontario);
    assert.deepEqual(
      links.map((link) => link.href),
      [internationalPath(quebec), internationalPath(manitoba), locationPublicPath("new-york")]
    );
    assert.equal(links[2]?.label, locationLabel(newYork));
    assert.equal(links[2]?.href, "/gifts-to-new-york");
  });

  it("skips the current page, duplicate slugs, and unknown slugs", () => {
    const ontario = getInternationalLocation("ontario");
    assert.ok(ontario);
    const quebec = getInternationalLocation("quebec");
    assert.ok(quebec);
    const edited: InternationalLocation = {
      ...ontario,
      relatedSlugs: ["ontario", "quebec", "quebec", "no-such-city", "new-york"],
    };
    const links = relatedLocationLinks(edited);
    assert.deepEqual(
      links.map((link) => link.href),
      [internationalPath(quebec), "/gifts-to-new-york"]
    );
  });
});

describe("header client graph excludes the US geo dataset", () => {
  it("does not reach locations.data.json from the layout, homepage, or header", () => {
    const mode = clientModulesFrom([
      path.join(webSrc, "app/layout.tsx"),
      path.join(webSrc, "app/page.tsx"),
      path.join(webSrc, "components/Header.tsx"),
    ]);
    const dataset = path.join(webSrc, "lib/content/geo/locations.data.json");
    const locationsModule = path.join(webSrc, "lib/content/geo/locations.ts");
    const relatedModule = path.join(webSrc, "lib/content/geo/international/related-location-links.ts");
    assert.equal(mode.get(dataset), undefined);
    assert.notEqual(mode.get(locationsModule), "client");
    assert.notEqual(mode.get(relatedModule), "client");
    assert.equal(mode.get(path.join(webSrc, "components/Header.tsx")), "client");
    assert.equal(mode.get(path.join(webSrc, "lib/city-menu-for-location.ts")), "client");
  });

  it("imports the dataset only from the server location page", () => {
    const registry = readSource(path.join(webSrc, "lib/content/geo/international/registry.ts"));
    const barrel = readSource(path.join(webSrc, "lib/content/geo/international/index.ts"));
    assert.doesNotMatch(registry, /locations\.data\.json|from\s+["']\.\.\/locations["']|seo-data/);
    assert.doesNotMatch(barrel, /relatedLocationLinks|related-location-links/);

    const importers: string[] = [];
    function scan(dir: string): void {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (entry.name === "node_modules" || entry.name === ".next") continue;
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          scan(full);
          continue;
        }
        if (!/\.(ts|tsx)$/.test(entry.name)) continue;
        if (entry.name === "related-location-links.test.ts") continue;
        const source = readSource(full);
        if (source.includes("related-location-links") || source.includes("relatedLocationLinks")) {
          importers.push(path.relative(webSrc, full).replaceAll("\\", "/"));
        }
      }
    }
    scan(webSrc);
    assert.deepEqual(importers.sort(), [
      "components/geo/InternationalLocationPage.tsx",
      "lib/content/geo/international/related-location-links.ts",
    ]);
  });
});
