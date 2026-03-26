// types/index.ts

export interface User {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: "farmer" | "buyer";
  crypto_wallets?: {
    ethereum?: string;
  };
  wallet?: {
    balance: number;
    escrow_balance: number;
    currency: string;
  };
}

export interface Product {
  _id: string;
  name: string;
  category: string;
  description?: string;
  quantity: number;
  unit: string;
  price_per_unit: number;
  min_order_quantity: number;
  location: {
    state: string;
    lga?: string;
  };
  images: { url: string; public_id?: string }[];
  grade: string;
  status: "available" | "sold_out" | "suspended";
  accepted_payment_methods: string[];
  owner: {
    _id: string;
    name: string;
    phone: string;
  };
  orders_count: number;
  views: number;
}

export interface Order {
  _id: string;
  product: {
    _id: string;
    name: string;
    images: { url: string }[];
    unit: string;
  };
  buyer: {
    _id: string;
    name: string;
    phone: string;
  };
  farmer: {
    _id: string;
    name: string;
    phone: string;
  };
  quantity: number;
  price_per_unit: number;
  total_amount: number;
  payment_method: string;
  payment_status: "unpaid" | "paid" | "refunded" | "failed";
  escrow_status: "holding" | "released" | "refunded";
  delivery_status: "pending" | "shipped" | "delivered" | "cancelled";
  delivery_address: {
    state: string;
    lga?: string;
    address?: string;
  };
  transaction_reference?: string;
  crypto_tx_hash?: string;
  crypto_wallet_address?: string;
  createdAt: string;
}

export interface Message {
  _id: string;
  from: string;
  fromUsername: string;
  orderId: string;
  text: string;
  type: "order";
  delivered: boolean;
  timestamp: string;
}
