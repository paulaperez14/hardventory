
// src/app/(authenticated)/goods-receipts/page.tsx
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, PlusCircle, Search, FilterX, LayoutList } from 'lucide-react';
import { format, parseISO, isValid } from 'date-fns';
import type { DateRange } from 'react-day-picker';
import { Label } from '@/components/ui/label'; 

import { getGoodsReceipts } from '@/lib/goodsReceipts';
import { getProducts } from '@/lib/products';
import { getSuppliers } from '@/lib/suppliers';
import type { GoodsReceipt, Product, Supplier } from '@/types/firestore';
// Timestamp import is not needed here if dates are always strings from lib
import GoodsReceiptForm from '@/components/forms/GoodsReceiptForm';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';

export default function GoodsReceiptsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [receipts, setReceipts] = useState<GoodsReceipt[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  
  const [loadingData, setLoadingData] = useState(true);
  const [errorData, setErrorData] = useState<string | null>(null);
  
  const [showForm, setShowForm] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

  // Redirect if not manager or admin or still loading auth
  useEffect(() => {
    if (!authLoading) {
      if (!user || !['admin', 'bodega'].includes(user.role)) {
        router.replace('/dashboard');
      }
    }
  }, [user, authLoading, router]);

  const fetchData = useCallback(async () => {
    setLoadingData(true);
    setErrorData(null);
    try {
      const [receiptsData, productsData, suppliersData] = await Promise.all([
        getGoodsReceipts(),
        getProducts(),
        getSuppliers(),
      ]);
      setReceipts(receiptsData);
      setProducts(productsData);
      setSuppliers(suppliersData);
    } catch (e: any) {
      setErrorData(`Error al cargar datos: ${e.message}`);
      console.error(e);
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    if (user && ['admin', 'bodega'].includes(user.role)) {
        fetchData();
    }
  }, [user, fetchData]);

  const handleFormSuccess = () => {
    setShowForm(false);
    fetchData(); // Refresh the list of receipts and potentially product data
  };

  const filteredReceipts = useMemo(() => {
    return receipts.filter(receipt => {
      let actualReceiptDate: Date | null = null;

      if (receipt.receiptDate && typeof receipt.receiptDate === 'string') {
        try {
          const parsedDate = parseISO(receipt.receiptDate);
          if (isValid(parsedDate)) {
            actualReceiptDate = parsedDate;
          }
        } catch (e) {
          // console.warn(`Invalid date string for receipt ${receipt.id}: ${receipt.receiptDate}`);
        }
      }
      
      const matchesSearch = searchTerm.trim() === '' ||
        receipt.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (receipt.supplierName && receipt.supplierName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (receipt.invoiceNumber && receipt.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()));
      
      let matchesDateRange = true; 
      if (dateRange?.from || dateRange?.to) {
        if (actualReceiptDate && isValid(actualReceiptDate)) {
          matchesDateRange = 
            (!dateRange.from || actualReceiptDate >= dateRange.from) && 
            (!dateRange.to || actualReceiptDate <= new Date(dateRange.to.setHours(23,59,59,999)));
        } else {
          matchesDateRange = false; 
        }
      }
      
      return matchesSearch && matchesDateRange;
    });
  }, [receipts, searchTerm, dateRange]);

  const handleClearFilters = () => {
    setSearchTerm('');
    setDateRange(undefined);
  };

  if (authLoading || (!user && loadingData)) { 
    return (
      <div className="flex flex-col gap-6 p-4 md:p-6 lg:p-8">
        <PageHeader title="Historial de Entradas de Mercancía" description="Cargando historial...">
          <Skeleton className="h-10 w-40" />
        </PageHeader>
        <Skeleton className="h-12 w-full" /> 
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!user || !['admin', 'bodega'].includes(user.role)) {
    return (
      <div className="flex flex-col gap-6 p-4 md:p-6 lg:p-8">
        <PageHeader title="Acceso Denegado" description="No tiene permiso para ver esta página." />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Historial de Entradas de Mercancía" description="Ver y gestionar las entradas de mercancía registradas.">
        <Button onClick={() => setShowForm(true)}>
          <PlusCircle className="mr-2 h-4 w-4" /> Registrar Nueva Entrada
        </Button>
      </PageHeader>

      <Card>
        <CardHeader>
          <CardTitle>Filtrar Entradas</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-4 items-start sm:items-end flex-wrap">
          <div className="flex-grow sm:min-w-[250px] w-full sm:w-auto">
            <Label htmlFor="search-receipts" className="block text-xs mb-1">Buscar (Producto, Proveedor, # Factura)</Label>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="search-receipts"
                type="text"
                placeholder="Escriba para buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 w-full"
              />
            </div>
          </div>
          <div className="w-full sm:w-auto">
             <Label htmlFor="date-range-receipts" className="block text-xs mb-1">Rango de Fechas</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="date-range-receipts"
                  variant={'outline'}
                  className="w-full sm:w-[300px] justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}
                      </>
                    ) : (
                      format(dateRange.from, "LLL dd, y")
                    )
                  ) : (
                    <span>Seleccione un rango de fechas</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          </div>
          <Button variant="outline" onClick={handleClearFilters} className="w-full sm:w-auto">
            <FilterX className="mr-2 h-4 w-4" /> Limpiar Filtros
          </Button>
        </CardContent>
      </Card>

      {errorData && (
        <Card className="border-destructive bg-destructive/10">
            <CardHeader><CardTitle className="text-destructive">Error al Cargar Datos</CardTitle></CardHeader>
            <CardContent><p className="text-destructive">{errorData}</p></CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Historial de Entradas</CardTitle>
          <CardDescription>
            {loadingData ? "Cargando entradas..." : `Mostrando ${filteredReceipts.length} de ${receipts.length} entradas.`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha de Entrada</TableHead>
                <TableHead>Producto</TableHead>
                <TableHead>Proveedor</TableHead>
                <TableHead className="text-right">Cant. Recibida</TableHead>
                <TableHead># Factura/Ref</TableHead>
                <TableHead>Registrado Por</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loadingData ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10">
                    <LayoutList className="h-8 w-8 animate-pulse text-muted-foreground mx-auto mb-2" />
                    Cargando historial de entradas...
                  </TableCell>
                </TableRow>
              ) : filteredReceipts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">No se encontraron entradas que coincidan con sus criterios.</TableCell>
                </TableRow>
              ) : (
                filteredReceipts.map((receipt) => {
                  let displayDate = 'N/D';
                  if (receipt.receiptDate && typeof receipt.receiptDate === 'string') {
                     try {
                       const parsed = parseISO(receipt.receiptDate);
                       if(isValid(parsed)) displayDate = format(parsed, 'PP');
                       else displayDate = "Fecha Inválida";
                     } catch (_) { displayDate = "Fecha Inválida"; }
                  }
                  return (
                    <TableRow key={receipt.id}>
                      <TableCell>{displayDate}</TableCell>
                      <TableCell className="font-medium">{receipt.productName}</TableCell>
                      <TableCell>{receipt.supplierName || 'N/D'}</TableCell>
                      <TableCell className="text-right">{receipt.quantityReceived}</TableCell>
                      <TableCell>{receipt.invoiceNumber || 'N/D'}</TableCell>
                      <TableCell>{receipt.userName || (receipt.userId ? 'Usuario Desconocido' : 'N/D')}</TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Registrar Nueva Entrada de Mercancía</DialogTitle>
            <DialogDescription>Complete los detalles de la mercancía entrante.</DialogDescription>
          </DialogHeader>
          <div className="p-1 max-h-[70vh] overflow-y-auto">
          {loadingData ? (
            <div className="flex justify-center items-center h-40">
                <LayoutList className="h-8 w-8 animate-pulse text-muted-foreground" />
                <p className="ml-2">Cargando datos del formulario...</p>
            </div>
          ) : errorData ? (
             <p className="text-destructive text-center">{errorData}</p>
          ) : (
            <GoodsReceiptForm products={products} suppliers={suppliers} onSuccess={handleFormSuccess} />
          )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
