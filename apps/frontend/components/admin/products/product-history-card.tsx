"use client";

import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/utils";
import { FALLBACK_IMAGE } from "@/utils/image-fallback";
import type { Product } from "@/utils/types";
import Image from "next/image";
import { Clock, Pencil, UserPlus } from "lucide-react";

interface HistoryEntry {
  label: string;
  name: string | undefined;
  photo: string | undefined;
  date: string;
  dateLabel: string;
  icon: React.ComponentType<{ className?: string }>;
}

function buildEntries(product: Product): HistoryEntry[] {
  return [
    {
      label: "Created by",
      name: product.createdBy?.name,
      photo: product.createdBy?.profilePhoto?.url,
      date: product.createdAt,
      dateLabel: "Created At",
      icon: UserPlus,
    },
    {
      label: "Last updated by",
      name: product.updatedBy?.name,
      photo: product.updatedBy?.profilePhoto?.url,
      date: product.updatedAt,
      dateLabel: "Updated At",
      icon: Pencil,
    },
  ];
}

export default function ProductHistoryCard({ product }: { product: Product }) {
  const entries = buildEntries(product);

  return (
    <div className="relative">
      {/* Connecting timeline line */}
      {entries.length > 1 && (
        <span
          aria-hidden="true"
          className="absolute left-[18px] top-9 bottom-9 w-px bg-border"
        />
      )}

      <div className="space-y-1">
        {entries.map((entry, index) => {
          const Icon = entry.icon;
          return (
            <div
              key={index}
              className="group relative flex gap-4 rounded-lg p-2 transition-colors hover:bg-muted/50 -mx-2"
            >
              {/* Avatar node on the timeline */}
              <div className="relative z-10 size-9 shrink-0">
                <div className="relative size-9 overflow-hidden rounded-full border bg-muted ring-2 ring-background">
                  {entry.photo ? (
                    <Image
                      src={entry.photo || FALLBACK_IMAGE}
                      alt={entry.name || ""}
                      fill
                      sizes="36px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex size-full items-center justify-center">
                      <Icon className="size-4 text-muted-foreground" />
                    </div>
                  )}
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 pt-1">
                <p className="text-xs text-muted-foreground">{entry.label}</p>
                <p className="text-sm font-medium truncate flex items-center gap-2">
                  {entry.name || "Unknown"}
                  {index === 0 && (
                    <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
                      Initial
                    </Badge>
                  )}
                </p>
              </div>

              {/* Timestamp */}
              <div className="text-right shrink-0 pt-1">
                <div className="flex items-center justify-end gap-1 text-xs text-muted-foreground">
                  <Clock className="size-3" />
                  {entry.dateLabel}
                </div>
                <p className="text-sm font-medium">{formatDateTime(entry.date)}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
