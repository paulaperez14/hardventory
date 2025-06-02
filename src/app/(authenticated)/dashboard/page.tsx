
'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatCard } from '@/components/shared/StatCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Users, Package, AlertTriangle, Tags, Truck } from 'lucide-react';
import Image from 'next/image';
import { getProducts } from '@/lib/products';
import { getUsers } from '@/lib/users';
import { getCategories } from '@/lib/categories';
import { getSuppliers } from '@/lib/suppliers';
import type { Product as FirestoreProduct, User as FirestoreUser, Category as FirestoreCategory, Supplier as FirestoreSupplier } from '@/types/firestore';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardPage() {
  const { user } = useAuth(); // Auth user info

  const [products, setProducts] = useState<FirestoreProduct[]>([]);
  const [allUsers, setAllUsers] = useState<FirestoreUser[]>([]);
  const [categories, setCategories] = useState<FirestoreCategory[]>([]);
  const [suppliers, setSuppliers] = useState<FirestoreSupplier[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoadingData(true);
      setDataError(null);
      try {
        const [productsData, usersData, categoriesData, suppliersData] = await Promise.all([
          getProducts(),
          getUsers(),
          getCategories(),
          getSuppliers(),
        ]);
        setProducts(productsData);
        setAllUsers(usersData);
        setCategories(categoriesData);
        setSuppliers(suppliersData);
      } catch (e: any) {
        setDataError('Failed to load dashboard data. ' + e.message);
        console.error(e);
      } finally {
        setLoadingData(false);
      }
    };
    fetchData();
  }, []);

  if (!user && loadingData) { // Still waiting for auth user and dashboard data
    return (
       <div className="flex flex-col gap-6 p-4 md:p-6 lg:p-8">
        <PageHeader title="Welcome!" description="Loading your dashboard..." />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {[...Array(5)].map((_, i) => ( <Skeleton key={i} className="h-[120px] w-full" /> ))}
        </div>
       </div>
    );
  }
  
  // Calculate low stock products after products data is fetched
  const lowStockProducts = products.filter(p => p.quantity < p.lowStockThreshold);

  const renderAdminDashboard = () => (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <StatCard title="Total Users" value={allUsers.length} icon={Users} />
        <StatCard title="Total Products" value={products.length} icon={Package} />
        <StatCard title="Low Stock Items" value={lowStockProducts.length} icon={AlertTriangle} description={`${lowStockProducts.length > 0 ? 'Action required' : 'All good'}`} />
        <StatCard title="Total Categories" value={categories.length} icon={Tags} />
        <StatCard title="Total Suppliers" value={suppliers.length} icon={Truck} />
      </div>
    </>
  );

  const renderBodegaDashboard = () => (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Productos" value={products.length} icon={Package} />
        <StatCard title="Items con Bajo Stock" value={lowStockProducts.length} icon={AlertTriangle} description={`${lowStockProducts.length > 0 ? 'Action required' : 'All good'}`} />
        <StatCard title="Total Categorias" value={categories.length} icon={Tags} />
        <StatCard title="Total Proveedores" value={suppliers.length} icon={Truck} />
      </div>
    </>
  );

  const renderSellerDashboard = () => (
    <>
      <div className="grid gap-4 md:grid-cols-2">
        <StatCard title="Total Products" value={products.length} icon={Package} />
        <StatCard title="Low Stock Items" value={lowStockProducts.length} icon={AlertTriangle} description={`${lowStockProducts.length > 0 ? 'Action required' : 'All good'}`} />
      </div>
    </>
  );
  
  const renderDashboardContent = () => {
    if (loadingData) {
      return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {[...Array(user?.role === 'admin' ? 5 : user?.role === 'bodega' ? 4 : 2)].map((_, i) => (
            <Skeleton key={i} className="h-[120px] w-full" />
          ))}
        </div>
      );
    }
    if (dataError) {
      return <p className="text-destructive">Error: {dataError}</p>;
    }

    switch (user?.role) {
      case 'admin':
        return renderAdminDashboard();
      case 'bodega':
        return renderBodegaDashboard();
      case 'seller':
        return renderSellerDashboard();
      default:
        return <p>No hay dashboard disponible para su rol, o los datos aún se están cargando.</p>;
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={`Welcome, ${user?.name || 'User'}!`} description={`Here's an overview for your ${user?.role || ''} role.`} />
      
      {renderDashboardContent()}

      {loadingData && !dataError && (
        <Card className="mt-6 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-6 w-6" />
              Alertas de Stock Bajo
            </CardTitle>
            <CardDescription>Cargando información sobre productos con bajo stock...</CardDescription>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[100px] w-full" />
          </CardContent>
        </Card>
      )}

      {!loadingData && dataError && lowStockProducts.length === 0 && (
         <Card className="mt-6 shadow-lg">
           <CardHeader>
             <CardTitle className="flex items-center gap-2 text-destructive">
               <AlertTriangle className="h-6 w-6" />
               Alertas de Stock Bajo
             </CardTitle>
             <CardDescription>No se ha podido cargar la información de productos con bajo stock debido a un error.</CardDescription>
           </CardHeader>
         </Card>
      )}

      {!loadingData && !dataError && lowStockProducts.length > 0 && (
        <Card className="mt-6 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-6 w-6" />
              Alertas de Stock Bajo
            </CardTitle>
            <CardDescription>Las existencias de estos productos se están agotando y es posible que haya que volver a pedirlos.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">Imagen</TableHead>
                  <TableHead>Nombre Producto</TableHead>
                  <TableHead className="text-right">Cantidad Actual</TableHead>
                  <TableHead className="text-right">Cantidad Mínima</TableHead>
                  <TableHead className="text-center">Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lowStockProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <Image
                        src={product.imageUrl || "https://placehold.co/64x64.png"}
                        alt={product.name}
                        width={64}
                        height={64}
                        className="rounded-md object-cover aspect-square"
                        data-ai-hint={"product image"}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell className="text-right text-destructive font-semibold">{product.quantity}</TableCell>
                    <TableCell className="text-right">{product.lowStockThreshold}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="destructive">Stock Bajo</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
       {!loadingData && !dataError && lowStockProducts.length === 0 && (
        <Card className="mt-6 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-6 w-6 text-green-500" /> {/* Using green for "all good" */}
              Alertas de Stock Bajo
            </CardTitle>
            <CardDescription>Todos los productos tienen suficiente stock. Excelente!</CardDescription>
          </CardHeader>
        </Card>
      )}
    </div>
  );
}
