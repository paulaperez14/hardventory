
export type UserRole = 'admin' | 'manager' | 'seller'; // Changed 'vendedor' to 'seller'

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
  // SKU was removed previously, ensure this type reflects current Product fields accurately
  // Consider if 'category' and 'supplier' should be IDs or full objects based on usage.
  // The dashboard and product page likely need IDs then fetch details.
  // For now, keeping as is from previous state, but flag for review if data display issues arise.
}

export interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  roles: UserRole[];
  subItems?: NavItem[];
}

