import { AdminPageContainer } from "@/components/admin/admin-page-container";
import { PageHeader } from "@/components/admin/page-header";
import StockMovementHistory from "@/components/admin/products/stock-movement-history";
import { Button } from "@/components/ui/button";
import { fetchData } from "@/utils/api-utils";
import type { Product } from "@/utils/types";
import { ArrowLeft, ExternalLink } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

export const metadata = {
    title: "Product Stock Movements",
};

export default async function ProductStockMovementsPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;

    const product = await fetchData<Product>(`products/${id}`);

    if (!product?.id) {
        notFound();
    }

    return (
        <AdminPageContainer>
            <PageHeader
                title="Stock Movements"
                description={`${product.name} · ${product.stock.toLocaleString(
                    "en-US"
                )} ${product.unit?.name || "units"} on hand · purchases in, sales out, reversals and manual adjustments.`}
                actionLabel="Back to Inventory"
                actionHref="/admin/products/inventory"
                actionIcon={<ArrowLeft className="mr-2 h-4 w-4" />}
            >
                <Button asChild variant="outline" size="sm">
                    <Link href={`/admin/products/${product.id}/view`}>
                        <ExternalLink className="mr-2 h-4 w-4" />
                        <span className="hidden sm:inline">View Product</span>
                    </Link>
                </Button>
            </PageHeader>

            <StockMovementHistory productId={product.id} />
        </AdminPageContainer>
    );
}
