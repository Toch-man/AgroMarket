"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import api from "@/lib/api";
import ChatBox from "@/components/chatBox";
import { useAuth } from "@/context/AuthContext";
import { Order } from "@/types";

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [updating, setUpdating] = useState<boolean>(false);

  const fetch_order = async (): Promise<void> => {
    try {
      const data: any = await api(`/orders/${id}`);
      setOrder(data.order);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch_order();
  }, [id]);

  const handle_action = async (action: string): Promise<void> => {
    setUpdating(true);
    try {
      await api(`/orders/${id}/${action}`, { method: "PATCH" });
      await fetch_order();
    } catch (err) {
      console.error(err);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <p className="p-8 text-gray-400 text-sm">Loading...</p>;
  if (!order)
    return <p className="p-8 text-gray-400 text-sm">Order not found</p>;

  const is_farmer = user?._id === order.farmer?._id?.toString();
  const is_buyer = user?._id === order.buyer?._id?.toString();

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 flex flex-col gap-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-xl font-bold text-gray-800 mb-4">Order Details</h1>

        <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
          <p>
            Product:{" "}
            <span className="font-medium text-gray-800">
              {order.product?.name}
            </span>
          </p>
          <p>
            Quantity:{" "}
            <span className="font-medium text-gray-800">
              {order.quantity} {order.product?.unit}
            </span>
          </p>
          <p>
            Total:{" "}
            <span className="font-medium text-green-700">
              N{order.total_amount?.toLocaleString()}
            </span>
          </p>
          <p>
            Payment:{" "}
            <span className="font-medium capitalize">
              {order.payment_method}
            </span>
          </p>
          <p>
            Payment Status:{" "}
            <span className="font-medium capitalize">
              {order.payment_status}
            </span>
          </p>
          <p>
            Delivery:{" "}
            <span className="font-medium capitalize">
              {order.delivery_status}
            </span>
          </p>
          <p>
            Escrow:{" "}
            <span className="font-medium capitalize">
              {order.escrow_status}
            </span>
          </p>
        </div>

        <div className="flex gap-2 mt-4 flex-wrap">
          {is_farmer && order.delivery_status === "pending" && (
            <button
              onClick={() => handle_action("ship")}
              disabled={updating}
              className="bg-blue-600 text-white px-4 py-2 rounded text-sm"
            >
              {updating ? "Updating..." : "Mark as Shipped"}
            </button>
          )}

          {is_buyer && order.delivery_status === "shipped" && (
            <button
              onClick={() => handle_action("delivered")}
              disabled={updating}
              className="bg-green-700 text-white px-4 py-2 rounded text-sm"
            >
              {updating ? "Updating..." : "Confirm Delivery"}
            </button>
          )}

          {order.delivery_status === "pending" && (
            <button
              onClick={() => handle_action("cancel")}
              disabled={updating}
              className="bg-red-500 text-white px-4 py-2 rounded text-sm"
            >
              {updating ? "Cancelling..." : "Cancel Order"}
            </button>
          )}
        </div>
      </div>

      <ChatBox order_id={id} />
    </div>
  );
}
