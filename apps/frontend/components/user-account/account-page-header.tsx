import type { ReactNode } from "react";

interface AccountPageHeaderProps {
  /** Page title, e.g. "My Orders". */
  title: string;
  /** Optional line under the title, e.g. "Order #1234". */
  subtitle?: ReactNode;
  /** Optional icon rendered in a soft badge before the title. */
  icon?: ReactNode;
  /** Optional element before the title, e.g. a back button. */
  leading?: ReactNode;
  /** Optional right-side element, e.g. an "Add New" button. */
  action?: ReactNode;
  className?: string;
}

/**
 * Shared page header for all user-account tab pages (Profile, Orders,
 * Addresses, Wishlist, ...). Keeps the title size/weight consistent
 * across tabs: text-2xl sm:text-3xl font-extrabold tracking-tight.
 */
export function AccountPageHeader({
  title,
  subtitle,
  icon,
  leading,
  action,
  className = "",
}: AccountPageHeaderProps) {
  return (
    <div
      className={`mb-6 flex items-center justify-between gap-4 sm:mb-8 ${className}`}
    >
      <div className="flex min-w-0 items-center gap-3">
        {leading}
        {icon && (
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-50 text-primaryColor dark:bg-red-950/40 dark:text-red-400">
            {icon}
          </span>
        )}
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-extrabold tracking-tight text-gray-900 sm:text-3xl dark:text-gray-50">
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export default AccountPageHeader;
