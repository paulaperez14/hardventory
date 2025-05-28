// src/app/(authenticated)/reports/page.tsx
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, Download, BarChart2 } from 'lucide-react';
import { format, subDays } from 'date-fns';
import type { DateRange } from 'react-day-picker';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { getSalesByDateRange } from '@/lib/sales';
import type { Sale, CartItem } from '@/types/firestore';
import { Timestamp } from 'firebase/firestore'; // Import Timestamp
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';

interface FlatSaleItem extends CartItem {
  saleId: string;
  saleDate: Timestamp; // Keep as Timestamp for consistent date handling before formatting
}

export default function ReportsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 29), // Default to last 30 days
    to: new Date(),
  });
  const [salesData, setSalesData] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect if not admin or still loading auth
  useEffect(() => {
    if (!authLoading) {
      if (!user || user.role !== 'admin') {
        router.replace('/dashboard'); // Or a 'Not Authorized' page
      }
    }
  }, [user, authLoading, router]);

  const flattenedSalesData: FlatSaleItem[] = useMemo(() => {
    return salesData.flatMap(sale =>
      (sale.items || []).map(item => ({ // Add guard for sale.items
        ...item,
        saleId: sale.id!,
        saleDate: sale.saleDate, // Keep as Timestamp
      }))
    );
  }, [salesData]);


  const handleGenerateReport = async () => {
    if (!dateRange?.from || !dateRange?.to) {
      setError('Please select a valid date range.');
      return;
    }
    setLoading(true);
    setError(null);
    setSalesData([]);
    try {
      const data = await getSalesByDateRange(dateRange.from, dateRange.to);
      setSalesData(data);
    } catch (e: any) {
      setError(`Failed to generate report: ${e.message}`);
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const downloadPdf = () => {
    if (flattenedSalesData.length === 0) {
        alert("No data to download."); // Or use a toast
        return;
    }
    const doc = new jsPDF();
    const reportTitle = `Sales Report (${format(dateRange?.from || new Date(), 'P')} - ${format(dateRange?.to || new Date(), 'P')})`;
    
    doc.setFontSize(18);
    doc.text(reportTitle, 14, 22);
    
    autoTable(doc, {
      startY: 30,
      head: [['Product Name', 'Quantity Sold', 'Unit Price', 'Subtotal', 'Sale Date']],
      body: flattenedSalesData.map(item => [
        item.productName,
        item.quantity,
        `$${item.unitPrice.toFixed(2)}`,
        `$${item.subtotal.toFixed(2)}`,
        item.saleDate instanceof Timestamp ? format(item.saleDate.toDate(), 'PPp') : 'Invalid Date'
      ]),
      theme: 'striped',
      headStyles: { fillColor: [41, 128, 185] }, // Example styling: a moderate blue
    });
    doc.save(`sales_report_${format(new Date(), 'yyyyMMddHHmmss')}.pdf`);
  };

  if (authLoading) {
    return (
      <div className="flex flex-col gap-6 p-4 md:p-6 lg:p-8">
        <PageHeader title="Sales Reports" description="Generating reports of sales activity." />
        <Skeleton className="h-12 w-1/4" /> 
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }
  
  if (!user || user.role !== 'admin') {
    return (
         <div className="flex flex-col gap-6 p-4 md:p-6 lg:p-8">
            <PageHeader title="Access Denied" description="You do not have permission to view this page." />
        </div>
    );
  }


  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Sales Reports" description="Generate and download sales reports for specific periods.">
        <Button onClick={downloadPdf} disabled={flattenedSalesData.length === 0 || loading} variant="outline">
          <Download className="mr-2 h-4 w-4" /> Download PDF
        </Button>
      </PageHeader>

      <Card>
        <CardHeader>
          <CardTitle>Report Configuration</CardTitle>
          <CardDescription>Select a date range to generate the sales report.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="date"
                variant={'outline'}
                className="w-full sm:w-[300px] justify-start text-left font-normal"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange?.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, 'LLL dd, y')} - {format(dateRange.to, 'LLL dd, y')}
                    </>
                  ) : (
                    format(dateRange.from, 'LLL dd, y')
                  )
                ) : (
                  <span>Pick a date range</span>
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
          <Button onClick={handleGenerateReport} disabled={loading}>
            <BarChart2 className="mr-2 h-4 w-4" />
            {loading ? 'Generating...' : 'Generate Report'}
          </Button>
        </CardContent>
      </Card>

      {error && (
        <Card className="border-destructive bg-destructive/10">
            <CardHeader>
                <CardTitle className="text-destructive">Error</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-destructive">{error}</p>
            </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Report Results</CardTitle>
          <CardDescription>
            {flattenedSalesData.length > 0 
                ? `Displaying ${flattenedSalesData.length} line items sold for the selected period.`
                : "No sales data found for the selected period, or report not yet generated."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product Name</TableHead>
                <TableHead className="text-right">Quantity Sold</TableHead>
                <TableHead className="text-right">Unit Price</TableHead>
                <TableHead className="text-right">Subtotal</TableHead>
                <TableHead>Sale Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10">
                    <div className="flex flex-col items-center gap-2">
                       <BarChart2 className="h-8 w-8 animate-pulse text-muted-foreground" />
                       <p className="text-muted-foreground">Loading report data...</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : flattenedSalesData.length === 0 && !error ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                    No sales data available for the selected period. Please ensure sales are recorded or try a different date range.
                  </TableCell>
                </TableRow>
              ) : (
                flattenedSalesData.map((item, index) => (
                  <TableRow key={`${item.saleId}-${item.productId}-${index}`}>
                    <TableCell className="font-medium">{item.productName}</TableCell>{/*
                 */}<TableCell className="text-right">{item.quantity}</TableCell>{/*
                 */}<TableCell className="text-right">${item.unitPrice.toFixed(2)}</TableCell>{/*
                 */}<TableCell className="text-right font-semibold">${item.subtotal.toFixed(2)}</TableCell>{/*
                 */}<TableCell>
                      {item.saleDate instanceof Timestamp 
                        ? format(item.saleDate.toDate(), 'PPp') 
                        : 'Invalid Date'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
