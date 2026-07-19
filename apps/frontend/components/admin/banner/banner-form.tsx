"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Upload } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { formPostData, patchData, postData } from "@/utils/api-utils";
import { bannerSchema } from "@/utils/form-validation";
import { Banner, BannerPosition, BannerType } from "@/utils/types";
import { Section } from "../helper";

type BannerFormValues = z.infer<typeof bannerSchema>;

interface BannerFormProps {
  mode: "create" | "edit";
  banner?: Banner;
}

export function BannerForm({ mode, banner }: BannerFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState("");
  const [imagePreview, setImagePreview] = useState(banner?.image?.url || "");
  const router = useRouter();

  const form = useForm<BannerFormValues>({
    resolver: zodResolver(bannerSchema),
    defaultValues: {
      title: banner?.title || "",
      description: banner?.description || "",
      targetUrl: banner?.targetUrl || "",
      position: banner?.position as BannerPosition,
      type: banner?.type as BannerType,
      isActive: banner?.isActive ?? true,
      displayOrder: banner?.displayOrder ?? 0,
      imageUrl: banner?.image?.url || "",
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

  const handleSubmit = async (data: BannerFormValues) => {
    setIsSubmitting(true);

    try {
      let attachmentId = banner?.image?.id;

      if (file) {
        const formData = new FormData();
        formData.append("file", file);
        const result = await formPostData("attachment", formData);
        attachmentId = result.data.id;
      }

      const bannerData = {
        ...data,
        imageId: attachmentId,
      };

      const endpoint = mode === "create" ? "banners" : `banners/${banner?.id}`;
      const method = mode === "create" ? postData : patchData;

      const response = await method(endpoint, bannerData);

      if (response?.statusCode === 200 || response?.statusCode === 201) {
        const successMessage =
          mode === "create"
            ? "Banner created successfully"
            : "Banner updated successfully";
        toast.success(successMessage);
        router.back();
      } else {
        toast.error(response?.message || "An error occurred");
      }
    } catch (error) {
      console.error("Error submitting banner form:", error);
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
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Banner Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter banner title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter banner description"
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="targetUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Target URL</FormLabel>
                  <FormControl>
                    <Input placeholder="https://example.com/promo" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </Section>

          {/* Banner Settings Section */}
          <Section title="Banner Settings">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel>Banner Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select banner type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.values(BannerType).map((type) => (
                          <SelectItem key={type} value={type}>
                            {type.charAt(0).toUpperCase() +
                              type.slice(1).toLowerCase()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="position"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel>Position</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select banner position" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.values(BannerPosition).map((position) => (
                          <SelectItem key={position} value={position}>
                            {position.charAt(0).toUpperCase() +
                              position.slice(1).toLowerCase()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="displayOrder"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel>Display Order</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        className="w-full"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </Section>

          {/* Media & Status Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Section title="Media">
              <FormField
                control={form.control}
                name="imageUrl"
                render={() => (
                  <FormItem>
                    <FormLabel>Banner Image</FormLabel>
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center gap-4">
                        {imagePreview ? (
                          <div className="relative w-64 h-32 border rounded-md overflow-hidden bg-gray-50">
                            <Image
                              src={imagePreview || "/placeholder.svg"}
                              alt="Banner preview"
                              fill
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <div className="flex items-center justify-center w-64 h-32 border rounded-md bg-muted/20">
                            <Upload className="h-8 w-8 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex flex-col gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() =>
                              document.getElementById("banner-upload")?.click()
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
                        id="banner-upload"
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
              <div className="grid grid-cols-1 gap-4">
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <SwitchCard
                      label="Active Status"
                      description="Banner will be visible to customers"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
              </div>
            </Section>
          </div>
        </div>

        <div className="flex justify-end p-6">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {mode === "create" ? "Creating..." : "Updating..."}
              </>
            ) : (
              <>{mode === "create" ? "Create Banner" : "Update Banner"}</>
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
