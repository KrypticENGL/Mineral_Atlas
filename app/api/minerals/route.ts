import { handle, ok } from "@/lib/api/http";
import { listMinerals } from "@/lib/services/mineral-service";

/** GET /api/minerals */
export function GET() {
  return handle(async () => ok(await listMinerals()));
}
