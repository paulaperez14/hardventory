
import type { NavItem, UserRole } from '@/types';
import { LayoutDashboard, Package, Tags, Truck, Users, FileText, ShoppingCart, ArchiveRestore } from 'lucide-react';

export const ALL_ROLES: UserRole[] = ['admin', 'bodega', 'seller'];
export const BODEGA_ROLES: UserRole[] = ['admin', 'bodega'];
export const ADMIN_ONLY: UserRole[] = ['admin'];
export const SELLER_AND_ADMIN_ROLES: UserRole[] = ['admin', 'seller'];

export const SIDENAV_ITEMS: NavItem[] = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    roles: ALL_ROLES,
  },
  {
    href: '/point-of-sale',
    label: 'Punto de Venta',
    icon: ShoppingCart,
    roles: SELLER_AND_ADMIN_ROLES,
  },
  {
    href: '/products',
    label: 'Productos',
    icon: Package,
    roles: BODEGA_ROLES,
  },
  {
    href: '/categories',
    label: 'Categorías',
    icon: Tags,
    roles: BODEGA_ROLES,
  },
  {
    href: '/suppliers',
    label: 'Proveedores',
    icon: Truck,
    roles: BODEGA_ROLES,
  },
  {
    href: '/goods-receipts',
    label: 'Entradas de Mercancías',
    icon: ArchiveRestore,
    roles: BODEGA_ROLES,
  },
  {
    href: '/users',
    label: 'Gestión de Usuarios',
    icon: Users,
    roles: ADMIN_ONLY,
  },
  {
    href: '/reports',
    label: 'Reportes',
    icon: FileText,
    roles: ADMIN_ONLY,
  },
];
