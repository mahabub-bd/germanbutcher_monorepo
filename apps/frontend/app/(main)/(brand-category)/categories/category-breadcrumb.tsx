import { BreadcrumbBar } from '@/components/common/breadcrumb-bar';
import { formatSlugToTitle } from '@/lib/utils';

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

  return (
    <BreadcrumbBar
      items={[
        { label: 'Categories', href: '/categories' },
        {
          label: formattedName,
          href: isActive ? undefined : `/categories/${categorySlug}`,
        },
      ]}
    />
  );
}
