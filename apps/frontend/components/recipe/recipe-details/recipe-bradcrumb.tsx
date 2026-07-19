import {
  BreadcrumbItem,
  PageBreadcrumb,
} from "@/components/ui/page-breadcrumb";
import { ChefHat, Tag } from "lucide-react";

// Recipe Breadcrumb Component
interface RecipeBreadcrumbProps {
  categoryName?: string;
  categorySlug?: string;
  recipeName?: string;
}

export function RecipeBreadcrumb({
  categoryName,
  categorySlug,
  recipeName,
}: RecipeBreadcrumbProps) {
  const breadcrumbItems: BreadcrumbItem[] = [
    {
      label: "Recipes",
      href: "/recipes",
      icon: <ChefHat className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-primaryColor" />,
      isActive: !categoryName && !recipeName,
    },
  ];

  if (categoryName && categorySlug) {
    breadcrumbItems.push({
      label: categoryName,
      href: `/recipes/category/${categorySlug}`,
      icon: <Tag className="h-2.5 w-2.5 sm:h-3 sm:w-3" />,
    });
  }

  if (recipeName) {
    breadcrumbItems.push({
      label: recipeName,
      isActive: true,
    });
  }

  return <PageBreadcrumb items={breadcrumbItems} />;
}
