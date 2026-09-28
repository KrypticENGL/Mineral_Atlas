"use client";

import { geoEqualEarth, geoGraticule10, geoPath } from "d3-geo";
import { use, useMemo } from "react";
import { useAtlas, useFiltered } from "@/components/atlas/AtlasProvider";
import { rgb } from "@/lib/atlas/palette";
import { useAtlasStore } from "@/lib/store/atlas-store";
import { cn } from "@/lib/utils";
import { useCountryInteractions, useCountryStyle, useSelectedStates } from "./CountryLayer";
import { loadCountryFeatures } from "./geo";

const WIDTH = 960;
const HEIGHT = 500;

/**
 * 2D fallback used when WebGL is unavailable. Same data, same colours and the
 * same interactions as the globe — an Equal Earth SVG map instead of a canvas.
 */
export default function FlatMapFallback() {
  const features = use(loadCountryFeatures());
  const { lookups } = useAtlas();
  const { result } = useFiltered();
  const { fill, supplierCount, selectedIso, colors } = useCountryStyle();
  const { onHover, onSelect } = useCountryInteractions();
  const selectedCode = useAtlasStore((s) => s.selectedCountry);
  const states = useSelectedStates(selectedCode);

  const { path, projection, graticule } = useMemo(() => {
    const projection = geoEqualEarth().fitExtent(
      [
        [8, 8],
        [WIDTH - 8, HEIGHT - 8],
      ],
      { type: "Sphere" },
    );
    return { projection, path: geoPath(projection), graticule: geoPath(projection)(geoGraticule10()) ?? "" };
  }, []);

  const shapes = useMemo(
    () => features.map((f) => ({ feature: f, d: path(f) ?? "" })),
    [features, path],
  );

  const dots = useMemo(
    () =>
      lookups.index.suppliers
        .filter((s) => result.supplierIds.has(s.id))
        .map((s) => {
          const [x, y] = projection([s.lng, s.lat]) ?? [0, 0];
          return { id: s.id, x, y, countryId: s.countryId };
        }),
    [lookups, result, projection],
  );
  const selectedId = selectedCode ? lookups.countryByCode.get(selectedCode)?.id : undefined;

  return (
    <div
      className={cn(
        "absolute inset-0 flex items-center justify-center px-4 pt-24 pb-20 transition-[padding] duration-700 ease-atlas lg:px-8",
        selectedCode ? "max-lg:pb-[58vh] lg:pr-[480px]" : "lg:pl-[380px]",
      )}
    >
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="h-auto max-h-full w-full max-w-6xl"
        role="img"
        aria-label="World map of mineral suppliers"
      >
        <path d={path({ type: "Sphere" }) ?? ""} fill={colors.ocean} stroke={rgb(colors.ink, 0.15)} />
        <path d={graticule} fill="none" stroke={rgb(colors.ink, 0.05)} />
        <g onMouseLeave={() => onHover(null)}>
          {shapes.map(({ feature, d }) => {
            const interactive = supplierCount(feature.id) > 0;
            return (
              <path
                key={feature.id}
                d={d}
                fill={fill(feature.id)}
                stroke={feature.id === selectedIso ? colors.selectedStroke : colors.landStroke}
                strokeWidth={feature.id === selectedIso ? 1 : 0.5}
                className={interactive ? "cursor-pointer transition-[fill] duration-300" : undefined}
                onMouseEnter={() => onHover(feature)}
                onClick={() => onSelect(feature)}
              >
                <title>{feature.properties.name}</title>
              </path>
            );
          })}
        </g>
        {states && (
          <g pointerEvents="none" fill="none" stroke={colors.stateStroke} strokeWidth={0.4}>
            {states.map((state) => (
              <path key={state.id} d={path(state) ?? ""} />
            ))}
          </g>
        )}
        <g pointerEvents="none">
          {dots.map((dot) => (
            <circle
              key={dot.id}
              cx={dot.x}
              cy={dot.y}
              r={dot.countryId === selectedId ? 2.6 : 1.8}
              fill={dot.countryId === selectedId ? colors.pointOnSelected : colors.point}
            />
          ))}
        </g>
      </svg>
    </div>
  );
}
