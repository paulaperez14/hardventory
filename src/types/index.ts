
export type UserRole = 'admin' | 'bodega' | 'seller';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
}

export interface Product {
  id: string;
  name: string;
  category: Category; // This might be better as categoryId: string if ProductForm expects that
  supplier?: Supplier; // This might be better as supplierId: string
  quantity: number;
  lowStockThreshold: number;
  price: number;
  imageUrl?: string;
  description?: string;
  // Consider if 'category' and 'supplier' should be IDs or full objects based on usage.
  // The dashboard and product page likely need IDs then fetch details.
}

export interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  roles: UserRole[];
  subItems?: NavItem[];
}

