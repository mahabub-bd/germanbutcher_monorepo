import { CouponUsageLogDetail } from "@/components/admin/coupon/coupon-usage-log-detail";

export default function CouponUsageLogDetailPage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <div className="space-y-6 border rounded-sm">
      <CouponUsageLogDetail logId={params.id} />
    </div>
  );
}
