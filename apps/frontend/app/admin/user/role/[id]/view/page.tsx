import { AdminPageContainer } from "@/components/admin/admin-page-container";
import { RoleDetail } from "@/components/admin/role/role-detail";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Role Details | Admin Dashboard",
    description: "View role information and the accounts assigned to it",
};

export default function RoleDetailPage() {
    return (
        <AdminPageContainer>
            <RoleDetail />
        </AdminPageContainer>
    );
}
