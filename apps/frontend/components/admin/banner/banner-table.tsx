"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ActiveStatusToggle } from "@/components/common/active-status-toggle";
import { usePermissions } from "@/components/admin/permissions/use-permissions";
import type { Banner } from "@/utils/types";
import { ExternalLink, ImageIcon, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface BannerTableProps {
  banners: Banner[];
  onDeleteClick: (banner: Banner) => void;
  onToggleActive: (banner: Banner) => void;
  togglingId: number | null;
}

// Badge colors per banner type — matches the filter chips in the list's
// Filters dropdown (main=purple, promotional=amber, featured=cyan).
const typeBadgeColors: Record<string, string> = {
  main: "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300",
  promotional:
    "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  featured:
    "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-300",
  default: "bg-gray-100 text-gray-800 dark:bg-gray-900/40 dark:text-gray-300",
};

// Badge colors per banner position.
const positionBadgeColors: Record<string, string> = {
  top: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  middle:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  bottom:
    "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300",
  sidebar:
    "bg-pink-100 text-pink-800 dark:bg-pink-900/40 dark:text-pink-300",
  default: "bg-gray-100 text-gray-800 dark:bg-gray-900/40 dark:text-gray-300",
};

const getBadgeColor = (
  colors: Record<string, string>,
  value: string | undefined
) =>
  (value && colors[value.trim().toLowerCase()]) || colors["default"];

export function BannerTable({
  banners,
  onDeleteClick,
  onToggleActive,
  togglingId,
}: BannerTableProps) {
  const MENU_URL = "/admin/banner/banner-list";
  const { can } = usePermissions();

  return (
    <div>
      <Table className="[&_td]:py-4 [&_th]:pb-3 [&_th]:pt-0">
        <TableHeader>
          <TableRow>
            <TableHead>Image</TableHead>
            <TableHead>Title</TableHead>
            <TableHead className="hidden md:table-cell">Type</TableHead>
            <TableHead className="hidden md:table-cell">Position</TableHead>
            <TableHead className="hidden md:table-cell">
              Display Order
            </TableHead>
            <TableHead className="hidden md:table-cell">Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {banners.map((banner) => (
            <TableRow key={banner.id} className="hover:bg-muted/50">
              <TableCell>
                <span className="flex aspect-[3/2] h-16 w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted p-1">
                  {banner?.image?.url ? (
                    <Image
                      src={banner.image.url}
                      alt={banner.title}
                      width={96}
                      height={64}
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <ImageIcon className="h-6 w-6 text-muted-foreground" />
                  )}
                </span>
              </TableCell>
              <TableCell>
                <Link
                  href={`/admin/banner/${banner.id}/edit`}
                  className="font-medium leading-tight hover:underline"
                >
                  {banner.title}
                </Link>
                <p className="mt-0.5 line-clamp-1 max-w-64 text-xs text-muted-foreground">
                  {banner.description || "No description"}
                </p>
                {banner.targetUrl && (
                  <a
                    href={banner.targetUrl}
                    target={banner.targetUrl.startsWith("/") ? undefined : "_blank"}
                    rel="noopener noreferrer"
                    className="mt-0.5 inline-flex max-w-64 items-center gap-1 text-xs text-blue-600 hover:text-blue-800 hover:underline dark:text-blue-400 dark:hover:text-blue-300"
                    title={banner.targetUrl}
                  >
                    <ExternalLink className="h-3 w-3 shrink-0" />
                    <span className="truncate">
                      {banner.targetUrl.startsWith("/")
                        ? `Storefront: ${banner.targetUrl}`
                        : banner.targetUrl}
                    </span>
                  </a>
                )}
              </TableCell>
              <TableCell className="hidden md:table-cell">
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${getBadgeColor(typeBadgeColors, banner.type)}`}
                >
                  {banner.type}
                </span>
              </TableCell>
              <TableCell className="hidden md:table-cell">
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${getBadgeColor(positionBadgeColors, banner.position)}`}
                >
                  {banner.position}
                </span>
              </TableCell>
              <TableCell className="hidden md:table-cell">
                {banner?.displayOrder}
              </TableCell>
              <TableCell className="hidden md:table-cell">
                <ActiveStatusToggle
                  isActive={banner.isActive}
                  disabled={togglingId === banner.id}
                  onToggle={() => onToggleActive(banner)}
                  label={banner.title}
                />
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Open menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {can(MENU_URL, "canEdit") && (
                      <DropdownMenuItem asChild>
                        <Link href={`/admin/banner/${banner.id}/edit`}>
                          <Pencil className="mr-2 h-4 w-4" /> Edit
                        </Link>
                      </DropdownMenuItem>
                    )}
                    {can(MENU_URL, "canDelete") && (
                      <DropdownMenuItem
                        className="text-red-600"
                        onClick={() => onDeleteClick(banner)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
