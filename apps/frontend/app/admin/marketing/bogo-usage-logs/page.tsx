import { BogoUsageLogList } from "@/components/admin/bogo/bogo-usage-log-list";
import { AdminPageContainer } from "@/components/admin/admin-page-container";

export default function BogoUsageLogsPage() {
  return (
    <AdminPageContainer>
      <BogoUsageLogList />
    </AdminPageContainer>
  );
}
