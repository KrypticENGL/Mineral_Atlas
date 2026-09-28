import { handle, ok } from "@/lib/api/http";
import { listCountries } from "@/lib/services/country-service";

/** GET /api/countries */
export function GET() {
  return handle(async () => ok(await listCountries()));
}
