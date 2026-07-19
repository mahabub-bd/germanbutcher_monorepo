"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export function SortBar({ currentSort }: { currentSort?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const createQueryString = (name: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set(name, value);
    return params.toString();
  };

  const handleSortChange = (value: string) => {
    router.push(`${pathname}?${createQueryString("sort", value)}`);
  };

  return (
    <div className="flex justify-end w-full">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium whitespace-nowrap">Sort by:</span>
        <Select
          value={currentSort || "featured"}
          onValueChange={handleSortChange}
        >
          <SelectTrigger className="md:w-[180px]" >
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="featured">Featured</SelectItem>
            <SelectItem value="price_asc">Price: Low to High</SelectItem>
            <SelectItem value="price_desc">Price: High to Low</SelectItem>
            <SelectItem value="name_asc">Name: A to Z</SelectItem>
            <SelectItem value="name_desc">Name: Z to A</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
