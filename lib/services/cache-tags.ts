/** Cache tags shared by cached reads (services) and invalidating writes (admin). */
export const CacheTags = {
  catalog: "catalog",
  country: (code: string) => `country:${code.toUpperCase()}`,
  supplier: (id: string) => `supplier:${id}`,
  mineral: (key: string) => `mineral:${key}`,
} as const;
