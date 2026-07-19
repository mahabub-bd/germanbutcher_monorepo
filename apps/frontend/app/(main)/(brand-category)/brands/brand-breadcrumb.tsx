import {
  PageBreadcrumb,
  type BreadcrumbItem,
} from '@/components/ui/page-breadcrumb';
import { Building2 } from 'lucide-react';

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
  const breadcrumbItems: BreadcrumbItem[] = [
    {
      label: brandName,
      href: isActive ? undefined : `/brands/${brandSlug}`,
      icon: (
        <Building2 className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-primaryColor" />
      ),
      isActive,
    },
  ];

  return <PageBreadcrumb items={breadcrumbItems} />;
}
