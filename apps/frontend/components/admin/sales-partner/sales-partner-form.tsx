"use client";

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
import { Section } from "../helper";

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
        const result = await formPostData("attachment", formData);
        imageId = result.data.id;
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
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="space-y-6 w-full"
      >
        <div className="p-6 space-y-6 w-full mx-auto">
          {/* Basic Information Section */}
          <Section title="Basic Information">
            <div className="w-full grid md:grid-cols-3 grid-cols-1 gap-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel>Partner Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter partner name"
                        {...field}
                        className="w-full"
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
                  <FormItem className="w-full">
                    <FormLabel>Display Order</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Enter display order"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        className="w-full"
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
                  <FormItem className="w-full">
                    <FormLabel>Website</FormLabel>
                    <FormControl>
                      <Input
                        type="url"
                        placeholder="https://example.com"
                        {...field}
                        className="w-full"
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
                <FormItem className="w-full">
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter partner description"
                      {...field}
                      className="w-full min-h-25"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </Section>

          {/* Media & Status Section */}
          <div className="grid grid-cols-2 justify-end gap-6 w-full">
            <Section title="Media">
              <FormField
                control={form.control}
                name="imageUrl"
                render={() => (
                  <FormItem className="w-full">
                    <FormLabel>Partner Logo</FormLabel>
                    <div className="flex flex-col gap-4 w-full">
                      <div className="flex items-center gap-4 w-full">
                        {imagePreview ? (
                          <div className="relative w-64 h-32 border rounded-md overflow-hidden bg-gray-50">
                            <Image
                              src={imagePreview || "/placeholder.svg"}
                              alt="Partner logo preview"
                              fill
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <div className="flex items-center justify-center w-32 h-32 border rounded-md bg-muted/20">
                            <Upload className="h-8 w-8 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex flex-col gap-2 flex-1">
                          <Button
                            type="button"
                            variant="outline"
                            className="w-full sm:w-auto bg-transparent"
                            onClick={() =>
                              document.getElementById("partner-upload")?.click()
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
                        id="partner-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileChange}
                      />
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </Section>
            <Section title="Status">
              <div className="w-full">
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <SwitchCard
                      label="Active Status"
                      description="Partner will be visible to users"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
              </div>
            </Section>
          </div>
        </div>
        <div className="flex justify-end px-6 w-full mx-auto">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {mode === "create" ? "Creating..." : "Updating..."}
              </>
            ) : (
              <>{mode === "create" ? "Create Partner" : "Update Partner"}</>
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
  <div className="flex items-center justify-between rounded-lg border p-4 w-full">
    <div className="space-y-0.5">
      <p className="text-base font-medium">{label}</p>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
    <Switch checked={checked} onCheckedChange={onCheckedChange} />
  </div>
);
