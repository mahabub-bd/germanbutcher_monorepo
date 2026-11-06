"use client";

import { PillBadge } from "@/components/common/pill-badge";
import { ProfileField } from "@/components/common/profile-field";
import { getRoleIcon, getRoleTone } from "@/components/common/role-badge-helpers";
import { formatDateTime } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import {
    BadgeCheck,
    CalendarClock,
    CalendarDays,
    History,
    Mail,
    MapPin,
    Phone,
    Users,
} from "lucide-react";
import Image from "next/image";
import type { ReactNode } from "react";

export interface ProfileStripField {
    icon: LucideIcon;
    label: string;
    value: string;
    href?: string;
    capitalize?: boolean;
}

/**
 * Identity + membership fields shared by the admin user / customer / CRM
 * detail pages, so a field's icon, label, fallback and formatting live in
 * exactly one place. `deliveryArea` inserts the "Delivery area" row (used by
 * the customer and CRM pages) when provided.
 */
export function identityProfileFields(
    user: {
        email: string;
        mobileNumber?: string | null;
        gender?: string | null;
        dateOfBirth?: string | null;
        createdAt: string;
        lastLoginAt?: string | null;
    },
    deliveryArea?: string | null,
): ProfileStripField[] {
    const fields: ProfileStripField[] = [
        {
            icon: Mail,
            label: "Email",
            value: user.email,
            href: `mailto:${user.email}`,
        },
        {
            icon: Phone,
            label: "Mobile",
            value: user.mobileNumber || "—",
            href: user.mobileNumber
                ? `tel:${user.mobileNumber}`
                : undefined,
        },
    ];
    if (deliveryArea !== undefined) {
        fields.push({
            icon: MapPin,
            label: "Delivery area",
            value: deliveryArea || "—",
        });
    }
    fields.push(
        {
            icon: Users,
            label: "Gender",
            value: user.gender || "Not set",
            capitalize: true,
        },
        {
            icon: CalendarDays,
            label: "Date of birth",
            value: user.dateOfBirth
                ? formatDateTime(user.dateOfBirth)
                : "Not set",
        },
        {
            icon: CalendarClock,
            label: "Joined",
            value: formatDateTime(user.createdAt),
        },
        {
            icon: History,
            label: "Last login",
            value: user.lastLoginAt
                ? formatDateTime(user.lastLoginAt)
                : "Never",
        },
    );
    return fields;
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
                            <PillBadge tone="emerald" className="gap-1">
                                <BadgeCheck className="h-3 w-3" />
                                Verified
                            </PillBadge>
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
