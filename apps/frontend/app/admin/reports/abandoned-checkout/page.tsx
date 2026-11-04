export const dynamic = "force-dynamic";

import { AdminPageContainer } from "@/components/admin/admin-page-container";
import AbandonedCheckoutList from "@/components/admin/reports/abandoned-checkout/abandoned-checkout-list";
import { fetchProtectedData } from "@/utils/api-utils";

interface ResolvedSearchParams {
  [key: string]: string | string[] | undefined;
}

interface Props {
  searchParams: Promise<ResolvedSearchParams>;
}

export default async function AbandonedCheckoutReportPage({
  searchParams,
}: Props) {
  const resolvedParams = await searchParams;

  const pageParam =
    typeof resolvedParams.page === "string" ? resolvedParams.page : undefined;
  const search =
    typeof resolvedParams.search === "string" ? resolvedParams.search : undefined;
  const page = Math.max(1, Number(pageParam) || 1);
  const limit = 10;

  let reportData: {
    summary: {
      abandonedCarts: number;
      abandonedValue: number;
    };
    items: {
      cartId: number;
      userName: string | null;
      mobileNumber: string | null;
      itemCount: number;
      value: number;
      updatedAt: string;
    }[];
    total: number;
  } | null = null;

  try {
    const queryParams = new URLSearchParams();
    queryParams.append("page", String(page));
    queryParams.append("limit", String(limit));
    if (search) queryParams.append("search", search);

    const endpoint = `cart/reports/abandoned?${queryParams.toString()}`;

    reportData = await fetchProtectedData(endpoint);
  } catch (error) {
    console.error("Failed to fetch abandoned checkout report:", error);
  }

  const total = reportData?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <AdminPageContainer>
      <AbandonedCheckoutList
        page={page}
        search={search}
        total={total}
        totalPages={totalPages}
        summary={reportData?.summary ?? null}
        items={reportData?.items ?? []}
      />
    </AdminPageContainer>
  );
}
