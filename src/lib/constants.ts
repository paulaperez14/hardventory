
import type { NavItem, UserRole } from '@/types';
import { LayoutDashboard, Package, Tags, Truck, Users, FileText, Settings, ShoppingCart } from 'lucide-react';

export const ALL_ROLES: UserRole[] = ['admin', 'manager', 'seller'];
export const MANAGER_ROLES: UserRole[] = ['admin', 'manager'];
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
    roles: MANAGER_ROLES,
  },
  {
    href: '/categories',
    label: 'Categorías',
    icon: Tags,
    roles: MANAGER_ROLES,
  },
  {
    href: '/suppliers',
    label: 'Proveedores',
    icon: Truck,
    roles: MANAGER_ROLES,
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

