import { AdminPageContainer } from "@/components/admin/admin-page-container";
import {
  parseListSearchParams,
  type ListPageProps,
} from "@/utils/admin-search-params";
import { CrmCustomerList } from "@/components/admin/crm/crm-customer-list";

export const metadata = {
  title: "CRM Customers",
  description: "Customer segments and RFM overview",
};

export default async function CrmCustomerPage({ searchParams }: ListPageProps) {
  const { page, limit, searchParams: params } = await parseListSearchParams(searchParams);
  return (
    <AdminPageContainer>
      <CrmCustomerList
        initialPage={page}
        initialLimit={limit}
        initialSearchParams={params}
      />
    </AdminPageContainer>
  );
}
