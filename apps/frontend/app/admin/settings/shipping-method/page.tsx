import { ShippingMethodList } from "@/components/admin/shipping-method/shipping-method-list";

export default async function ShippingMethodPage() {
  return (
    <div className="md:p-4 p-2 space-y-6 rounded-sm">
      <ShippingMethodList />
    </div>
  );
}
