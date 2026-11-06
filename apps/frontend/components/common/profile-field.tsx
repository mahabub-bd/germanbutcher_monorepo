"use client";

import type { LucideIcon } from "lucide-react";
import Link from "next/link";

/**
 * One labelled field in an admin detail profile strip: icon badge, label
 * (only the first letter capitalised) and value at the same font size on a
 * single line, so long values truncate instead of wrapping. Shared by the
 * user and customer detail pages.
 */
export function ProfileField({
    icon: Icon,
    label,
    value,
    href,
    capitalize,
}: {
    icon: LucideIcon;
    label: string;
    value: string;
    href?: string;
    capitalize?: boolean;
}) {
    const textClass = `min-w-0 truncate text-sm font-medium ${capitalize ? "capitalize" : ""}`;

    return (
        <div className="flex min-w-0 items-center gap-2 rounded-lg border bg-muted/30 px-2.5 py-2">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-md border bg-background text-muted-foreground">
                <Icon className="size-3.5" />
            </span>
            <span className="shrink-0 text-sm font-semibold tracking-wide text-muted-foreground first-letter:uppercase">
                {label}:
            </span>
            {href ? (
                <Link
                    href={href}
                    title={value}
                    className={`${textClass} text-blue-600 hover:underline dark:text-blue-400`}
                >
                    {value}
                </Link>
            ) : (
                <span title={value} className={textClass}>
                    {value}
                </span>
            )}
        </div>
    );
}
