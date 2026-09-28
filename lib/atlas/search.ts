import type { SearchResult } from "@/types/search";
import { normalize } from "./filters";
import type { AtlasLookups } from "./lookups";

interface Entry {
  haystack: string;
  result: SearchResult;
}

interface Corpus {
  minerals: Entry[];
  countries: Entry[];
  suppliers: Entry[];
  cities: Entry[];
  /** mineralId → country codes offering it, ordered by supplier count. */
  mineralCountries: Map<string, { code: string; suppliers: number }[]>;
}

const corpusCache = new WeakMap<AtlasLookups, Corpus>();

/** Normalised search corpus, built once per index. */
function getCorpus(lookups: AtlasLookups): Corpus {
  const cached = corpusCache.get(lookups);
  if (cached) return cached;

  const { index, countryById } = lookups;
  const countryName = (id: string) => countryById.get(id)?.name ?? "";

  const mineralCountryCounts = new Map<string, Map<string, number>>();
  for (const supplier of index.suppliers) {
    const country = countryById.get(supplier.countryId);
    if (!country) continue;
    for (const mineralId of supplier.mineralIds) {
      let counts = mineralCountryCounts.get(mineralId);
      if (!counts) mineralCountryCounts.set(mineralId, (counts = new Map()));
      counts.set(country.code, (counts.get(country.code) ?? 0) + 1);
    }
  }
  const mineralCountries = new Map(
    [...mineralCountryCounts].map(([mineralId, counts]) => [
      mineralId,
      [...counts].map(([code, suppliers]) => ({ code, suppliers })).sort((a, b) => b.suppliers - a.suppliers),
    ]),
  );

  const cityKeys = new Set<string>();
  const cities: Entry[] = [];
  for (const s of index.suppliers) {
    const key = `${s.countryId}:${s.city}`;
    if (cityKeys.has(key)) continue;
    cityKeys.add(key);
    const country = countryById.get(s.countryId);
    cities.push({
      haystack: normalize(`${s.city} ${s.region ?? ""}`),
      result: {
        kind: "city",
        id: key,
        label: s.city,
        sublabel: [s.region, country?.name].filter(Boolean).join(", "),
        countryCode: country?.code ?? null,
        lat: s.lat,
        lng: s.lng,
      },
    });
  }

  const corpus: Corpus = {
    minerals: index.minerals.map((m) => ({
      haystack: normalize(`${m.name} ${m.chemicalFormula ?? ""}`),
      result: {
        kind: "mineral",
        id: m.id,
        label: m.name,
        sublabel: `${mineralCountries.get(m.id)?.length ?? 0} countries`,
        countryCode: null,
        mineralId: m.id,
      },
    })),
    countries: index.countries
      .filter((c) => lookups.suppliersByCountry.has(c.id))
      .map((c) => ({
        haystack: normalize(`${c.name} ${c.code}`),
        result: {
          kind: "country",
          id: c.code,
          label: c.name,
          sublabel: `${lookups.suppliersByCountry.get(c.id)?.length ?? 0} suppliers`,
          countryCode: c.code,
        },
      })),
    suppliers: index.suppliers.map((s) => ({
      haystack: normalize(s.name),
      result: {
        kind: "supplier",
        id: s.id,
        label: s.name,
        sublabel: `${s.city}, ${countryName(s.countryId)}`,
        countryCode: countryById.get(s.countryId)?.code ?? null,
        supplierId: s.id,
        lat: s.lat,
        lng: s.lng,
      },
    })),
    cities,
    mineralCountries,
  };
  corpusCache.set(lookups, corpus);
  return corpus;
}

/** 3 = prefix match, 2 = word prefix, 1 = substring, 0 = no match. */
function score(haystack: string, q: string): number {
  if (haystack.startsWith(q)) return 3;
  if (haystack.includes(` ${q}`)) return 2;
  if (haystack.includes(q)) return 1;
  return 0;
}

function rank(entries: Entry[], q: string, limit: number): SearchResult[] {
  const hits: { s: number; entry: Entry }[] = [];
  for (const entry of entries) {
    const s = score(entry.haystack, q);
    if (s) hits.push({ s, entry });
  }
  return hits
    .sort((a, b) => b.s - a.s || a.entry.result.label.localeCompare(b.entry.result.label))
    .slice(0, limit)
    .map((h) => h.entry.result);
}

/**
 * Ranked search across minerals, countries, suppliers and cities. When the best
 * hit is a mineral, the countries supplying it are appended ("Lithium → Chile,
 * Australia, Argentina…").
 */
export function searchAtlas(lookups: AtlasLookups, rawQuery: string): SearchResult[] {
  const q = normalize(rawQuery);
  if (!q) return [];
  const corpus = getCorpus(lookups);

  const minerals = rank(corpus.minerals, q, 4);
  const countries = rank(corpus.countries, q, 5);
  const suppliers = rank(corpus.suppliers, q, 6);
  const cities = rank(corpus.cities, q, 4);

  const results: SearchResult[] = [...minerals];
  const topMineral = minerals[0];
  if (topMineral?.mineralId) {
    const where = corpus.mineralCountries.get(topMineral.mineralId) ?? [];
    for (const { code, suppliers: count } of where.slice(0, 6)) {
      const country = lookups.countryByCode.get(code);
      if (!country) continue;
      results.push({
        kind: "country",
        id: `${topMineral.mineralId}:${code}`,
        label: country.name,
        sublabel: `${topMineral.label} · ${count} supplier${count === 1 ? "" : "s"}`,
        countryCode: code,
        mineralId: topMineral.mineralId,
      });
    }
  }
  return [...results, ...countries, ...suppliers, ...cities];
}
