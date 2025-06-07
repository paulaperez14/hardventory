
// src/components/forms/GoodsReceiptForm.tsx
'use client';

import React, { useState } from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { addGoodsReceipt } from '@/lib/goodsReceipts';
import type { Product, Supplier } from '@/types/firestore';
import { useAuth } from '@/hooks/useAuth';

interface GoodsReceiptFormProps {
  products: Product[];
  suppliers: Supplier[];
  onSuccess: () => void;
}

const GoodsReceiptForm: React.FC<GoodsReceiptFormProps> = ({ products, suppliers, onSuccess }) => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [productId, setProductId] = useState<string>('');
  const [supplierId, setSupplierId] = useState<string>('');
  const [quantityReceived, setQuantityReceived] = useState<number | string>('');
  const [invoiceNumber, setInvoiceNumber] = useState<string>('');
  const [receiptDate, setReceiptDate] = useState<Date | undefined>(new Date());
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!productId) {
      setError('Seleccione un producto.');
      toast({ title: 'Validation Error', description: 'Se requiere un producto.', variant: 'destructive' });
      return;
    }
    if (!receiptDate) {
      setError('Seleccione una fecha de ingreso.');
      toast({ title: 'Validation Error', description: 'Fecha de recepción obligatoria.', variant: 'destructive' });
      return;
    }
    const numQuantity = Number(quantityReceived);
    if (isNaN(numQuantity) || numQuantity <= 0) {
      setError('La cantidad recibida debe ser un número positivo.');
      toast({ title: 'Validation Error', description: 'La cantidad debe ser un número positivo.', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      await addGoodsReceipt({
        productId,
        supplierId: supplierId || undefined, // Pass undefined if empty string to Firestore lib
        quantityReceived: numQuantity,
        invoiceNumber: invoiceNumber || undefined,
        receiptDate,
        userId: user?.id,
        userName: user?.name,
      });
      toast({ title: 'Success', description: 'Entrada de mercancías registrada correctamente.' });
      // Reset form
      setProductId('');
      setSupplierId('');
      setQuantityReceived('');
      setInvoiceNumber('');
      setReceiptDate(new Date());
      if (onSuccess) onSuccess();
    } catch (e: any) {
      console.error("Error in form submission:", e);
      setError(e.message || 'Failed to record goods receipt.');
      toast({ title: 'Error', description: e.message || 'Failed to record goods receipt.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const inputClassName = "w-full h-10 px-3 py-2 border rounded-md text-sm flex items-center justify-between";
  const labelClassName = "block text-sm font-medium";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="text-sm text-destructive bg-destructive/10 p-2 rounded-md">{error}</p>}
      
      <div>
        <Label htmlFor="receiptDate" className={labelClassName}>Fecha de Entrada</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={'outline'}
              className={cn(
                "w-full justify-start text-left font-normal",
                !receiptDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {receiptDate ? format(receiptDate, "PPP") : <span>Seleccione una fecha</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={receiptDate}
              onSelect={setReceiptDate}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      <div>
        <Label htmlFor="productId" className={labelClassName}>Producto</Label>
        <Select value={productId} onValueChange={setProductId} required>
          <SelectTrigger className={inputClassName} id="productId">
            <SelectValue placeholder="Seleccione un producto" />
          </SelectTrigger>
          <SelectContent>
            {products.map(p => (
              p.id && <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="supplierId" className={labelClassName}>Proveedor</Label>
        <Select value={supplierId} onValueChange={setSupplierId}>
          <SelectTrigger className={inputClassName} id="supplierId">
            <SelectValue placeholder="Seleccione un proveedor (opcional)" />
          </SelectTrigger>
          <SelectContent>
            {suppliers.map(s => (
              s.id && <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="quantityReceived" className={labelClassName}>Cantidad Recibida</Label>
        <Input
          id="quantityReceived"
          type="number"
          value={quantityReceived}
          onChange={(e) => setQuantityReceived(e.target.value)}
          placeholder="e.g., 50"
          required
          min="1"
          className={inputClassName}
        />
      </div>
      
      <div>
        <Label htmlFor="invoiceNumber" className={labelClassName}>Número de factura / Referencia de pedido</Label>
        <Input
          id="invoiceNumber"
          type="text"
          value={invoiceNumber}
          onChange={(e) => setInvoiceNumber(e.target.value)}
          placeholder="e.g., INV-12345 or PO-67890"
          className={inputClassName}
        />
      </div>

      <Button type="submit" disabled={loading} className="w-full mt-6">
        {loading ? 'Registrando...' : 'Registrar Entrada de Mercancía'}
      </Button>
    </form>
  );
};

export default GoodsReceiptForm;

