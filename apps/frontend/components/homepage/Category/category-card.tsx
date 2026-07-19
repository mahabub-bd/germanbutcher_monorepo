import { Category } from "@/utils/types";
import Image from "next/image";
import Link from "next/link";

interface CategoryCardProps {
  category: Category;
}

export default function CategoryCard({ category }: CategoryCardProps) {
  // Determine the href based on category
  const href =
    category.id === 2500
      ? "/products/flash-sale"
      : `/categories/${category.slug || category.id}`;

  return (
    <Link
      href={href}
      className="group block rounded-lg overflow-hidden"
      prefetch={true}
    >
      <div className="flex w-full items-center justify-center">
        <div className="relative md:w-45 md:h-45 w-24 h-24 rounded-full p-2 flex items-center justify-center group-hover:border-primary transition-colors duration-200">
          <div className="relative w-full h-full rounded-full overflow-hidden bg-gray-100">
            <Image
              src={category?.attachment?.url || "/category-placeholder.svg"}
              alt={`${category?.name} category`}
              title={`${category?.name} category`}
              fill
              className="object-cover transition-transform duration-200 group-hover:scale-105"
              loading="lazy"
              sizes="(max-width: 768px) 100px, 150px"
              quality={75}
            />
          </div>
        </div>
      </div>

      <div className="p-2 text-center">
        <h3 className="text-base sm:text-base font-semibold md:text-lg text-primaryColor group-hover:text-primary transition-colors duration-200 line-clamp-2 min-h-10 flex items-center justify-center">
          {category?.name}
        </h3>
      </div>
    </Link>
  );
}
