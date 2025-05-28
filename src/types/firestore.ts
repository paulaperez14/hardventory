
// src/types/firestore.ts

import type { Timestamp } from 'firebase/firestore';

export interface Product {
  id?: string;
  name: string;
  description: string;
  specifications?: string;
  price: number;
  categoryId: string; // Reference to a Category document ID
  supplierId?: string; // Reference to a Supplier document ID - Made optional
  quantity: number;
  lowStockThreshold: number;
  imageUrl?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface Category {
  id?: string;
  name: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface User {
  id?: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'seller';
  createdAt?: Timestamp;
  avatar?: string; // Optional: URL to the user's avatar image
  updatedAt?: Timestamp;
}

export interface Supplier {
  id?: string;
  name: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface CartItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface Sale {
  id?: string; // Firestore document ID
  items: CartItem[];
  grandTotal: number;
  saleDate: Timestamp; // Firestore Timestamp of when the sale occurred
}
