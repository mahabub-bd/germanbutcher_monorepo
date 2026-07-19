"use client";

import type React from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Upload } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { formPostData, patchData, postData } from "@/utils/api-utils";
import type { SalesPoint } from "@/utils/types";
import { useRouter } from "next/navigation";
import { Section } from "../helper";

const salesPointSchema = z.object({
  name: z.string().min(1, "Sales point name is required"),
  description: z.string().optional(),
  website: z.string().url("Please enter a valid URL")
    .optional()
    .or(z.literal("")),
  contactNumber: z.string().min(1, "Contact number is required"),
  email: z.string().email("Please enter a valid email"),
  isActive: z.boolean(),
  order: z.number().min(1, "Order must be at least 1"),
});

type SalesPointFormValues = z.infer<typeof salesPointSchema>;

interface SalesPointFormProps {
  mode: "create" | "edit";
  salesPoint?: SalesPoint;
}

export function SalesPointForm({ mode, salesPoint }: SalesPointFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState("");
  const [imagePreview, setImagePreview] = useState(
    salesPoint?.logoAttachment?.url || ""
  );
  const router = useRouter();

  const form = useForm<SalesPointFormValues>({
    resolver: zodResolver(salesPointSchema),
    defaultValues: {
      name: salesPoint?.name || "",
      description: salesPoint?.description || "",
      website: salesPoint?.website || "",
      contactNumber: salesPoint?.contactNumber || "",
      email: salesPoint?.email || "",
      isActive: salesPoint?.isActive ?? true,
      order: salesPoint?.order || 1,
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setFileName(selectedFile.name);
    const fileUrl = URL.createObjectURL(selectedFile);
    setImagePreview(fileUrl);
  };

  const handleSubmit = async (data: SalesPointFormValues) => {
    setIsSubmitting(true);
    try {
      let logoAttachmentId = salesPoint?.logoAttachmentId;

      if (file) {
        const formData = new FormData();
        formData.append("file", file);
        const result = await formPostData("attachment", formData);
        logoAttachmentId = result.data.id;
      }

      const salesPointData = {
        ...data,
        logoAttachmentId,
      };

      const endpoint =
        mode === "create" ? "sales-points" : `sales-points/${salesPoint?.id}`;
      const method = mode === "create" ? postData : patchData;
      const response = await method(endpoint, salesPointData);

      if (response?.statusCode === 200 || response?.statusCode === 201) {
        const successMessage =
          mode === "create"
            ? "Sales point created successfully"
            : "Sales point updated successfully";
        toast.success(successMessage);
        router.back();
      } else {
        toast.error(response?.message || "An error occurred");
      }
    } catch (error) {
      console.error("Error submitting sales point form:", error);
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
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="p-6 space-y-6">
          {/* Basic Information Section */}
          <Section title="Basic Information">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sales Point Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter sales point name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="order"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Display Order</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        placeholder="Enter display order"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter sales point description"
                      className="min-h-25"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </Section>

          {/* Contact Information Section */}
          <Section title="Contact Information">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="Enter email address"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="contactNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Number</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter contact number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="website"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Website (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      type="url"
                      placeholder="https://example.com"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </Section>

          {/* Media & Status Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Section title="Logo">
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-4">
                  {imagePreview ? (
                    <div className="relative w-32 h-32 border rounded-md overflow-hidden bg-gray-50">
                      <Image
                        src={imagePreview || "/placeholder.svg"}
                        alt="Logo preview"
                        fill
                        className="object-contain"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center justify-center w-32 h-32 border rounded-md bg-muted/20">
                      <Upload className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex flex-col gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        document.getElementById("logo-upload")?.click()
                      }
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      Choose File
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      {fileName || "No file chosen"}
                    </span>
                  </div>
                </div>
                <Input
                  id="logo-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>
            </Section>

            <Section title="Status">
              <div className="grid grid-cols-1 gap-4">
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <SwitchCard
                      label="Active Status"
                      description="Sales point will be visible to customers"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
              </div>
            </Section>
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {mode === "create" ? "Creating..." : "Updating..."}
              </>
            ) : (
              <>
                {mode === "create"
                  ? "Create Sales Point"
                  : "Update Sales Point"}
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}

const SwitchCard = ({
  label,
  description,
  checked,
  onCheckedChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) => (
  <div className="flex items-center justify-between rounded-lg border p-4">
    <div className="space-y-0.5">
      <p className="text-base font-medium">{label}</p>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
    <Switch checked={checked} onCheckedChange={onCheckedChange} />
  </div>
);
