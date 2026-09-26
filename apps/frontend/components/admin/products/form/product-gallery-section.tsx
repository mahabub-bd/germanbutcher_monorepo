"use client";

import { ImagePlus, Trash2 } from "lucide-react";
import Image from "next/image";

import { SectionCard } from "@/components/admin/products/form/section-card";
import { Button } from "@/components/ui/button";

interface ProductGallerySectionProps {
  existingPreviews: string[];
  existingAttachmentIds: number[];
  newPreviews: string[];
  onDeleteExisting: (attachmentId: number) => void;
  onRemoveNew: (index: number) => void;
  onAddClick: () => void;
}

export function ProductGallerySection({
  existingPreviews,
  existingAttachmentIds,
  newPreviews,
  onDeleteExisting,
  onRemoveNew,
  onAddClick,
}: ProductGallerySectionProps) {
  return (
    <SectionCard
      icon={ImagePlus}
      title="Product Gallery"
      subtitle="Additional product photos"
    >
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {existingPreviews.map((preview, index) => (
          <div key={`existing-${index}`} className="group relative">
            <div className="relative h-32 w-full overflow-hidden rounded-lg border bg-muted/20">
              <Image
                src={preview || "/placeholder.svg"}
                alt={`Gallery image ${index + 1}`}
                fill
                sizes="200px"
                className="object-contain p-1"
              />
            </div>
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute right-1 top-1 h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100"
              onClick={() =>
                existingAttachmentIds[index]
                  ? onDeleteExisting(existingAttachmentIds[index])
                  : console.warn("Missing attachment id for gallery image", index)
              }
              aria-label={`Remove gallery image ${index + 1}`}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        ))}

        {newPreviews.map((preview, index) => (
          <div key={`new-${index}`} className="group relative">
            <div className="relative h-32 w-full overflow-hidden rounded-lg border bg-muted/20">
              <Image
                src={preview}
                alt={`New gallery image ${index + 1}`}
                fill
                sizes="200px"
                className="object-contain p-1"
              />
            </div>
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute right-1 top-1 h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100"
              onClick={() => onRemoveNew(index)}
              aria-label={`Remove new gallery image ${index + 1}`}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
        </div>
        ))}

        <button
          type="button"
          onClick={onAddClick}
          className="flex h-32 w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed bg-muted/20 text-muted-foreground transition hover:bg-muted/40"
        >
          <ImagePlus className="h-6 w-6" />
          <span className="text-sm">Add Image</span>
        </button>
      </div>
    </SectionCard>
  );
}
