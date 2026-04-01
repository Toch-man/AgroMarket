// components/ProductCard.tsx
import Link from "next/link";
import Image from "next/image";
import { Product } from "@/types";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  return (
    <div className="bg-white rounded-lg shadow p-4 flex flex-col gap-2">
      {product.images?.length > 0 ? (
        <Image
          src={product.images[0].url}
          alt={product.name}
          width={400}
          height={160}
          className="w-full h-40 object-cover rounded"
        />
      ) : (
        <div className="w-full h-40 bg-green-50 rounded flex items-center justify-center text-green-300 text-sm">
          No image
        </div>
      )}

      <h3 className="font-semibold text-gray-800">{product.name}</h3>

      <p className="text-xs text-gray-500 capitalize">
        {product.category} - {product.location?.state}
      </p>

      <p className="text-green-700 font-bold">
        N{product.price_per_unit.toLocaleString()} / {product.unit}
      </p>

      <p className="text-xs text-gray-400">
        {product.quantity} {product.unit} available
      </p>

      <Link
        href={`/product/${product._id}`}
        className="mt-auto bg-green-700 text-white text-sm text-center py-2 rounded"
      >
        View Product
      </Link>
    </div>
  );
}
