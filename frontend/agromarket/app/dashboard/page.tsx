// app/dashboard/page.tsx
"use client";

import { useEffect, useState, FormEvent, ChangeEvent } from "react";
import Link from "next/link";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Product, Order } from "@/types";

interface ProductForm {
  name: string;
  category: string;
  description: string;
  quantity: string;
  unit: string;
  price_per_unit: string;
  min_order_quantity: number;
  location: { state: string; lga: string };
  grade: string;
  accepted_payment_methods: string[];
}

const EMPTY_FORM: ProductForm = {
  name: "",
  category: "grains",
  description: "",
  quantity: "",
  unit: "kg",
  price_per_unit: "",
  min_order_quantity: 1,
  location: { state: "", lga: "" },
  grade: "ungraded",
  accepted_payment_methods: ["interswitch"],
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [show_form, setShowForm] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<ProductForm>(EMPTY_FORM);

  const fetch_data = async (): Promise<void> => {
    try {
      const [products_res, orders_res] = await Promise.all([
        api(`/products/farmer/${user?._id}`),
        api("/orders/farmer-orders"),
      ]);
      setProducts(products_res.products);
      setOrders(orders_res.orders);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetch_data();
  }, [user]);

  const handle_submit = async (
    e: FormEvent<HTMLFormElement>
  ): Promise<void> => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await api("/products/upload", {
        method: "POST",
        body: JSON.stringify(form),
      });
      setShowForm(false);
      setForm(EMPTY_FORM);
      fetch_data();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const status_color = (status: string): string => {
    if (status === "delivered") return "text-green-600";
    if (status === "cancelled") return "text-red-500";
    if (status === "shipped") return "text-blue-500";
    return "text-yellow-500";
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Farmer Dashboard</h1>
        <button
          onClick={() => setShowForm(!show_form)}
          className="bg-green-700 text-white px-4 py-2 rounded text-sm font-medium"
        >
          {show_form ? "Cancel" : "List New Product"}
        </button>
      </div>

      {show_form && (
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="font-semibold text-gray-800 mb-4">New Product</h2>

          {error && (
            <p className="bg-red-100 text-red-600 p-2 rounded text-sm mb-4">
              {error}
            </p>
          )}

          <form
            onSubmit={handle_submit}
            className="grid grid-cols-1 sm:grid-cols-2 gap-4"
          >
            <div>
              <label className="text-sm font-medium">Product Name</label>
              <input
                value={form.name}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setForm({ ...form, name: e.target.value })
                }
                className="w-full border rounded px-3 py-2 text-sm mt-1"
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium">Category</label>
              <select
                value={form.category}
                onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                  setForm({ ...form, category: e.target.value })
                }
                className="w-full border rounded px-3 py-2 text-sm mt-1"
              >
                {[
                  "grains",
                  "vegetables",
                  "fruits",
                  "livestock",
                  "dairy",
                  "tubers",
                  "spices",
                  "other",
                ].map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="text-sm font-medium">Description</label>
              <textarea
                value={form.description}
                onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                  setForm({ ...form, description: e.target.value })
                }
                className="w-full border rounded px-3 py-2 text-sm mt-1"
                rows={3}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Quantity</label>
              <input
                type="number"
                value={form.quantity}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setForm({ ...form, quantity: e.target.value })
                }
                className="w-full border rounded px-3 py-2 text-sm mt-1"
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium">Unit</label>
              <select
                value={form.unit}
                onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                  setForm({ ...form, unit: e.target.value })
                }
                className="w-full border rounded px-3 py-2 text-sm mt-1"
              >
                {[
                  "kg",
                  "tonnes",
                  "bags",
                  "litres",
                  "crates",
                  "pieces",
                  "bundles",
                ].map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium">Price per Unit (N)</label>
              <input
                type="number"
                value={form.price_per_unit}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setForm({ ...form, price_per_unit: e.target.value })
                }
                className="w-full border rounded px-3 py-2 text-sm mt-1"
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium">Min Order Quantity</label>
              <input
                type="number"
                value={form.min_order_quantity}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setForm({
                    ...form,
                    min_order_quantity: Number(e.target.value),
                  })
                }
                className="w-full border rounded px-3 py-2 text-sm mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium">State</label>
              <input
                value={form.location.state}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setForm({
                    ...form,
                    location: { ...form.location, state: e.target.value },
                  })
                }
                className="w-full border rounded px-3 py-2 text-sm mt-1"
                placeholder="e.g Lagos"
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium">LGA</label>
              <input
                value={form.location.lga}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setForm({
                    ...form,
                    location: { ...form.location, lga: e.target.value },
                  })
                }
                className="w-full border rounded px-3 py-2 text-sm mt-1"
                placeholder="e.g Ikeja"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Grade</label>
              <select
                value={form.grade}
                onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                  setForm({ ...form, grade: e.target.value })
                }
                className="w-full border rounded px-3 py-2 text-sm mt-1"
              >
                {["A", "B", "C", "ungraded"].map((g) => (
                  <option key={g} value={g}>
                    Grade {g}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={submitting}
                className="bg-green-700 text-white px-6 py-2 rounded font-medium text-sm"
              >
                {submitting ? "Uploading..." : "Upload Product"}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <p className="text-gray-400 text-sm">Loading...</p>
      ) : (
        <div className="flex flex-col gap-8">
          <div>
            <h2 className="font-semibold text-gray-700 mb-3">
              My Products ({products.length})
            </h2>
            {products.length === 0 ? (
              <p className="text-sm text-gray-400">No products listed yet</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {products.map((p) => (
                  <div key={p._id} className="bg-white rounded-lg shadow p-4">
                    <p className="font-medium text-gray-800">{p.name}</p>
                    <p className="text-sm text-gray-500 capitalize">
                      {p.category}
                    </p>
                    <p className="text-green-700 font-bold text-sm mt-1">
                      N{p.price_per_unit.toLocaleString()} / {p.unit}
                    </p>
                    <p className="text-xs text-gray-400">
                      {p.quantity} {p.unit} left
                    </p>
                    <span
                      className={`text-xs font-medium capitalize mt-1 inline-block ${
                        p.status === "available"
                          ? "text-green-600"
                          : "text-red-500"
                      }`}
                    >
                      {p.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <h2 className="font-semibold text-gray-700 mb-3">
              Incoming Orders ({orders.length})
            </h2>
            {orders.length === 0 ? (
              <p className="text-sm text-gray-400">No orders yet</p>
            ) : (
              <div className="flex flex-col gap-3">
                {orders.map((order) => (
                  <div
                    key={order._id}
                    className="bg-white rounded-lg shadow p-4 flex justify-between items-center"
                  >
                    <div>
                      <p className="font-medium text-gray-800">
                        {order.product?.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {order.quantity} {order.product?.unit} - N
                        {order.total_amount.toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-500">
                        Buyer: {order.buyer?.name}
                      </p>
                      <p
                        className={`text-sm font-medium capitalize mt-1 ${status_color(
                          order.delivery_status
                        )}`}
                      >
                        {order.delivery_status}
                      </p>
                    </div>
                    <Link
                      href={`/order/${order._id}`}
                      className="bg-green-700 text-white text-sm px-4 py-2 rounded"
                    >
                      View
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
