import { AdminPageContainer } from "@/components/admin/admin-page-container";
import { DashboardSkeleton } from "@/components/admin/dashboard/dashboard-skeleton";

// Route-level skeleton: mirrors the dashboard's KPI grid, charts and list
// sections so the shell paints instantly and nothing shifts when data lands.
export default function DashboardLoading() {
  return (
    <AdminPageContainer className="md:p-4 p-2 space-y-6 rounded-sm flex flex-col gap-4">
      <DashboardSkeleton />
    </AdminPageContainer>
  );
}
