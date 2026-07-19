import { SisterConcern } from "@/utils/types";
import Image from "next/image";
import Link from "next/link";

// Helper function to create SEO-friendly slugs
const createSlug = (name: string): string => {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // Remove special characters
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens
};

const SisterConcernCard: React.FC<{ concern: SisterConcern }> = ({
  concern,
}) => {
  // Create SEO-friendly slug
  const brandSlug = createSlug(concern.name);

  return (
    <div className=" p-2 group bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2">
      <div className="relative aspect-[4/3] overflow-hidden w-[160px] mx-auto">
        <Image
          src={concern.imageUrl}
          alt={concern.name}
          width={150}
          height={113}
          className="w-full h-full object-contain transition-transform duration-700 ease-out"
        />
      </div>

      <div className="p-6 space-y-4">
        <div className="space-y-2">
          <h3 className="text-2xl font-bold text-gray-900 group-hover:text-primaryColor transition-colors duration-300">
            {concern.name}
          </h3>
          <div className="w-12 h-1 bg-gradient-to-r from-primaryColor to-secondaryColor rounded-full transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
        </div>

        <p className="text-gray-800 text-md leading-relaxed line-clamp-5">
          {concern.description}
        </p>

        <div className="flex items-center justify-between pt-2">
          <Link
            href={`/our-brands/${brandSlug}`}
            className="group/btn bg-gradient-to-r from-primaryColor to-secondaryColor text-white px-6 py-2.5 rounded-lg hover:from-gray-700 hover:to-gray-800 transition-all duration-300 text-sm font-semibold shadow-md hover:shadow-lg transform hover:scale-105 inline-flex items-center gap-2"
          >
            Explore
            <svg
              className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform duration-200"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </Link>

          <div className="flex items-center gap-2 text-gray-400">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
            </svg>
            <span className="text-xs font-medium">Verified</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SisterConcernCard;
