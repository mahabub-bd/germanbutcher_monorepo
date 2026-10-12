import { fetchPublicData } from "@/utils/api-utils";
import type { BusinessSettings } from "@/utils/types";

export async function getBusinessSettings(): Promise<BusinessSettings | null> {
  return fetchPublicData<BusinessSettings>("business-settings").catch(
    () => null
  );
}
