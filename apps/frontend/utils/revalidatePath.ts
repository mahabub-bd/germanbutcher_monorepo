"use server";

import { revalidatePath, updateTag } from "next/cache";

export const serverRevalidate = async (
  paths: string | string[]
): Promise<void> => {
  // Accepts one path or a list so callers can invalidate several routes in a
  // single server-action round trip instead of one call per path.
  const list = Array.isArray(paths) ? paths : [paths];
  try {
    for (const path of list) {
      revalidatePath(path);
    }
  } catch (error) {
    console.error(`Error revalidating paths "${list.join('", "')}":`, error);
    throw new Error(`Failed to revalidate paths: ${list.join('", "')}`);
  }
};

export async function refreshDashboard() {
  // updateTag so the admin's next dashboard view reflects the order change
  // immediately (revalidateTag would serve stale data while regenerating).
  updateTag("dashboard");
}
