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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  fetchData,
  formPostData,
  patchData,
  postData,
} from "@/utils/api-utils";
import type { Category, Recipe } from "@/utils/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Upload } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type React from "react";
import { useEffect, useState } from "react";
import { type Resolver, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Section } from "../helper";

const recipeSchema = z.object({
  title: z.string().min(1, "Title is required"),
  details: z.string().min(1, "Details are required"),
  nutrition_details: z.string().optional(),
  isPublished: z.boolean(),
  imageUrl: z.string().optional(),
  categoryId: z.union([z.string(), z.number()])
    .transform((val) => typeof val === 'string' ? parseInt(val, 10) : val)
    .pipe(z.number()),
});

type RecipeFormValues = z.output<typeof recipeSchema>;

interface RecipeFormProps {
  mode: "create" | "edit";
  recipe?: Recipe;
}

export function RecipeForm({ mode, recipe }: RecipeFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState("");
  const [imagePreview, setImagePreview] = useState(
    recipe?.attachment?.url || ""
  );
  const [categories, setCategories] = useState<Category[]>([]);
  const router = useRouter();


  const form = useForm<RecipeFormValues>({
    resolver: zodResolver(recipeSchema) as Resolver<RecipeFormValues>,
    defaultValues: {
      title: recipe?.title || "",
      details: recipe?.details || "",
      nutrition_details: recipe?.nutrition_details || "",
      isPublished: recipe?.isPublished ?? false,
      imageUrl: recipe?.attachment?.url || "",
      categoryId: recipe?.category?.id || 0,
    },
  });

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetchData<Category[]>(
          "categories?isMainCategory=true"
        );
        setCategories(response);
      } catch (error) {
        console.error("Error fetching categories:", error);
        toast.error("Failed to load categories");
      }
    };

    fetchCategories();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setFileName(selectedFile.name);

    const fileUrl = URL.createObjectURL(selectedFile);
    setImagePreview(fileUrl);

    form.setValue("imageUrl", "");
  };

  const handleSubmit = async (data: RecipeFormValues) => {
    setIsSubmitting(true);

    try {
      let attachmentId = recipe?.attachment?.id;

      if (file) {
        const formData = new FormData();
        formData.append("file", file);
        const result = await formPostData("attachment", formData);
        attachmentId = result.data.id;
      }

      const recipeData = {
        ...data,
        attachment: attachmentId,
        category: data.categoryId,
      };

      const endpoint = mode === "create" ? "recipes" : `recipes/${recipe?.id}`;
      const method = mode === "create" ? postData : patchData;

      const response = await method(endpoint, recipeData);

      if (response?.statusCode === 200 || response?.statusCode === 201) {
        const successMessage =
          mode === "create"
            ? "Recipe created successfully"
            : "Recipe updated successfully";
        toast.success(successMessage);
        router.back();
      } else {
        toast.error(response?.message || "An error occurred");
      }
    } catch (error) {
      console.error("Error submitting recipe form:", error);
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
        <div className="p-6 space-y-6 w-full  mx-auto">
          {/* Basic Information Section */}
          <Section title="Basic Information">
            <div className=" w-full grid md:grid-cols-2 grid-cols-1 gap-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel>Recipe Title</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter recipe title"
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
                name="categoryId"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel>Category</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value.toString()}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem
                            key={category.id}
                            value={category.id.toString()}
                          >
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </Section>

          <Section title="Information">
            <div className="grid grid-cols-1 gap-6">
              <FormField
                control={form.control}
                name="details"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel>Recipe Details</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter recipe details, ingredients, and instructions"
                        className="w-full min-h-37.5"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="nutrition_details"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel>Nutrition Details</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter nutrition information (optional)"
                        className="w-full "
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
          <div className="grid grid-cols-2 justify-end gap-6 w-full">
            <Section title="Media">
              <FormField
                control={form.control}
                name="imageUrl"
                render={() => (
                  <FormItem className="w-full">
                    <FormLabel>Recipe Image</FormLabel>
                    <div className="flex flex-col gap-4 w-full">
                      <div className="flex items-center gap-4 w-full">
                        {imagePreview ? (
                          <div className="relative w-32 h-32 border rounded-md overflow-hidden bg-gray-50">
                            <Image
                              src={imagePreview || "/placeholder.svg"}
                              alt="Recipe preview"
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
                            className="w-full sm:w-auto"
                            onClick={() =>
                              document.getElementById("recipe-upload")?.click()
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
                        id="recipe-upload"
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
                  name="isPublished"
                  render={({ field }) => (
                    <SwitchCard
                      label="Published Status"
                      description="Recipe will be visible to users"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
              </div>
            </Section>
          </div>
        </div>

        <div className="flex justify-end px-6 w-full  mx-auto">
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
              <>{mode === "create" ? "Create Recipe" : "Update Recipe"}</>
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
