"use client";

import { RecipeForm } from "@/components/admin/recipe/recipe-form";
import { Button } from "@/components/ui/button";
import { CardDescription, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default function AddRecipePage() {
  return (
    <div className="md:p-6 p:2 space-y-6 border rounded-sm">
      <div className="md:p-6 p:2">
        <div className="flex justify-between items-center mb-6">
          <div>
            <CardTitle>Add New Recipe</CardTitle>
            <CardDescription>
              Create a new recipe. Fill in all the required information.
            </CardDescription>
          </div>
          <Button asChild variant="outline">
            <Link href="/admin/recipe/recipe-list">Back to Recipes</Link>
          </Button>
        </div>
      </div>
      <div>
        <RecipeForm mode="create" />
      </div>
    </div>
  );
}
