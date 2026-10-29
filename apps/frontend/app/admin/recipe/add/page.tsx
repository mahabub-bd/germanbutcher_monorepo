"use client";

import { RecipeForm } from "@/components/admin/recipe/recipe-form";
import { FormPageHeader } from "@/components/admin/form-page-header";
import { AdminPageContainer } from "@/components/admin/admin-page-container";

export default function AddRecipePage() {
  return (
    <AdminPageContainer>
        <FormPageHeader
        title="Add New Recipe"
        description="Create a new recipe. Fill in all the required information."
        backHref="/admin/recipe/recipe-list"
        backLabel="Back to Recipes"
      />
      <div>
        <RecipeForm mode="create" />
      </div>
    </AdminPageContainer>
  );
}
