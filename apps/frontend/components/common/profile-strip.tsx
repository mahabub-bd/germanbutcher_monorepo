"use client";

import { PillBadge } from "@/components/common/pill-badge";
import { ProfileField } from "@/components/common/profile-field";
import { getRoleIcon, getRoleTone } from "@/components/common/role-badge-helpers";
import type { LucideIcon } from "lucide-react";
import { BadgeCheck } from "lucide-react";
import Image from "next/image";
import type { ReactNode } from "react";

export interface ProfileStripField {
    icon: LucideIcon;
    label: string;
    value: string;
    href?: string;
    capitalize?: boolean;
}

interface ProfileStripProps {
    name: string;
    avatarUrl?: string | null;
    /** Role pill colour/icon come from the shared role badge helpers. */
    rolename?: string;
    verified?: boolean;
    /** Extra pills rendered after the role/verified pills, e.g. a CRM segment. */
    badges?: ReactNode;
    fields: ProfileStripField[];
}


export function ProfileStrip({
    name,
    avatarUrl,
    rolename,
    verified,
    badges,
    fields,
}: ProfileStripProps) {
    return (
        <div className="space-y-4">
            <div className="flex items-center gap-3">
                {avatarUrl ? (
                    <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full border bg-muted">
                        <Image
                            src={avatarUrl}
                            alt={name}
                            fill
                            className="object-cover"
                        />
                    </span>
                ) : (
                    <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border bg-muted text-xl font-semibold uppercase text-muted-foreground">
                        {name?.charAt(0) || "?"}
                    </span>
                )}
                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-lg font-semibold capitalize">{name}</h2>
                        {rolename && (
                            <PillBadge
                                tone={getRoleTone(rolename)}
                                className="gap-1 capitalize"
                            >
                                {getRoleIcon(rolename)}
                                {rolename}
                            </PillBadge>
                        )}
                        {verified && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2.5 py-0.75 text-[11px] font-semibold leading-none whitespace-nowrap text-white shadow-sm dark:bg-emerald-500 dark:text-emerald-950">
                                <BadgeCheck className="h-3 w-3" />
                                Verified
                            </span>
                        )}
                        {badges}
                    </div>
                </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                {fields.map((field) => (
                    <ProfileField key={field.label} {...field} />
                ))}
            </div>
        </div>
    );
}
