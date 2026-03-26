// app/products/page.tsx
"use client";

import { useEffect, useState, ChangeEvent } from "react";
import api from "@/lib/api";
import ProductCard from "@/components/product_card";
import { Product } from "@/types";

interface Filters {
  category: string;
  state: string;
  search: string;
}

const CATEGORIES: string[] = [
  "grains",
  "vegetables",
  "fruits",
  "livestock",
  "dairy",
  "tubers",
  "spices",
  "other",
];

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filters, setFilters] = useState<Filters>({
    category: "",
    state: "",
    search: "",
  });

  const fetch_products = async (): Promise<void> => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.category) params.append("category", filters.category);
      if (filters.state) params.append("state", filters.state);
      if (filters.search) params.append("search", filters.search);

      const data = await api(`/products?${params.toString()}`);
      setProducts(data.products);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch_products();
  }, [filters]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Browse Products</h1>

      <div className="flex gap-4 mb-6 flex-wrap">
        <input
          placeholder="Search products..."
          value={filters.search}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            setFilters({ ...filters, search: e.target.value })
          }
          className="border rounded px-3 py-2 text-sm w-48"
        />

        <select
          value={filters.category}
          onChange={(e: ChangeEvent<HTMLSelectElement>) =>
            setFilters({ ...filters, category: e.target.value })
          }
          className="border rounded px-3 py-2 text-sm"
        >
          <option value="">All Categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c} className="capitalize">
              {c}
            </option>
          ))}
        </select>

        <input
          placeholder="Filter by state..."
          value={filters.state}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            setFilters({ ...filters, state: e.target.value })
          }
          className="border rounded px-3 py-2 text-sm w-40"
        />
      </div>

      {loading ? (
        <p className="text-gray-400 text-sm">Loading products...</p>
      ) : products.length === 0 ? (
        <p className="text-gray-400 text-sm">No products found</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
