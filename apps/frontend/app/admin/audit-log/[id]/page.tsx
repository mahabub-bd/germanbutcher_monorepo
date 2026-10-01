import { ActivityDetails } from "@/components/admin/reports/user-activity/activity-details";

export default async function ActivityDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;

  return (
    <div className="border rounded-sm">
      <ActivityDetails activityId={resolvedParams.id} />
    </div>
  );
}