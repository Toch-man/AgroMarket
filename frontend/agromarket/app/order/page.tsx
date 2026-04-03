// app/orders/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";
import { Order } from "@/types";

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetch_orders = async (): Promise<void> => {
      try {
        const data: any = await api("/orders/my-orders");
        setOrders(data.orders);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetch_orders();
  }, []);

  const status_color = (status: string): string => {
    if (status === "delivered") return "text-green-600";
    if (status === "cancelled") return "text-red-500";
    if (status === "shipped") return "text-blue-500";
    return "text-yellow-500";
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">My Orders</h1>

      {loading ? (
        <p className="text-gray-400 text-sm">Loading orders...</p>
      ) : orders.length === 0 ? (
        <p className="text-gray-400 text-sm">You have no orders yet</p>
      ) : (
        <div className="flex flex-col gap-4">
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
                  Farmer: {order.farmer?.name}
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
  );
}
