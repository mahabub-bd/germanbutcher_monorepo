import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatDateTime } from "@/lib/utils";
import type { Recipe } from "@/utils/types";
import {
  Apple,
  BookOpen,
  Calendar,
  ChefHat,
  Clock,
  Info,
  Tag,
  User,
} from "lucide-react";
import Image from "next/image";
import { RecipeBreadcrumb } from "./recipe-bradcrumb";

function formatRecipeInstructions(details: string) {
  const sections = details.split("\n\n \n\n");

  return sections.map((section, index) => {
    const lines = section.split("\n");
    const title = lines[0].trim();
    const instructions = lines.slice(1).join("\n").trim();

    return (
      <div key={index} className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center">
            <span className="text-orange-600 text-sm font-semibold">
              {index + 1}
            </span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>
        <div className="text-gray-700 leading-relaxed whitespace-pre-line pl-8">
          {instructions}
        </div>
      </div>
    );
  });
}

export default async function RecipeDetails({
  recipeData,
}: {
  recipeData: Recipe;
}) {
  return (
    <div className="min-h-screen ">
      <div className="container mx-auto px-4 md:py-5">
        {/* Breadcrumbs */}
        <RecipeBreadcrumb
          categoryName={recipeData.category?.name}
          categorySlug={recipeData.category?.slug}
          recipeName={recipeData.title}
        />

        {/* Recipe Header */}
        <div className="bg-white rounded-md shadow-sm overflow-hidden mb-8">
          <div className="relative h-[400px]">
            <Image
              src={recipeData.attachment.url || "/placeholder.svg"}
              alt={recipeData.title}
              fill
              className="object-cover"
              priority
            />
          </div>

          <div className="md:p-6 p-4">
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <Badge variant="secondary" className="flex items-center gap-1">
                <Tag className="w-3 h-3" />
                {recipeData.category?.name}
              </Badge>
              {recipeData.isPublished && (
                <Badge variant="default" className="flex items-center gap-1">
                  <BookOpen className="w-3 h-3" />
                  Published
                </Badge>
              )}
            </div>

            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {recipeData.title}
            </h1>

            <div className="flex flex-wrap items-center gap-6 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                <span>By {recipeData.createdBy.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>Created {formatDateTime(recipeData.createdAt)}</span>
              </div>
              {recipeData.updatedAt !== recipeData.createdAt && (
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>Updated {formatDateTime(recipeData.updatedAt)}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recipe Content */}
        <div className="grid gap-8 md:grid-cols-3">
          {/* Main Content */}
          <div className="md:col-span-2">
            <div className=" rounded-md md:p-6 p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-6">
                <ChefHat className="w-5 h-5 text-orange-600" />
                <h2 className="text-xl font-semibold text-gray-900">
                  Cooking Instructions
                </h2>
              </div>
              <div className="prose prose-gray max-w-none">
                {formatRecipeInstructions(recipeData.details)}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Category Section */}
            <div className=" rounded-md md:p-6 p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Tag className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Category
                </h3>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative w-12 h-12 rounded-lg overflow-hidden">
                  <Image
                    src={
                      recipeData.category?.attachment?.url || "/placeholder.svg"
                    }
                    alt={recipeData.category?.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div>
                  <h4 className="font-semibold">
                    {recipeData?.category?.name}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {recipeData.category?.description}
                  </p>
                </div>
              </div>
            </div>

            {/* Recipe Info */}
            <div className=" rounded-md md:p-6  p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Info className="w-5 h-5 text-green-600" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Recipe Information
                </h3>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600 flex items-center gap-1">
                    <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                    Recipe ID
                  </label>
                  <p className="text-sm mt-1 pl-3">{recipeData.id}</p>
                </div>
                <Separator />
                <div>
                  <label className="text-sm font-medium text-gray-600 flex items-center gap-1">
                    <User className="w-3 h-3" />
                    Author
                  </label>
                  <p className="text-sm mt-1 pl-4">
                    {recipeData.createdBy.name}
                  </p>
                </div>
                <Separator />
                <div>
                  <label className="text-sm font-medium text-gray-600 flex items-center gap-1">
                    <User className="w-3 h-3" />
                    Last Updated By
                  </label>
                  <p className="text-sm mt-1 pl-4">
                    {recipeData.updatedBy.name}
                  </p>
                </div>
                <Separator />
                <div>
                  <label className="text-sm font-medium text-gray-600 flex items-center gap-1">
                    <BookOpen className="w-3 h-3" />
                    Status
                  </label>
                  <p className="text-sm mt-1 pl-4">
                    {recipeData.isPublished ? "Published" : "Draft"}
                  </p>
                </div>
              </div>
            </div>

            {/* Nutrition Details */}
            {recipeData.nutrition_details && (
              <div className="bg-white rounded-md md:p-6 p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <Apple className="w-5 h-5 text-red-600" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    Nutrition Information
                  </h3>
                </div>
                <p className="text-sm text-gray-600">
                  {recipeData.nutrition_details ||
                    "No nutrition information available."}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
