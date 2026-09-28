import { fetchPublicData } from "@/utils/api-utils";
import type { BusinessSettings } from "@/utils/types";

/** Server-side helper: fetch the public business settings (60s ISR).
 * Returns null when the API is unreachable — there are no hardcoded
 * fallbacks, consumers render only what is configured. */
export async function getBusinessSettings(): Promise<BusinessSettings | null> {
  return fetchPublicData<BusinessSettings>("business-settings").catch(
    () => null
  );
}
