import { PaymentMethodList } from "@/components/admin/payment-method/payment-method-list";

export default async function ShippingMethodPage() {
  return (
    <div className="md:p-4 p-2 space-y-6 rounded-sm">
      <PaymentMethodList />
    </div>
  );
}
