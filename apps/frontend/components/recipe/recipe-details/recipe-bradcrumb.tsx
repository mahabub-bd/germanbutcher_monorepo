import {
  BreadcrumbBarItem,
  BreadcrumbBar,
} from "@/components/common/breadcrumb-bar";

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
  const items: BreadcrumbBarItem[] = [
    { label: "Recipes", href: "/recipes" },
  ];

  if (categoryName && categorySlug) {
    items.push({
      label: categoryName,
      href: `/recipes/category/${categorySlug}`,
    });
  }

  if (recipeName) {
    items.push({ label: recipeName });
  }

  return <BreadcrumbBar items={items} />;
}
