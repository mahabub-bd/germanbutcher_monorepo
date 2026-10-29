import { ActivityDetails } from "@/components/admin/reports/user-activity/activity-details";
import { AdminPageContainer } from "@/components/admin/admin-page-container";

export default async function ActivityDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;

  return (
    <AdminPageContainer>
      <ActivityDetails activityId={resolvedParams.id} />
    </AdminPageContainer>
  );
}