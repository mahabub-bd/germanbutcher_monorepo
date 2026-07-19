"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import { applyCoupon as applyCouponApi } from "@/lib/coupon-service";
import { deleteData, patchData, postData } from "@/utils/api-utils";
import {
  backendCouponToLocalCoupon,
  clearLocalCoupon,
  getCartFromLocalStorage,
  getCouponFromLocalStorage,
  type LocalCart,
  type LocalCartItem,
  type LocalCoupon,
  saveCartToLocalStorage,
  saveCouponToLocalStorage,
} from "@/utils/cart-storage";
import { serverRevalidate } from "@/utils/revalidatePath";
import type { Cart, CartItem, Product } from "@/utils/types";

type UseCartProps = {
  serverCart?: Cart;
  isLoggedIn: boolean;
};

export function useCart({ serverCart, isLoggedIn }: UseCartProps) {
  const [localCart, setLocalCart] = useState<LocalCart | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<LocalCoupon | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isInitialized || !isMounted) return;

    if (isLoggedIn && serverCart) {
      setLocalCart(null);
    } else {
      const storedCart = getCartFromLocalStorage();
      const storedCoupon = getCouponFromLocalStorage();

      if (storedCart) {
        // Check if cart is older than 1 hour, refresh product data
        const cartAge = Date.now() - storedCart.lastUpdated;
        const oneHour = 60 * 60 * 1000;

        if (cartAge > oneHour && storedCart.items.length > 0) {
          // Refresh product data for items in cart
          refreshCartProductData(storedCart);
        } else {
          setLocalCart(storedCart);
        }
      } else {
        setLocalCart({ items: [], lastUpdated: Date.now() });
      }

      if (storedCoupon) {
        setAppliedCoupon(storedCoupon);
      }
    }

    setIsInitialized(true);
  }, [isLoggedIn, serverCart, isInitialized, isMounted]);

  useEffect(() => {
    if (!isLoggedIn && localCart) {
      saveCartToLocalStorage(localCart);
    }
  }, [localCart, isLoggedIn]);

  useEffect(() => {
    if (!isLoggedIn && appliedCoupon) {
      saveCouponToLocalStorage(appliedCoupon);
    }
  }, [appliedCoupon, isLoggedIn]);

  useEffect(() => {
    const syncCartWithServer = async () => {
      if (isLoggedIn && localCart && localCart.items.length > 0) {
        setIsLoading(true);
        try {
          for (const item of localCart.items) {
            await postData("cart/items", {
              productId: item.productId,
              quantity: item.quantity,
            });
          }

          if (appliedCoupon) {
            try {
              // Build cartItems array from local cart for coupon application
              const cartItems = localCart.items
                .filter((item) => item.product?.isActive !== false)
                .map((item) => ({
                  productId: item.productId,
                  price: item.product.sellingPrice,
                }));
              await applyCouponApi(appliedCoupon.code, cartItems);
            } catch (error) {
              console.error("Error syncing coupon:", error);
            }
          }

          setLocalCart(null);
          saveCartToLocalStorage({ items: [], lastUpdated: Date.now() });
          clearLocalCoupon();

          serverRevalidate("/");
          serverRevalidate("/cart");
          serverRevalidate("/checkout");

          toast.success("Cart synced successfully", {
            description: "Your cart has been synced with your account",
          });
        } catch (error) {
          console.error("Error syncing cart:", error);
          toast.error("Failed to sync cart", {
            description: "Please try again later",
          });
        } finally {
          setIsLoading(false);
        }
      }
    };

    syncCartWithServer();
  }, [isLoggedIn, localCart, appliedCoupon]);

  const addItem = async (product: Product, quantity = 1) => {
    setIsLoading(true);

    try {
      if (isLoggedIn) {
        await postData("cart/items", {
          productId: product.id,
          quantity,
        });

        serverRevalidate("/");
        serverRevalidate("/cart");
      } else {
        setLocalCart((prev) => {
          if (!prev)
            return {
              items: [{ productId: product.id, quantity, product }],
              lastUpdated: Date.now(),
            };

          const existingItemIndex = prev.items.findIndex(
            (item) => item.productId === product.id
          );

          if (existingItemIndex >= 0) {
            const updatedItems = [...prev.items];
            updatedItems[existingItemIndex] = {
              ...updatedItems[existingItemIndex],
              quantity: updatedItems[existingItemIndex].quantity + quantity,
            };

            return {
              ...prev,
              items: updatedItems,
              lastUpdated: Date.now(),
            };
          } else {
            return {
              ...prev,
              items: [
                ...prev.items,
                { productId: product.id, quantity, product },
              ],
              lastUpdated: Date.now(),
            };
          }
        });
      }

      toast.success("Item added to cart", {
        description: `${product.name} has been added to your cart`,
      });
    } catch (error) {
      console.error("Error adding item to cart:", error);
      toast.error("Failed to add item", {
        description: "Please try again later",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateItemQuantity = async (
    itemId: number | string,
    quantity: number
  ) => {
    if (quantity < 1) return;
    setIsLoading(true);

    try {
      if (isLoggedIn) {
        await patchData(`cart/items/${itemId}`, { quantity });

        serverRevalidate("/");
        serverRevalidate("/cart");
      } else {
        setLocalCart((prev) => {
          if (!prev) return null;

          const updatedItems = prev.items.map((item) => {
            if (typeof itemId === "number" && item.productId === itemId) {
              return { ...item, quantity };
            }
            return item;
          });

          return {
            ...prev,
            items: updatedItems,
            lastUpdated: Date.now(),
          };
        });
      }
    } catch (error) {
      console.error("Error updating item quantity:", error);
      toast.error("Failed to update quantity", {
        description: "Please try again later",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const removeItem = async (itemId: number | string) => {
    setIsLoading(true);

    try {
      if (isLoggedIn) {
        await deleteData("cart/items", itemId);

        serverRevalidate("/");
        serverRevalidate("/cart");
      } else {
        setLocalCart((prev) => {
          if (!prev) return null;

          return {
            ...prev,
            items: prev.items.filter((item) => {
              if (typeof itemId === "number") {
                return item.productId !== itemId;
              }
              return true;
            }),
            lastUpdated: Date.now(),
          };
        });
      }

      toast.success("Item removed from cart");
    } catch (error) {
      console.error("Error removing item from cart:", error);
      toast.error("Failed to remove item", {
        description: "Please try again later",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const clearCart = async () => {
    setIsLoading(true);

    try {
      if (isLoggedIn) {
        await deleteData("cart", "");

        serverRevalidate("/");
        serverRevalidate("/cart");
      } else {
        setLocalCart({ items: [], lastUpdated: Date.now() });
        saveCartToLocalStorage({ items: [], lastUpdated: Date.now() });

        setAppliedCoupon(null);
        clearLocalCoupon();
      }

      toast.success("Cart cleared");
    } catch (error) {
      console.error("Error clearing cart:", error);
      toast.error("Failed to clear cart", {
        description: "Please try again later",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const applyCoupon = async (code: string, subtotal: number) => {
    if (!code.trim()) return;
    setIsLoading(true);

    try {
      // Get cart items with product data
      const items =
        isLoggedIn && serverCart ? serverCart.items : localCart?.items || [];
      const activeItems = items.filter((item) => item.product.isActive !== false);

      // Build cartItems array with productId and price
      const cartItems = activeItems.map((item) => ({
        productId: item.product.id,
        price: item.product.sellingPrice,
      }));

      // Apply coupon with cart items
      const applyRes = await applyCouponApi(code, cartItems);

      if (applyRes.statusCode === 200 && applyRes.data) {
        const couponData = backendCouponToLocalCoupon(
          applyRes.data.couponId,
          code,
          applyRes.data.discountValue
        );

        setAppliedCoupon(couponData);

        if (!isLoggedIn) {
          saveCouponToLocalStorage(couponData);
        } else {
          serverRevalidate("/cart");
          serverRevalidate("/checkout");
        }

        // Show success message with excluded products info if any
        if (applyRes.data.excludedProducts && applyRes.data.excludedProducts.length > 0) {
          const excludedNames = applyRes.data.excludedProducts.map((p) => p.name).join(", ");
          toast.success("Coupon applied successfully", {
            description: `Discount not applicable for: ${excludedNames}`,
          });
        } else {
          toast.success("Coupon applied successfully");
        }
        return;
      } else {
        throw new Error(applyRes.message || "Failed to apply coupon");
      }
    } catch (error) {
      console.error(error);
      setAppliedCoupon(null);
      if (!isLoggedIn) {
        clearLocalCoupon();
      }

      toast.error(error instanceof Error ? error.message : "Invalid coupon code");
    } finally {
      setIsLoading(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);

    if (!isLoggedIn) {
      clearLocalCoupon();
    } else {
      serverRevalidate("/cart");
      serverRevalidate("/checkout");
    }

    toast.success("Coupon removed");
  };

  const getCartTotals = () => {
    const items =
      isLoggedIn && serverCart ? serverCart.items : localCart?.items || [];

    // Filter out inactive products from calculations
    const activeItems = items.filter((item) => item.product.isActive !== false);

    const itemCount = activeItems.reduce((sum, item) => sum + item.quantity, 0);
    const productCount = activeItems.length;

    const originalSubtotal = activeItems.reduce((sum, item) => {
      const price = isLoggedIn
        ? item.product.sellingPrice
        : (item as LocalCartItem).product.sellingPrice;
      return sum + price * item.quantity;
    }, 0);

    const discountedSubtotal = activeItems.reduce((sum, item) => {
      const product = isLoggedIn
        ? item.product
        : (item as LocalCartItem).product;
      const discountedPrice = getDiscountedPrice(product);
      return sum + discountedPrice * item.quantity;
    }, 0);

    const productDiscounts = originalSubtotal - discountedSubtotal;

    return {
      itemCount,
      productCount,
      originalSubtotal,
      discountedSubtotal,
      productDiscounts,
    };
  };

  const getDiscountedPrice = (product: Product) => {
    const now = new Date();
    const startDate = new Date(product.discountStartDate ?? 0);
    const endDate = new Date(product.discountEndDate ?? 0);

    if (
      product.discountType &&
      product.discountValue &&
      now >= startDate &&
      now <= endDate
    ) {
      return product.discountType === "fixed"
        ? product.sellingPrice - product.discountValue
        : product.sellingPrice * (1 - product.discountValue / 100);
    }
    return product.sellingPrice;
  };

  const refreshCartProductData = async (storedCart: LocalCart) => {
    try {
      // Fetch current product data for all items in cart
      const itemResults = await Promise.all(
        storedCart.items.map(async (item) => {
          try {
            // Fetch current product data from API
            const response = await fetch(
              `${process.env.NEXT_PUBLIC_API_URL}/products/${item.productId}`
            );
            if (response.ok) {
              const currentProduct = await response.json();
              const productData = currentProduct.data || currentProduct;

              // Check if product is active
              if (productData.isActive === false) {
                // Return null to indicate this item should be removed
                return null;
              }

              return {
                ...item,
                product: productData,
              };
            }
          } catch (error) {
            console.error(
              `Error refreshing product ${item.productId}:`,
              error
            );
          }
          return item;
        })
      );

      // Filter out null values (inactive products) and undefined values
      const updatedItems = itemResults.filter(
        (item): item is (typeof itemResults)[0] & NonNullable<typeof itemResults[0]> =>
          item !== null && item !== undefined
      );

      const updatedCart = {
        ...storedCart,
        items: updatedItems,
        lastUpdated: Date.now(),
      };

      setLocalCart(updatedCart);
      saveCartToLocalStorage(updatedCart);

      // Notify user about removed products (inactive)
      const removedCount = storedCart.items.length - updatedItems.length;
      if (removedCount > 0) {
        toast.info("Cart updated", {
          description: `${removedCount} unavailable item(s) removed from your cart`,
        });
      }

      // Notify user about price updates
      const priceChanges = updatedItems.filter((item) => {
        const oldItem = storedCart.items.find(
          (oldItem) => oldItem.productId === item.productId
        );
        if (!oldItem) return false;

        const oldPrice = getDiscountedPrice(oldItem.product);
        const newPrice = getDiscountedPrice(item.product);
        return oldPrice !== newPrice;
      });

      if (priceChanges.length > 0) {
        toast.info("Cart prices updated", {
          description: `${priceChanges.length} item(s) price has been updated`,
        });
      }
    } catch (error) {
      console.error("Error refreshing cart product data:", error);
      // If refresh fails, use stored cart
      setLocalCart(storedCart);
    }
  };

  const removeInactiveProducts = async () => {
    const items = isLoggedIn && serverCart ? serverCart.items : localCart?.items || [];

    // Find inactive products
    const inactiveItems = items.filter((item) => item.product.isActive === false);

    if (inactiveItems.length === 0) {
      return; // No inactive items to remove
    }

    setIsLoading(true);

    try {
      if (isLoggedIn) {
        // Remove inactive items from server cart
        for (const item of inactiveItems) {
          const itemId = (item as CartItem).id || item.product.id;
          await deleteData("cart/items", itemId);
        }

        serverRevalidate("/");
        serverRevalidate("/cart");
        serverRevalidate("/checkout");
      } else {
        // Remove inactive items from local cart
        const activeItems = items.filter((item) => item.product.isActive !== false) as LocalCartItem[];
        const updatedCart: LocalCart = {
          items: activeItems,
          lastUpdated: Date.now(),
        };

        setLocalCart(updatedCart);
        saveCartToLocalStorage(updatedCart);
      }

      toast.info("Cart updated", {
        description: `${inactiveItems.length} unavailable item(s) removed from your cart`,
      });
    } catch (error) {
      console.error("Error removing inactive products:", error);
      toast.error("Failed to update cart", {
        description: "Please try again later",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    cart: isLoggedIn ? serverCart : { items: localCart?.items || [] },
    isLoading,
    appliedCoupon,
    addItem,
    updateItemQuantity,
    removeItem,
    clearCart,
    applyCoupon,
    removeCoupon,
    getCartTotals,
    getDiscountedPrice,
    removeInactiveProducts,
  };
}
