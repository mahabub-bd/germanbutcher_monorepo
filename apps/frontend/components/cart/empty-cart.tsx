import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";
import Link from "next/link";

export function EmptyCart({ onClose }: { onClose?: () => void }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 py-12">
      <div className="flex flex-col items-center gap-4">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gray-100">
          <ShoppingCart className="h-10 w-10 text-gray-400" />
        </div>
        <div className="space-y-2 text-center">
          <h3 className="text-xl font-semibold">Your cart is empty</h3>
          <p className="text-muted-foreground">Add items to get started</p>
        </div>
      </div>
      <Button asChild variant="secondary" onClick={onClose}>
        <Link href="/products">Continue Shopping</Link>
      </Button>
    </div>
  );
}
