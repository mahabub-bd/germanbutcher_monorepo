import { CouponUsageLogDetail } from "@/components/admin/coupon/coupon-usage-log-detail";

export default async function CouponUsageLogDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div className="space-y-6 border rounded-sm">
      <CouponUsageLogDetail logId={id} />
    </div>
  );
}
