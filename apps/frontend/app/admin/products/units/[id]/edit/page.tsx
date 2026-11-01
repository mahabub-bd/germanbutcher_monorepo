import { redirect } from "next/navigation";

// Units are now edited from an inline modal on the units list, so the old
// standalone edit route simply forwards to that page.
export default function EditUnitPage() {
  redirect("/admin/products/units");
}
