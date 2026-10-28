import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Leaf,
  ShieldCheck,
  ShoppingCart,
  ShoppingBag,
  Truck,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";

const TRUST_FEATURES: { icon: LucideIcon; title: string; subtitle: string }[] = [
  { icon: Leaf, title: "Fresh & Premium", subtitle: "Quality Meat" },
  { icon: Truck, title: "Fast Delivery", subtitle: "Across Dhaka" },
  { icon: ShieldCheck, title: "Safe Payment", subtitle: "100% Secure" },
];

export function EmptyCart({ onClose }: { onClose?: () => void }) {
  return (
    <div className="flex h-full flex-col items-center justify-center px-4 py-10 text-center">
      {/* Illustration — cart over a soft brand blob with sparkle accents */}
      <div className="relative mb-8" aria-hidden>
        <div className="absolute left-1/2 top-1/2 h-40 w-44 -translate-x-1/2 -translate-y-1/2 rounded-[48%_52%_58%_42%/55%_48%_52%_45%] bg-primaryColor/5" />
        <div className="relative flex h-40 w-40 items-center justify-center">
          <ShoppingCart
            className="size-16 text-primaryColor/70"
            strokeWidth={1.25}
          />
          <span className="absolute right-6 top-4 flex gap-1">
            <span className="h-3 w-0.5 rotate-12 rounded-full bg-primaryColor" />
            <span className="h-4 w-0.5 rotate-12 rounded-full bg-primaryColor" />
            <span className="h-3 w-0.5 rotate-12 rounded-full bg-primaryColor" />
          </span>
        </div>
      </div>

      <h3 className="text-2xl font-bold tracking-tight">
        Your cart is empty
      </h3>
      <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground">
        Looks like you haven&rsquo;t added any items yet. Add some fresh
        products to get started!
      </p>

      <Button
        asChild
        size="lg"
        onClick={onClose}
        className="mt-6 gap-2 rounded-full bg-primaryColor px-8 text-white hover:bg-primaryColor/90"
      >
        <Link href="/products">
          <ShoppingBag className="size-4" />
          Continue Shopping
          <ArrowRight className="size-4" />
        </Link>
      </Button>

      {/* Trust features */}
      <div className="mt-10 grid w-full max-w-sm grid-cols-3 divide-x">
        {TRUST_FEATURES.map(({ icon: Icon, title, subtitle }) => (
          <div key={title} className="flex flex-col items-center gap-1 px-2">
            <span className="mb-1 flex size-11 items-center justify-center rounded-full bg-primaryColor/10">
              <Icon className="size-5 text-primaryColor" />
            </span>
            <p className="text-xs font-bold sm:text-sm">{title}</p>
            <p className="text-[11px] text-muted-foreground sm:text-xs">
              {subtitle}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
