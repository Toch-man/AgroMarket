// app/products/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Product } from "@/types";

interface OrderForm {
  quantity: number;
  payment_method: string;
  delivery_address: {
    state: string;
    lga: string;
    address: string;
  };
}

export default function SingleProductPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [ordering, setOrdering] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<OrderForm>({
    quantity: 1,
    payment_method: "interswitch",
    delivery_address: { state: "", lga: "", address: "" },
  });

  useEffect(() => {
    const fetch_product = async (): Promise<void> => {
      try {
        const data = await api(`/products/${id}`);
        setProduct(data.product);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetch_product();
  }, [id]);

  const handle_order = async (): Promise<void> => {
    if (!user) return router.push("/auth/login");
    setError(null);
    setOrdering(true);

    try {
      const order_data = await api("/orders", {
        method: "POST",
        body: JSON.stringify({
          product_id: id,
          quantity: form.quantity,
          payment_method: form.payment_method,
          delivery_address: form.delivery_address,
        }),
      });

      if (form.payment_method === "interswitch") {
        const payment_data = await api("/payments/initialize", {
          method: "POST",
          body: JSON.stringify({ order_id: order_data.order._id }),
        });
        window.location.href = payment_data.payment_url;
      } else {
        router.push(`/orders/${order_data.order._id}`);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setOrdering(false);
    }
  };

  if (loading) return <p className="p-8 text-gray-400 text-sm">Loading...</p>;
  if (!product)
    return <p className="p-8 text-gray-400 text-sm">Product not found</p>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow p-6 flex flex-col md:flex-row gap-8">
        <div className="md:w-1/2">
          {product.images?.length > 0 ? (
            <img
              src={product.images[0].url}
              alt={product.name}
              className="w-full h-64 object-cover rounded"
            />
          ) : (
            <div className="w-full h-64 bg-green-50 rounded flex items-center justify-center text-green-300">
              No image
            </div>
          )}
        </div>

        <div className="md:w-1/2 flex flex-col gap-4">
          <h1 className="text-2xl font-bold text-gray-800">{product.name}</h1>

          <p className="text-sm text-gray-500 capitalize">
            {product.category} - {product.location?.state},{" "}
            {product.location?.lga}
          </p>

          <p className="text-green-700 text-xl font-bold">
            N{product.price_per_unit.toLocaleString()} / {product.unit}
          </p>

          <p className="text-sm text-gray-600">{product.description}</p>

          <p className="text-sm text-gray-500">
            Available: {product.quantity} {product.unit}
          </p>

          <p className="text-sm text-gray-500">
            Sold by: {product.owner?.name}
          </p>

          {error && (
            <p className="bg-red-100 text-red-600 p-2 rounded text-sm">
              {error}
            </p>
          )}

          {user?.role === "buyer" && product.status === "available" && (
            <div className="flex flex-col gap-3 mt-2">
              <div>
                <label className="text-sm font-medium">
                  Quantity ({product.unit})
                </label>
                <input
                  type="number"
                  min={product.min_order_quantity}
                  max={product.quantity}
                  value={form.quantity}
                  onChange={(e) =>
                    setForm({ ...form, quantity: Number(e.target.value) })
                  }
                  className="w-full border rounded px-3 py-2 text-sm mt-1"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Payment Method</label>
                <select
                  value={form.payment_method}
                  onChange={(e) =>
                    setForm({ ...form, payment_method: e.target.value })
                  }
                  className="w-full border rounded px-3 py-2 text-sm mt-1"
                >
                  {product.accepted_payment_methods?.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium">Delivery State</label>
                <input
                  placeholder="e.g Lagos"
                  value={form.delivery_address.state}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      delivery_address: {
                        ...form.delivery_address,
                        state: e.target.value,
                      },
                    })
                  }
                  className="w-full border rounded px-3 py-2 text-sm mt-1"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Delivery Address</label>
                <input
                  placeholder="Street address"
                  value={form.delivery_address.address}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      delivery_address: {
                        ...form.delivery_address,
                        address: e.target.value,
                      },
                    })
                  }
                  className="w-full border rounded px-3 py-2 text-sm mt-1"
                />
              </div>

              <p className="text-sm font-medium text-green-700">
                Total: N
                {(form.quantity * product.price_per_unit).toLocaleString()}
              </p>

              <button
                onClick={handle_order}
                disabled={ordering}
                className="bg-green-700 text-white py-2 rounded font-medium"
              >
                {ordering ? "Placing order..." : "Place Order"}
              </button>
            </div>
          )}

          {!user && (
            <p className="text-sm text-gray-500">
              <a href="/auth/login" className="text-green-700 font-medium">
                Login
              </a>{" "}
              to place an order
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
