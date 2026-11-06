import { getUser } from "@/actions/auth";
import { redirect } from "next/navigation";


export default async function UserAccountRedirectPage() {
  const user = await getUser();
  redirect(user ? `/user/${user.id}/orders` : "/auth/sign-in");
}
