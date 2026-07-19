"use client";

import type React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { PaginationComponent } from "@/components/common/pagination";
import { formatCurrencyEnglish, formatDateTime } from "@/lib/utils";
import { fetchDataPagination, patchData } from "@/utils/api-utils";
import {
  DiscountType,
  type Brand,
  type Category,
  type Product,
} from "@/utils/types";
import {
  BadgePercent,
  CalendarRange,
  Filter,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Tag,
  Trash2,
  XCircle,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import DeleteConfirmationDialog from "../delete-confirmation-dialog";
import { LoadingIndicator } from "../loading-indicator";
import { PageHeader } from "../page-header";

interface DiscountListProps {
  initialPage: number;
  initialLimit: number;
  initialSearchParams?: { [key: string]: string | string[] | undefined };
}

export function DiscountList({
  initialPage,
  initialLimit,
  initialSearchParams = {},
}: DiscountListProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const getInitialParam = (key: string) => {
    const param = searchParams?.get(key);
    return param ? param : initialSearchParams?.[key] || "";
  };

  const [products, setProducts] = useState<Product[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState(
    getInitialParam("search") as string
  );
  const [categoryFilter, setCategoryFilter] = useState(
    getInitialParam("category") as string
  );
  const [brandFilter, setBrandFilter] = useState(
    getInitialParam("brand") as string
  );
  const [statusFilter, setStatusFilter] = useState(
    getInitialParam("status") as string
  );
  const [discountTypeFilter, setDiscountTypeFilter] = useState(
    getInitialParam("discountType") as string
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [limit] = useState(initialLimit);
  const [totalPages, setTotalPages] = useState(1);

  const updateUrl = useCallback(() => {
    const params = new URLSearchParams();

    params.set("page", currentPage.toString());
    params.set("limit", limit.toString());

    if (searchQuery) params.set("search", searchQuery);
    if (categoryFilter && categoryFilter !== "all")
      params.set("category", categoryFilter);
    if (brandFilter && brandFilter !== "all") params.set("brand", brandFilter);
    if (statusFilter && statusFilter !== "all")
      params.set("status", statusFilter);
    if (discountTypeFilter && discountTypeFilter !== "all")
      params.set("discountType", discountTypeFilter);

    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }, [
    router,
    pathname,
    currentPage,
    limit,
    searchQuery,
    categoryFilter,
    brandFilter,
    statusFilter,
    discountTypeFilter,
  ]);

  const fetchDiscountedProducts = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("page", currentPage.toString());
      params.append("limit", limit.toString());
      params.append("hasDiscount", "true");

      if (searchQuery) params.append("search", searchQuery);
      if (categoryFilter && categoryFilter !== "all")
        params.append("category", categoryFilter);
      if (brandFilter && brandFilter !== "all")
        params.append("brand", brandFilter);
      if (statusFilter && statusFilter !== "all")
        params.append("status", statusFilter);
      if (discountTypeFilter && discountTypeFilter !== "all")
        params.append("discountType", discountTypeFilter);

      const response = await fetchDataPagination<{
        data: Product[];
        total: number;
        totalPages: number;
      }>(`products?${params.toString()}`);
      setProducts(response.data);
      setTotalItems(response.total);
      setTotalPages(response.totalPages);
    } catch (error) {
      console.error("Error fetching discounted products:", error);
      toast.error("Failed to load discounted products. Please try again.");
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBrands = async () => {
    try {
      const response = await fetchDataPagination<{
        data: Brand[];
      }>("brands");
      if (Array.isArray(response.data)) {
        setBrands(response.data);
      }
    } catch (error) {
      console.error("Error fetching brands:", error);
      toast.error("Failed to load brands");
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetchDataPagination<{
        data: Category[];
      }>("categories");
      if (Array.isArray(response.data)) {
        setCategories(response.data);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
      toast.error("Failed to load categories");
    }
  };

  useEffect(() => {
    fetchDiscountedProducts();
    fetchBrands();
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchDiscountedProducts();
    updateUrl();
  }, [
    currentPage,
    limit,
    searchQuery,
    categoryFilter,
    brandFilter,
    statusFilter,
    discountTypeFilter,
  ]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleDeleteClick = (product: Product) => {
    setSelectedProduct(product);
    setIsDeleteDialogOpen(true);
  };

  const handleRemoveDiscount = async () => {
    if (!selectedProduct) return;

    try {
      await patchData(`products/${selectedProduct.id}`, {
        discountType: null,
        discountValue: null,
        discountStartDate: null,
        discountEndDate: null,
      });
      fetchDiscountedProducts();
      toast.success("Discount removed successfully");
    } catch (error) {
      console.error("Error removing discount:", error);
      toast.error("Failed to remove discount. Please try again.");
    } finally {
      setIsDeleteDialogOpen(false);
    }
  };

  const clearFilters = () => {
    setSearchQuery("");
    setCategoryFilter("");
    setBrandFilter("");
    setStatusFilter("");
    setDiscountTypeFilter("");
    setCurrentPage(1);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const getDiscountStatus = (product: Product) => {
    if (!product.discountStartDate || !product.discountEndDate) return "active";

    const now = new Date();
    const startDate = new Date(product.discountStartDate);
    const endDate = new Date(product.discountEndDate);

    if (now > endDate) return "expired";
    if (now < startDate) return "upcoming";
    return "active";
  };

  const calculateDiscountedPrice = (product: Product) => {
    if (!product.discountType || !product.discountValue)
      return product.sellingPrice;

    if (product.discountType === DiscountType.PERCENTAGE) {
      return product.sellingPrice * (1 - product.discountValue / 100);
    } else {
      return Math.max(0, product.sellingPrice - product.discountValue);
    }
  };

  const getDiscountBadge = (product: Product) => {
    if (!product.discountType || !product.discountValue) return null;

    const badgeClass =
      product.discountType === DiscountType.PERCENTAGE
        ? "bg-green-100 text-green-800"
        : "bg-blue-100 text-blue-800";
    const icon =
      product.discountType === DiscountType.PERCENTAGE ? (
        <BadgePercent className="h-3 w-3 mr-1" />
      ) : null;
    const value =
      product.discountType === DiscountType.PERCENTAGE
        ? `${product.discountValue}%`
        : formatCurrencyEnglish(product.discountValue);

    return (
      <div
        className={`inline-flex items-center px-4 py-1 rounded-full text-xs font-medium text-center mx-auto ${badgeClass}`}
      >
        {icon}
        {value}
      </div>
    );
  };

  const renderEmptyState = () => (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <Tag className="h-10 w-10 text-muted-foreground mb-4" />
      <h3 className="text-lg font-semibold">No discounted products found</h3>
      <p className="text-sm text-muted-foreground mt-2">
        {searchQuery ||
        categoryFilter ||
        brandFilter ||
        statusFilter ||
        discountTypeFilter
          ? "No discounted products match your search criteria. Try different filters."
          : "Get started by adding discounts to your products."}
      </p>
      {!(
        searchQuery ||
        categoryFilter ||
        brandFilter ||
        statusFilter ||
        discountTypeFilter
      ) && (
        <Button asChild className="mt-4">
          <Link href="/admin/marketing/discounts/add">
            <Plus className="mr-2 h-4 w-4" /> Create Discount
          </Link>
        </Button>
      )}
      {(searchQuery ||
        categoryFilter ||
        brandFilter ||
        statusFilter ||
        discountTypeFilter) && (
        <Button variant="outline" className="mt-4" onClick={clearFilters}>
          Clear Filters
        </Button>
      )}
    </div>
  );

  const renderActiveFilters = () => {
    const hasFilters =
      searchQuery ||
      categoryFilter ||
      brandFilter ||
      statusFilter ||
      discountTypeFilter;

    if (!hasFilters) return null;

    return (
      <div className="flex flex-wrap gap-2 mt-4">
        {searchQuery && (
          <Badge
            variant="outline"
            className="flex items-center gap-1 px-3 py-1"
          >
            Search: {searchQuery}
            <button onClick={() => setSearchQuery("")} className="ml-1">
              <XCircle className="h-3 w-3" />
            </button>
          </Badge>
        )}

        {categoryFilter && categoryFilter !== "all" && (
          <Badge
            variant="outline"
            className="flex items-center gap-1 px-3 py-1"
          >
            Category:{" "}
            {categories.find((c) => c.id.toString() === categoryFilter)?.name ||
              categoryFilter}
            <button onClick={() => setCategoryFilter("")} className="ml-1">
              <XCircle className="h-3 w-3" />
            </button>
          </Badge>
        )}

        {brandFilter && brandFilter !== "all" && (
          <Badge
            variant="outline"
            className="flex items-center gap-1 px-3 py-1"
          >
            Brand:{" "}
            {brands.find((b) => b.id.toString() === brandFilter)?.name ||
              brandFilter}
            <button onClick={() => setBrandFilter("")} className="ml-1">
              <XCircle className="h-3 w-3" />
            </button>
          </Badge>
        )}

        {statusFilter && statusFilter !== "all" && (
          <Badge
            variant="outline"
            className="flex items-center gap-1 px-3 py-1"
          >
            Status: {statusFilter}
            <button onClick={() => setStatusFilter("")} className="ml-1">
              <XCircle className="h-3 w-3" />
            </button>
          </Badge>
        )}

        {discountTypeFilter && discountTypeFilter !== "all" && (
          <Badge
            variant="outline"
            className="flex items-center gap-1 px-3 py-1"
          >
            Discount Type:{" "}
            {discountTypeFilter === "percentage"
              ? "Percentage"
              : "Fixed Amount"}
            <button onClick={() => setDiscountTypeFilter("")} className="ml-1">
              <XCircle className="h-3 w-3" />
            </button>
          </Badge>
        )}

        <Button
          variant="ghost"
          size="sm"
          onClick={clearFilters}
          className="h-7 text-xs"
        >
          Clear all
        </Button>
      </div>
    );
  };

  const renderTableView = () => (
    <div className="overflow-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Product</TableHead>
            <TableHead className="hidden md:table-cell">SKU</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Discount</TableHead>
            <TableHead className="hidden md:table-cell">Period</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => {
            const discountStatus = getDiscountStatus(product);
            const discountedPrice = calculateDiscountedPrice(product);
            const discountBadge = getDiscountBadge(product);

            return (
              <TableRow key={product.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-md border bg-muted">
                      <Image
                        src={product?.attachment?.url || "/placeholder.svg"}
                        alt={product.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-medium line-clamp-1">
                        {product.name}
                      </span>
                      <span className="text-xs text-muted-foreground md:hidden">
                        {product?.productSku}
                      </span>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {product?.productSku}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">
                      {formatCurrencyEnglish(discountedPrice)}
                    </span>
                    <span className="text-xs text-muted-foreground line-through">
                      {formatCurrencyEnglish(product?.sellingPrice)}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">{discountBadge}</div>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {product.discountStartDate && product.discountEndDate ? (
                    <div className="flex items-center text-xs">
                      <CalendarRange className="h-3 w-3 mr-1 text-muted-foreground" />
                      <span>
                        {formatDateTime(product.discountStartDate)}
                        {"-  "}
                        {formatDateTime(product.discountEndDate)}
                      </span>
                    </div>
                  ) : (
                    "No period set"
                  )}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      discountStatus === "active"
                        ? "default"
                        : discountStatus === "upcoming"
                        ? "outline"
                        : "secondary"
                    }
                  >
                    {discountStatus === "active"
                      ? "Active"
                      : discountStatus === "upcoming"
                      ? "Upcoming"
                      : "Expired"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Open menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/admin/products/${product.id}/edit`}>
                          <Pencil className="mr-2 h-4 w-4" /> Edit
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-red-600"
                        onClick={() => handleDeleteClick(product)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" /> Remove Discount
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <>
      <div className="w-full p-2 md:p-6">
        <PageHeader
          title="Product Discounts"
          description="Manage your product discounts and promotions"
          actionLabel="Create Discount"
          actionHref="/admin/marketing/discounts/add"
        />

        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search discounted products..."
                className="pl-8"
                value={searchQuery}
                onChange={handleSearchChange}
              />
            </div>

            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <Filter className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[200px]">
                  <div className="grid gap-3 p-2">
                    <div className="space-y-1">
                      <h4 className="text-xs font-semibold">Category</h4>
                      <Select
                        value={categoryFilter}
                        onValueChange={(value) => {
                          setCategoryFilter(value);
                          setCurrentPage(1);
                        }}
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue placeholder="All Categories" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Categories</SelectItem>
                          {categories.map((category) => (
                            <SelectItem
                              key={category.id}
                              value={category.id.toString()}
                            >
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <h4 className="text-xs font-semibold">Brand</h4>
                      <Select
                        value={brandFilter}
                        onValueChange={(value) => {
                          setBrandFilter(value);
                          setCurrentPage(1);
                        }}
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue placeholder="All Brands" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Brands</SelectItem>
                          {brands.map((brand) => (
                            <SelectItem
                              key={brand.id}
                              value={brand.id.toString()}
                            >
                              {brand.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <h4 className="text-xs font-semibold">Status</h4>
                      <Select
                        value={statusFilter}
                        onValueChange={(value) => {
                          setStatusFilter(value);
                          setCurrentPage(1);
                        }}
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue placeholder="All Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Status</SelectItem>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="upcoming">Upcoming</SelectItem>
                          <SelectItem value="expired">Expired</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <h4 className="text-xs font-semibold">Discount Type</h4>
                      <Select
                        value={discountTypeFilter}
                        onValueChange={(value) => {
                          setDiscountTypeFilter(value);
                          setCurrentPage(1);
                        }}
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue placeholder="All Types" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Types</SelectItem>
                          <SelectItem value="percentage">Percentage</SelectItem>
                          <SelectItem value="fixed">Fixed Amount</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {(categoryFilter ||
                      brandFilter ||
                      statusFilter ||
                      discountTypeFilter) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearFilters}
                        className="mt-2"
                      >
                        Reset Filters
                      </Button>
                    )}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {renderActiveFilters()}

          {isLoading ? (
            <LoadingIndicator message=" Loading Discounted Products..." />
          ) : products.length === 0 ? (
            renderEmptyState()
          ) : (
            <div className="mt-6">{renderTableView()}</div>
          )}
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mt-6">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground text-center md:text-left truncate">
              {`Showing ${products.length} of ${totalItems} discounted products`}
            </p>
          </div>

          <div className="flex-1 w-full md:w-auto">
            <PaginationComponent
              currentPage={currentPage}
              totalPages={totalPages}
              baseUrl="#"
              onPageChange={handlePageChange}
            />
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleRemoveDiscount}
      />
    </>
  );
}
