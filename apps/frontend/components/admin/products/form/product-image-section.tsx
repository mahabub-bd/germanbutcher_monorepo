"use client";

import { Upload } from "lucide-react";
import Image from "next/image";
import type React from "react";
import type { Control } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

import { SectionCard } from "@/components/admin/products/form/section-card";
import type { ProductFormValues } from "@/components/admin/products/form/types";

interface ProductImageSectionProps {
  control: Control<ProductFormValues>;
  imagePreview: string;
  fileName: string;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function ProductImageSection({
  control,
  imagePreview,
  fileName,
  onFileChange,
}: ProductImageSectionProps) {
  const hasImage = Boolean(imagePreview);

  return (
    <SectionCard
      icon={Upload}
      title="Product Image"
      subtitle="Main product photo"
    >
      <FormField
        control={control}
        name="imageUrl"
        render={() => (
          <FormItem>
            <FormControl>
              <div className="flex flex-col gap-2">
                <div className="relative overflow-hidden rounded-xl border bg-muted/20">
                  {hasImage ? (
                    <>
                      <div className="relative mx-auto flex h-44 w-full items-center justify-center">
                        <Image
                          src={imagePreview}
                          alt="Product preview"
                          fill
                          sizes="480px"
                          className="object-contain p-4"
                        />
                      </div>
                      <div className="absolute inset-x-0 bottom-3 flex justify-center">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 bg-background shadow-md hover:bg-background"
                          onClick={() =>
                            document.getElementById("product-upload")?.click()
                          }
                        >
                          <Upload className="mr-1.5 h-3.5 w-3.5" />
                          Change Image
                        </Button>
                      </div>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() =>
                        document.getElementById("product-upload")?.click()
                      }
                      className="flex h-44 w-full flex-col items-center justify-center gap-2 text-muted-foreground transition hover:bg-muted/40"
                    >
                      <Upload className="h-7 w-7" />
                      <span className="text-sm font-medium">
                        Click to upload image
                      </span>
                    </button>
                  )}
                </div>
                <p className="truncate text-center text-xs text-muted-foreground">
                  {fileName ? `${fileName} · ` : ""}JPG, PNG or WebP. Max 5MB.
                </p>
                <Input
                  id="product-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={onFileChange}
                />
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </SectionCard>
  );
}
