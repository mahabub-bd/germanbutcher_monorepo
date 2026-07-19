import { LoadingIndicator } from "@/components/admin/loading-indicator";
import { HeadingPrimary } from "@/components/common/heading-primary";
import {
  ApiResponse,
  WhereToBuyClient,
} from "@/components/where-to-buy-page/where-to-buy-section";
import { fetchDataPagination } from "@/utils/api-utils";
import { Suspense } from "react";

interface SearchParams {
  page?: string | string[];
  total?: string | string[];
  shopName?: string | string[];
  division?: string | string[];
  district?: string | string[];
  search?: string | string[];
}

interface Props {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

async function fetchSalesPoints(searchParams: SearchParams) {
  const params = new URLSearchParams();

  const getStringValue = (value: string | string[] | undefined): string => {
    if (Array.isArray(value)) {
      return value[0] || "";
    }
    return value || "";
  };

  params.set("page", getStringValue(searchParams.page) || "1");
  params.set("limit", "10");

  const shopName = getStringValue(searchParams.shopName);
  if (shopName) params.set("shopName", shopName);

  const division = getStringValue(searchParams.division);
  if (division) params.set("division", division);

  const district = getStringValue(searchParams.district);
  if (district) params.set("district", district);

  const search = getStringValue(searchParams.search);
  if (search) params.set("search", search);

  try {
    const response = await fetchDataPagination(`sales-points?${params}`);
    return response as ApiResponse;
  } catch (error) {
    console.error("Error fetching sales points:", error);

    return {
      data: [],
      total: 0,
      page: 1,
      limit: 10,
      message: "Error fetching sales points",
      statusCode: 500,
      totalPages: 0,
    } as ApiResponse;
  }
}

export default async function WhereToBuyPage({ searchParams }: Props) {
  const resolvedParams = await searchParams;

  const page =
    typeof resolvedParams.page === "string"
      ? Number.parseInt(resolvedParams.page)
      : 1;

  const shopName =
    typeof resolvedParams.shopName === "string"
      ? resolvedParams.shopName
      : undefined;

  const division =
    typeof resolvedParams.division === "string"
      ? resolvedParams.division
      : undefined;

  const district =
    typeof resolvedParams.district === "string"
      ? resolvedParams.district
      : undefined;

  const search =
    typeof resolvedParams.search === "string"
      ? resolvedParams.search
      : undefined;

  const normalizedSearchParams: SearchParams = {
    page: page.toString(),
    ...(shopName && { shopName }),
    ...(division && { division }),
    ...(district && { district }),
    ...(search && { search }),
  };

  const data = await fetchSalesPoints(normalizedSearchParams);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-primaryColor/10">
      <div className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="text-center mb-12">
          <HeadingPrimary
            title="Where to Buy"
            subtitle="Find our authentic German products at these locations across Bangladesh"
          />
        </div>

        <Suspense
          fallback={<LoadingIndicator message="Loading Sales Points" />}
        >
          <WhereToBuyClient initialData={data} searchParams={resolvedParams} />
        </Suspense>
      </div>
    </div>
  );
}
