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
import { testimonialSchema } from "@/utils/form-validation";
import type { Testimonial } from "@/utils/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Star, Upload } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type * as z from "zod";

interface TestimonialFormProps {
  testimonial?: Testimonial;
  mode: "create" | "edit";
  onSuccess: () => void;
}

export function TestimonialForm({
  testimonial,
  mode,
  onSuccess,
}: TestimonialFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState("");
  const [imagePreview, setImagePreview] = useState(
    testimonial?.attachment?.url || ""
  );

  const form = useForm<z.infer<typeof testimonialSchema>>({
    resolver: zodResolver(testimonialSchema),
    defaultValues: {
      name: testimonial?.name || "",
      role: testimonial?.role || "",
      text: testimonial?.text || "",
      rating: testimonial?.rating || 5,
      isPublish: testimonial?.isPublish ?? false,
      imageUrl: testimonial?.attachment?.url || "",
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

  const onSubmit = async (values: z.infer<typeof testimonialSchema>) => {
    setIsSubmitting(true);
    try {
      let attachmentId = testimonial?.attachment?.id;

      // Upload file if selected
      if (file) {
        const formData = new FormData();
        formData.append("file", file);
        const result = await formPostData("attachment", formData);
        attachmentId = result.data.id;
      }

      // Prepare testimonial data
      const testimonialData = {
        name: values.name,
        role: values.role,
        text: values.text,
        rating: values.rating,
        isPublish: values.isPublish,
        attachmentId: attachmentId ? attachmentId.toString() : null,
      };

      if (mode === "create") {
        await postData("testimonials", testimonialData);
        toast.success("Testimonial created successfully");
      } else if (mode === "edit" && testimonial) {
        await patchData(`testimonials/${testimonial.id}`, testimonialData);
        toast.success("Testimonial updated successfully");
      }

      onSuccess();
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error(
        mode === "create"
          ? error instanceof Error
            ? `${error.message}`
            : "Failed to create testimonial"
          : error instanceof Error
            ? `${error.message}`
            : "Failed to update testimonial"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper function to render star rating selector
  const renderStarRating = (
    value: number,
    onChange: (rating: number) => void
  ) => {
    return (
      <div className="flex items-center gap-1">
        {Array.from({ length: 5 }, (_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onChange(i + 1)}
            className="focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
          >
            <Star
              className={`h-6 w-6 transition-colors ${
                i < value
                  ? "fill-yellow-400 text-yellow-400 hover:fill-yellow-500 hover:text-yellow-500"
                  : "text-gray-300 hover:text-yellow-300"
              }`}
            />
          </button>
        ))}
        <span className="ml-2 text-sm font-medium">
          ({value} star{value !== 1 ? "s" : ""})
        </span>
      </div>
    );
  };

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      if (imagePreview && !imagePreview.startsWith("http")) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 gap-4 w-full mx-auto">
          {/* Customer Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Customer Information</h3>

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel>Name *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter customer's name"
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
              name="role"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel>Role *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Loyal Customer, CEO, Manager, etc."
                      {...field}
                      className="w-full"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Testimonial Content */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Testimonial Content</h3>

            <FormField
              control={form.control}
              name="text"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel>Testimonial Text *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter the customer's testimonial..."
                      rows={6}
                      {...field}
                      className="w-full resize-none"
                    />
                  </FormControl>
                  <FormMessage />
                  <p className="text-xs text-muted-foreground">
                    Write the customer&apos;s review or testimonial in their own
                    words
                  </p>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="rating"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel>Rating *</FormLabel>
                  <FormControl>
                    <div className="flex flex-col gap-2">
                      {renderStarRating(field.value, field.onChange)}
                    </div>
                  </FormControl>
                  <FormMessage />
                  <p className="text-xs text-muted-foreground">
                    Click on the stars to set the rating (1-5 stars)
                  </p>
                </FormItem>
              )}
            />
          </div>

          {/* Attachment Upload */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Attachment (Optional)</h3>

            <FormField
              control={form.control}
              name="imageUrl"
              render={() => (
                <FormItem className="space-y-2">
                  <FormLabel>Customer Photo or Document</FormLabel>
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-4">
                      {imagePreview ? (
                        <div className="relative w-24 h-24 border rounded-md overflow-hidden bg-gray-50">
                          <Image
                            src={imagePreview}
                            alt="Testimonial attachment preview"
                            fill
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="flex items-center justify-center w-24 h-24 border rounded-md bg-muted/20">
                          <Upload className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex flex-col gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            document
                              .getElementById("testimonial-upload")
                              ?.click()
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
                      id="testimonial-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                  </div>
                  <FormMessage />
                  <p className="text-xs text-muted-foreground">
                    Optional: Upload a customer photo or related document
                  </p>
                </FormItem>
              )}
            />
          </div>

          {/* Publishing Status */}
          <FormField
            control={form.control}
            name="isPublish"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 space-y-0">
                <div className="space-y-0.5">
                  <FormLabel>Publish Status</FormLabel>
                  <p className="text-sm text-muted-foreground">
                    {field.value
                      ? "This testimonial will be visible to the public"
                      : "This testimonial will be saved as a draft"}
                  </p>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end space-x-4 pt-2 mx-auto">
          <Button
            type="button"
            variant="outline"
            onClick={onSuccess}
            disabled={isSubmitting}
            className="w-24"
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting} className="w-32">
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mode === "create" ? "Create" : "Update"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
