// app/payment/callback/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import api from "@/lib/api";

type PaymentStatus = "verifying" | "success" | "failed";

export default function PaymentCallbackPage() {
  const search_params = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<PaymentStatus>("verifying");

  useEffect(() => {
    const verify = async (): Promise<void> => {
      const reference = search_params.get("txnref");

      if (!reference) {
        setStatus("failed");
        return;
      }

      try {
        await api(`/payments/verify/${reference}`);
        setStatus("success");
        setTimeout(() => router.push("/orders"), 2000);
      } catch {
        setStatus("failed");
      }
    };

    verify();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow text-center max-w-sm w-full">
        {status === "verifying" && (
          <>
            <p className="text-gray-600 font-medium">
              Verifying your payment...
            </p>
            <p className="text-sm text-gray-400 mt-2">Please wait</p>
          </>
        )}

        {status === "success" && (
          <>
            <p className="text-green-700 text-xl font-bold">
              Payment Confirmed
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Your funds are held in escrow. Redirecting to your orders...
            </p>
          </>
        )}

        {status === "failed" && (
          <>
            <p className="text-red-600 text-xl font-bold">Payment Failed</p>
            <p className="text-sm text-gray-500 mt-2">
              Something went wrong. Please try again.
            </p>
            <button
              onClick={() => router.push("/orders")}
              className="mt-4 bg-green-700 text-white px-4 py-2 rounded text-sm"
            >
              Go to Orders
            </button>
          </>
        )}
      </div>
    </div>
  );
}
