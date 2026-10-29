import { CrmDashboard } from "@/components/admin/crm/crm-dashboard";
import { AdminPageContainer } from "@/components/admin/admin-page-container";

export const metadata = {
  title: "CRM Dashboard",
  description: "Customer relationship overview",
};

export default function CrmPage() {
  return (
    <AdminPageContainer>
      <CrmDashboard />
    </AdminPageContainer>
  );
}
