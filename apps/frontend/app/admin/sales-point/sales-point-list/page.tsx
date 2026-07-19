import { SalesPointList } from "@/components/admin/sales-point/sales-point-list";

export default async function SalesPointsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedParams = await searchParams;
  const page =
    typeof resolvedParams.page === "string"
      ? Number.parseInt(resolvedParams.page)
      : 1;
  const limit =
    typeof resolvedParams.limit === "string"
      ? Number.parseInt(resolvedParams.limit)
      : 10;

  return (
    <div className=" space-y-6 border rounded-sm">
      <SalesPointList
        initialPage={page}
        initialLimit={limit}
        initialSearchParams={resolvedParams}
      />
    </div>
  );
}
