// app/auth/register/page.tsx
"use client";

import { useState, ChangeEvent, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { User } from "@/types";

interface RegisterForm {
  first_name: string;
  last_name: string;
  user_name: string;
  email: string;
  password: string;
  role: "buyer" | "farmer";
  phone: string;
}

export default function RegisterPage() {
  const { login } = useAuth();
  const router = useRouter();

  const [form, setForm] = useState<RegisterForm>({
    first_name: "",
    last_name: "",
    user_name: "",
    email: "",
    password: "",
    role: "buyer",
    phone: "",
  });

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const handle_change = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ): void => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handle_submit = async (
    e: FormEvent<HTMLFormElement>
  ): Promise<void> => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const data: { user: User; token: string } = await api("/auth/signup", {
        method: "POST",
        body: JSON.stringify(form),
      });

      login(data.user, data.token);
      router.push(data.user.role === "farmer" ? "/dashboard" : "/product");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow w-full max-w-md">
        <h1 className="text-2xl font-bold text-green-700 mb-6">
          Create Account
        </h1>

        {error && (
          <p className="bg-red-100 text-red-600 p-3 rounded mb-4 text-sm">
            {error}
          </p>
        )}

        <form onSubmit={handle_submit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">First Name</label>
            <input
              name="first_name"
              value={form.first_name}
              onChange={handle_change}
              className="w-full border rounded px-3 py-2 text-sm"
              placeholder="John"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">last Name</label>
            <input
              name="last_name"
              value={form.last_name}
              onChange={handle_change}
              className="w-full border rounded px-3 py-2 text-sm"
              placeholder="John"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">user_Name</label>
            <input
              name="username"
              value={form.user_name}
              onChange={handle_change}
              className="w-full border rounded px-3 py-2 text-sm"
              placeholder="John"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handle_change}
              className="w-full border rounded px-3 py-2 text-sm"
              placeholder="john@email.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Phone</label>
            <input
              name="phone"
              value={form.phone}
              onChange={handle_change}
              className="w-full border rounded px-3 py-2 text-sm"
              placeholder="08012345678"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={handle_change}
              className="w-full border rounded px-3 py-2 text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">I am a</label>
            <select
              name="role"
              value={form.role}
              onChange={handle_change}
              className="w-full border rounded px-3 py-2 text-sm"
            >
              <option value="buyer">Buyer</option>
              <option value="farmer">Farmer</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-700 text-white py-2 rounded font-medium"
          >
            {loading ? "Creating account..." : "Register"}
          </button>
        </form>

        <p className="text-sm text-center mt-4">
          Already have an account?{" "}
          <Link href="/auth/login" className="text-green-700 font-medium">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
