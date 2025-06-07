
// src/lib/goodsReceipts.ts
'use server';

import { collection, addDoc, getDocs, query, orderBy, Timestamp, doc, runTransaction } from 'firebase/firestore';
import { db } from './firebase';
import type { GoodsReceipt, Product, Supplier } from '../types/firestore';
import { getProduct } from './products'; // Assuming getProduct can fetch full product details
import { getSupplier } from './suppliers'; // Assuming getSupplier can fetch full supplier details

const goodsReceiptsCollectionRef = collection(db, 'goodsReceipts');
const productsCollectionRef = collection(db, 'products');

interface AddGoodsReceiptData {
  productId: string;
  supplierId?: string;
  quantityReceived: number;
  invoiceNumber?: string;
  receiptDate: Date; // Expecting Date object from form
  userId?: string;
  userName?: string;
}

export const addGoodsReceipt = async (data: AddGoodsReceiptData): Promise<string> => {
  if (!data.productId || data.quantityReceived <= 0) {
    throw new Error('Product ID and positive quantity are required.');
  }

  try {
    const productDoc = await getProduct(data.productId);
    if (!productDoc) {
      throw new Error(`Product with ID ${data.productId} not found.`);
    }
    let supplierName: string | undefined = undefined;
    if (data.supplierId) {
      const supplierDoc = await getSupplier(data.supplierId);
      supplierName = supplierDoc?.name;
    }

    const newReceiptId = await runTransaction(db, async (transaction) => {
      const goodsReceiptDocRef = doc(collection(db, 'goodsReceipts'));
      // Data to save in Firestore, using Timestamps
      const firestoreReceiptData = {
        productId: data.productId,
        productName: productDoc.name,
        supplierId: data.supplierId,
        supplierName: supplierName,
        quantityReceived: data.quantityReceived,
        invoiceNumber: data.invoiceNumber || '',
        receiptDate: Timestamp.fromDate(data.receiptDate), // Store as Timestamp
        recordedAt: Timestamp.now(), // Store as Timestamp
        userId: data.userId,
        userName: data.userName,
      };
      transaction.set(goodsReceiptDocRef, firestoreReceiptData);

      const productRef = doc(productsCollectionRef, data.productId);
      const newQuantity = (productDoc.quantity || 0) + data.quantityReceived;
      transaction.update(productRef, { quantity: newQuantity });
      
      return goodsReceiptDocRef.id;
    });

    console.log('Goods receipt added and product quantity updated successfully, ID:', newReceiptId);
    return newReceiptId;
  } catch (e) {
    console.error('Error adding goods receipt: ', e);
    throw e;
  }
};

export const getGoodsReceipts = async (): Promise<GoodsReceipt[]> => {
  try {
    const q = query(goodsReceiptsCollectionRef, orderBy('receiptDate', 'desc'));
    const querySnapshot = await getDocs(q);
    const receipts: GoodsReceipt[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      
      // Convert Timestamps to ISO strings for client-side compatibility
      const receiptDateString = data.receiptDate instanceof Timestamp 
        ? data.receiptDate.toDate().toISOString() 
        : (typeof data.receiptDate === 'string' ? data.receiptDate : new Date(data.receiptDate.seconds * 1000).toISOString()); // Fallback for already serialized
        
      let recordedAtString: string | undefined = undefined;
      if (data.recordedAt) {
        recordedAtString = data.recordedAt instanceof Timestamp
        ? data.recordedAt.toDate().toISOString()
        : (typeof data.recordedAt === 'string' ? data.recordedAt : new Date(data.recordedAt.seconds * 1000).toISOString());
      }

      receipts.push({
        id: doc.id,
        productId: data.productId,
        productName: data.productName,
        supplierId: data.supplierId,
        supplierName: data.supplierName,
        quantityReceived: data.quantityReceived,
        invoiceNumber: data.invoiceNumber,
        receiptDate: receiptDateString,
        recordedAt: recordedAtString,
        userId: data.userId,
        userName: data.userName,
      } as GoodsReceipt); 
    });
    return receipts;
  } catch (e) {
    console.error('Error getting goods receipts: ', e);
    throw e;
  }
};
