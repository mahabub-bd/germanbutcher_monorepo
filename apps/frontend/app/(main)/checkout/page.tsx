import { getUser } from "@/actions/auth";
import CheckoutSection from "@/components/checkout/checkoutSection";

export default async function CheckoutPage() {
  const user = await getUser();
  return <CheckoutSection user={user} />;
}
