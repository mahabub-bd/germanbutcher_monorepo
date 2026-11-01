import { AdminPageContainer } from "@/components/admin/admin-page-container";
import { AbandonedCartDetail } from "@/components/admin/reports/abandoned-cart-detail";

export const dynamic = "force-dynamic";

export default function AbandonedCartDetailPage() {
  return (
    <AdminPageContainer>
      <AbandonedCartDetail />
    </AdminPageContainer>
  );
}
