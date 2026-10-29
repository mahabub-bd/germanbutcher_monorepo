import { CouponUsageLogList } from "@/components/admin/coupon/coupon-usage-log-list";
import { AdminPageContainer } from "@/components/admin/admin-page-container";

export default function AllCouponUsageLogsPage() {
  return (
    <AdminPageContainer>
      <CouponUsageLogList />
    </AdminPageContainer>
  );
}
