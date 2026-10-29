import { CouponUsageLogDetail } from "@/components/admin/coupon/coupon-usage-log-detail";
import { AdminPageContainer } from "@/components/admin/admin-page-container";

export default async function CouponUsageLogDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <AdminPageContainer>
      <CouponUsageLogDetail logId={id} />
    </AdminPageContainer>
  );
}
