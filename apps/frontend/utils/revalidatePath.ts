"use server";

import { revalidatePath, revalidateTag } from "next/cache";

// revalidateTag (not updateTag) — "dashboard" tags belong to fetch() Data
// Cache entries (next: { tags }), which updateTag does not reliably expire.

export const serverRevalidate = async (
  paths: string | string[]
): Promise<void> => {

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

  revalidateTag("dashboard", "max");
}
