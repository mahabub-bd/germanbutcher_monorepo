import type { Product } from "@/utils/types";
import { Home } from "lucide-react";
import Link from "next/link";

interface ProductBreadcrumbProps {
  product: Product;
}

function CrumbLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="relative text-gray-500 transition-colors hover:text-primaryColor after:absolute after:-bottom-0.5 after:left-0 after:h-px after:w-0 after:bg-primaryColor after:transition-all after:duration-300 hover:after:w-full"
    >
      {children}
    </Link>
  );
}

export function ProductBreadcrumb({ product }: ProductBreadcrumbProps) {
  const brand = product.brand;

  return (
    <div className="border-b border-gray-200/70 bg-white/90 backdrop-blur">
      <div className="container mx-auto md:px-0 px-2">
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-2 overflow-x-auto py-2.5 text-xs sm:text-sm"
        >
          <Link
            href="/"
            aria-label="Home"
            className="flex shrink-0 items-center text-gray-500 transition-colors hover:text-primaryColor"
          >
            <Home className="size-4" />
          </Link>

          <span className="shrink-0 text-gray-300" aria-hidden>
            /
          </span>

          <CrumbLink href={`/categories/${product.category.slug}`}>
            <span className="whitespace-nowrap">{product.category.name}</span>
          </CrumbLink>

          {brand?.slug && (
            <>
              <span className="shrink-0 text-gray-300" aria-hidden>
                /
              </span>
              <CrumbLink href={`/brands/${brand.slug}`}>
                <span className="whitespace-nowrap">{brand.name}</span>
              </CrumbLink>
            </>
          )}

          <span className="shrink-0 text-gray-300" aria-hidden>
            /
          </span>

          <span
            aria-current="page"
            className="truncate whitespace-nowrap font-medium text-primaryColor"
          >
            {product.name}
          </span>
        </nav>
      </div>
    </div>
  );
}
