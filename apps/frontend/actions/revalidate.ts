"use server";

import { updateTag } from "next/cache";


export async function revalidateProducts(): Promise<void> {

  // updateTag (not revalidateTag) so the admin sees their own change on the
  // very next render — revalidateTag has stale-while-revalidate semantics
  // and could serve the pre-edit data.
  updateTag("products");
}

export async function revalidatePublic(): Promise<void> {
  // Busts the 60s cache on public homepage content (banners, categories,
  // brands, recipes…) after admin content edits.
  updateTag("public");
}
