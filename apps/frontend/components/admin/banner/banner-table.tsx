"use client";

import { Badge } from "@/components/ui/badge";
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
import type { Banner } from "@/utils/types";
import { ImageIcon, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface BannerTableProps {
  banners: Banner[];
  onDeleteClick: (banner: Banner) => void;
}

export function BannerTable({ banners, onDeleteClick }: BannerTableProps) {
  return (
    <div className="md:p-6 p-2">
      <Table>
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
            <TableRow key={banner.id}>
              <TableCell>
                <div className=" overflow-hidden">
                  {banner?.image?.url ? (
                    <Image
                      src={banner.image.url}
                      alt={banner.title}
                      width={120}
                      height={60}
                      className="object-cover aspect-[2/1]"
                    />
                  ) : (
                    <div className="w-[120px] h-[60px] flex items-center justify-center bg-muted">
                      <ImageIcon className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell className="font-medium">
                <div>
                  <div className="font-medium">{banner.title}</div>
                  <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                    {banner.description || "No description"}
                  </div>
                </div>
              </TableCell>
              <TableCell className="hidden md:table-cell">
                <Badge variant="outline">{banner.type}</Badge>
              </TableCell>
              <TableCell className="hidden md:table-cell">
                {banner.position}
              </TableCell>
              <TableCell className="hidden md:table-cell">
                {banner?.displayOrder}
              </TableCell>
              <TableCell className="hidden md:table-cell">
                <Badge variant={banner.isActive ? "default" : "destructive"}>
                  {banner.isActive ? "Active" : "Inactive"}
                </Badge>
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
                    <DropdownMenuItem asChild>
                      <Link href={`/admin/banner/${banner.id}/edit`}>
                        <Pencil className="mr-2 h-4 w-4" /> Edit
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-red-600"
                      onClick={() => onDeleteClick(banner)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" /> Delete
                    </DropdownMenuItem>
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
