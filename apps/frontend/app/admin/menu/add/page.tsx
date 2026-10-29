"use client";

import { FormPageHeader } from "@/components/admin/form-page-header";
import { MenuForm } from "@/components/admin/menu/menu-form";
import { AdminPageContainer } from "@/components/admin/admin-page-container";

export default function AddMenuPage() {
  return (
    <AdminPageContainer>
        <FormPageHeader
        title="Add New Menu Item"
        description="Create a new menu item. Fill in all the required information."
        backHref="/admin/menu/menu-list"
        backLabel="Back to Menu"
      />

      <MenuForm mode="create" />
    </AdminPageContainer>
  );
}
