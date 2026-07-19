import WishlistSection from "@/components/wishlist/wishlist";
import { deleteData, fetchProtectedData } from "@/utils/api-utils";
import { serverRevalidate } from "@/utils/revalidatePath";
import { Wishlist } from "@/utils/types";

export default async function WishlistPage({
  params,
}: {
  params: Promise<{ id?: string }>;
}) {
  const { id } = await params;

  const handleRemoveFromWishlist = async (productId: number) => {
    "use server";
    try {
      await deleteData(`wishlist/items`, productId);
      serverRevalidate(`/user/${id}/wishlist`);
    } catch (error) {
      console.error("Error removing from wishlist:", error);
      throw error;
    }
  };

  try {
    const wishlistData: Wishlist = await fetchProtectedData("wishlist");

    return (
      <WishlistSection
        wishlistData={wishlistData}
        onRemoveItem={handleRemoveFromWishlist}
      />
    );
  } catch (error) {
    console.error("Error fetching wishlist data:", error);
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Unable to Load Wishlist
          </h1>
          <p className="text-gray-600 mb-6">
            There was an error loading your wishlist. Please try again.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }
}
