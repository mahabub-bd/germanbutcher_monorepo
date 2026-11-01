"use client";

import { LoadingIndicator } from "@/components/admin/loading-indicator";
import { RecipeForm } from "@/components/admin/recipe/recipe-form";
import { FormPageHeader } from "@/components/admin/form-page-header";
import { fetchData } from "@/utils/api-utils";
import { Recipe } from "@/utils/types";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AdminPageContainer } from "@/components/admin/admin-page-container";

export default function EditRecipePage() {
  const params = useParams();
  const recipeId = params.id as string;

  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRecipe = async () => {
    try {
      const response = await fetchData<Recipe>(`recipes/${recipeId}`);
      setRecipe(response);
    } catch (error) {
      console.error("Error fetching recipe:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRecipe();
  }, [recipeId]);

  if (isLoading) {
    return <LoadingIndicator message="Loading Recipe" />;
  }

  if (!recipe) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Recipe not found</p>
      </div>
    );
  }

  return (
    <AdminPageContainer>
      <FormPageHeader
        title="Edit Recipe"
        description="Update the recipe details and publish state."
        backHref="/admin/recipe/recipe-list"
        backLabel="Back to Recipes"
      />

      <RecipeForm mode="edit" recipe={recipe} />
    </AdminPageContainer>
  );
}
