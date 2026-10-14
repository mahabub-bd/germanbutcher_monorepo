"use server";

import { updateTag } from "next/cache";


export async function revalidateProducts(): Promise<void> {
  updateTag("products");
}

export async function revalidatePublic(): Promise<void> {
  updateTag("public");
}
