import { CrmCampaignList } from "@/components/admin/crm/crm-campaign-list";

export const metadata = {
  title: "CRM Campaigns",
  description: "SMS and email blasts to customer segments",
};

export default function CrmCampaignsPage() {
  return (
    <div className="md:p-4 p-2 space-y-6 rounded-sm">
      <CrmCampaignList />
    </div>
  );
}
