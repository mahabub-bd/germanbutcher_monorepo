import { Recipe } from "@/utils/types";
import Image from "next/image";
import Link from "next/link";

interface RecipeProps {
  recipe: Recipe;
}

export default function RecipeCard({ recipe }: RecipeProps) {
  return (
    <div>
      <Link
        href={`/recipe/${recipe?.id}`}
        className="w-full h-full block group"
      >
        {/* Image Wrapper */}
        <div className="relative overflow-hidden rounded-lg aspect-[4/3]">
          <Image
            src={recipe?.attachment?.url}
            alt={recipe?.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-110"
            sizes="(max-width: 768px) 100vw, 33vw"
            loading="lazy"
          />
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 w-[90%] py-3 lg:py-4 px-5 bg-gradient-to-r from-primaryColor to-secondaryColor/20 rounded-lg z-10">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold text-whiteColor">
                  {recipe?.title}
                </h3>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}
