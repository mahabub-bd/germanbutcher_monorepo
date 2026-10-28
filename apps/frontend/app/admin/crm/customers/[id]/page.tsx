import { CrmCustomerDetail } from "@/components/admin/crm/crm-customer-detail";

export const metadata = {
  title: "Customer 360",
  description: "Full customer view for CRM",
};

export default function CrmCustomerDetailPage() {
  return (
    <div className="md:p-4 p-2 space-y-6 rounded-sm">
      <CrmCustomerDetail />
    </div>
  );
}
