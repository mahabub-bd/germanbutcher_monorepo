import { BreadcrumbBar } from '@/components/common/breadcrumb-bar';

interface BrandBreadcrumbProps {
  brandName: string;
  brandSlug?: string;
  isActive?: boolean;
}

export function BrandBreadcrumb({
  brandName,
  brandSlug,
  isActive = true,
}: BrandBreadcrumbProps) {
  return (
    <BreadcrumbBar
      items={[
        { label: 'Brands', href: '/brands' },
        {
          label: brandName,
          href: isActive ? undefined : `/brands/${brandSlug}`,
        },
      ]}
    />
  );
}
