"use server";

import { revalidateTag } from "next/cache";

// revalidateTag (not updateTag) — these tags belong to fetch() Data Cache
// entries (next: { tags }), which updateTag does not reliably expire.

export async function revalidateProducts(): Promise<void> {
  revalidateTag("products", "max");
}

export async function revalidatePublic(): Promise<void> {
  revalidateTag("public", "max");
}
