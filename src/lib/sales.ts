
// src/lib/sales.ts
import { collection, query, where, getDocs, Timestamp, orderBy, addDoc, doc } from 'firebase/firestore';
import { db } from './firebase';
import type { Sale, CartItem } from '@/types/firestore'; // Updated to include CartItem
import { updateProduct, getProduct } from './products'; // To update product quantity

const salesCollectionRef = collection(db, 'sales');

/**
 * Fetches sales records from Firestore within the specified date range.
 * @param startDate The start of the date range.
 * @param endDate The end of the date range.
 * @returns A promise that resolves to an array of Sale objects.
 */
export const getSalesByDateRange = async (startDate: Date, endDate: Date): Promise<Sale[]> => {
  try {
    // Ensure endDate includes the whole day by setting time to 23:59:59.999
    const endOfDayEndDate = new Date(endDate);
    endOfDayEndDate.setHours(23, 59, 59, 999);

    const q = query(
      salesCollectionRef,
      where('saleDate', '>=', Timestamp.fromDate(startDate)),
      where('saleDate', '<=', Timestamp.fromDate(endOfDayEndDate)),
      orderBy('saleDate', 'desc')
    );
    const querySnapshot = await getDocs(q);
    const sales: Sale[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      sales.push({ id: doc.id, ...data } as Sale);
    });
    return sales;
  } catch (e) {
    console.error('Error getting sales by date range: ', e);
    throw e;
  }
};

/**
 * Adds a new sale record to Firestore (for multiple items) and updates product quantities.
 * @param items - An array of CartItem objects representing the items sold.
 * @param grandTotal - The total amount for the sale.
 * @returns A promise that resolves when the sale is recorded and products are updated.
 */
export const addSale = async (
  items: CartItem[],
  grandTotal: number
): Promise<void> => {
  if (!items || items.length === 0) {
    throw new Error("Cannot record an empty sale. Cart is empty.");
  }

  try {
    // 1. Prepare the sale document
    const saleData: Omit<Sale, 'id'> = {
      items: items,
      grandTotal: grandTotal,
      saleDate: Timestamp.now(),
    };
    await addDoc(salesCollectionRef, saleData);
    console.log('Sale recorded successfully!');

    // 2. Update product quantities for each item in the sale
    //    This should ideally be a transaction for atomicity, but for simplicity,
    //    we'll update them sequentially. Consider transactions for production.
    for (const item of items) {
      const productDoc = await getProduct(item.productId);
      if (!productDoc) {
        console.error(`Product with ID ${item.productId} not found. Stock not updated for this item.`);
        // Decide how to handle this: throw an error, or log and continue?
        // For now, log and continue, but this could lead to inconsistencies.
        continue;
      }
      if (productDoc.quantity < item.quantity) {
        console.error(`Not enough stock for ${item.productName} (ID: ${item.productId}). Requested: ${item.quantity}, Available: ${productDoc.quantity}. Stock not updated.`);
        // This check should ideally happen before confirming the sale (e.g., when adding to cart or at checkout)
        // Throwing an error here if a sale was already recorded in step 1 would leave inconsistent data.
        // For robustness, stock check should be more proactive.
        continue; 
      }
      const newQuantity = productDoc.quantity - item.quantity;
      await updateProduct(item.productId, { quantity: newQuantity });
      console.log(`Product ${item.productName} (ID: ${item.productId}) quantity updated to ${newQuantity}`);
    }

  } catch (e) {
    console.error('Error processing multi-item sale: ', e);
    throw e; // Re-throw to be handled by the caller
  }
};
