import { CouponUsageLogDetail } from "@/components/admin/coupon/coupon-usage-log-detail";

export default async function CouponUsageLogDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div className="md:p-4 p-2 space-y-6 rounded-sm">
      <CouponUsageLogDetail logId={id} />
    </div>
  );
}
