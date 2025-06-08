
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
  role: 'admin' | 'bodega' | 'vendedor';
  createdAt?: Timestamp;
  avatar?: string;
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
  saleDate: string; // Firestore Timestamp of when the sale occurred - Converted to string for client
}

export interface GoodsReceipt {
  id?: string; // Firestore document ID
  productId: string;
  productName: string; // Denormalized for easier display
  supplierId?: string;
  supplierName?: string; // Denormalized for easier display
  quantityReceived: number;
  invoiceNumber?: string; // Or order reference
  receiptDate: string; // Date of entry - Converted to string for client
  recordedAt?: string; // Timestamp of when the record was created - Converted to string for client
  userId?: string; // Optional: ID of the user who recorded the receipt
  userName?: string; // Optional: Name of the user
}