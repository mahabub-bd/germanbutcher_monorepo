"use client";

import { RecipeForm } from "@/components/admin/recipe/recipe-form";
import { FormPageHeader } from "@/components/admin/form-page-header";

export default function AddRecipePage() {
  return (
    <div className="md:p-4 p-2 space-y-6 rounded-sm">
        <FormPageHeader
        title="Add New Recipe"
        description="Create a new recipe. Fill in all the required information."
        backHref="/admin/recipe/recipe-list"
        backLabel="Back to Recipes"
      />
      <div>
        <RecipeForm mode="create" />
      </div>
    </div>
  );
}
