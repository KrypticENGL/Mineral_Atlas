/**
 * Builds per-country state/province boundaries for the globe.
 *
 *   curl -L -o admin1.geojson https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_admin_1_states_provinces.geojson
 *   node scripts/build-admin1.mjs admin1.geojson
 *
 * Source: Natural Earth 1:10m admin-1 (public domain). Output is one small
 * TopoJSON file per ISO 3166-1 alpha-2 code in public/geo/admin1/, loaded only
 * when that country is selected.
 */
import { mkdirSync, readdirSync, rmSync, statSync } from "node:fs";
import { join } from "node:path";
import mapshaper from "mapshaper";

const input = process.argv[2];
if (!input) {
  console.error("Usage: node scripts/build-admin1.mjs <ne_10m_admin_1_states_provinces.geojson>");
  process.exit(1);
}

const outDir = join("public", "geo", "admin1");
rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

await mapshaper.runCommands([
  "-i", JSON.stringify(input),
  "-filter", "'iso_a2 != null && /^[A-Z]{2}$/.test(iso_a2)'",
  "-filter-fields", "iso_a2,name",
  "-simplify", "12%", "weighted", "keep-shapes",
  "-split", "iso_a2",
  "-o", `${outDir}/`, "format=topojson", "singles", "quantization=100000", "extension=.json",
].join(" "));

const files = readdirSync(outDir);
const bytes = files.reduce((sum, f) => sum + statSync(join(outDir, f)).size, 0);
console.log(`Wrote ${files.length} files, ${(bytes / 1024 / 1024).toFixed(1)} MB total`);
