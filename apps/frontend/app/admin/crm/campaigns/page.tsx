import { CrmCampaignList } from "@/components/admin/crm/crm-campaign-list";
import { AdminPageContainer } from "@/components/admin/admin-page-container";

export const metadata = {
  title: "CRM Campaigns",
  description: "SMS and email blasts to customer segments",
};

export default function CrmCampaignsPage() {
  return (
    <AdminPageContainer>
      <CrmCampaignList />
    </AdminPageContainer>
  );
}
