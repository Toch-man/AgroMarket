"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="bg-green-700 text-white px-6 py-4 flex justify-between items-center">
      <Link href="/" className="text-xl font-bold tracking-wide">
        AgroMarket
      </Link>

      <div className="flex gap-6 items-center text-sm">
        <Link href="/product">Browse</Link>

        {!user && (
          <>
            <Link href="/auth/login">Login</Link>
            <Link href="/auth/register">Register</Link>
          </>
        )}

        {user?.role === "farmer" && <Link href="/dashboard">Dashboard</Link>}

        {user?.role === "buyer" && <Link href="/order">My Orders</Link>}

        {user && (
          <button
            onClick={logout}
            className="bg-white text-green-700 px-4 py-1 rounded font-medium"
          >
            Logout
          </button>
        )}
      </div>
    </nav>
  );
}
