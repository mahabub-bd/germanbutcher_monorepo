"use client";

import { LoadingIndicator } from "@/components/admin/loading-indicator";
import { RecipeForm } from "@/components/admin/recipe/recipe-form";
import { Button } from "@/components/ui/button";
import { CardTitle } from "@/components/ui/card";
import { fetchData } from "@/utils/api-utils";
import { Recipe } from "@/utils/types";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

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
    <div className="md:p-4 p-2 space-y-6 rounded-sm">
        <div className="flex justify-between items-center mb-6">
          <div>
            <CardTitle>Edit Recipe</CardTitle>
          </div>
          <Button asChild variant="outline">
            <Link href="/admin/recipe/recipe-list">Back to Recipes</Link>
          </Button>
        </div>

      <RecipeForm mode="edit" recipe={recipe} />
    </div>
  );
}
