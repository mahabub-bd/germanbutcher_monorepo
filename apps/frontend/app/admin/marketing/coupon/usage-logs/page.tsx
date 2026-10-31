import { AdminPageContainer } from "@/components/admin/admin-page-container";
import {
  parseListSearchParams,
  type ListPageProps,
} from "@/utils/admin-search-params";
import { CouponUsageLogList } from "@/components/admin/coupon/coupon-usage-log-list";

export default async function AllCouponUsageLogsPage({
  searchParams,
}: ListPageProps) {
  const { page, limit, searchParams: params } =
    await parseListSearchParams(searchParams);
  return (
    <AdminPageContainer>
      <CouponUsageLogList
        initialPage={page}
        initialLimit={limit}
        initialSearchParams={params}
      />
    </AdminPageContainer>
  );
}
