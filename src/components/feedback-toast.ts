import { toast } from "sonner";
import type { ActionResult } from "@/lib/types";

export function showResult(result: ActionResult) {
  if (result.ok) toast.success(result.message);
  else if (result.tone === "warning") toast.warning(result.message);
  else toast.error(result.message);
}
