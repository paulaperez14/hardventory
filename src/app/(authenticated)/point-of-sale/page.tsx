
// src/app/(authenticated)/point-of-sale/page.tsx
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Image from 'next/image';
import { PageHeader } from '@/components/shared/PageHeader';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { getProducts } from '@/lib/products';
import { getCategories } from '@/lib/categories';
import { getSuppliers } from '@/lib/suppliers';
import { addSale } from '@/lib/sales';
import type { Product as FirestoreProduct, Category as FirestoreCategory, Supplier as FirestoreSupplier, CartItem } from '@/types/firestore';
import { ShoppingCart, Search, FilterX, PackageOpen, Trash2, Plus, Minus, PackageX as EmptyCartIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const PRODUCTS_PER_PAGE = 20;

export default function PointOfSalePage() {
  const { toast } = useToast();

  const [allProducts, setAllProducts] = useState<FirestoreProduct[]>([]);
  const [categories, setCategories] = useState<FirestoreCategory[]>([]);
  const [suppliers, setSuppliers] = useState<FirestoreSupplier[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('');

  const [showAddToCartDialog, setShowAddToCartDialog] = useState(false);
  const [productToAdd, setProductToAdd] = useState<FirestoreProduct | null>(null);
  const [quantityToAdd, setQuantityToAdd] = useState<number>(1);
  const [addToCartError, setAddToCartError] = useState<string | null>(null);
  
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isProcessingSale, setIsProcessingSale] = useState(false);

  const [expandedDescriptions, setExpandedDescriptions] = useState<Record<string, boolean>>({});
  const [currentPage, setCurrentPage] = useState(1);

  const categoryMap = useMemo(() => new Map(categories.map(cat => [cat.id!, cat.name])), [categories]);
  const supplierMap = useMemo(() => new Map(suppliers.map(sup => [sup.id!, sup.name])), [suppliers]);

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [productsData, categoriesData, suppliersData] = await Promise.all([
        getProducts(),
        getCategories(),
        getSuppliers(),
      ]);
      setAllProducts(productsData);
      setCategories(categoriesData);
      setSuppliers(suppliersData);
    } catch (e: any) {
      setError('Error al cargar datos: ' + e.message);
      toast({ variant: 'destructive', title: 'Error de Carga', description: e.message });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const filteredProducts = useMemo(() => {
    return allProducts.filter(product => {
      const matchesSearchTerm = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                               (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCategory = selectedCategoryId ? product.categoryId === selectedCategoryId : true;
      const matchesSupplier = selectedSupplierId ? product.supplierId === selectedSupplierId : true;
      return matchesSearchTerm && matchesCategory && matchesSupplier;
    });
  }, [allProducts, searchTerm, selectedCategoryId, selectedSupplierId]);

  const currentDisplayProducts = useMemo(() => {
    const indexOfLastProduct = currentPage * PRODUCTS_PER_PAGE;
    const indexOfFirstProduct = indexOfLastProduct - PRODUCTS_PER_PAGE;
    return filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct);
  }, [filteredProducts, currentPage]);

  const totalPages = Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE);

  const grandTotal = useMemo(() => {
    return cartItems.reduce((total, item) => total + item.subtotal, 0);
  }, [cartItems]);

  const handleSearchTermChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleCategoryChange = (value: string) => {
    setSelectedCategoryId(value);
    setCurrentPage(1);
  };

  const handleSupplierChange = (value: string) => {
    setSelectedSupplierId(value);
    setCurrentPage(1);
  };
  
  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedCategoryId('');
    setSelectedSupplierId('');
    setCurrentPage(1);
  };

  const handleOpenAddToCartDialog = (product: FirestoreProduct) => {
    setProductToAdd(product);
    setQuantityToAdd(1);
    setAddToCartError(null);
    setShowAddToCartDialog(true);
  };

  const handleAddToCart = () => {
    if (!productToAdd || !productToAdd.id) {
      setAddToCartError("Producto no válido.");
      return;
    }
    if (quantityToAdd <= 0) {
      setAddToCartError("La cantidad debe ser mayor que cero.");
      return;
    }
    if (quantityToAdd > productToAdd.quantity) {
      setAddToCartError(`No hay suficiente stock. Disponible: ${productToAdd.quantity}.`);
      return;
    }

    setCartItems(prevCart => {
      const existingItemIndex = prevCart.findIndex(item => item.productId === productToAdd.id);
      if (existingItemIndex > -1) {
        const updatedCart = [...prevCart];
        const newQuantityForExisting = updatedCart[existingItemIndex].quantity + quantityToAdd;
        if (newQuantityForExisting > productToAdd.quantity) {
           setAddToCartError(`No se puede añadir más. Total en carrito (${newQuantityForExisting}) excede stock (${productToAdd.quantity}).`);
           return prevCart; 
        }
        updatedCart[existingItemIndex].quantity = newQuantityForExisting;
        updatedCart[existingItemIndex].subtotal = newQuantityForExisting * updatedCart[existingItemIndex].unitPrice;
        return updatedCart;
      } else {
        return [
          ...prevCart,
          {
            productId: productToAdd.id!,
            productName: productToAdd.name,
            quantity: quantityToAdd,
            unitPrice: productToAdd.price,
            subtotal: productToAdd.price * quantityToAdd,
          }
        ];
      }
    });
    toast({ title: "Producto Añadido", description: `${quantityToAdd} x ${productToAdd.name} añadido al carrito.` });
    setShowAddToCartDialog(false);
  };

  const handleUpdateCartItemQuantity = (productId: string, newQuantity: number) => {
    const productInAll = allProducts.find(p => p.id === productId);
    if (!productInAll) return; 

    if (newQuantity <= 0) {
      handleRemoveCartItem(productId);
      return;
    }
    if (newQuantity > productInAll.quantity) {
      toast({ variant: 'destructive', title: 'Stock Insuficiente', description: `No puede añadir más de ${productInAll.quantity} para ${productInAll.name}.` });
      return;
    }

    setCartItems(prevCart => 
      prevCart.map(item => 
        item.productId === productId 
          ? { ...item, quantity: newQuantity, subtotal: newQuantity * item.unitPrice }
          : item
      )
    );
  };

  const handleRemoveCartItem = (productId: string) => {
    setCartItems(prevCart => prevCart.filter(item => item.productId !== productId));
    toast({ title: "Producto Eliminado", description: "El producto ha sido eliminado del carrito." });
  };
  
  const handleClearCart = () => {
    setCartItems([]);
    toast({ title: "Carrito Vacío", description: "Todos los productos han sido eliminados del carrito." });
  };

  const handleFinalizeSale = async () => {
    if (cartItems.length === 0) {
      toast({ variant: 'destructive', title: 'Carrito Vacío', description: 'No hay productos en el carrito para vender.' });
      return;
    }

    setIsProcessingSale(true);
    try {
      await addSale(cartItems, grandTotal);
      toast({ title: "Venta Exitosa", description: "La venta ha sido registrada correctamente." });
      setCartItems([]); 
      fetchAllData(); 
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Error en Venta', description: 'Error al procesar la venta: ' + e.message });
      console.error('Sale finalization error:', e);
    } finally {
      setIsProcessingSale(false);
    }
  };

  const toggleDescription = (productId: string) => {
    setExpandedDescriptions(prev => ({
      ...prev,
      [productId]: !prev[productId]
    }));
  };
  
  const renderProductCards = () => {
    if (loading) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-6">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="h-48 w-full" />
              <CardContent className="p-4 space-y-2">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-4 w-1/3" />
              </CardContent>
              <CardFooter className="p-4">
                <Skeleton className="h-10 w-full" />
              </CardFooter>
            </Card>
          ))}
        </div>
      );
    }

    if (error) {
      return <p className="text-destructive text-center mt-10">{error}</p>;
    }

    if (currentDisplayProducts.length === 0) {
      return (
        <div className="text-center py-10 mt-6 flex flex-col items-center">
          <PackageOpen className="h-16 w-16 text-muted-foreground mb-4" />
          <p className="text-xl font-semibold text-muted-foreground">No se encontraron productos</p>
          <p className="text-muted-foreground">Intente ajustar los filtros o el término de búsqueda.</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-6">
        {currentDisplayProducts.map((product) => (
          <Card key={product.id} className="flex flex-col overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="p-0 relative">
              <Image
                src={product.imageUrl || "https://placehold.co/600x400.png"}
                alt={product.name}
                width={600}
                height={400}
                className="object-cover w-full h-48"
                data-ai-hint="product item"
              />
              {product.quantity < product.lowStockThreshold && (
                <Badge 
                  variant="outline" 
                  className="absolute top-2 right-2 bg-orange-400 text-white border-orange-500 px-2 py-1 text-xs font-semibold shadow-md"
                >
                  Stock Bajo
                </Badge>
              )}
            </CardHeader>
            <CardContent className="p-4 flex-grow flex flex-col">
              <h3 className="text-lg font-semibold truncate" title={product.name}>{product.name}</h3>
              {product.categoryId && categoryMap.has(product.categoryId) && (
                <Badge variant="secondary" className="text-xs mt-1 mb-2 w-fit">
                  {categoryMap.get(product.categoryId)}
                </Badge>
              )}
              
              <div className="text-sm text-muted-foreground mt-1 mb-3">
                {product.description ? (
                  product.description.length > 70 ? (
                    expandedDescriptions[product.id!] ? (
                      <>
                        {product.description}
                        <button 
                          onClick={() => toggleDescription(product.id!)} 
                          className="text-primary hover:underline text-xs ml-1 font-medium"
                          aria-expanded="true"
                        >
                          Ver menos
                        </button>
                      </>
                    ) : (
                      <>
                        {product.description.substring(0, 70)}...
                        <button 
                          onClick={() => toggleDescription(product.id!)} 
                          className="text-primary hover:underline text-xs ml-1 font-medium"
                          aria-expanded="false"
                        >
                          Ver más
                        </button>
                      </>
                    )
                  ) : (
                    product.description
                  )
                ) : (
                  'Sin descripción.'
                )}
              </div>

              {product.specifications && product.specifications.trim() !== '' && (
                 <Accordion type="single" collapsible className="w-full mb-3">
                  <AccordionItem value={`specs-${product.id}`} className="border-b-0">
                    <AccordionTrigger className="text-xs hover:no-underline py-1 px-0 justify-start gap-1 [&[data-state=open]>svg]:text-primary">
                      Especificaciones
                    </AccordionTrigger>
                    <AccordionContent className="text-xs text-muted-foreground pt-1 pb-0">
                      {product.specifications}
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              )}

              <div className="flex justify-between items-center mt-auto mb-2">
                <p className="text-xl font-bold text-primary">${product.price.toFixed(2)}</p>
                <p className="text-sm font-medium">Stock: <span className={product.quantity < product.lowStockThreshold ? "text-orange-600 font-bold" : "text-foreground"}>{product.quantity}</span></p>
              </div>
              {product.supplierId && supplierMap.has(product.supplierId) && (
                <p className="text-xs text-muted-foreground mb-3">Proveedor: {supplierMap.get(product.supplierId)}</p>
              )}
            </CardContent>
            <CardFooter className="p-4 border-t">
              <Button 
                className="w-full" 
                onClick={() => handleOpenAddToCartDialog(product)}
                disabled={product.quantity === 0}
              >
                <ShoppingCart className="mr-2 h-4 w-4" /> Añadir al Carrito
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  };

  const renderPaginationControls = () => {
    if (totalPages <= 1) return null;

    return (
      <div className="flex justify-center items-center gap-4 mt-8">
        <Button
          variant="outline"
          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
        >
          <ChevronLeft className="mr-2 h-4 w-4" /> Anterior
        </Button>
        <span className="text-sm text-muted-foreground">
          Página {currentPage} de {totalPages}
        </span>
        <Button
          variant="outline"
          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
          disabled={currentPage === totalPages}
        >
          Siguiente <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    );
  };


  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Punto de Venta" description="Busque productos y gestione el carrito de ventas." />

      {/* Shopping Cart Section - Moved to the top */}
      <Card className="shadow-lg">
          <CardHeader>
              <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-6 w-6 text-primary" />
                  Carrito de Compras
              </CardTitle>
              <CardDescription>Revise los productos antes de finalizar la venta.</CardDescription>
          </CardHeader>
          <CardContent className="max-h-[60vh] overflow-y-auto pr-2">
              {cartItems.length === 0 ? (
                  <div className="text-center py-10 text-muted-foreground">
                      <PackageOpen className="h-12 w-12 mx-auto mb-3" />
                      <p>El carrito está vacío.</p>
                      <p className="text-xs">Añada productos para iniciar una venta.</p>
                  </div>
              ) : (
                  <Table>
                      <TableHeader>
                          <TableRow>
                          <TableHead>Producto</TableHead>
                          <TableHead className="w-[100px] text-center">Cant.</TableHead>
                          <TableHead className="text-right">Subtotal</TableHead>
                          <TableHead className="w-[40px]"></TableHead>
                          </TableRow>
                      </TableHeader>
                      <TableBody>
                          {cartItems.map(item => (
                          <TableRow key={item.productId}>
                              <TableCell className="font-medium text-sm py-2">
                                  {item.productName}
                                  <p className="text-xs text-muted-foreground">${item.unitPrice.toFixed(2)} c/u</p>
                              </TableCell>
                              <TableCell className="py-2">
                                  <div className="flex items-center justify-center gap-1">
                                      <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => handleUpdateCartItemQuantity(item.productId, item.quantity - 1)} disabled={isProcessingSale}>
                                          <Minus className="h-3 w-3" />
                                      </Button>
                                      <Input 
                                          type="number" 
                                          value={item.quantity} 
                                          onChange={(e) => {
                                              const val = parseInt(e.target.value);
                                              if (!isNaN(val)) handleUpdateCartItemQuantity(item.productId, val);
                                          }}
                                          className="h-7 w-12 text-center px-1"
                                          min="1"
                                          disabled={isProcessingSale}
                                      />
                                      <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => handleUpdateCartItemQuantity(item.productId, item.quantity + 1)} disabled={isProcessingSale}>
                                          <Plus className="h-3 w-3" />
                                      </Button>
                                  </div>
                              </TableCell>
                              <TableCell className="text-right font-semibold py-2">${item.subtotal.toFixed(2)}</TableCell>
                              <TableCell className="py-2">
                                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleRemoveCartItem(item.productId)} disabled={isProcessingSale}>
                                      <Trash2 className="h-4 w-4" />
                                  </Button>
                              </TableCell>
                          </TableRow>
                          ))}
                      </TableBody>
                  </Table>
              )}
          </CardContent>
          {cartItems.length > 0 && (
              <CardFooter className="flex flex-col gap-3 pt-4 border-t">
                  <div className="flex justify-between w-full text-lg font-bold">
                      <span>Total General:</span>
                      <span className="text-primary">${grandTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex gap-2 w-full">
                     <Button variant="outline" className="flex-1" onClick={handleClearCart} disabled={isProcessingSale}>
                          <EmptyCartIcon className="mr-2 h-4 w-4" /> Vaciar Carrito
                      </Button>
                      <Button className="flex-1" onClick={handleFinalizeSale} disabled={isProcessingSale || cartItems.length === 0}>
                          {isProcessingSale ? "Procesando..." : "Finalizar Venta"}
                      </Button>
                  </div>
              </CardFooter>
          )}
      </Card>

      {/* Product Listing and Filters Section */}
      <div className="space-y-6">
          <Card className="shadow-md">
              <CardContent className="p-4 space-y-4 md:space-y-0 md:flex md:flex-wrap md:gap-4 md:items-end">
              <div className="flex-grow md:min-w-[250px]">
                  <Label htmlFor="search-product" className="text-xs">Buscar Productos</Label>
                  <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                      id="search-product"
                      type="text"
                      placeholder="Buscar por nombre o descripción..."
                      value={searchTerm}
                      onChange={(e) => handleSearchTermChange(e.target.value)}
                      className="pl-8 w-full"
                  />
                  </div>
              </div>
              
              <div className="flex-grow md:min-w-[200px]">
                  <Label htmlFor="category-filter" className="text-xs">Categoría</Label>
                  <Select value={selectedCategoryId} onValueChange={handleCategoryChange}>
                  <SelectTrigger id="category-filter" className="w-full">
                      <SelectValue placeholder="Todas las categorías" />
                  </SelectTrigger>
                  <SelectContent>
                      {categories.map(cat => (
                      cat.id && <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                      ))}
                  </SelectContent>
                  </Select>
              </div>

              <div className="flex-grow md:min-w-[200px]">
                  <Label htmlFor="supplier-filter" className="text-xs">Proveedor</Label>
                  <Select value={selectedSupplierId} onValueChange={handleSupplierChange}>
                  <SelectTrigger id="supplier-filter" className="w-full">
                      <SelectValue placeholder="Todos los proveedores" />
                  </SelectTrigger>
                  <SelectContent>
                      {suppliers.map(sup => (
                      sup.id && <SelectItem key={sup.id} value={sup.id}>{sup.name}</SelectItem>
                      ))}
                  </SelectContent>
                  </Select>
              </div>
              
              <Button variant="outline" onClick={handleClearFilters} className="w-full md:w-auto">
                  <FilterX className="mr-2 h-4 w-4" /> Limpiar Filtros
              </Button>
              </CardContent>
          </Card>

          {renderProductCards()}
          {renderPaginationControls()}
      </div>


      {/* Add to Cart Dialog */}
      {productToAdd && (
        <Dialog open={showAddToCartDialog} onOpenChange={setShowAddToCartDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Añadir al Carrito: {productToAdd.name}</DialogTitle>
              <DialogDescription>
                Disponible en stock: {productToAdd.quantity}. Ingrese la cantidad a añadir.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {addToCartError && <p className="text-sm text-destructive bg-destructive/10 p-2 rounded-md">{addToCartError}</p>}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="add-quantity" className="text-right">Cantidad</Label>
                <Input
                  id="add-quantity"
                  type="number"
                  value={quantityToAdd}
                  onChange={(e) => {
                      const val = parseInt(e.target.value);
                      setQuantityToAdd(isNaN(val) ? 0 : val);
                      if (addToCartError) setAddToCartError(null); 
                  }}
                  className="col-span-3"
                  min="1"
                  max={productToAdd.quantity}
                />
              </div>
               <p className="col-span-4 text-sm text-muted-foreground text-right">
                Precio Unitario: ${productToAdd.price.toFixed(2)}
              </p>
              <p className="col-span-4 text-lg font-semibold text-primary text-right">
                Subtotal: ${(productToAdd.price * (isNaN(quantityToAdd) || quantityToAdd < 0 ? 0 : quantityToAdd)).toFixed(2)}
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddToCartDialog(false)}>Cancelar</Button>
              <Button onClick={handleAddToCart}>Añadir al Carrito</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

