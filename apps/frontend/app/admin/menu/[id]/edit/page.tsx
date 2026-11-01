"use client";

import { LoadingIndicator } from "@/components/admin/loading-indicator";
import { MenuForm } from "@/components/admin/menu/menu-form";
import { FormPageHeader } from "@/components/admin/form-page-header";
import { fetchData } from "@/utils/api-utils";
import type { MenuItem } from "@/utils/types";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AdminPageContainer } from "@/components/admin/admin-page-container";

export default function EditMenuPage() {
  const params = useParams();
  const menuId = params.id as string;

  const [menuItem, setMenuItem] = useState<MenuItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMenuItem = async () => {
    try {
      const response = await fetchData<MenuItem>(`menu/${menuId}`);
      setMenuItem(response);
    } catch (error) {
      console.error("Error fetching menu item:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMenuItem();
  }, [menuId]);

  if (isLoading) {
    return <LoadingIndicator message="Loading Menu" />;
  }

  if (!menuItem) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Menu item not found</p>
      </div>
    );
  }

  return (
    <AdminPageContainer>
      <FormPageHeader
        title="Edit menu item"
        description="Update this menu item's label, destination and placement."
        backHref="/admin/menu/menu-list"
        backLabel="Back to Menu"
      />

      <MenuForm mode="edit" menuItem={menuItem} />
    </AdminPageContainer>
  );
}
