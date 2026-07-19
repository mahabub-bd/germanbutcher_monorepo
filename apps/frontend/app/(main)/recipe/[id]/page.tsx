import RecipeDetails from "@/components/recipe/recipe-details/recipe-details";
import { fetchData } from "@/utils/api-utils";
import { Recipe } from "@/utils/types";

export default async function RecipeDetilsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const recipeData: Recipe = await fetchData(`recipes/${id}`);

  return <RecipeDetails recipeData={recipeData} />;
}
