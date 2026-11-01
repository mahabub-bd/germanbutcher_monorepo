"use client";

import { revalidatePublic } from "@/actions/revalidate";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { formPostData, patchData, postData } from "@/utils/api-utils";
import type { SalesPartner } from "@/utils/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Upload } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type React from "react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const salesPartnerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  order: z.number().min(0, "Order must be 0 or greater"),
  description: z.string().min(1, "Description is required"),
  website: z.string().url("Please enter a valid URL")
    .optional()
    .or(z.literal("")),
  isActive: z.boolean(),
  imageUrl: z.string().optional(),
});

type SalesPartnerFormValues = z.infer<typeof salesPartnerSchema>;

interface SalesPartnerFormProps {
  mode: "create" | "edit";
  salesPartner?: SalesPartner;
}

export function SalesPartnerForm({
  mode,
  salesPartner,
}: SalesPartnerFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState("");
  const [imagePreview, setImagePreview] = useState(
    salesPartner?.Image?.url || ""
  );
  const router = useRouter();

  const form = useForm<SalesPartnerFormValues>({
    resolver: zodResolver(salesPartnerSchema),
    defaultValues: {
      name: salesPartner?.name || "",
      description: salesPartner?.description || "",
      order: salesPartner?.order || 0,
      website: salesPartner?.website || "",
      isActive: salesPartner?.isActive ?? true,
      imageUrl: salesPartner?.Image?.url || "",
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setFileName(selectedFile.name);
    const fileUrl = URL.createObjectURL(selectedFile);
    setImagePreview(fileUrl);
    form.setValue("imageUrl", "");
  };

  const handleSubmit = async (data: SalesPartnerFormValues) => {
    setIsSubmitting(true);
    try {
      let imageId = salesPartner?.Image?.id;

      if (file) {
        const formData = new FormData();
        formData.append("file", file);
        const result = await formPostData<{ id: number }>("attachment", formData);
        imageId = result.data!.id;
      }

      const salesPartnerData = {
        ...data,
        Image: imageId,
      };

      const endpoint =
        mode === "create"
          ? "sales-partners"
          : `sales-partners/${salesPartner?.Id}`;
      const method = mode === "create" ? postData : patchData;

      const response = await method(endpoint, salesPartnerData);

      if (response?.statusCode === 200 || response?.statusCode === 201) {
        const successMessage =
          mode === "create"
            ? "Sales Partner created successfully"
            : "Sales Partner updated successfully";
        toast.success(successMessage);
        await revalidatePublic();
        router.back();
      } else {
        toast.error(response?.message || "An error occurred");
      }
    } catch (error) {
      console.error("Error submitting sales partner form:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    return () => {
      if (imagePreview && !imagePreview.startsWith("http")) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-3 w-full">
        {/* Partner details */}
        <FormSection
          title="Partner details"
          description="Name, ordering and web presence shown across the site."
        >
          <div className="grid grid-cols-1 items-stretch gap-3 md:grid-cols-2 lg:grid-cols-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="flex h-full flex-col gap-1.5">
                  <FormLabel>Partner name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. Prime Meats"
                      {...field}
                      className="w-full flex-1"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="order"
              render={({ field }) => (
                <FormItem className="flex h-full flex-col gap-1.5">
                  <FormLabel>Display order</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      placeholder="0 (lower shows first)"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                      className="w-full flex-1 tabular-nums"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="website"
              render={({ field }) => (
                <FormItem className="flex h-full flex-col gap-1.5">
                  <FormLabel>Website</FormLabel>
                  <FormControl>
                    <Input
                      type="url"
                      placeholder="https://example.com"
                      {...field}
                      className="w-full flex-1"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem className="flex h-full flex-col gap-1.5">
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter partner description"
                      {...field}
                      className="w-full min-h-9 flex-1 resize-none"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </FormSection>

        {/* Logo & visibility */}
        <FormSection
          title="Logo & visibility"
          description="The logo shown beside the partner and whether it is live."
        >
          <div className="grid gap-3 lg:grid-cols-2">
            <FormField
              control={form.control}
              name="imageUrl"
              render={() => (
                <FormItem className="space-y-1.5">
                  <FormLabel>Partner logo</FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-3">
                      {imagePreview ? (
                        <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-md border bg-muted/20">
                          <Image
                            src={imagePreview || "/placeholder.svg"}
                            alt="Partner logo preview"
                            fill
                            className="object-contain"
                          />
                        </div>
                      ) : (
                        <div className="flex h-16 w-24 shrink-0 items-center justify-center rounded-md border border-dashed bg-muted/20">
                          <Upload className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex min-w-0 flex-col gap-1.5">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            document.getElementById("partner-upload")?.click()
                          }
                        >
                          <Upload className="mr-2 h-4 w-4" />
                          Choose image
                        </Button>
                        <p className="break-all text-xs text-muted-foreground">
                          {fileName || "PNG or JPG recommended"}
                        </p>
                      </div>
                      <Input
                        id="partner-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileChange}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex flex-col justify-center">
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <SwitchRow
                    label="Active"
                    hint="Partner is visible on the storefront"
                    checked={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
            </div>
          </div>
        </FormSection>

        <div className="sticky bottom-2 flex flex-col-reverse items-stretch gap-2 rounded-lg border bg-card/95 p-3 shadow-sm backdrop-blur sm:flex-row sm:items-center sm:justify-end">
          <p className="mr-auto hidden text-xs text-muted-foreground lg:block">
            The partner appears on the storefront immediately after saving.
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {mode === "create" ? "Create partner" : "Save changes"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

/** A bordered card that groups related fields under a titled header, so the
 *  form reads as distinct sections instead of one long grid. */
function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-lg border bg-card shadow-xs">
      <div className="border-b px-3.5 py-2.5">
        <h3 className="text-sm font-semibold">{title}</h3>
        {description && (
          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      <div className="space-y-3 p-3.5">{children}</div>
    </section>
  );
}

/** Toggle rendered as a full-width row: label + hint on the left, switch on
 *  the right. Clicking anywhere on the row flips the switch. */
function SwitchRow({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div
      onClick={() => onChange(!checked)}
      className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border bg-background p-3 transition-colors hover:border-primary/40 hover:bg-muted/30"
    >
      <div className="min-w-0 space-y-0.5">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs leading-snug text-muted-foreground">{hint}</p>
      </div>
      <Switch
        checked={checked}
        onCheckedChange={onChange}
        onClick={(event) => event.stopPropagation()}
        className="shrink-0"
      />
    </div>
  );
}
