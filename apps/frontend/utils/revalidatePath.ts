"use server";

import { revalidatePath, updateTag } from "next/cache";

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

  updateTag("dashboard");
}
