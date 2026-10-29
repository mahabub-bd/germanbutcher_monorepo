import { PaymentMethodList } from "@/components/admin/payment-method/payment-method-list";
import { AdminPageContainer } from "@/components/admin/admin-page-container";

export default async function ShippingMethodPage() {
  return (
    <AdminPageContainer>
      <PaymentMethodList />
    </AdminPageContainer>
  );
}
