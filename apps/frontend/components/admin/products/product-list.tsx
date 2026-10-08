"use client";

import type React from "react";

import StatsCard from "@/components/admin/dashboard/stats-card";
import { ActiveStatusToggle } from "@/components/common/active-status-toggle";
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
import { useActiveStatusToggle } from "@/hooks/use-active-status-toggle";

import { revalidateProducts } from "@/actions/revalidate";
import { PaginationComponent } from "@/components/common/pagination";
import { usePermissions } from "@/components/admin/permissions/use-permissions";
import { formatCurrencyEnglish } from "@/lib/utils";
import { deleteData, fetchData, fetchDataPagination } from "@/utils/api-utils";
import type { Brand, Category, Product } from "@/utils/types";
import {
  Ban,
  CheckCircle,
  Eye,
  Filter,
  MoreHorizontal,
  Package,
  Pencil,
  Plus,
  Search,
  Trash2,
  XCircle
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import DeleteConfirmationDialog from "../delete-confirmation-dialog";
import { ProductImage } from "../image-wrapper";
import { LoadingIndicator } from "../loading-indicator";
import { PageHeader } from "../page-header";

interface ProductListProps {
  initialPage: number;
  initialLimit: number;
  initialSearchParams?: { [key: string]: string | string[] | undefined };
}

export function ProductList({
  initialPage,
  initialLimit,
  initialSearchParams = {},
}: ProductListProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const MENU_URL = "/admin/products";
  const { can } = usePermissions();

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
  // Applied 400ms after typing stops — the input stays instant, the API call
  // doesn't fire per keystroke.
  const [debouncedSearch, setDebouncedSearch] = useState(
    getInitialParam("search") as string
  );
  const [categoryFilter, setCategoryFilter] = useState(
    getInitialParam("category") as string
  );
  const [brandFilter, setBrandFilter] = useState(
    getInitialParam("brand") as string
  );
  const [statusFilter, setStatusFilter] = useState(
    getInitialParam("isActive") as string
  );
  const [featuredFilter, setFeaturedFilter] = useState(
    getInitialParam("featured") as string
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

    if (debouncedSearch) params.set("search", debouncedSearch);
    if (categoryFilter && categoryFilter !== "all")
      params.set("category", categoryFilter);
    if (brandFilter && brandFilter !== "all") params.set("brand", brandFilter);
    if (statusFilter && statusFilter !== "all" && statusFilter !== "")
      params.set("isActive", statusFilter);
    if (featuredFilter && featuredFilter !== "all")
      params.set("featured", featuredFilter);

    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }, [
    router,
    pathname,
    currentPage,
    limit,
    debouncedSearch,
    categoryFilter,
    brandFilter,
    statusFilter,
    featuredFilter,
  ]);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("page", currentPage.toString());
      params.append("limit", limit.toString());

      if (debouncedSearch) params.append("search", debouncedSearch);
      if (categoryFilter && categoryFilter !== "all")
        params.append("category", categoryFilter);
      if (brandFilter && brandFilter !== "all")
        params.append("brand", brandFilter);
      if (statusFilter && statusFilter !== "all" && statusFilter !== "")
        params.append("isActive", statusFilter);
      if (featuredFilter && featuredFilter !== "all")
        params.append("featured", featuredFilter);

      const response = await fetchDataPagination<{
        data: Product[];
        total: number;
        totalPages: number;
      }>(`products?${params.toString()}`);
      setProducts(response.data);
      setTotalItems(response.total);
      setTotalPages(response.totalPages);
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error("Failed to load products. Please try again.");
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBrands = async () => {
    try {
      const response = await fetchData<Brand[]>("brands");
      if (Array.isArray(response)) {
        setBrands(response);
      }
    } catch (error) {
      console.error("Error fetching brands:", error);
      toast.error("Failed to load brands");
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetchData<Category[]>("categories");
      if (Array.isArray(response)) {
        setCategories(response);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
      toast.error("Failed to load categories");
    }
  };

  // Debounce the search box so typing doesn't fire a request per keystroke.
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Filter dropdown data loads once; products fetch on the applied filters.
  useEffect(() => {
    fetchBrands();
    fetchCategories();
  }, []);

  const isInitialMount = useRef(true);

  useEffect(() => {
    fetchProducts();
  }, [
    currentPage,
    limit,
    debouncedSearch,
    categoryFilter,
    brandFilter,
    statusFilter,
    featuredFilter,
  ]);

  // Sync the URL only for user-driven changes, not on first paint.
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    updateUrl();
  }, [updateUrl]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleDeleteClick = (product: Product) => {
    setSelectedProduct(product);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedProduct) return;

    try {
      await deleteData("products", selectedProduct.id);
      // Refresh cached product data on public pages immediately
      await revalidateProducts();
      fetchProducts();
      toast.success("Product deleted successfully");
    } catch (error) {
      console.error("Error deleting product:", error);
      toast.error("Failed to delete product. Please try again.");
    } finally {
      setIsDeleteDialogOpen(false);
    }
  };

  const { togglingId, toggleActive } = useActiveStatusToggle<Product>({
    getId: (product) => product.id,
    getName: (product) => product.name,
    buildEndpoint: (id) => `products/${id}`,
    // Keep cached product data on public pages in sync
    onSuccess: revalidateProducts,
    setStatusLocally: (id, isActive) =>
      setProducts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, isActive } : p))
      ),
    errorLabel: "product status",
  });

  const clearFilters = () => {
    setSearchQuery("");
    setCategoryFilter("");
    setBrandFilter("");
    setStatusFilter("");
    setFeaturedFilter("");
    setCurrentPage(1);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const hasActiveFilters = () =>
    Boolean(
      searchQuery ||
        categoryFilter ||
        brandFilter ||
        statusFilter ||
        featuredFilter
    );

  const renderEmptyState = () => (
    <div className="p-4 pb-6">
      <div className="flex flex-col items-center justify-center border border-dashed rounded-xl p-12 text-center">
        <Package className="h-10 w-10 text-muted-foreground/50 mb-4" />
        <h3 className="text-lg font-semibold">No products found</h3>
        <p className="text-sm text-muted-foreground mt-2">
          {hasActiveFilters()
            ? "No products match your search criteria. Try different filters."
            : "Get started by adding your first product."}
        </p>
        {!hasActiveFilters() && can(MENU_URL, "canCreate") && (
          <Button asChild className="mt-4">
            <Link href="/admin/products/add">
              <Plus className="mr-2 h-4 w-4" /> Add Product
            </Link>
          </Button>
        )}
        {hasActiveFilters() && (
          <Button variant="outline" className="mt-4" onClick={clearFilters}>
            Clear Filters
          </Button>
        )}
      </div>
    </div>
  );

  const renderActiveFilters = () => {
    if (!hasActiveFilters()) return null;

    return (
      <div className="flex flex-wrap items-center gap-2 px-4 pb-3">
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
            Status: {statusFilter === "true" ? "Active" : "Inactive"}
            <button onClick={() => setStatusFilter("")} className="ml-1">
              <XCircle className="h-3 w-3" />
            </button>
          </Badge>
        )}

        {featuredFilter && featuredFilter !== "all" && (
          <Badge
            variant="outline"
            className="flex items-center gap-1 px-3 py-1"
          >
            {featuredFilter === "true" ? "Featured" : "Not Featured"}
            <button onClick={() => setFeaturedFilter("")} className="ml-1">
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

  const renderFiltersMenu = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 px-3 shrink-0">
          <Filter className="h-4 w-4" />
          <span>Filters</span>
          {(categoryFilter ||
            brandFilter ||
            statusFilter ||
            featuredFilter) && (
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[400px]">
        <div className="grid grid-cols-2 gap-3 p-3">
          <div className="space-y-1">
            <h4 className="text-xs font-semibold">Category</h4>
            <Select
              value={categoryFilter}
              onValueChange={(value) => {
                setCategoryFilter(value);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="h-9 w-full">
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
              <SelectTrigger className="h-9 w-full">
                <SelectValue placeholder="All Brands" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Brands</SelectItem>
                {brands.map((brand) => (
                  <SelectItem key={brand.id} value={brand.id.toString()}>
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
              <SelectTrigger className="h-9 w-full">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="true">Active</SelectItem>
                <SelectItem value="false">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <h4 className="text-xs font-semibold">Featured</h4>
            <Select
              value={featuredFilter}
              onValueChange={(value) => {
                setFeaturedFilter(value);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="h-9 w-full">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="true">Featured</SelectItem>
                <SelectItem value="false">Not Featured</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {(categoryFilter ||
            brandFilter ||
            statusFilter ||
            featuredFilter) && (
              <div className="col-span-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="w-full mt-2"
                >
                  Reset Filters
                </Button>
              </div>
            )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const renderTableView = () => (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Product</TableHead>
            <TableHead className="text-right">Purchase Price</TableHead>
            <TableHead className="text-right">Sale Price</TableHead>
            <TableHead>Unit</TableHead>
            <TableHead className="hidden md:table-cell">Brand</TableHead>
            <TableHead className="hidden lg:table-cell">Category</TableHead>
            <TableHead className="hidden md:table-cell text-center">
              Stock
            </TableHead>
            <TableHead className="hidden lg:table-cell text-center">
              Sold
            </TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => (
            <TableRow key={product.id} className="hover:bg-muted/50">
              <TableCell>
                <div className="flex items-center gap-3 min-w-0">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted">
                    <ProductImage product={product} width={40} height={40} />
                  </span>
                  <div className="min-w-0">
                    <Link
                      href={`/admin/products/${product.id}/view`}
                      className="font-medium leading-tight hover:underline"
                    >
                      {product.name}
                    </Link>
                    <p className="text-xs text-muted-foreground font-mono mt-0.5">
                      {product?.productSku || "—"}
                    </p>
                  </div>
                </div>
              </TableCell>
              <TableCell className="text-right text-muted-foreground">
                {formatCurrencyEnglish(product?.purchasePrice)}
              </TableCell>
              <TableCell className="text-right font-medium">
                {formatCurrencyEnglish(product?.sellingPrice)}
              </TableCell>
              <TableCell className="capitalize">
                {product?.unit?.name || "-"}
              </TableCell>
              <TableCell className="hidden md:table-cell">
                {product.brand?.name || "-"}
              </TableCell>
              <TableCell className="hidden lg:table-cell">
                {product.category?.name || "-"}
              </TableCell>
              <TableCell className="hidden md:table-cell text-center">
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    product.stock === 0
                      ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                      : "bg-muted"
                  }`}
                >
                  {product.stock}
                </span>
              </TableCell>
              <TableCell className="hidden lg:table-cell text-center">
                {product.saleCount}
              </TableCell>
              <TableCell>
                <ActiveStatusToggle
                  isActive={product.isActive}
                  disabled={togglingId === product.id}
                  onToggle={() => toggleActive(product)}
                  label={product.name}
                />
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
                    {/* View Option */}
                    <DropdownMenuItem asChild>
                      <Link
                        href={`/admin/products/${product.id}/view`}
                        passHref
                      >
                        <Eye className="mr-2 h-4 w-4" /> View
                      </Link>
                    </DropdownMenuItem>
                    {can(MENU_URL, "canEdit") && (
                      <DropdownMenuItem asChild>
                        <Link href={`/admin/products/${product.id}/edit`}>
                          <Pencil className="mr-2 h-4 w-4" /> Edit
                        </Link>
                      </DropdownMenuItem>
                    )}
                    {can(MENU_URL, "canDelete") && (
                      <DropdownMenuItem
                        className="text-red-600"
                        onClick={() => handleDeleteClick(product)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <>
      <div className="w-full md:p-4 p-2 space-y-4">
        <PageHeader
          title="Products"
          description="Manage your product inventory"
          {...(can(MENU_URL, "canCreate")
            ? {
                actionLabel: "Add Product",
                actionHref: "/admin/products/add",
              }
            : {})}
        />

        {/* Summary tiles */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <StatsCard
            icon={Package}
            title="Total Products"
            value={totalItems}
            bgColor="blue"
          />
          <StatsCard
            icon={CheckCircle}
            title="Active"
            value={products.filter((p) => p.isActive).length}
            bgColor="green"
          />
          <StatsCard
            icon={Ban}
            title="Inactive"
            value={products.filter((p) => !p.isActive).length}
            bgColor="orange"
          />
        </div>

        {/* List card: toolbar + table */}
        <div className="rounded-xl border bg-card">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 border-b">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-600">
                <Package className="h-4.5 w-4.5" />
              </span>
              <div>
                <h3 className="font-semibold leading-tight">All Products</h3>
                <p className="text-sm text-muted-foreground">
                  {totalItems} product{totalItems === 1 ? "" : "s"}
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full lg:w-auto">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search products..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={handleSearchChange}
                />
              </div>
              {renderFiltersMenu()}
            </div>
          </div>

          {renderActiveFilters()}

          {isLoading ? (
            <LoadingIndicator message="Loading Products..." />
          ) : products.length === 0 ? (
            renderEmptyState()
          ) : (
            renderTableView()
          )}
        </div>

        {/* Pagination */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground text-center md:text-left truncate">
              {`Showing ${products.length} of ${totalItems} products`}
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
        onConfirm={handleDelete}
      />
    </>
  );
}
