import { CrmDashboard } from "@/components/admin/crm/crm-dashboard";

export const metadata = {
  title: "CRM Dashboard",
  description: "Customer relationship overview",
};

export default function CrmPage() {
  return (
    <div className="md:p-4 p-2 space-y-6 rounded-sm">
      <CrmDashboard />
    </div>
  );
}
