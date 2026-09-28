import { geoArea, geoCentroid, geoDistance } from "d3-geo";
import type { MultiPolygon, Position } from "geojson";
import type { CountryFeature } from "./geo";

/** globe.gl's perspective camera uses a 50° vertical field of view. */
const HALF_FOV = (25 * Math.PI) / 180;
/** Polygons smaller than this share of the largest are ignored (Alaska, Svalbard, far islands). */
const MIN_SHARE = 0.25;
const MIN_ALTITUDE = 0.06;
const MAX_ALTITUDE = 2.4;

export interface Viewport {
  /** Canvas height in px (the camera's vertical field of view spans it). */
  height: number;
  /** Size of the unobstructed area the country should fill, centred on the canvas. */
  freeWidth: number;
  freeHeight: number;
}

/**
 * Camera view that frames a country's main landmass inside the free viewport:
 * centred on its centroid, with the altitude at which its furthest point sits
 * just inside the tighter of the free width/height.
 */
export function fitCountryView(feature: CountryFeature, viewport: Viewport) {
  const polygons: Position[][][] =
    feature.geometry.type === "Polygon" ? [feature.geometry.coordinates] : feature.geometry.coordinates;
  const areas = polygons.map((coordinates) => {
    const a = geoArea({ type: "Polygon", coordinates });
    return Math.min(a, 4 * Math.PI - a); // tolerate reversed winding
  });
  const largest = Math.max(...areas);
  const main: MultiPolygon = {
    type: "MultiPolygon",
    coordinates: polygons.filter((_, i) => areas[i] >= largest * MIN_SHARE),
  };

  const [lng, lat] = geoCentroid(main);
  let theta = 0;
  for (const polygon of main.coordinates) {
    for (const point of polygon[0]) theta = Math.max(theta, geoDistance([lng, lat], point as [number, number]));
  }

  // Pixel offset from centre → angle off the camera axis: tan φ = offset / (h/2) · tan(fov/2).
  const halfSpan = Math.min(viewport.freeWidth, viewport.freeHeight) / 2;
  const tanPhi = (halfSpan / (viewport.height / 2)) * Math.tan(HALF_FOV);
  // A point θ from the view centre on a unit sphere, seen from distance 1 + altitude.
  const altitude = Math.sin(theta) / tanPhi + Math.cos(theta) - 1;

  return { lat, lng, altitude: Math.min(MAX_ALTITUDE, Math.max(MIN_ALTITUDE, altitude)) };
}
