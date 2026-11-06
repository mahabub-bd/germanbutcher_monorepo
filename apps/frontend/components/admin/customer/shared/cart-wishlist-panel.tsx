"use client";

import { CalendarClock, ShoppingCart } from "lucide-react";

/** Cart line from the CRM 360 / users extras payload. */
export interface CartItemRow {
    id: number;
    quantity: number;
    product?: { id: number; name: string; salePrice: number } | null;
}

/** Wishlist line — quantity is not tracked, just the saved product. */
export interface WishlistItemRow {
    id: number;
    product?: { id: number; name: string; salePrice: number } | null;
}

interface CartWishlistPanelProps {
    cartItems: CartItemRow[];
    wishlistItems: WishlistItemRow[];
    /** Wishlist rows shown before truncating; both detail pages cap at 10. */
    wishlistLimit?: number;
}

/**
 * "Cart & Wishlist" tab shared by the admin customer detail and CRM 360
 * pages: two bordered cards listing current cart lines and saved wishlist
 * products.
 */
export function CartWishlistPanel({
    cartItems,
    wishlistItems,
    wishlistLimit = 10,
}: CartWishlistPanelProps) {
    const visibleWishlist = wishlistItems.slice(0, wishlistLimit);

    return (
        <div className="grid md:grid-cols-2 gap-4">
            <div className="rounded-lg border bg-card p-4 space-y-3">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                    <ShoppingCart className="h-4 w-4" /> Current Cart
                </h3>
                {cartItems.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Cart is empty.</p>
                ) : (
                    <div className="space-y-2">
                        {cartItems.map((item) => (
                            <div
                                key={item.id}
                                className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                            >
                                <span className="truncate">{item.product?.name}</span>
                                <span className="text-muted-foreground ml-2">
                                    {item.quantity} × {item.product?.salePrice?.toLocaleString()}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="rounded-lg border bg-card p-4 space-y-3">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                    <CalendarClock className="h-4 w-4" /> Wishlist
                </h3>
                {visibleWishlist.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Wishlist is empty.</p>
                ) : (
                    <div className="space-y-2">
                        {visibleWishlist.map((item) => (
                            <div
                                key={item.id}
                                className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                            >
                                <span className="truncate">{item.product?.name}</span>
                                <span className="text-muted-foreground ml-2">
                                    {item.product?.salePrice?.toLocaleString()}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
