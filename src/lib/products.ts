
'use server';

// src/lib/products.ts

import { collection, addDoc, getDocs, query, doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from './firebase';
import { Product } from '../types/firestore';
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";

// Initialize S3 Client
// This client will be initialized on the server when these functions are called.
let s3ClientInstance: S3Client | null = null;

function getS3Client() {
  if (!s3ClientInstance) {
    if (!process.env.AWS_REGION || !process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
      console.error("AWS S3 client credentials or region not configured in environment variables.");
      // Potentially throw an error or return a dummy client to prevent further errors,
      // though server actions should ideally fail loudly if env vars are missing.
      throw new Error("AWS S3 client configuration is missing in environment variables.");
    }
    s3ClientInstance = new S3Client({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      }
    });
  }
  return s3ClientInstance;
}

const productsCollection = collection(db, 'products');

export const addProduct = async (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  try {
    // Ensure all required fields are present or have defaults if not provided by productData
    const newProduct: Product = {
      name: productData.name,
      description: productData.description || '',
      specifications: productData.specifications || '',
      price: productData.price ?? 0,
      categoryId: productData.categoryId,
      supplierId: productData.supplierId || '', // Default to empty string if undefined
      quantity: productData.quantity ?? 0,
      lowStockThreshold: productData.lowStockThreshold ?? 5,
      imageUrl: productData.imageUrl || '',
      // createdAt and updatedAt will be handled by Firestore serverTimestamp if needed
      // or set explicitly if your application logic requires client-side timestamps
    };
    const docRef = await addDoc(productsCollection, newProduct);
    console.log('Document written with ID: ', docRef.id);
    return docRef.id;
  } catch (e) {
    console.error('Error adding document: ', e);
    throw e; // Re-throw the error for handling in the component
  }
};

export const getProducts = async (): Promise<Product[]> => {
  try {
    const q = query(productsCollection);
    const querySnapshot = await getDocs(q);
    const products: Product[] = [];
    querySnapshot.forEach((doc) => {
      products.push({ id: doc.id, ...doc.data() } as Product);
    });
    return products;
  } catch (e) {
    console.error('Error getting products: ', e);
    throw e;
  }
};

// Get a single product by ID
export const getProduct = async (id: string): Promise<Product | null> => {
  try {
    const productDocRef = doc(db, 'products', id);
    const productDocSnap = await getDoc(productDocRef);

    if (productDocSnap.exists()) {
      return { id: productDocSnap.id, ...productDocSnap.data() } as Product;
    } else {
      console.log('No such product!');
      return null;
    }
  } catch (e) {
    console.error('Error getting product: ', e);
    throw e;
  }
};

// Update a product
export const updateProduct = async (id: string, newData: Partial<Omit<Product, 'id' | 'createdAt' | 'updatedAt'>>) => {
  try {
    const productDocRef = doc(db, 'products', id);
    // Ensure no undefined values are sent for update if they are meant to be optional strings
    const updateData = { ...newData };
    if (updateData.description === undefined) delete updateData.description;
    if (updateData.specifications === undefined) delete updateData.specifications;
    if (updateData.supplierId === undefined) updateData.supplierId = ''; // Ensure empty string is saved if undefined was passed
    if (updateData.imageUrl === undefined) delete updateData.imageUrl;


    await updateDoc(productDocRef, updateData);
    console.log('Product updated successfully!');
  } catch (e) {
    console.error('Error updating product: ', e);
    throw e;
  }
};

// Delete a product
export const deleteProduct = async (id: string) => {
  const productToDelete = await getProduct(id);

  if (productToDelete && productToDelete.imageUrl) {
    const s3Client = getS3Client();
    const s3BucketName = process.env.S3_BUCKET_NAME;
    const awsRegion = process.env.AWS_REGION;

    if (!s3BucketName || !awsRegion) {
        console.error("S3 bucket name or AWS region not configured in environment variables. Skipping S3 deletion.");
    } else {
        const expectedUrlPrefix = `https://${s3BucketName}.s3.${awsRegion}.amazonaws.com/`;

        if (productToDelete.imageUrl.startsWith(expectedUrlPrefix)) {
          const s3Key = productToDelete.imageUrl.substring(expectedUrlPrefix.length);
          if (s3Key && s3Key.trim() !== '') {
            console.log(`Attempting to delete S3 object for product ${id}: ${s3Key}`);
            try {
              const deleteObjectParams = {
                Bucket: s3BucketName!,
                Key: s3Key,
              };
              await s3Client.send(new DeleteObjectCommand(deleteObjectParams));
              console.log(`Successfully deleted S3 object: ${s3Key}`);
            } catch (s3Error) {
              console.error(`Failed to delete S3 object for product ${id}. Key derived: "${s3Key}". Error: `, s3Error);
            }
          } else {
            console.warn(`S3 key extracted was empty or whitespace for imageUrl: "${productToDelete.imageUrl}". Skipping S3 deletion.`);
          }
        } else {
          console.log(`Product ${id} imageUrl ("${productToDelete.imageUrl}") does not match expected S3 prefix ("${expectedUrlPrefix}"). Skipping S3 deletion.`);
        }
    }
  } else if (productToDelete && !productToDelete.imageUrl) {
    console.log(`Product ${id} does not have an imageUrl. No S3 object to delete.`);
  }


  try {
    const productDocRef = doc(db, 'products', id);
    await deleteDoc(productDocRef);
    console.log(`Product ${id} deleted successfully from Firestore!`);
  } catch (e) {
    console.error(`Error deleting product ${id} from Firestore: `, e);
    throw e;
  }
};