import { ActivityDetails } from "@/components/admin/reports/user-activity/activity-details";

export default async function ActivityDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;

  return (
    <div className="md:p-4 p-2 space-y-6 rounded-sm">
      <ActivityDetails activityId={resolvedParams.id} />
    </div>
  );
}