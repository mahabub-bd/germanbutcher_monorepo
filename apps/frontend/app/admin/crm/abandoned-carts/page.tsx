import { AbandonedCarts } from "@/components/admin/crm/abandoned-carts";

export const metadata = {
  title: "Abandoned Carts",
  description: "Carts left with items and no recent activity",
};

export default async function AbandonedCartsPage({
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
      <AbandonedCarts
        initialPage={page}
        initialLimit={limit}
        initialSearchParams={resolvedParams}
      />
    </div>
  );
}
