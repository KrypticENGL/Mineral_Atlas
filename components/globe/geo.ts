import type { Feature, FeatureCollection, MultiPolygon, Polygon } from "geojson";
import { feature } from "topojson-client";
import type { GeometryCollection, Topology } from "topojson-specification";

export type CountryFeature = Feature<Polygon | MultiPolygon, { name: string }> & { id: string };

let featuresPromise: Promise<CountryFeature[]> | null = null;

/**
 * Natural Earth 1:110m boundaries (≈30 KB gzipped TopoJSON), fetched once and
 * shared by the globe and the 2D fallback. Countries join to the database via
 * their ISO 3166-1 numeric id.
 */
export function loadCountryFeatures(): Promise<CountryFeature[]> {
  featuresPromise ??= fetch("/geo/countries-110m.json")
    .then((res) => {
      if (!res.ok) throw new Error(`Failed to load country boundaries (${res.status})`);
      return res.json() as Promise<Topology<{ countries: GeometryCollection<{ name: string }> }>>;
    })
    .then((topology) => {
      const collection = feature(topology, topology.objects.countries) as FeatureCollection<
        Polygon | MultiPolygon,
        { name: string }
      >;
      return collection.features
        .filter((f): f is CountryFeature => typeof f.id === "string")
        .map((f) => ({ ...f, id: f.id as string }));
    })
    .catch((error: unknown) => {
      featuresPromise = null; // allow a retry
      throw error;
    });
  return featuresPromise;
}

export type StateFeature = Feature<Polygon | MultiPolygon, { name: string; kind: "state" }> & { id: string };

const stateCache = new Map<string, Promise<StateFeature[]>>();

/**
 * State/province boundaries for one country (Natural Earth 1:10m admin-1,
 * simplified per country by scripts/build-admin1.mjs). Loaded on selection.
 * Resolves to [] when a country has no admin-1 file.
 */
export function loadStateFeatures(code: string): Promise<StateFeature[]> {
  let promise = stateCache.get(code);
  if (!promise) {
    promise = fetch(`/geo/admin1/${encodeURIComponent(code)}.json`)
      .then((res) => (res.ok ? (res.json() as Promise<Topology>) : null))
      .then((topology) => {
        if (!topology) return [];
        const object = Object.values(topology.objects)[0];
        if (!object) return [];
        const collection = feature(topology, object) as FeatureCollection<Polygon | MultiPolygon, { name: string }>;
        return collection.features
          .filter((f) => f.geometry)
          .map((f, i) => ({ ...f, id: `state:${code}:${i}`, properties: { name: f.properties.name, kind: "state" as const } }));
      })
      .catch(() => {
        stateCache.delete(code); // allow a retry
        return [];
      });
    stateCache.set(code, promise);
  }
  return promise;
}

export function isStateFeature(f: CountryFeature | StateFeature): f is StateFeature {
  return (f.properties as { kind?: string }).kind === "state";
}
