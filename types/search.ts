export type SearchResultKind = "mineral" | "country" | "supplier" | "city";

export interface SearchResult {
  kind: SearchResultKind;
  id: string;
  label: string;
  sublabel: string;
  countryCode: string | null;
  supplierId?: string;
  mineralId?: string;
  lat?: number;
  lng?: number;
}
