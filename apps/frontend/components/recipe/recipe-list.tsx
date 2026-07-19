import { fetchData } from "@/utils/api-utils";
import type { Recipe } from "@/utils/types";
import { BookCopy, ShieldOff } from "lucide-react";
import type { ReactNode } from "react";
import RecipeCard from "./recipe-card";

interface Props {
  children: ReactNode;
  endpoint: string | null;
}

export default async function RecipeList({ children, endpoint }: Props) {
  if (endpoint === null) {
    return (
      <div className="container mx-auto py-4 sm:px-1 md:py-8 lg:py-10 md:px-2">
        {children}
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-4">
            <ShieldOff size={64} className="text-gray-400" />
          </div>
          <h3 className="text-xl font-medium text-gray-700 mb-2">
            No recipes to display
          </h3>
          <p className="text-gray-500 max-w-md">
            Please select a category or search for recipes to get started
          </p>
        </div>
      </div>
    );
  }

  const recipes: Recipe[] = await fetchData(endpoint);

  if (!recipes || recipes.length === 0) {
    return (
      <div className="container mx-auto py-4 sm:px-1 md:py-8 lg:py-10 md:px-2">
        {children}
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-4">
            <BookCopy size={64} className="text-gray-400" />
          </div>
          <h3 className="text-xl font-medium text-gray-700 mb-2">
            No recipes found
          </h3>
          <p className="text-gray-500 max-w-md">
            Try adjusting your search or selecting a different category
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-4 sm:px-1 md:py-8 lg:py-10 md:px-2">
      {children}
      <div className="grid grid-cols-1 md:px-0 px-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3  md:gap-4 lg:gap-6 gap-4">
        {recipes.map((recipe: Recipe) => (
          <RecipeCard key={recipe.id} recipe={recipe} />
        ))}
      </div>
    </div>
  );
}
