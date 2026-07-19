import {
  PageBreadcrumb,
  type BreadcrumbItem,
} from '@/components/ui/page-breadcrumb';
import { formatSlugToTitle } from '@/lib/utils';
import { Grid3X3, Tag } from 'lucide-react';

interface CategoryBreadcrumbProps {
  categoryName: string;
  categorySlug?: string;
  isActive?: boolean;
}

export function CategoryBreadcrumb({
  categoryName,
  categorySlug,
  isActive = true,
}: CategoryBreadcrumbProps) {

  const formattedName = formatSlugToTitle(categoryName);

  const breadcrumbItems: BreadcrumbItem[] = [
    {
      label: 'Categories',
      href: '/categories',
      icon: <Grid3X3 className="h-2.5 w-2.5 sm:h-3 sm:w-3" />,
    },
    {
      label: formattedName,
      href: isActive ? undefined : `/categories/${categorySlug}`,
      icon: <Tag className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-primaryColor" />,
      isActive,
    },
  ];

  return <PageBreadcrumb items={breadcrumbItems} />;
}
