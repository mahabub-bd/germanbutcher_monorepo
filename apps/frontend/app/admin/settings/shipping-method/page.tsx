import { ShippingMethodList } from "@/components/admin/shipping-method/shipping-method-list";

export default async function ShippingMethodPage() {
  return (
    <div className=" space-y-6 border rounded-sm">
      <ShippingMethodList />
    </div>
  );
}
