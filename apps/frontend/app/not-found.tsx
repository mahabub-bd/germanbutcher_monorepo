"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Home, Search } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center p-4 text-center">
      <div className="mx-auto max-w-md space-y-6">
        {/* 404 Status */}
        <h1 className="text-7xl font-bold text-primary">404</h1>

        {/* Title */}
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Page Not Found
        </h2>

        {/* Description */}
        <p className="text-muted-foreground">
          The page you&apos;re looking for doesn&apos;t exist or has been moved. Check the
          URL or try one of the options below.
        </p>

        {/* Search Bar */}
        <div className="relative mx-auto max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search for products, categories..."
            className="pl-10 pr-4"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                const value = (e.target as HTMLInputElement).value;
                if (value) {
                  window.location.href = `/search?q=${encodeURIComponent(
                    value
                  )}`;
                }
              }
            }}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button variant="default" asChild className="gap-2">
            <Link href="/">
              <Home className="h-4 w-4" />
              Go to Homepage
            </Link>
          </Button>
          <Button variant="outline" asChild className="gap-2">
            <Link href="javascript:history.back()">
              <ArrowLeft className="h-4 w-4" />
              Go Back
            </Link>
          </Button>
        </div>

        {/* Quick Links */}
        <div className="mt-8">
          <h3 className="mb-3 text-sm font-medium">Popular Pages</h3>
          <div className="flex flex-wrap justify-center gap-2">
            <Button
              variant="link"
              asChild
              size="sm"
              className="text-muted-foreground"
            >
              <Link href="/products">All Products</Link>
            </Button>
            <Button
              variant="link"
              asChild
              size="sm"
              className="text-muted-foreground"
            >
              <Link href="/categories">Categories</Link>
            </Button>
            <Button
              variant="link"
              asChild
              size="sm"
              className="text-muted-foreground"
            >
              <Link href="/cart">Shopping Cart</Link>
            </Button>
            <Button
              variant="link"
              asChild
              size="sm"
              className="text-muted-foreground"
            >
              <Link href="/account">My Account</Link>
            </Button>
            <Button
              variant="link"
              asChild
              size="sm"
              className="text-muted-foreground"
            >
              <Link href="/contact">Contact Us</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
