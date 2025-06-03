
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, PlusCircle, Edit, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import Image from 'next/image';

import { getProducts, deleteProduct } from '@/lib/products';
import { getCategories } from '@/lib/categories';
import { getSuppliers } from '@/lib/suppliers';
import type { Product, Category, Supplier } from '@/types/firestore';
import ProductForm from '@/components/forms/ProductForm';

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [productToDeleteId, setProductToDeleteId] = useState<string | null>(null);

  const [showProductForm, setShowProductForm] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | undefined>(undefined);
  
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [allSuppliers, setAllSuppliers] = useState<Supplier[]>([]);
  const [categoryMap, setCategoryMap] = useState<Map<string, string>>(new Map());

  const fetchPageData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [productsData, categoriesData, suppliersData] = await Promise.all([
        getProducts(),
        getCategories(),
        getSuppliers(),
      ]);
      
      setProducts(productsData);
      setAllCategories(categoriesData);
      setAllSuppliers(suppliersData);

      const catMap = new Map(categoriesData.map(cat => [cat.id!, cat.name]));
      setCategoryMap(catMap);

    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPageData();
  }, [fetchPageData]);

  const handleAddClick = () => {
    setSelectedProduct(undefined);
    setShowProductForm(true);
  };

  const handleEditClick = (product: Product) => {
    setSelectedProduct(product);
    setShowProductForm(true);
  };

  const handleFormSuccess = () => {
    setShowProductForm(false);
    setSelectedProduct(undefined);
    fetchPageData(); // Refresh the list
  };

  const handleDeleteClick = (productId: string) => {
    setProductToDeleteId(productId);
    setShowDeleteConfirmModal(true);
  };

  const confirmDeleteProduct = async () => {
    if (productToDeleteId) {
      try {
        await deleteProduct(productToDeleteId);
        fetchPageData(); // Refresh the list
      } catch (e: any) {
        setError(`Failed to delete product: ${e.message}`);
      } finally {
        setShowDeleteConfirmModal(false);
        setProductToDeleteId(null);
      }
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Product Management" description="Manage your product inventory.">
        <Button onClick={handleAddClick}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add New Product
        </Button>
      </PageHeader>

      <Card>
        <CardHeader>
          <CardTitle>Product List</CardTitle>
          <CardDescription>View, edit, and manage all products.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Image</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center">Cargando productos...</TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-destructive">Error al cargar productos: {error}</TableCell>
                </TableRow>
              ) : products.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center">No se encontraron productos.</TableCell>
                </TableRow>
              ) : (
                products.map((product) => (
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
                    <TableCell>{categoryMap.get(product.categoryId) || product.categoryId || 'N/A'}</TableCell>
                    <TableCell className="text-right">${product.price.toFixed(2)}</TableCell>
                    <TableCell className="text-right">{product.quantity}</TableCell>
                    <TableCell className="text-center">
                      {product.quantity === 0 ? (
                        <Badge variant="destructive">Out of Stock</Badge>
                      ) : product.quantity < (product.lowStockThreshold || 0) ? (
                        <Badge variant="destructive">Low Stock</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-green-600 bg-green-100 border-green-200">In Stock</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditClick(product)}>
                            <Edit className="mr-2 h-4 w-4" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive focus:bg-destructive/10"
                            onClick={() => handleDeleteClick(product.id!)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
  
      {/* Product Form Dialog */}
      <Dialog open={showProductForm} onOpenChange={setShowProductForm}>
        <DialogContent className="sm:max-w-md md:max-w-lg lg:max-w-xl">
          <DialogHeader>
            <DialogTitle>{selectedProduct ? 'Editar Producto' : 'Añadir Producto'}</DialogTitle>
            <DialogDescription>
              {selectedProduct ? 'Actualice los datos de este producto.' : 'Rellene los datos para añadir un nuevo producto al inventario.'}
            </DialogDescription>
          </DialogHeader>
          <div className="p-2 max-h-[70vh] overflow-y-auto">
            <ProductForm 
              product={selectedProduct} 
              categories={allCategories}
              suppliers={allSuppliers}
              onSuccess={handleFormSuccess} 
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmation Delete Modal */}
      <Dialog open={showDeleteConfirmModal} onOpenChange={setShowDeleteConfirmModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirmar Eliminación</DialogTitle>
            <DialogDescription>¿Está seguro de que desea eliminar este producto? Esta acción no se puede deshacer.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteConfirmModal(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={confirmDeleteProduct}>Eliminar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
