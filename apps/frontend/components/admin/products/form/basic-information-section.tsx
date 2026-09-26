"use client";

import { Link2, Package, Plus, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useWatch, type Control } from "react-hook-form";
import { useFormContext } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

import { SectionCard } from "@/components/admin/products/form/section-card";
import { slugifyName } from "@/components/admin/products/form/slug-utils";
import type { ProductFormValues } from "@/components/admin/products/form/types";
import RichTextEditor from "@/components/ui/jodit-editor";
import { Textarea } from "@/components/ui/textarea";

const DESCRIPTION_MAX_LENGTH = 2000;

interface BasicInformationSectionProps {
  control: Control<ProductFormValues>;
  initialTags: string[];
  initialSlug?: string;
  mode: "create" | "edit";
}

export function BasicInformationSection({
  control,
  initialTags,
  initialSlug,
  mode,
}: BasicInformationSectionProps) {
  const form = useFormContext<ProductFormValues>();
  const [tags, setTags] = useState<string[]>(initialTags);
  const [tagInput, setTagInput] = useState("");
  const [slugTouched, setSlugTouched] = useState(
    mode === "edit" && Boolean(initialSlug)
  );

  const watchedName = useWatch({ control, name: "name" }) ?? "";
  const watchedDescription = useWatch({ control, name: "description" }) ?? "";

  // Auto-suggest the slug from the name until the user edits it manually.
  useEffect(() => {
    if (!slugTouched) {
      form.setValue("slug", slugifyName(watchedName), {
        shouldValidate: false,
        shouldDirty: true,
      });
    }
  }, [watchedName, slugTouched, form]);

  const handleAddTag = () => {
    const trimmedTag = tagInput.trim().toLowerCase();
    if (!trimmedTag) return;
    if (tags.includes(trimmedTag)) {
      toast.error("Tag already exists");
      return;
    }
    const newTags = [...tags, trimmedTag];
    setTags(newTags);
    form.setValue("tags", newTags, { shouldDirty: true });
    setTagInput("");
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const newTags = tags.filter((tag) => tag !== tagToRemove);
    setTags(newTags);
    form.setValue("tags", newTags, { shouldDirty: true });
  };

  const handleTagInputKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag();
    }
  };

  return (
    <SectionCard icon={Package} title="Basic Information">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <FormField
          control={control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Product Name <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Input placeholder="Enter product name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="slug"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Slug (URL)</FormLabel>
              <FormControl>
                <div className="relative">
                  <Link2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="auto-generated-from-name"
                    className="pl-9"
                    value={field.value ?? ""}
                    onChange={(e) => {
                      setSlugTouched(true);
                      field.onChange(e.target.value);
                    }}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <div className="flex items-center justify-between">
              <FormLabel>
                Description <span className="text-destructive">*</span>
              </FormLabel>
              <span className="text-xs text-muted-foreground">
                {watchedDescription.length} / {DESCRIPTION_MAX_LENGTH}
              </span>
            </div>
            <FormControl>
              <Textarea
                placeholder="Enter product description"
                className="min-h-20"
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="productDetails"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Product Details</FormLabel>
            <FormControl>
              <RichTextEditor
                value={field.value ?? ""}
                onChange={field.onChange}
              />
            </FormControl>
            <FormMessage />
            <p className="text-xs text-muted-foreground">
              Use the rich text editor to format detailed content — supports
              text formatting, lists, links, and images.
            </p>
          </FormItem>
        )}
      />

      <FormItem>
        <FormLabel>Tags</FormLabel>
        <div className="flex gap-2">
          <div className="flex min-h-10 flex-1 flex-wrap items-center gap-1.5 rounded-md border px-2 py-1.5">
            {tags.map((tag) => (
              <div
                key={tag}
                className="flex items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 text-xs"
              >
                <span>{tag}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="rounded-full p-0.5 transition hover:bg-accent"
                  aria-label={`Remove tag ${tag}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
            <Input
              placeholder={tags.length > 0 ? "Add another tag..." : "Add a tag..."}
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagInputKeyDown}
              className="h-7 min-w-24 flex-1 border-0 shadow-none focus-visible:ring-0"
            />
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={handleAddTag}
            className="h-10 whitespace-nowrap"
          >
            <Plus className="mr-1 h-4 w-4" />
            Add Tag
          </Button>
        </div>
      </FormItem>
    </SectionCard>
  );
}
