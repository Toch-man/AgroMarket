// app/page.tsx
import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-5xl mx-auto px-4 py-20 text-center">
        <h1 className="text-4xl font-bold text-green-700 mb-4">AgroMarket</h1>
        <p className="text-gray-500 text-lg mb-8 max-w-xl mx-auto">
          A trusted marketplace connecting farmers directly to buyers. Secure
          escrow payments, real-time chat, and verified produce.
        </p>

        <div className="flex gap-4 justify-center">
          <Link
            href="/products"
            className="bg-green-700 text-white px-6 py-3 rounded font-medium"
          >
            Browse Products
          </Link>
          <Link
            href="/auth/register"
            className="border border-green-700 text-green-700 px-6 py-3 rounded font-medium"
          >
            Get Started
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-20 text-left">
          <div className="bg-green-50 rounded-lg p-6">
            <h3 className="font-semibold text-gray-800 mb-2">
              Direct from Farmers
            </h3>
            <p className="text-sm text-gray-500">
              Buy fresh produce directly from verified farmers across Nigeria
            </p>
          </div>
          <div className="bg-green-50 rounded-lg p-6">
            <h3 className="font-semibold text-gray-800 mb-2">
              Escrow Protection
            </h3>
            <p className="text-sm text-gray-500">
              Your payment is held securely until you confirm delivery
            </p>
          </div>
          <div className="bg-green-50 rounded-lg p-6">
            <h3 className="font-semibold text-gray-800 mb-2">In-Order Chat</h3>
            <p className="text-sm text-gray-500">
              Communicate directly with farmers about your order in real time
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
