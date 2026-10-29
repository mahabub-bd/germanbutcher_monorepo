import { ShippingMethodList } from "@/components/admin/shipping-method/shipping-method-list";
import { AdminPageContainer } from "@/components/admin/admin-page-container";

export default async function ShippingMethodPage() {
  return (
    <AdminPageContainer>
      <ShippingMethodList />
    </AdminPageContainer>
  );
}
