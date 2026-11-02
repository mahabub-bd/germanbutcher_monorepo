import FAQPageComponent from "@/components/faqs/faqs-componet";
import { DeliveryPolicyTable } from "@/components/common/delivery-policy-table";

export default function FAQPage() {
  return (
    <>
      <FAQPageComponent />
      <div className="container mx-auto px-4 pb-12">
        <div className="mx-auto max-w-3xl">
          {/* Live delivery charges from shipping methods — same data as checkout */}
          <DeliveryPolicyTable />
        </div>
      </div>
    </>
  );
}
