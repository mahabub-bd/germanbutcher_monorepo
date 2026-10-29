import { CrmCustomerDetail } from "@/components/admin/crm/crm-customer-detail";
import { AdminPageContainer } from "@/components/admin/admin-page-container";

export const metadata = {
  title: "Customer 360",
  description: "Full customer view for CRM",
};

export default function CrmCustomerDetailPage() {
  return (
    <AdminPageContainer>
      <CrmCustomerDetail />
    </AdminPageContainer>
  );
}
