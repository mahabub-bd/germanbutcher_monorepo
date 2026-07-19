import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";
import Link from "next/link";

export function EmptyCartMessage() {
  return (
    <div className="container mx-auto py-8 px-4 md:py-16 text-center">
      <div className="mx-auto mb-6 flex h-16 w-16 md:h-20 md:w-20 items-center justify-center rounded-full bg-muted">
        <ShoppingCart className="h-8 w-8 md:h-10 md:w-10 text-muted-foreground" />
      </div>
      <h1 className="mb-4 text-xl md:text-2xl font-bold">Your cart is empty</h1>
      <p className="mb-6 md:mb-8 text-sm md:text-base text-muted-foreground">
        Add some items to your cart before proceeding to checkout
      </p>
      <Button asChild>
        <Link href="/">Continue Shopping</Link>
      </Button>
    </div>
  );
}
