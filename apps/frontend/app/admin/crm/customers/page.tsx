import { CrmCustomerList } from "@/components/admin/crm/crm-customer-list";

export const metadata = {
  title: "CRM Customers",
  description: "Customer segments and RFM overview",
};

export default async function CrmCustomersPage({
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
      <CrmCustomerList
        initialPage={page}
        initialLimit={limit}
        initialSearchParams={resolvedParams}
      />
    </div>
  );
}
