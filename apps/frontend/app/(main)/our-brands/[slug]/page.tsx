import { sisterConcerns } from "@/constants";
import { SisterConcern } from "@/utils/types";
import Image from "next/image";
import { notFound } from "next/navigation";

function createSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeString(str: string): string {
  return str.toLowerCase().trim().replace(/\s+/g, " ");
}

function findBrandBySlug(slug: string): SisterConcern | undefined {
  const decodedSlug = decodeURIComponent(slug);
  const normalizedSlug = normalizeString(decodedSlug);

  return sisterConcerns.find((concern) => {
    const normalizedName = normalizeString(concern.name);
    const concernSlug = createSlug(concern.name);

    return (
      concernSlug === slug.toLowerCase() ||
      normalizedName === normalizedSlug ||
      normalizedName === normalizedSlug.replace(/-/g, " ") ||
      normalizedName.replace(/\s+/g, "-") === normalizedSlug ||
      concern.name.toLowerCase() === decodedSlug.toLowerCase()
    );
  });
}

interface BrandPageProps {
  params: Promise<{ slug: string }>;
}

export default async function BrandPage({ params }: BrandPageProps) {
  const { slug } = await params;

  const brandData = findBrandBySlug(slug);

  if (!brandData) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="relative h-96 bg-gradient-to-r from-gray-900 to-gray-700">
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative h-full flex items-center justify-center">
          <div className="text-center text-white">
            <h1 className="text-5xl font-bold mb-4">{brandData.name}</h1>
            <p className="text-xl max-w-2xl mx-auto px-4">
              {brandData.description}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className=" container mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Brand Image */}
          <div className="relative">
            <div className="aspect-video  overflow-hidden flex items-center justify-center">
              <Image
                src={brandData.imageUrl}
                alt={`${brandData.name} restaurant interior`}
                className="object-contain w-80"
                width={800}
                height={600}
                priority
              />
            </div>
          </div>

          {/* Brand Details */}
          <div className="space-y-8">
            {/* Basic Information */}
            {brandData.details.established && (
              <div className="bg-white p-6 rounded-xl shadow-lg">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">
                  Established
                </h2>
                <p className="text-lg text-gray-600">
                  {brandData.details.established}
                </p>
              </div>
            )}

            {/* Concept */}
            {brandData.details.concept && (
              <div className="bg-white p-6 rounded-xl shadow-lg">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">
                  Our Concept
                </h2>
                <p className="text-gray-600 leading-relaxed">
                  {brandData.details.concept}
                </p>
              </div>
            )}

            {/* Cuisine Type */}
            {brandData.details.cuisineType && (
              <div className="bg-white p-6 rounded-xl shadow-lg">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">
                  Cuisine Type
                </h2>
                <p className="text-gray-600">{brandData.details.cuisineType}</p>
              </div>
            )}

            {/* Business Model */}
            {brandData.details.businessModel && (
              <div className="bg-white p-6 rounded-xl shadow-lg">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">
                  Business Model
                </h2>
                <p className="text-gray-600">
                  {brandData.details.businessModel}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Specialties Section */}
        {brandData.details.specialties &&
          brandData.details.specialties.length > 0 && (
            <div className="mt-16">
              <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">
                Our Specialties
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {brandData.details.specialties.map((specialty, index) => (
                  <div
                    key={index}
                    className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow"
                  >
                    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                      <span className="text-red-600 font-bold text-lg">
                        {index + 1}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">
                      {specialty}
                    </h3>
                  </div>
                ))}
              </div>
            </div>
          )}

        {/* Atmosphere & Experience */}
        <div className="mt-16 grid md:grid-cols-2 gap-8">
          {brandData.details.atmosphere && (
            <div className="bg-white p-8 rounded-xl shadow-lg">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                Atmosphere
              </h2>
              <p className="text-gray-600 leading-relaxed">
                {brandData.details.atmosphere}
              </p>
            </div>
          )}

          {brandData.details.diningExperience && (
            <div className="bg-white p-8 rounded-xl shadow-lg">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                Dining Experience
              </h2>
              <p className="text-gray-600 leading-relaxed">
                {brandData.details.diningExperience}
              </p>
            </div>
          )}

          {brandData.details.service && (
            <div className="bg-white p-8 rounded-xl shadow-lg">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Service</h2>
              <p className="text-gray-600 leading-relaxed">
                {brandData.details.service}
              </p>
            </div>
          )}

          {brandData.details.location && (
            <div className="bg-white p-8 rounded-xl shadow-lg">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                Location
              </h2>
              <p className="text-gray-600 leading-relaxed">
                {brandData.details.location}
              </p>
            </div>
          )}
        </div>

        {/* Key Features */}
        {brandData.details.keyFeatures &&
          brandData.details.keyFeatures.length > 0 && (
            <div className="mt-16">
              <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">
                What Makes Us Special
              </h2>
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <div className="grid md:grid-cols-2 gap-6">
                  {brandData.details.keyFeatures.map((feature, index) => (
                    <div key={index} className="flex items-start space-x-4">
                      <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                        <svg
                          className="w-4 h-4 text-white"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <p className="text-gray-700 leading-relaxed">{feature}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        {/* Cooking Methods (for restaurants with specific techniques) */}
        {brandData.details.cookingMethods &&
          brandData.details.cookingMethods.length > 0 && (
            <div className="mt-16">
              <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">
                Our Cooking Methods
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                {brandData.details.cookingMethods.map((method, index) => (
                  <div
                    key={index}
                    className="bg-gradient-to-r from-red-50 to-orange-50 p-6 rounded-xl border border-red-100"
                  >
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">
                      {method}
                    </h3>
                  </div>
                ))}
              </div>
            </div>
          )}

        {/* Call to Action */}
        <div className="mt-16 text-center">
          <div className="bg-gradient-to-r from-red-600 to-red-700 text-white p-12 rounded-2xl">
            <h2 className="text-3xl font-bold mb-4">
              Visit {brandData.name} Today
            </h2>
            <p className="text-xl mb-8 opacity-90">
              Experience the finest {brandData.name.toLowerCase()} cuisine
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-white text-red-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
                Find Locations
              </button>
              <button className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-red-600 transition-colors">
                View Menu
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
