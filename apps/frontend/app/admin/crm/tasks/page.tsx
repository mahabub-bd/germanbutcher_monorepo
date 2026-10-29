import { AdminPageContainer } from "@/components/admin/admin-page-container";
import { CrmTaskList } from "@/components/admin/crm/crm-task-list";
import {
  parseListSearchParams,
  parseStringParam,
  type ListPageProps,
} from "@/utils/admin-search-params";

export const metadata = {
  title: "CRM Tasks",
  description: "Follow-up tasks across all customers",
};

export default async function CrmTasksPage({ searchParams }: ListPageProps) {
  const { searchParams: params } = await parseListSearchParams(searchParams);
  const status = parseStringParam(params.status, "open") ?? "open";
  return (
    <AdminPageContainer>
      <CrmTaskList
        initialStatus={status}
        initialOverdue={params.overdue === "true"}
      />
    </AdminPageContainer>
  );
}
