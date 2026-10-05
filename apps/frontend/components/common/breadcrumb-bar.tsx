import { Home } from "lucide-react";
import Link from "next/link";
import { Fragment } from "react";

export interface BreadcrumbBarItem {
  label: string;
  /** When absent the crumb renders as the current page (no link). */
  href?: string;
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

function CrumbSeparator() {
  return (
    <span className="shrink-0 text-gray-300" aria-hidden>
      /
    </span>
  );
}

/**
 * Storefront breadcrumb bar — same design as the product details page:
 * frosted-white bar, Home icon, "/" separators, gray links with an
 * animated underline on hover, current page in primaryColor. The last item
 * without an `href` renders as the current page; give every item an `href`
 * to render a plain link trail.
 */
export function BreadcrumbBar({ items }: { items: BreadcrumbBarItem[] }) {
  return (
    <div className="w-full min-w-0 border-b border-gray-200/70 bg-white/90 backdrop-blur">
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

        {items.map((item, index) => (
          <Fragment key={`${item.label}-${index}`}>
            <CrumbSeparator />
            {item.href ? (
              <CrumbLink href={item.href}>
                <span className="whitespace-nowrap">{item.label}</span>
              </CrumbLink>
            ) : (
              <span
                aria-current="page"
                className="truncate whitespace-nowrap font-medium text-primaryColor"
              >
                {item.label}
              </span>
            )}
          </Fragment>
        ))}
      </nav>
    </div>
  );
}
