import { getUser } from "@/actions/auth";
import { redirect } from "next/navigation";

// The account overview (dashboard) page was removed — the account root now
// lands on Orders. Resolves the real user from the session cookie so legacy
// links like /user/dashboard also end up in the right place.
export default async function UserAccountRedirectPage() {
  const user = await getUser();
  redirect(user ? `/user/${user.id}/orders` : "/auth/sign-in");
}
