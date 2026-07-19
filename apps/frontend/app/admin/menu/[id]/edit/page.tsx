"use client";

import { LoadingIndicator } from "@/components/admin/loading-indicator";
import { MenuForm } from "@/components/admin/menu/menu-form";
import { Button } from "@/components/ui/button";
import { CardDescription, CardTitle } from "@/components/ui/card";
import { fetchData } from "@/utils/api-utils";
import type { MenuItem } from "@/utils/types";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

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
    <div className="md:p-6 p:2 space-y-6 border rouunded-sm">
      <div className="md:p-6 p:2">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Edit Menu Item</CardTitle>
            <CardDescription>Update the menu item information.</CardDescription>
          </div>
          <Button asChild variant="outline">
            <Link href="/admin/menu/menu-list">Back to Menu</Link>
          </Button>
        </div>
      </div>

      <MenuForm mode="edit" menuItem={menuItem} />
    </div>
  );
}
