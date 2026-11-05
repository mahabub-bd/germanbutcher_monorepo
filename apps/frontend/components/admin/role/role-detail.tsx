"use client";

import StatsCard from "@/components/admin/dashboard/stats-card";
import { LoadingIndicator } from "@/components/admin/loading-indicator";
import { PageHeader } from "@/components/admin/page-header";
import { usePermissions } from "@/components/admin/permissions/use-permissions";
import { ListPaginationFooter } from "@/components/common/list-pagination-footer";
import { PillBadge } from "@/components/common/pill-badge";
import { TableSearch } from "@/components/common/table-search";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { formatDateTime } from "@/lib/utils";
import { fetchDataPagination, fetchProtectedData } from "@/utils/api-utils";
import type { Role } from "@/utils/types";
import {
    Briefcase,
    CalendarClock,
    CheckCircle2,
    Mail,
    Pencil,
    Phone,
    Shield,
    ShieldCheck,
    Store,
    User,
    Users,
    XCircle,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import type React from "react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

/** One account carrying the role, as returned by `roles/:id/users`. */
interface RoleMember {
    id: number;
    name: string;
    email: string;
    mobileNumber: string | null;
    isVerified: boolean;
    lastLoginAt: string | null;
    createdAt: string;
    profilePhoto?: { id: number; url: string } | null;
}

// Same identity → icon mapping as the role list, so a role looks alike on both pages.
const roleIcons: Record<string, React.ReactNode> = {
    admin: <ShieldCheck className="size-5 text-muted-foreground" />,
    superadmin: <Shield className="size-5 text-muted-foreground" />,
    modaretor: <Shield className="size-5 text-muted-foreground" />,
    manager: <Briefcase className="size-5 text-muted-foreground" />,
    storemanager: <Store className="size-5 text-muted-foreground" />,
    staff: <Users className="size-5 text-muted-foreground" />,
    customer: <User className="size-5 text-muted-foreground" />,
};

const getRoleIcon = (roleName: string | undefined) =>
    (roleName && roleIcons[roleName.trim().toLowerCase()]) || (
        <Shield className="size-5 text-muted-foreground" />
    );

const MEMBER_LIMIT = 10;

export function RoleDetail() {
    const params = useParams();
    const roleId = params.id as string;
    const MENU_URL = "/admin/user/role/role-list";
    const { can } = usePermissions();

    const [role, setRole] = useState<Role | null>(null);
    const [isLoadingRole, setIsLoadingRole] = useState(true);
    const [notFound, setNotFound] = useState(false);

    const [members, setMembers] = useState<RoleMember[]>([]);
    const [isLoadingMembers, setIsLoadingMembers] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        const loadRole = async () => {
            setIsLoadingRole(true);
            try {
                const data = await fetchProtectedData<Role>(`roles/${roleId}`);
                setRole(data);
            } catch (error) {
                console.error("Error fetching role:", error);
                setNotFound(true);
            } finally {
                setIsLoadingRole(false);
            }
        };
        loadRole();
    }, [roleId]);

    const loadMembers = useCallback(async () => {
        setIsLoadingMembers(true);
        try {
            const qs = new URLSearchParams();
            qs.set("page", currentPage.toString());
            qs.set("limit", MEMBER_LIMIT.toString());
            if (searchQuery.trim()) qs.set("search", searchQuery.trim());

            const response = await fetchDataPagination<{
                data: RoleMember[];
                total: number;
                totalPages: number;
            }>(`roles/${roleId}/users?${qs.toString()}`);
            setMembers(response.data ?? []);
            setTotal(response.total ?? 0);
            setTotalPages(response.totalPages ?? 1);
        } catch (error) {
            console.error("Error fetching role members:", error);
            toast.error("Failed to load role members. Please try again.");
            setMembers([]);
        } finally {
            setIsLoadingMembers(false);
        }
    }, [roleId, currentPage, searchQuery]);

    useEffect(() => {
        loadMembers();
    }, [loadMembers]);

    if (isLoadingRole) {
        return (
            <div className="flex justify-center py-16">
                <LoadingIndicator message="Loading role..." />
            </div>
        );
    }

    if (notFound || !role) {
        return (
            <div className="w-full">
                <PageHeader title="Role not found" />
                <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-card px-6 py-16 text-center">
                    <div className="rounded-full bg-muted p-3">
                        <Shield className="size-6 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                        The requested role could not be found.
                    </p>
                    <Button asChild size="sm" variant="outline">
                        <Link href="/admin/user/role/role-list">Back to Roles</Link>
                    </Button>
                </div>
            </div>
        );
    }

    const userCount = role.userCount ?? total;

    const infoRow = (label: string, value: React.ReactNode) => (
        <div className="flex items-center justify-between gap-3 border-b px-4 py-2.5 last:border-b-0">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {label}
            </span>
            <span className="min-w-0 truncate text-right text-sm">
                {value ?? "—"}
            </span>
        </div>
    );

    return (
        <div className="w-full">
            <PageHeader
                title={`${role.rolename.charAt(0).toUpperCase()}${role.rolename.slice(1)}`}
                description={
                    role.description ||
                    "Details for this role and the accounts currently assigned to it."
                }
                titleIcon={getRoleIcon(role.rolename)}
            >
                {can(MENU_URL, "canEdit") && (
                    <Button asChild size="sm">
                        <Link href={`/admin/user/role/${role.id}/edit`}>
                            <Pencil className="size-4" />
                            <span className="hidden sm:inline">Edit Role</span>
                        </Link>
                    </Button>
                )}
            </PageHeader>

            {/* Overview */}
            <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                <StatsCard
                    icon={Users}
                    title="Assigned users"
                    value={userCount.toLocaleString("en-US")}
                    description="Accounts carrying this role"
                    bgColor="blue"
                />
                <StatsCard
                    icon={role.isActive ? CheckCircle2 : XCircle}
                    title="Status"
                    value={role.isActive ? "Active" : "Inactive"}
                    description={role.isActive ? "Assignable to users" : "Not currently usable"}
                    bgColor={role.isActive ? "green" : "red"}
                />
                <StatsCard
                    icon={CalendarClock}
                    title="Created"
                    value={formatDateTime(role.createdAt)}
                    description="When the role was added"
                    bgColor="purple"
                />
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                {/* Role details */}
                <div className="lg:col-span-1">
                    <div className="overflow-hidden rounded-xl border bg-card shadow-xs">
                        <div className="flex items-center gap-2.5 border-b px-4 py-3">
                            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border bg-muted">
                                {getRoleIcon(role.rolename)}
                            </span>
                            <div className="min-w-0">
                                <h3 className="truncate text-sm font-semibold capitalize">
                                    {role.rolename}
                                </h3>
                                <p className="text-xs text-muted-foreground">Role information</p>
                            </div>
                        </div>

                        {infoRow(
                            "Status",
                            <PillBadge tone={role.isActive ? "emerald" : "neutral"}>
                                {role.isActive ? "Active" : "Inactive"}
                            </PillBadge>
                        )}
                        {infoRow("Total users", userCount.toLocaleString("en-US"))}
                        {infoRow("Created", formatDateTime(role.createdAt))}
                        {infoRow(
                            "Created by",
                            (role as { createdBy?: { name?: string } }).createdBy?.name || "—"
                        )}
                        {infoRow(
                            "Last updated",
                            formatDateTime(
                                (role as { updatedAt?: string }).updatedAt ||
                                role.updatedDate ||
                                role.createdAt
                            )
                        )}
                        <div className="px-4 py-3">
                            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                Description
                            </p>
                            <p className="text-sm leading-snug wrap-break-word">
                                {role.description || "No description provided."}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Members */}
                <div className="lg:col-span-2">
                    <div className="overflow-hidden rounded-xl border bg-card shadow-xs">
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
                            <div>
                                <h3 className="text-sm font-semibold">Assigned accounts</h3>
                                <p className="text-xs text-muted-foreground">
                                    Users currently holding this role
                                </p>
                            </div>
                            <PillBadge className="font-medium tabular-nums">
                                {total.toLocaleString("en-US")} total
                            </PillBadge>
                        </div>

                        <div className="border-b px-4 py-3">
                            <TableSearch
                                wrapperClassName="w-full md:max-w-xs"
                                className="h-9"
                                placeholder="Search name, email or mobile..."
                                value={searchQuery}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                    setSearchQuery(e.target.value);
                                    setCurrentPage(1);
                                }}
                            />
                        </div>

                        {isLoadingMembers ? (
                            <div className="flex justify-center py-12">
                                <LoadingIndicator message="Loading accounts..." />
                            </div>
                        ) : members.length === 0 ? (
                            <div className="flex flex-col items-center justify-center gap-3 px-6 py-14 text-center">
                                <div className="rounded-full bg-muted p-3">
                                    <Users className="size-6 text-muted-foreground" />
                                </div>
                                <p className="text-sm font-semibold">
                                    {searchQuery ? "No accounts match your search" : "No assigned accounts"}
                                </p>
                                <p className="max-w-md text-xs text-muted-foreground">
                                    {searchQuery
                                        ? "Try a different name, email or mobile number."
                                        : "No user currently carries this role."}
                                </p>
                            </div>
                        ) : (
                            <>
                                {/* Desktop table */}
                                <div className="hidden md:block">
                                    <Table className="report-table [&_td:first-child]:pl-4 [&_td:last-child]:pr-4 [&_th:first-child]:pl-4 [&_th:last-child]:pr-4">
                                        <TableHeader className="[&_th]:font-semibold">
                                            <TableRow className="hover:bg-transparent">
                                                <TableHead>User</TableHead>
                                                <TableHead>Contact</TableHead>
                                                <TableHead>Joined</TableHead>
                                                <TableHead className="pr-4">Last login</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {members.map((member) => (
                                                <TableRow key={member.id}>
                                                    <TableCell className="py-2.5">
                                                        <div className="flex min-w-0 items-center gap-2.5">
                                                            <span className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full border bg-muted">
                                                                {member.profilePhoto?.url ? (
                                                                    // eslint-disable-next-line @next/next/no-img-element
                                                                    <img
                                                                        src={member.profilePhoto.url}
                                                                        alt={member.name}
                                                                        className="size-full object-cover"
                                                                    />
                                                                ) : (
                                                                    <User className="size-4 text-muted-foreground" />
                                                                )}
                                                            </span>
                                                            <div className="min-w-0">
                                                                <p className="truncate text-sm font-medium">
                                                                    {member.name}
                                                                </p>
                                                                <p className="truncate text-[11px] text-muted-foreground">
                                                                    #{member.id}
                                                                    {member.isVerified && (
                                                                        <span className="ml-1 text-emerald-600 dark:text-emerald-400">
                                                                            · verified
                                                                        </span>
                                                                    )}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </TableCell>

                                                    <TableCell>
                                                        <div className="flex flex-col gap-0.5">
                                                            {member.email ? (
                                                                <a
                                                                    href={`mailto:${member.email}`}
                                                                    className="flex min-w-0 items-center gap-1 text-[11px] text-blue-600 hover:underline dark:text-blue-400"
                                                                >
                                                                    <Mail className="size-3 shrink-0" />
                                                                    <span className="truncate">{member.email}</span>
                                                                </a>
                                                            ) : (
                                                                <span className="text-[11px] text-muted-foreground">
                                                                    No email
                                                                </span>
                                                            )}
                                                            {member.mobileNumber ? (
                                                                <a
                                                                    href={`tel:${member.mobileNumber}`}
                                                                    className="flex items-center gap-1 text-[11px] text-blue-600 hover:underline dark:text-blue-400"
                                                                >
                                                                    <Phone className="size-3 shrink-0" />
                                                                    {member.mobileNumber}
                                                                </a>
                                                            ) : (
                                                                <span className="text-[11px] text-muted-foreground">
                                                                    No mobile
                                                                </span>
                                                            )}
                                                        </div>
                                                    </TableCell>

                                                    <TableCell className="text-muted-foreground">
                                                        <span className="line-clamp-2 text-xs">
                                                            {formatDateTime(member.createdAt)}
                                                        </span>
                                                    </TableCell>

                                                    <TableCell className="pr-4 text-muted-foreground">
                                                        <span className="line-clamp-2 text-xs">
                                                            {member.lastLoginAt
                                                                ? formatDateTime(member.lastLoginAt)
                                                                : "Never"}
                                                        </span>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>

                                {/* Mobile cards */}
                                <div className="divide-y md:hidden">
                                    {members.map((member) => (
                                        <article key={member.id} className="space-y-2.5 p-3.5">
                                            <div className="flex items-start gap-2.5">
                                                <span className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full border bg-muted">
                                                    {member.profilePhoto?.url ? (
                                                        // eslint-disable-next-line @next/next/no-img-element
                                                        <img
                                                            src={member.profilePhoto.url}
                                                            alt={member.name}
                                                            className="size-full object-cover"
                                                        />
                                                    ) : (
                                                        <User className="size-4 text-muted-foreground" />
                                                    )}
                                                </span>
                                                <div className="min-w-0">
                                                    <p className="truncate text-sm font-semibold">
                                                        {member.name}
                                                    </p>
                                                    <p className="truncate text-[11px] text-muted-foreground">
                                                        Joined {formatDateTime(member.createdAt)}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex flex-wrap gap-x-3 gap-y-1">
                                                {member.email && (
                                                    <a
                                                        href={`mailto:${member.email}`}
                                                        className="flex min-w-0 items-center gap-1 text-[11px] text-blue-600 hover:underline dark:text-blue-400"
                                                    >
                                                        <Mail className="size-3 shrink-0" />
                                                        <span className="truncate">{member.email}</span>
                                                    </a>
                                                )}
                                                {member.mobileNumber && (
                                                    <a
                                                        href={`tel:${member.mobileNumber}`}
                                                        className="flex items-center gap-1 text-[11px] text-blue-600 hover:underline dark:text-blue-400"
                                                    >
                                                        <Phone className="size-3 shrink-0" />
                                                        {member.mobileNumber}
                                                    </a>
                                                )}
                                            </div>

                                            <div className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
                                                <span>
                                                    Last login:{" "}
                                                    {member.lastLoginAt
                                                        ? formatDateTime(member.lastLoginAt)
                                                        : "Never"}
                                                </span>
                                                {member.isVerified && (
                                                    <PillBadge tone="emerald" className="shrink-0">
                                                        Verified
                                                    </PillBadge>
                                                )}
                                            </div>
                                        </article>
                                    ))}
                                </div>

                                {/* Footer + pagination */}
                                <ListPaginationFooter
                                    currentPage={currentPage}
                                    limit={MEMBER_LIMIT}
                                    totalItems={total}
                                    totalPages={totalPages}
                                    entityLabel="account"
                                    onPageChange={(page) => setCurrentPage(page)}
                                />
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
