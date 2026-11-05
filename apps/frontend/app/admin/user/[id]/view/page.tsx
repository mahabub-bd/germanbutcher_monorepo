import { UserDetail } from "@/components/admin/user/user-detail";
import type { Metadata } from "next";
import { AdminPageContainer } from "@/components/admin/admin-page-container";

export const metadata: Metadata = {
  title: "User Details | Admin Dashboard",
  description: "View detailed information about a user",
};

export default function UserDetailPage() {
  return (
    <AdminPageContainer>
      <UserDetail />
    </AdminPageContainer>
  );
}
