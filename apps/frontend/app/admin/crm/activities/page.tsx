import { AdminPageContainer } from "@/components/admin/admin-page-container";
import { CrmActivityList } from "@/components/admin/crm/crm-activity-list";

export const metadata = {
  title: "CRM Activities",
  description: "Notes, tasks, calls and emails across all customers",
};

export default function CrmActivitiesPage() {
  return (
    <AdminPageContainer>
      <CrmActivityList />
    </AdminPageContainer>
  );
}
