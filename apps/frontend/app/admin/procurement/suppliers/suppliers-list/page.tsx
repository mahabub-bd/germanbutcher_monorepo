import { SupplierList } from "@/components/admin/procurement/suppliers/supplier-list";

export default async function SuppliersPage({
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
    <div className="md:p-4 p-2 space-y-6 rounded-sm">
      <SupplierList
        initialPage={page}
        initialLimit={limit}
        initialSearchParams={resolvedParams}
      />
    </div>
  );
}
